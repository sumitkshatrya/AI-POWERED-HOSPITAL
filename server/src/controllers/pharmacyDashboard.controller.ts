import { Request, Response, NextFunction } from 'express';
import { PharmacySale, Inventory, Medicine, Prescription } from '../models';

export const getPharmacyDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const query: any = {};
    if (req.user?.hospitalId) {
      query.hospitalId = req.user.hospitalId;
    }

    const salesQuery: any = { createdAt: { $gte: startOfDay } };
    if (req.user?.hospitalId) {
      salesQuery.hospitalId = req.user.hospitalId;
    }

    const [
      totalMedicines,
      allMedicines,
      allInventory,
      salesAgg,
      pendingPrescriptionsCount,
      recentSales,
    ] = await Promise.all([
      Medicine.countDocuments(query),
      Medicine.find(query),
      Inventory.find(query).populate('medicineId'),
      PharmacySale.aggregate([
        { $match: salesQuery },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Prescription.countDocuments({
        ...(req.user?.hospitalId ? { hospitalId: req.user.hospitalId } : {}),
        status: { $ne: 'FULFILLED' },
      }),
      PharmacySale.find(query)
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('patientId', 'firstName lastName')
        .populate('items.medicineId', 'name'),
    ]);

    const todaysSalesAmount = salesAgg.length > 0 ? salesAgg[0].totalAmount : 0;
    const todaysSalesCount = salesAgg.length > 0 ? salesAgg[0].count : 0;

    let lowStockCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;
    let hospitalInventoryLowStockCount = 0;

    const alerts: Array<{
      id: string;
      medicineName: string;
      batchNumber: string;
      type: 'LOW_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';
      severity: 'HIGH' | 'MEDIUM' | 'CRITICAL';
      message: string;
      value: number | string;
    }> = [];

    allInventory.forEach((inv: any) => {
      const medName = (inv.medicineId as any)?.name || 'Medicine';
      const batchNum = inv.batchNumber || 'N/A';
      const expiry = new Date(inv.expiryDate);
      const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (inv.quantity <= inv.reorderLevel) {
        lowStockCount++;
        hospitalInventoryLowStockCount++;
        alerts.push({
          id: `low-${inv._id}`,
          medicineName: medName,
          batchNumber: batchNum,
          type: 'LOW_STOCK',
          severity: inv.quantity === 0 ? 'CRITICAL' : 'HIGH',
          message: `Stock low (${inv.quantity} remaining, reorder level ${inv.reorderLevel})`,
          value: inv.quantity,
        });
      }

      if (daysUntil < 0) {
        expiredCount++;
        alerts.push({
          id: `exp-${inv._id}`,
          medicineName: medName,
          batchNumber: batchNum,
          type: 'EXPIRED',
          severity: 'CRITICAL',
          message: `EXPIRED on ${expiry.toISOString().split('T')[0]} (${Math.abs(daysUntil)} days ago)`,
          value: expiry.toISOString().split('T')[0],
        });
      } else if (daysUntil <= 90) {
        expiringCount++;
        alerts.push({
          id: `expsoon-${inv._id}`,
          medicineName: medName,
          batchNumber: batchNum,
          type: 'EXPIRING_SOON',
          severity: daysUntil <= 30 ? 'HIGH' : 'MEDIUM',
          message: `Expires in ${daysUntil} days (${expiry.toISOString().split('T')[0]})`,
          value: daysUntil,
        });
      }
    });

    const recentTransactions = recentSales.map((s: any) => ({
      id: s._id,
      saleNumber: s.saleNumber,
      totalAmount: s.totalAmount,
      patientName: s.patientId ? `${s.patientId.firstName} ${s.patientId.lastName}` : 'Walk-in',
      createdAt: s.createdAt,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalMedicines,
          lowStockCount,
          expiringCount,
          expiredCount,
          todaysSalesAmount,
          todaysSalesCount,
          pendingPrescriptionsCount,
          hospitalInventoryLowStockCount,
        },
        alerts,
        recentTransactions,
      },
    });
  } catch (err) {
    next(err);
  }
};
