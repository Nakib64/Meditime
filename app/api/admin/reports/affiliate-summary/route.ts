import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Affiliate from '@/models/Affiliate';
import User from '@/models/User';
import AffiliateCommission from '@/models/AffiliateCommission';
import AffiliateWithdrawal from '@/models/AffiliateWithdrawal';
import Appointment from '@/models/Appointment';

// GET - Fetch affiliate program summary statistics
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get total active affiliates from both collections
    const totalUserAffiliates = await User.countDocuments({ userType: 'affiliate', isActive: true });
    const totalLegacyAffiliates = await Affiliate.countDocuments({ isActive: true });
    const totalAffiliates = totalUserAffiliates + totalLegacyAffiliates;

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get this month's commissions
    const monthlyCommissions = await AffiliateCommission.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          status: { $in: ['approved', 'paid'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get pending commissions
    const pendingCommissions = await AffiliateCommission.aggregate([
      {
        $match: {
          status: 'pending',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get pending withdrawals
    const pendingWithdrawals = await AffiliateWithdrawal.aggregate([
      {
        $match: {
          status: 'pending',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get total appointments with affiliate codes
    const totalAffiliateAppointments = await Appointment.countDocuments({
      affiliateId: { $exists: true, $ne: null },
    });

    // Get monthly appointments
    const monthlyAppointments = await Appointment.countDocuments({
      affiliateId: { $exists: true, $ne: null },
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    return NextResponse.json({
      summary: {
        totalAffiliates,
        totalAffiliateAppointments,
        monthlyAppointments,
        monthlyCommissions: {
          total: monthlyCommissions[0]?.total || 0,
          count: monthlyCommissions[0]?.count || 0,
        },
        pendingCommissions: {
          total: pendingCommissions[0]?.total || 0,
          count: pendingCommissions[0]?.count || 0,
        },
        pendingWithdrawals: {
          total: pendingWithdrawals[0]?.total || 0,
          count: pendingWithdrawals[0]?.count || 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching summary:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
