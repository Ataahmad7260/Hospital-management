import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { BillCategory, BillStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';

@Injectable()
export class PharmacyService {
  constructor(private readonly prisma: PrismaService) {}

  private roundCurrency(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }

  private parsePharmacyBillItemDescription(description: string): {
    medicineName: string;
    catalogName: string | null;
    regimenDetails: string | null;
  } {
    const raw = String(description || '').trim();
    const match = raw.match(/^Medicine:\s*(.+?)\s*\((.+)\)$/);
    if (!match) {
      return {
        medicineName: raw || 'Dispensed Medication',
        catalogName: null,
        regimenDetails: null,
      };
    }

    const prescribedName = match[1].trim();
    const meta = match[2].trim();
    const [leftRegimen, rightSource] = meta.split('•').map((s) => s.trim());
    let catalogName: string | null = null;

    if (rightSource) {
      const sourceLabel = rightSource.split('—')[0]?.trim() || '';
      if (sourceLabel && !sourceLabel.toLowerCase().includes('unlisted')) {
        catalogName = sourceLabel;
      }
    }

    return {
      medicineName: prescribedName || catalogName || 'Dispensed Medication',
      catalogName,
      regimenDetails: leftRegimen || null,
    };
  }

  async createMedicine(dto: CreateMedicineDto) {
    const existing = await this.prisma.medicine.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Medicine with name '${dto.name}' already exists in inventory`);
    }

    return this.prisma.medicine.create({
      data: {
        name: dto.name,
        genericName: dto.genericName,
        category: dto.category,
        manufacturer: dto.manufacturer,
        batchNumber: dto.batchNumber,
        stockQuantity: dto.stockQuantity,
        reorderLevel: dto.reorderLevel ?? 10,
        unitPrice: dto.unitPrice,
        expiryDate: new Date(dto.expiryDate),
      },
    });
  }

  async findAll() {
    return this.prisma.medicine.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findLowStock() {
    return this.prisma.medicine.findMany({
      where: {
        stockQuantity: { lte: 10 },
      },
    });
  }

  async updateStock(id: string, quantityDelta: number) {
    const med = await this.prisma.medicine.findUnique({ where: { id } });
    if (!med) throw new NotFoundException(`Medicine ${id} not found`);

    return this.prisma.medicine.update({
      where: { id },
      data: {
        stockQuantity: Math.max(0, med.stockQuantity + quantityDelta),
      },
    });
  }

  /**
   * Pharmacist Sales & Revenue Ledger:
   * Aggregates complete payment history for all PHARMACY invoices,
   * itemized medicine breakdowns, payment method breakdown,
   * and totals for both the last month (30 days) and overall.
   */
  async getSalesLedger() {
    const [pharmacyBills, dispensedLogs] = await Promise.all([
      this.prisma.bill.findMany({
        where: {
          billType: BillCategory.PHARMACY,
          status: { notIn: [BillStatus.CANCELLED, BillStatus.REFUNDED] },
        },
        include: {
          patient: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
          prescription: {
            select: {
              id: true,
              prescriptionNo: true,
              status: true,
              createdAt: true,
              doctor: {
                select: {
                  id: true,
                  specialization: true,
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Query without nested pharmacist join to avoid errors on legacy seed logs
      this.prisma.dispensedLog.findMany({
        select: {
          prescriptionId: true,
          dispensedItems: true,
          dispensedAt: true,
          notes: true,
        },
        orderBy: { dispensedAt: 'desc' },
      }),
    ]);

    const dispensedAtByRx = new Map<string, Date>();
    for (const log of dispensedLogs) {
      if (log.prescriptionId && !dispensedAtByRx.has(log.prescriptionId)) {
        dispensedAtByRx.set(log.prescriptionId, log.dispensedAt);
      }
    }

    const now = new Date();
    const lastMonthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const currentCalendarMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let overallPaidRevenue = 0;
    let overallTotalBilled = 0;
    let overallPendingRevenue = 0;
    let overallPaidTransactions = 0;
    let overallPendingTransactions = 0;
    let overallUnitsSold = 0;

    let lastMonthPaidRevenue = 0;
    let lastMonthTotalBilled = 0;
    let lastMonthPaidTransactions = 0;
    let lastMonthUnitsSold = 0;

    let currentMonthPaidRevenue = 0;
    let currentMonthPaidTransactions = 0;

    const medicineMap = new Map<
      string,
      {
        medicineName: string;
        catalogName: string | null;
        transactionsCount: number;
        totalUnitsSold: number;
        totalRevenue: number;
        lastMonthUnitsSold: number;
        lastMonthRevenue: number;
        lastSoldAt: Date;
      }
    >();

    const paymentMethodMap = new Map<
      string,
      { paymentMethod: string; transactionsCount: number; totalRevenue: number }
    >();

    const transactions = pharmacyBills.map((bill) => {
      const effectiveDate = bill.paidAt || bill.createdAt;
      const isPaid = bill.status === BillStatus.PAID;
      const hasCollectedPayment = isPaid || bill.status === BillStatus.PARTIALLY_PAID;
      const inLastMonth = new Date(effectiveDate).getTime() >= lastMonthStart.getTime();
      const inCurrentCalendarMonth =
        new Date(effectiveDate).getTime() >= currentCalendarMonthStart.getTime();

      const totalAmount = this.roundCurrency(bill.totalAmount);
      const paidAmount = this.roundCurrency(bill.paidAmount);
      const remainingDue = this.roundCurrency(Math.max(0, totalAmount - paidAmount));

      overallTotalBilled = this.roundCurrency(overallTotalBilled + totalAmount);
      if (inLastMonth) {
        lastMonthTotalBilled = this.roundCurrency(lastMonthTotalBilled + totalAmount);
      }

      if (hasCollectedPayment && paidAmount > 0) {
        overallPaidRevenue = this.roundCurrency(overallPaidRevenue + paidAmount);
        overallPaidTransactions += 1;

        if (inLastMonth) {
          lastMonthPaidRevenue = this.roundCurrency(lastMonthPaidRevenue + paidAmount);
          lastMonthPaidTransactions += 1;
        }
        if (inCurrentCalendarMonth) {
          currentMonthPaidRevenue = this.roundCurrency(currentMonthPaidRevenue + paidAmount);
          currentMonthPaidTransactions += 1;
        }

        const methodKey = String(bill.paymentMethod || 'CASH');
        const prevMethod = paymentMethodMap.get(methodKey) || {
          paymentMethod: methodKey,
          transactionsCount: 0,
          totalRevenue: 0,
        };
        prevMethod.transactionsCount += 1;
        prevMethod.totalRevenue = this.roundCurrency(prevMethod.totalRevenue + paidAmount);
        paymentMethodMap.set(methodKey, prevMethod);
      }

      if (!isPaid && remainingDue > 0) {
        overallPendingRevenue = this.roundCurrency(overallPendingRevenue + remainingDue);
        overallPendingTransactions += 1;
      }

      const parsedItems = (bill.items || []).map((item) => {
        const parsed = this.parsePharmacyBillItemDescription(item.description);
        const qty = Math.max(0, Number(item.quantity || 0));
        const unitPrice = this.roundCurrency(item.unitPrice);
        const lineTotal = this.roundCurrency(item.total);

        if (isPaid) {
          overallUnitsSold += qty;
          if (inLastMonth) {
            lastMonthUnitsSold += qty;
          }

          const displayName = parsed.catalogName || parsed.medicineName;
          const medKey = displayName.trim().toLowerCase();
          const prevMed = medicineMap.get(medKey) || {
            medicineName: displayName,
            catalogName: parsed.catalogName,
            transactionsCount: 0,
            totalUnitsSold: 0,
            totalRevenue: 0,
            lastMonthUnitsSold: 0,
            lastMonthRevenue: 0,
            lastSoldAt: effectiveDate,
          };
          prevMed.transactionsCount += 1;
          prevMed.totalUnitsSold += qty;
          prevMed.totalRevenue = this.roundCurrency(prevMed.totalRevenue + lineTotal);
          if (inLastMonth) {
            prevMed.lastMonthUnitsSold += qty;
            prevMed.lastMonthRevenue = this.roundCurrency(prevMed.lastMonthRevenue + lineTotal);
          }
          if (new Date(effectiveDate).getTime() > new Date(prevMed.lastSoldAt).getTime()) {
            prevMed.lastSoldAt = effectiveDate;
          }
          medicineMap.set(medKey, prevMed);
        }

        return {
          description: item.description,
          medicineName: parsed.medicineName,
          catalogName: parsed.catalogName,
          regimenDetails: parsed.regimenDetails,
          quantity: qty,
          unitPrice,
          total: lineTotal,
        };
      });

      const rxId = bill.prescription?.id || bill.prescriptionId || null;

      return {
        id: bill.id,
        invoiceNumber: bill.invoiceNumber,
        status: bill.status,
        paymentMethod: bill.paymentMethod,
        subtotal: this.roundCurrency(bill.subtotal),
        taxAmount: this.roundCurrency(bill.taxAmount),
        discountAmount: this.roundCurrency(bill.discountAmount),
        totalAmount,
        paidAmount,
        remainingDue,
        paidAt: bill.paidAt,
        createdAt: bill.createdAt,
        isLastMonth: inLastMonth,
        dispensedAt: rxId ? dispensedAtByRx.get(rxId) || null : null,
        patient: bill.patient?.user
          ? {
              id: bill.patientId,
              name: `${bill.patient.user.firstName} ${bill.patient.user.lastName}`.trim(),
              email: bill.patient.user.email,
            }
          : { id: bill.patientId, name: 'Patient', email: '' },
        prescription: bill.prescription
          ? {
              id: bill.prescription.id,
              prescriptionNo: bill.prescription.prescriptionNo,
              status: bill.prescription.status,
              doctorName: bill.prescription.doctor?.user
                ? `Dr. ${[
                    bill.prescription.doctor.user.firstName,
                    bill.prescription.doctor.user.lastName,
                  ]
                    .filter(Boolean)
                    .join(' ')
                    .trim()}`
                : 'Attending Physician',
            }
          : null,
        items: parsedItems,
      };
    });

    const medicineBreakdown = Array.from(medicineMap.values())
      .map((m) => ({
        ...m,
        averageUnitPrice:
          m.totalUnitsSold > 0
            ? this.roundCurrency(m.totalRevenue / m.totalUnitsSold)
            : 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    const paymentMethodBreakdown = Array.from(paymentMethodMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue,
    );

    return {
      summary: {
        lastMonth: {
          windowStart: lastMonthStart.toISOString(),
          windowEnd: now.toISOString(),
          totalRevenue: lastMonthPaidRevenue,
          totalBilled: lastMonthTotalBilled,
          paidTransactionsCount: lastMonthPaidTransactions,
          totalUnitsSold: lastMonthUnitsSold,
          averageOrderValue:
            lastMonthPaidTransactions > 0
              ? this.roundCurrency(lastMonthPaidRevenue / lastMonthPaidTransactions)
              : 0,
        },
        currentCalendarMonth: {
          monthStart: currentCalendarMonthStart.toISOString(),
          totalRevenue: currentMonthPaidRevenue,
          paidTransactionsCount: currentMonthPaidTransactions,
        },
        overall: {
          totalRevenue: overallPaidRevenue,
          totalBilled: overallTotalBilled,
          pendingRevenue: overallPendingRevenue,
          paidTransactionsCount: overallPaidTransactions,
          pendingTransactionsCount: overallPendingTransactions,
          totalTransactionsCount: transactions.length,
          totalUnitsSold: overallUnitsSold,
          averageOrderValue:
            overallPaidTransactions > 0
              ? this.roundCurrency(overallPaidRevenue / overallPaidTransactions)
              : 0,
        },
      },
      medicineBreakdown,
      paymentMethodBreakdown,
      transactions,
    };
  }
}
