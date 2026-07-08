import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AffiliateWithdrawal from '@/models/AffiliateWithdrawal';
import Affiliate from '@/models/Affiliate';
import User from '@/models/User';

// GET - Fetch all withdrawal requests
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

    const [withdrawals, total] = await Promise.all([
      AffiliateWithdrawal.find(query)
        .populate('processedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AffiliateWithdrawal.countDocuments(query),
    ]);

    // Manually populate affiliateId since they can be in User or Affiliate collections
    const affiliateIds = withdrawals.map(w => w.affiliateId).filter(Boolean);
    
    // Find in Users and Affiliates
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

    const populatedWithdrawals = withdrawals.map(w => {
      const wObj = w.toObject();
      const affId = w.affiliateId?.toString();
      wObj.affiliateId = affiliateMap.get(affId) || null;
      return wObj;
    });

    return NextResponse.json({
      withdrawals: populatedWithdrawals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
