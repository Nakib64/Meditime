import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await dbConnect();

    // Default admin credentials requested by user
    const defaultAdmin = {
      username: "meditime_admin",
      email: "meditimebd@gmail.com",
      password: "meditime12345",
      role: "superadmin",
      phoneNumber: "01315168075",
    };

    const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);

    const admin = await Admin.findOneAndUpdate(
      { email: defaultAdmin.email },
      { 
        $set: {
          username: defaultAdmin.username,
          email: defaultAdmin.email,
          password: hashedPassword,
          role: defaultAdmin.role,
          phoneNumber: defaultAdmin.phoneNumber,
        }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      message: "Admin account seeded/updated successfully",
      credentials: {
        username: admin.username,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
        role: admin.role,
      },
      note: "PLEASE DELETE THIS ROUTE AFTER USE IN PRODUCTION FOR SECURITY."
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
