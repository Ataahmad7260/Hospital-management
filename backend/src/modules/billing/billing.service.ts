import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BillStatus, PaymentMethod } from '@prisma/client';
import { CreateBillDto } from './dto/create-bill.dto';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBillDto) {
    const count = await this.prisma.bill.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;
    const tax = dto.taxAmount ?? 0;
    const discount = dto.discountAmount ?? 0;
    const totalAmount = dto.subtotal + tax - discount;

    return this.prisma.bill.create({
      data: {
        invoiceNumber,
        patientId: dto.patientId,
        appointmentId: dto.appointmentId,
        items: dto.items,
        subtotal: dto.subtotal,
        taxAmount: tax,
        discountAmount: discount,
        totalAmount,
        paidAmount: 0,
        status: BillStatus.PENDING,
        paymentMethod: dto.paymentMethod ?? PaymentMethod.CASH,
      },
      include: {
        patient: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
    });
  }

  async findAll(user?: any) {
    let whereClause = {};

    if (user?.role === 'PATIENT') {
      whereClause = { patient: { userId: user.id } };
    }

    return this.prisma.bill.findMany({
      where: whereClause,
      include: {
        patient: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordPayment(id: string, paidAmount: number, paymentMethod?: PaymentMethod) {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException(`Bill with ID ${id} not found`);

    const newPaid = bill.paidAmount + paidAmount;
    const isFull = newPaid >= bill.totalAmount;

    return this.prisma.bill.update({
      where: { id },
      data: {
        paidAmount: newPaid,
        status: isFull ? BillStatus.PAID : BillStatus.PARTIALLY_PAID,
        paidAt: isFull ? new Date() : bill.paidAt,
        ...(paymentMethod && { paymentMethod }),
      },
    });
  }
}
