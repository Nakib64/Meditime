import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    await dbConnect();
    const admin = await Admin.findById(session.id);
    if (!admin) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ 
      authenticated: true, 
      user: {
        id: admin._id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        phoneNumber: admin.phoneNumber || "",
      } 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error verifying admin session:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
