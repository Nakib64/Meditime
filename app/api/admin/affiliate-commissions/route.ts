import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AffiliateCommission from '@/models/AffiliateCommission';
import Appointment from '@/models/Appointment';
import Affiliate from '@/models/Affiliate';
import User from '@/models/User';

// GET - Fetch all affiliate commissions with filters
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const affiliateId = searchParams.get('affiliateId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (affiliateId) {
      query.affiliateId = affiliateId;
    }

    const skip = (page - 1) * limit;

    const [commissions, total] = await Promise.all([
      AffiliateCommission.find(query)
        .populate('appointmentId', 'patientName mobileNumber appointmentDate hospitalName')
        .populate('approvedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AffiliateCommission.countDocuments(query),
    ]);

    // Manually populate affiliateId since they can be in User or Affiliate collections
    const affiliateIds = commissions.map(c => c.affiliateId).filter(Boolean);
    const users = await User.find({ _id: { $in: affiliateIds } }).lean();
    const legacy = await Affiliate.find({ _id: { $in: affiliateIds } }).lean();

    const affiliateMap = new Map();
    users.forEach((u: any) => {
      affiliateMap.set(u._id.toString(), {
        _id: u._id.toString(),
        name: u.fullName,
        fullName: u.fullName,
        affiliateCode: u.affiliateCode,
        email: u.email,
        phoneNumber: u.phoneNumber,
        walletBalance: u.walletBalance || 0,
      });
    });
    legacy.forEach((l: any) => {
      affiliateMap.set(l._id.toString(), {
        _id: l._id.toString(),
        name: l.name,
        fullName: l.name,
        affiliateCode: l.affiliateCode,
        email: l.email,
        phoneNumber: l.phoneNumber,
        walletBalance: l.walletBalance || 0,
      });
    });

    const populatedCommissions = commissions.map(c => {
      const cObj = c.toObject();
      const affId = c.affiliateId?.toString();
      cObj.affiliateId = affiliateMap.get(affId) || null;
      return cObj;
    });

    return NextResponse.json({
      commissions: populatedCommissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching commissions:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update commission for an appointment
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      appointmentId,
      totalBill,
      commissionType,
      commissionValue,
      notes,
    } = body;

    // Validate required fields
    if (!appointmentId || !totalBill || !commissionType || commissionValue === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify appointment exists and has affiliate
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (!appointment.affiliateId) {
      return NextResponse.json(
        { error: 'Appointment does not have an affiliate code' },
        { status: 400 }
      );
    }

    // Calculate commission amount
    let commissionAmount = 0;
    if (commissionType === 'percentage') {
      commissionAmount = (totalBill * commissionValue) / 100;
    } else if (commissionType === 'flat') {
      commissionAmount = commissionValue;
    }

    // Check if commission already exists
    const existingCommission = await AffiliateCommission.findOne({ appointmentId });

    if (existingCommission) {
      // Update existing commission
      existingCommission.totalBill = totalBill;
      existingCommission.commissionType = commissionType;
      existingCommission.commissionValue = commissionValue;
      existingCommission.commissionAmount = commissionAmount;
      existingCommission.notes = notes;
      await existingCommission.save();

      return NextResponse.json({
        message: 'Commission updated successfully',
        commission: existingCommission,
      });
    } else {
      // Create new commission
      const commission = await AffiliateCommission.create({
        appointmentId,
        affiliateId: appointment.affiliateId,
        totalBill,
        commissionType,
        commissionValue,
        commissionAmount,
        status: 'pending',
        notes,
      });

      // Update appointment
      appointment.hasCommission = true;
      await appointment.save();

      // Update affiliate pending commissions (check both collections)
      let affiliate = await User.findById(appointment.affiliateId);
      if (affiliate) {
        affiliate.pendingCommissions = (affiliate.pendingCommissions || 0) + commissionAmount;
        await affiliate.save();
      } else {
        await Affiliate.findByIdAndUpdate(appointment.affiliateId, {
          $inc: { pendingCommissions: commissionAmount },
        });
      }

      // Populate manually for return response
      const affObj: any = await User.findById(appointment.affiliateId).lean() || await Affiliate.findById(appointment.affiliateId).lean();
      const populatedCommission = commission.toObject();
      if (affObj) {
        populatedCommission.affiliateId = {
          _id: affObj._id.toString(),
          name: (affObj as any).fullName || (affObj as any).name || "",
          affiliateCode: affObj.affiliateCode,
          email: affObj.email,
        };
      }

      return NextResponse.json(
        {
          message: 'Commission created successfully',
          commission: populatedCommission,
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error('Error creating commission:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
