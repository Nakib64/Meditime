import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { sendSMS } from '@/lib/sms';
import { signToken, verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, checkExists } = await request.json();

    // Standardize to 11 digit check
    if (!phoneNumber || phoneNumber.length !== 11 || !phoneNumber.startsWith('01')) {
      return NextResponse.json({ error: 'Invalid phone number format. Must be 11 digits starting with 01.' }, { status: 400 });
    }

    // Check if phone number is already registered
    if (checkExists) {
      await dbConnect();
      const formattedWithCountry = `+880${phoneNumber.substring(1)}`;
      const userExists = await User.findOne({
        $or: [
          { phoneNumber: phoneNumber },
          { phoneNumber: formattedWithCountry }
        ]
      });

      if (userExists) {
        return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 });
      }
    }

    // Check cooldown stateless via cookie
    const tempCookie = request.cookies.get('temp_otp_token')?.value;
    if (tempCookie) {
      const payload = await verifyToken(tempCookie);
      if (payload && payload.sentAt && Date.now() - payload.sentAt < 2 * 60 * 1000) {
        const remainingSeconds = Math.ceil((2 * 60 * 1000 - (Date.now() - payload.sentAt)) / 1000);
        return NextResponse.json({ 
          error: `Please wait ${remainingSeconds} seconds before requesting a new OTP.` 
        }, { status: 429 });
      }
    }

    // Generate 4-digit code
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    // Format the OTP message as requested
    const message = `Your Meditime OTP code is: ${otp}.\nPlease do not share this code with anyone.\nThis code is valid for 2 minutes.`;
    const smsRes = await sendSMS(phoneNumber, message);

    if (!smsRes.success) {
      console.log(`[DEV OTP BYPASS] Failed to send SMS to ${phoneNumber}. OTP code: ${otp}`);
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: smsRes.error || 'Failed to send SMS' }, { status: 500 });
      }
    }

    // Sign temporary token containing phoneNumber and hashed OTP
    const tempToken = await signToken({
      id: "temp",
      email: "temp@meditime.com",
      role: "temp",
      phoneNumber,
      otpHash,
      sentAt: Date.now(),
    }, "5m");

    const response = NextResponse.json({ success: true, message: 'OTP sent successfully' });

    // Set secure HTTP-Only cookie for verification
    response.cookies.set('temp_otp_token', tempToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60, // 5 minutes
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
