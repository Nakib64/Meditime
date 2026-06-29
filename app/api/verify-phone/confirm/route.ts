import { NextRequest, NextResponse } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, code } = await request.json();

    if (!phoneNumber || !code) {
      return NextResponse.json({ error: 'Phone number and code are required' }, { status: 400 });
    }

    const tempCookie = request.cookies.get('temp_otp_token')?.value;
    if (!tempCookie) {
      return NextResponse.json({ error: 'Verification session expired or invalid. Please request a new OTP.' }, { status: 400 });
    }

    const payload = await verifyToken(tempCookie);
    if (!payload || !payload.otpHash || payload.phoneNumber !== phoneNumber) {
      return NextResponse.json({ error: 'Verification session expired or invalid. Please request a new OTP.' }, { status: 400 });
    }

    // Compare code
    const isOtpValid = await bcrypt.compare(code, payload.otpHash);
    if (!isOtpValid) {
      return NextResponse.json({ error: 'Invalid verification code. Please try again.' }, { status: 400 });
    }

    // Generate verified token (valid for 10 minutes)
    const verifiedToken = await signToken({
      id: "verified",
      email: "verified@meditime.com",
      role: "verified",
      phoneNumber,
      verified: true,
    }, "10m");

    const response = NextResponse.json({ success: true, message: 'Phone number verified successfully' });

    // Set verified cookie
    response.cookies.set('verified_phone_token', verifiedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 minutes
      path: '/',
    });

    // Clear temporary OTP token cookie
    response.cookies.set('temp_otp_token', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error confirming OTP:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
