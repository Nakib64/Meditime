import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";
import { verifyAdmin } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  try {
    const session = await verifyAdmin(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { email, username, currentPassword, newPassword, phoneNumber } = body;

    const admin = await Admin.findById(session.id);
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Verify current password if any sensitive changes or password change
    if (newPassword || email !== admin.email || username !== admin.username || phoneNumber !== admin.phoneNumber) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to update credentials" }, { status: 400 });
      }
      const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "Invalid current password" }, { status: 401 });
      }
    }

    // Update fields
    if (email) admin.email = email.toLowerCase();
    if (username) admin.username = username.toLowerCase();
    
    // Validate and update phone number
    if (phoneNumber !== undefined) {
      if (phoneNumber) {
        const numbers = phoneNumber.split(",").map((num: string) => num.trim()).filter(Boolean);
        const isValid = numbers.every((num: string) => num.length === 11 && num.startsWith("01") && /^\d+$/.test(num));
        if (!isValid) {
          return NextResponse.json({ error: "Invalid phone number format. All numbers must be 11 digits starting with 01, separated by commas." }, { status: 400 });
        }
      }
      admin.phoneNumber = phoneNumber || "";
    }

    if (newPassword) {
      admin.password = await bcrypt.hash(newPassword, 10);
    }

    await admin.save();

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: admin._id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        phoneNumber: admin.phoneNumber,
      }
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
