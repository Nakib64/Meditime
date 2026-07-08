import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AffiliateWithdrawal from '@/models/AffiliateWithdrawal';
import User from '@/models/User';
import Affiliate from '@/models/Affiliate';

// PUT - Process withdrawal request (approve or reject)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await context.params;
    const body = await request.json();
    const { action, adminId, rejectionReason, notes } = body;

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Find withdrawal request
    const withdrawal = await AffiliateWithdrawal.findById(id);
    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    // Check if already processed
    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Withdrawal request already processed' },
        { status: 400 }
      );
    }

    // Find affiliate - check User model first, then legacy Affiliate model
    let affiliate = await User.findById(withdrawal.affiliateId);
    if (!affiliate) {
      affiliate = await Affiliate.findById(withdrawal.affiliateId);
    }

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      // Approve withdrawal (wallet balance was already deducted at request time)
      // Increment totalWithdrawn now on approval
      affiliate.totalWithdrawn = (affiliate.totalWithdrawn || 0) + withdrawal.amount;
      await affiliate.save();

      withdrawal.status = 'approved';
      withdrawal.processedBy = adminId;
      withdrawal.processedAt = new Date();
      withdrawal.notes = notes;
      await withdrawal.save();

      return NextResponse.json({
        message: 'Withdrawal approved successfully',
        withdrawal,
      });
    } else {
      // Reject withdrawal
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      // Refund withdrawal amount back to affiliate's walletBalance on rejection
      affiliate.walletBalance = (affiliate.walletBalance || 0) + withdrawal.amount;
      await affiliate.save();

      withdrawal.status = 'rejected';
      withdrawal.processedBy = adminId;
      withdrawal.processedAt = new Date();
      withdrawal.rejectionReason = rejectionReason;
      withdrawal.notes = notes;
      await withdrawal.save();

      return NextResponse.json({
        message: 'Withdrawal rejected successfully',
        withdrawal,
      });
    }
  } catch (error: any) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
