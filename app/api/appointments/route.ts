import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import Affiliate from '@/models/Affiliate';
import User from '@/models/User';
import PhoneVerification from '@/models/PhoneVerification';
import { sendSMS } from '@/lib/sms';
import { getSession, getAdminSession, verifyToken } from '@/lib/auth';

// GET - Fetch all appointments or filter by doctorId
export async function GET(request: NextRequest) {
  try {
    let session = await getAdminSession(request);
    if (!session) {
      session = await getSession(request);
    }
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const query: any = {};
    if (doctorId) {
      if (doctorId.match(/^[0-9a-fA-F]{24}$/)) {
        query.doctorId = doctorId;
      } else {
        const doctor = await Doctor.findOne({ $or: [{ slug: doctorId }, { slugBn: doctorId }] });
        if (doctor) {
          query.doctorId = doctor._id;
        } else {
          query.doctorId = doctorId; // Will likely return empty, which is correct
        }
      }
    }
    if (status) {
      query.status = status;
    }
    if (userId) {
      // If not admin, they can only fetch their own appointments
      const isAdmin = session.role === 'admin' || session.role === 'superadmin';
      if (!isAdmin && session.id !== userId) {
        return NextResponse.json({ error: 'Forbidden. You can only view your own appointments.' }, { status: 403 });
      }
      query.userId = userId;
    }

    // If no filters provided and not admin, don't allow fetching all
    const isAdmin = session.role === 'admin' || session.role === 'superadmin';
    if (!doctorId && !userId && !status && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden. Admin access required for global view.' }, { status: 403 });
    }

    const appointments = await Appointment.find(query)
      .populate('doctorId')
      .populate('userId', 'fullName email phoneNumber')
      .populate('affiliateId', 'name affiliateCode email')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { appointments },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate unique serial number (used when admin confirms appointment)
export async function generateSerialNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const prefix = `MT${year}${month}${day}`;

  // Find the last appointment for today to get the next sequence number
  const lastAppointment = await Appointment.findOne({
    serialNumber: { $regex: `^${prefix}` }
  }).sort({ serialNumber: -1 });

  let sequence = 1;
  if (lastAppointment && lastAppointment.serialNumber) {
    const lastSequence = parseInt(lastAppointment.serialNumber.slice(-4));
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  return `${prefix}${String(sequence).padStart(4, '0')}`;
}

// POST - Create a new appointment
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      doctorId,
      patientName,
      mobileNumber,
      gender,
      age,
      patientType,
      hospitalName,
      hospitalSlug,
      appointmentDate,
      appointmentTime,
      userId,
      affiliateCode,
    } = body;

    // Validate required fields
    if (!doctorId || !patientName || !mobileNumber || !patientType || !hospitalName || !appointmentDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate mobile number to be exactly 11 digits starting with 01
    if (typeof mobileNumber !== 'string' || mobileNumber.length !== 11 || !mobileNumber.startsWith('01')) {
      return NextResponse.json(
        { error: 'Mobile number must be exactly 11 digits and start with 01.' },
        { status: 400 }
      );
    }

    // Validate phone verification via cookie (always verify)
    const localPhone = mobileNumber.startsWith('+880') 
      ? '0' + mobileNumber.slice(4) 
      : (mobileNumber.startsWith('+88') ? '0' + mobileNumber.slice(3) : mobileNumber);

    const verifiedCookie = request.cookies.get("verified_phone_token")?.value;
    if (!verifiedCookie) {
      return NextResponse.json(
        { error: "Phone number not verified. Please verify your phone number first." },
        { status: 400 }
      );
    }

    const payload = await verifyToken(verifiedCookie);
    if (!payload || !payload.verified || payload.phoneNumber !== localPhone) {
      return NextResponse.json(
        { error: "Phone number verification is invalid or expired. Please verify again." },
        { status: 400 }
      );
    }

    // Verify doctor exists
    let doctor;
    const trimmedDoctorId = doctorId.trim();

    // 1. Try finding by ID if it's a valid ObjectId
    if (trimmedDoctorId.match(/^[0-9a-fA-F]{24}$/)) {
      doctor = await Doctor.findById(trimmedDoctorId);
    }

    // 2. Fallback to finding by slug if not found by ID or not a valid ObjectId
    if (!doctor) {
      doctor = await Doctor.findOne({ $or: [{ slug: trimmedDoctorId }, { slugBn: trimmedDoctorId }] });
    }

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Use the actual doctor _id for the appointment
    const actualDoctorId = doctor._id;

    // Validate affiliate code if provided
    let affiliateId = undefined;
    if (affiliateCode) {
      // Check in User model first (new system)
      let affiliate: any = await User.findOne({
        affiliateCode: affiliateCode.toUpperCase(),
        userType: 'affiliate',
        isActive: true
      });

      // Fallback to Affiliate model (old system) if not found in User
      if (!affiliate) {
        affiliate = await Affiliate.findOne({
          affiliateCode: affiliateCode.toUpperCase(),
          isActive: true
        });
      }

      if (affiliate) {
        affiliateId = affiliate._id;
        // Increment referrals count
        affiliate.referrals = (affiliate.referrals || 0) + 1;
        await affiliate.save();
      }
    }

    console.log(body)

    // Create appointment (serial number will be assigned by admin when confirming)
    const appointment = await Appointment.create({
      doctorId: actualDoctorId,
      patientName,
      mobileNumber,
      gender: gender || undefined,
      age: age || undefined,
      patientType,
      hospitalName,
      hospitalSlug: hospitalSlug || undefined,
      appointmentDate: new Date(appointmentDate),
      appointmentTime: appointmentTime || undefined,
      userId: userId || undefined,
      affiliateCode: affiliateCode?.toUpperCase() || undefined,
      affiliateId: affiliateId || undefined,
      hasCommission: false,
      status: 'pending',
    });

    // Populate doctor info
    await appointment.populate('doctorId');

    // Send SMS alert to admin
    try {
      const adminMessage = `New Serial Added!\nPatient Name: ${patientName}\nPatient Mobile: ${mobileNumber}`;
      await sendSMS('8801610384444', adminMessage);
    } catch (smsErr) {
      console.error('Failed to send admin booking SMS alert:', smsErr);
    }

    const response = NextResponse.json(
      { message: 'Appointment booked successfully', appointment },
      { status: 201 }
    );

    // Clear verification cookie
    response.cookies.set('verified_phone_token', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Clear user appointment history
export async function DELETE(request: NextRequest) {
  try {
    let session = await getAdminSession(request);
    if (!session) {
      session = await getSession(request);
    }
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Security check: Users can only clear their own history
    const isAdmin = session.role === 'admin' || session.role === 'superadmin';
    if (!isAdmin && session.id !== userId) {
      return NextResponse.json({ error: 'Forbidden. You can only clear your own history.' }, { status: 403 });
    }

    // We only delete 'completed' or 'cancelled' appointments when clearing history
    // Active appointments (pending/confirmed) should be preserved or manually cancelled first
    const result = await Appointment.deleteMany({
      userId: userId,
      status: { $in: ['completed', 'cancelled'] }
    });

    return NextResponse.json(
      { message: 'History cleared successfully', deletedCount: result.deletedCount },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error clearing appointments:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
