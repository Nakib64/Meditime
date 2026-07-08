import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Affiliate from '@/models/Affiliate';
import User from '@/models/User';
import AffiliateCommission from '@/models/AffiliateCommission';
import Appointment from '@/models/Appointment';

// GET - Fetch monthly affiliate performance report
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    // Calculate date range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Fetch active affiliates from both User and Affiliate collections
    const userAffiliates = await User.find({ userType: 'affiliate', isActive: true }).lean();
    const legacyAffiliates = await Affiliate.find({ isActive: true }).lean();

    const combinedAffiliates = [
      ...userAffiliates.map((aff: any) => ({
        _id: aff._id,
        name: aff.fullName,
        affiliateCode: aff.affiliateCode,
        email: aff.email,
        phoneNumber: aff.phoneNumber,
        walletBalance: aff.walletBalance || 0,
        totalEarned: aff.totalEarned || 0,
      })),
      ...legacyAffiliates.map((aff: any) => ({
        _id: aff._id,
        name: aff.name,
        affiliateCode: aff.affiliateCode,
        email: aff.email,
        phoneNumber: aff.phoneNumber,
        walletBalance: aff.walletBalance || 0,
        totalEarned: aff.totalEarned || 0,
      }))
    ];

    const report = await Promise.all(
      combinedAffiliates.map(async (affiliate) => {
        // Get bookings this month
        const bookings = await Appointment.countDocuments({
          affiliateId: affiliate._id,
          createdAt: { $gte: startDate, $lte: endDate },
        });

        // Get commissions this month
        const commissions = await AffiliateCommission.find({
          affiliateId: affiliate._id,
          createdAt: { $gte: startDate, $lte: endDate },
        });

        const earnedThisMonth = commissions
          .filter((c) => c.status === 'approved' || c.status === 'paid')
          .reduce((sum, c) => sum + c.commissionAmount, 0);

        const pendingAmount = commissions
          .filter((c) => c.status === 'pending')
          .reduce((sum, c) => sum + c.commissionAmount, 0);

        return {
          affiliateId: affiliate._id,
          name: affiliate.name,
          affiliateCode: affiliate.affiliateCode,
          email: affiliate.email,
          phoneNumber: affiliate.phoneNumber,
          bookingsThisMonth: bookings,
          earnedThisMonth,
          pendingAmount,
          walletBalance: affiliate.walletBalance || 0,
          totalEarned: affiliate.totalEarned || 0,
        };
      })
    );

    // Sort by earnings this month
    report.sort((a, b) => b.earnedThisMonth - a.earnedThisMonth);

    return NextResponse.json({
      report,
      period: {
        month,
        year,
        startDate,
        endDate,
      },
    });
  } catch (error: any) {
    console.error('Error fetching monthly report:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
