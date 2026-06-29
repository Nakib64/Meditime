import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { signToken, verifyToken } from "@/lib/auth";
import { sendSMS } from "@/lib/sms";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { action, phoneNumber, otp, newPassword } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    // ----------------------------------------------------
    // ACTION: SEND OTP via SMS
    // ----------------------------------------------------
    if (action === "send_otp") {
      if (!phoneNumber) {
        return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
      }

      // Validate standard 11-digit Bangladeshi number
      if (phoneNumber.length !== 11 || !phoneNumber.startsWith("01") || /\D/.test(phoneNumber)) {
        return NextResponse.json(
          { error: "Invalid phone number format. Must be 11 digits starting with 01." },
          { status: 400 }
        );
      }

      // Check if user exists in database with this phone number
      const formattedWithCountry = `+880${phoneNumber.substring(1)}`;
      const user = await User.findOne({
        $or: [
          { phoneNumber: phoneNumber },
          { phoneNumber: formattedWithCountry }
        ]
      });

      if (!user) {
        return NextResponse.json(
          { error: "No registered account found with this phone number." },
          { status: 404 }
        );
      }

      if (user.authProvider === 'google') {
        return NextResponse.json(
          { error: "This account is registered with Google. Please log in using Google." },
          { status: 400 }
        );
      }

      // Generate 4-digit OTP
      const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
      const otpHash = await bcrypt.hash(otpCode, 10);

      // Send SMS
      const message = `Your Meditime password reset code is: ${otpCode}.\nDo not share this code with anyone.`;
      const smsRes = await sendSMS(phoneNumber, message);

      // In development mode, log OTP to console if SMS gateway fails/is not configured
      if (!smsRes.success) {
        console.log(`[DEV OTP BYPASS] Failed to send reset SMS to ${phoneNumber}. OTP code: ${otpCode}`);
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json(
            { error: smsRes.error || "Failed to send SMS code. Please try again." },
            { status: 500 }
          );
        }
      }

      // Generate a temporary JWT token (expires in 5 minutes)
      const tempToken = await signToken(
        {
          id: String(user._id),
          email: user.email || "",
          role: user.role || "user",
          otpHash,
          phoneNumber,
        },
        "5m"
      );

      const response = NextResponse.json(
        { message: "Verification OTP code sent successfully", phoneNumber },
        { status: 200 }
      );

      // Store verification details in secure HTTP-Only cookie
      response.cookies.set("user_reset_otp_token", tempToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 5 * 60, // 5 minutes
        path: "/",
      });

      return response;
    }

    // ----------------------------------------------------
    // ACTION: VERIFY OTP from Cookie
    // ----------------------------------------------------
    if (action === "verify_otp") {
      if (!otp) {
        return NextResponse.json({ error: "Verification OTP code is required" }, { status: 400 });
      }

      const tempToken = request.cookies.get("user_reset_otp_token")?.value;
      if (!tempToken) {
        return NextResponse.json(
          { error: "Reset password session expired or invalid. Please request a new OTP." },
          { status: 400 }
        );
      }

      // Verify token
      const payload = await verifyToken(tempToken);
      if (!payload || !payload.otpHash || !payload.id) {
        return NextResponse.json(
          { error: "Invalid or expired reset session. Please try again." },
          { status: 400 }
        );
      }

      // Verify code match
      const isOtpValid = await bcrypt.compare(otp, payload.otpHash);
      if (!isOtpValid) {
        return NextResponse.json({ error: "Invalid verification code. Please try again." }, { status: 400 });
      }

      // Create reset validation verified token (valid for 10 minutes)
      const verifiedToken = await signToken(
        {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          verified: true,
        },
        "10m"
      );

      const response = NextResponse.json(
        { message: "OTP code verified successfully" },
        { status: 200 }
      );

      // Set cookie for verified status
      response.cookies.set("user_reset_verified", verifiedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 10 * 60, // 10 minutes
        path: "/",
      });

      // Clear original OTP token cookie
      response.cookies.set("user_reset_otp_token", "", {
        httpOnly: true,
        expires: new Date(0),
        path: "/",
      });

      return response;
    }

    // ----------------------------------------------------
    // ACTION: RESET PASSWORD
    // ----------------------------------------------------
    if (action === "reset_password") {
      if (!newPassword) {
        return NextResponse.json({ error: "New password is required" }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }

      const verifiedToken = request.cookies.get("user_reset_verified")?.value;
      if (!verifiedToken) {
        return NextResponse.json(
          { error: "Session expired or unauthorized. Please verify your phone again." },
          { status: 400 }
        );
      }

      // Verify token
      const payload = await verifyToken(verifiedToken);
      if (!payload || !payload.verified || !payload.id) {
        return NextResponse.json(
          { error: "Invalid or expired reset session. Please request a new OTP." },
          { status: 400 }
        );
      }

      // Find user
      const user = await User.findById(payload.id);
      if (!user) {
        return NextResponse.json({ error: "User account not found." }, { status: 404 });
      }

      if (user.authProvider === 'google') {
        return NextResponse.json({ error: "Google accounts cannot reset passwords." }, { status: 400 });
      }

      // Save new password
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      const response = NextResponse.json(
        { message: "Password reset successfully!" },
        { status: 200 }
      );

      // Clear reset verification cookie
      response.cookies.set("user_reset_verified", "", {
        httpOnly: true,
        expires: new Date(0),
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("Forgot Password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
