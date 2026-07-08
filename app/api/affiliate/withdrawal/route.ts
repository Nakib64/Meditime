import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AffiliateWithdrawal from '@/models/AffiliateWithdrawal';
import User from '@/models/User';
import Affiliate from '@/models/Affiliate';

// POST - Submit withdrawal request
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      affiliateCode,
      amount,
      patientName,
      patientPhone,
      hospitalName,
      proofPhotos,
      paymentMethod,
      paymentDetails,
      notes,
    } = body;

    // Basic validation
    if (!affiliateCode || !amount) {
      return NextResponse.json(
        { error: 'Affiliate code and amount are required' },
        { status: 400 }
      );
    }

    // Find affiliate - check both User model (new) and Affiliate model (legacy)
    let affiliate = await User.findOne({ 
      affiliateCode: affiliateCode.toUpperCase(),
      userType: 'affiliate'
    });
    
    // Fallback to legacy Affiliate model if not found in User
    if (!affiliate) {
      affiliate = await Affiliate.findOne({ affiliateCode: affiliateCode.toUpperCase() });
    }

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    const currentBalance = affiliate.walletBalance || 0;

    // Check balance
    if (currentBalance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance. Your current balance is ৳' + currentBalance },
        { status: 400 }
      );
    }

    // Immediately deduct from wallet at request time, but do NOT increment totalWithdrawn yet
    affiliate.walletBalance = currentBalance - amount;
    await affiliate.save();

    // Create withdrawal request (admin will only approve/reject, no more balance changes)
    const withdrawal = await AffiliateWithdrawal.create({
      affiliateId: affiliate._id,
      amount,
      patientName,
      patientPhone,
      hospitalName,
      proofPhotos,
      paymentMethod,
      paymentDetails,
      notes,
      status: 'pending',
    });

    await withdrawal.populate('affiliateId', 'fullName name affiliateCode email');

    return NextResponse.json(
      {
        message: 'Withdrawal request submitted successfully',
        withdrawal,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error submitting withdrawal:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
