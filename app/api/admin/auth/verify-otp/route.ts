import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { verifyToken, signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const tempToken = request.cookies.get("admin_temp_otp")?.value;
    if (!tempToken) {
      return NextResponse.json(
        { error: "Verification session expired or invalid. Please log in again." },
        { status: 400 }
      );
    }

    // Verify temp token
    const payload = await verifyToken(tempToken);
    if (!payload || !payload.otpHash || !payload.id) {
      return NextResponse.json(
        { error: "Invalid or expired verification session." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { code } = body;

    if (!code || code.length !== 4) {
      return NextResponse.json(
        { error: "A valid 4-digit verification code is required." },
        { status: 400 }
      );
    }

    // Compare OTP code with hash
    const isOtpValid = await bcrypt.compare(code, payload.otpHash);
    if (!isOtpValid) {
      return NextResponse.json(
        { error: "Invalid verification code. Please try again." },
        { status: 401 }
      );
    }

    // Prepare user session payload
    const sessionPayload = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };

    // Generate Access Token (15 minutes) and Refresh Token (3 days)
    const accessToken = await signToken(sessionPayload, "15m");
    const refreshToken = await signToken(sessionPayload, "3d");

    const response = NextResponse.json(
      {
        success: true,
        message: "MFA login successful",
        user: {
          id: payload.id,
          email: payload.email,
          role: payload.role,
        },
      },
      { status: 200 }
    );

    // Set HTTP-Only access token cookie
    response.cookies.set("admin_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });

    // Set HTTP-Only refresh token cookie (defines session maximum lifetime to 3 days)
    response.cookies.set("admin_refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3 * 24 * 60 * 60, // 3 days
      path: "/",
    });

    // Clear temporary verification cookie
    response.cookies.set("admin_temp_otp", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Admin verify OTP error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
