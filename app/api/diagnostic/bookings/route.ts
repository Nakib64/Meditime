import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import DiagnosticBooking from "@/models/DiagnosticBooking";
import AbandonedCart from "@/models/AbandonedCart";
import User from "@/models/User";
import PhoneVerification from "@/models/PhoneVerification";
import mongoose from "mongoose";
import "@/models/Hospital"; // Ensure Hospital model is registered for populate
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    // Validate mobile number: exactly 11 digits, strip +88 or +880 prefix if present
    let mobile = String(body.mobileNumber || '').trim();
    if (mobile.startsWith('+880')) {
      mobile = '0' + mobile.slice(4);
    } else if (mobile.startsWith('+88')) {
      mobile = '0' + mobile.slice(3);
    } else if (mobile.startsWith('880')) {
      mobile = '0' + mobile.slice(3);
    }
    
    // Now replace non-digits
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 11 || !cleanMobile.startsWith('01')) {
      return NextResponse.json(
        { error: "Mobile number must be exactly 11 digits starting with 01" },
        { status: 400 }
      );
    }

    // Validate phone verification via cookie (always verify)
    const cookieStore = await cookies();
    const verifiedCookie = cookieStore.get("verified_phone_token")?.value;
    if (!verifiedCookie) {
      return NextResponse.json(
        { error: "Phone number not verified. Please verify your phone number first." },
        { status: 400 }
      );
    }

    const payload = await verifyToken(verifiedCookie);
    if (!payload || !payload.verified || payload.phoneNumber !== cleanMobile) {
      return NextResponse.json(
        { error: "Phone number verification is invalid or expired. Please verify again." },
        { status: 400 }
      );
    }

    // Generate unique 8-digit ID
    let bookingId = "";
    let isUnique = false;
    while (!isUnique) {
      bookingId = `MDT-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const existing = await DiagnosticBooking.findOne({ bookingId });
      if (!existing) isUnique = true;
    }

    const newBooking = new DiagnosticBooking({
      userId: body.userId ? new mongoose.Types.ObjectId(body.userId) : undefined,
      patientName: body.patientName,
      mobileNumber: body.mobileNumber,
      gender: body.gender,
      age: body.age,
      patientType: body.patientType,
      appointmentDate: new Date(body.appointmentDate),
      venueId: body.venueId,
      tests: body.tests,
      totalPrice: body.totalPrice,
      affiliateCode: body.affiliateCode,
      bookingId,
      status: 'Pending'
    }); 

    await newBooking.save();

    // Cleanup abandoned cart for this user
    try {
      if (body.userId) {
        await AbandonedCart.deleteMany({ userId: new mongoose.Types.ObjectId(body.userId) });
      }
      await AbandonedCart.deleteMany({ phoneNumber: body.mobileNumber });
    } catch (cleanupErr) {
      console.error("Error cleaning up abandoned cart:", cleanupErr);
    }

    // Clear verification cookie
    try {
      cookieStore.set('verified_phone_token', '', {
        httpOnly: true,
        expires: new Date(0),
        path: '/',
      });
    } catch (e) {
      console.error("Error clearing verified_phone_token cookie:", e);
    }

    return NextResponse.json(
      { 
        message: "Diagnostic booking created successfully", 
        booking: newBooking
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating diagnostic booking:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "UserId is required" }, { status: 400 });
    }

    const bookings = await DiagnosticBooking.find({ 
      userId: new mongoose.Types.ObjectId(userId) 
    }).populate('venueId').sort({ createdAt: -1 });

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching patient bookings:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
