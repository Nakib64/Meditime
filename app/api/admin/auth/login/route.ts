import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { sendSMS } from "@/lib/sms";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, password, selectedPhone } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    // Verify the admin has a phone number
    if (!admin.phoneNumber) {
      return NextResponse.json(
        { error: "No verified phone number is registered for this admin account. Please contact system support." },
        { status: 400 }
      );
    }

    const numbers = admin.phoneNumber.split(",").map((num: string) => num.trim()).filter(Boolean);

    // If there are multiple numbers and none is selected yet, prompt the user to choose
    if (numbers.length > 1 && !selectedPhone) {
      return NextResponse.json(
        {
          step: "select_phone",
          phoneNumbers: numbers.map((num: string) => {
            const lastDigits = num.slice(-3);
            return {
              lastDigits,
              masked: `Ending in ...${lastDigits}`
            };
          })
        },
        { status: 200 }
      );
    }

    // Determine the target phone number to send OTP to
    let targetNumber = "";
    if (numbers.length === 1) {
      targetNumber = numbers[0];
    } else if (selectedPhone) {
      targetNumber = numbers.find((num: string) => num.endsWith(selectedPhone)) || "";
    }

    if (!targetNumber) {
      return NextResponse.json(
        { error: "Invalid phone number selection. Please choose a valid number." },
        { status: 400 }
      );
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    // Prepare message
    const message = `Your Meditime Admin login verification code is: ${otp}.\nDo not share this code.`;
    
    // Send SMS to the target number
    let smsSuccess = false;
    let smsError = "";
    try {
      const smsRes = await sendSMS(targetNumber, message);
      if (smsRes.success) {
        smsSuccess = true;
      } else {
        smsError = smsRes.error || "Failed to send SMS";
      }
    } catch (err: any) {
      smsError = err.message || "Failed to send SMS";
    }
    
    // In development mode, if SMS fails, log it to console so developer can proceed
    if (!smsSuccess) {
      console.log(`[DEV OTP BYPASS] Failed to send SMS to ${targetNumber}. OTP code: ${otp}`);
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: smsError || "Failed to send SMS OTP. Please try again." },
          { status: 500 }
        );
      }
    }

    // Generate temporary verification token (expires in 5 minutes)
    const tempToken = await signToken(
      {
        id: String(admin._id),
        email: admin.email,
        role: admin.role,
        otpHash,
      },
      "5m"
    );

    const response = NextResponse.json(
      { 
        message: "Verification OTP sent successfully",
        step: "verify_phone",
        phoneNumber: targetNumber,
      },
      { status: 200 }
    );

    // Set secure HTTP-Only cookie for temp OTP session
    response.cookies.set("admin_temp_otp", tempToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 5 * 60, // 5 minutes
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
