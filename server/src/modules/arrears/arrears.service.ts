import { prisma } from "../../services/prisma";
import { NotFoundError } from "../../utils/errors";

export const arrearsService = {
  async list(status?: string) {
    const where = status && status !== "all" ? { status } : {};
    return prisma.arrear.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } } },
    });
  },

  async create(data: { customerId: string; totalBill: number; amountPaid?: number; saleId?: string }) {
    const balanceDue = data.totalBill - (data.amountPaid ?? 0);
    return prisma.arrear.create({
      data: {
        saleId: data.saleId ?? "",
        customerId: data.customerId,
        totalBill: data.totalBill,
        amountPaid: data.amountPaid ?? 0,
        balanceDue: Math.max(0, balanceDue),
        status: balanceDue <= 0 ? "settled" : "pending",
      },
      include: { customer: { select: { name: true } } },
    });
  },

  async recordPayment(id: string, amount: number) {
    const arrear = await prisma.arrear.findUnique({ where: { id } });
    if (!arrear) throw new NotFoundError("Arrear");

    const newPaid = arrear.amountPaid + amount;
    const newBalance = Math.max(0, arrear.totalBill - newPaid);
    const newStatus = newBalance <= 0 ? "settled" : "pending";

    return prisma.$transaction(async (tx) => {
      const updated = await tx.arrear.update({
        where: { id },
        data: { amountPaid: newPaid, balanceDue: newBalance, status: newStatus },
        include: { customer: { select: { name: true } } },
      });

      if (newBalance <= 0 && arrear.saleId) {
        await tx.sale.update({ where: { id: arrear.saleId }, data: { status: "paid" } });
      }

      return updated;
    });
  },

  async settle(id: string) {
    const arrear = await prisma.arrear.findUnique({ where: { id } });
    if (!arrear) throw new NotFoundError("Arrear");

    return prisma.$transaction(async (tx) => {
      const updated = await tx.arrear.update({
        where: { id },
        data: { amountPaid: arrear.totalBill, balanceDue: 0, status: "settled" },
        include: { customer: { select: { name: true } } },
      });

      if (arrear.saleId) {
        await tx.sale.update({ where: { id: arrear.saleId }, data: { status: "paid" } });
      }

      return updated;
    });
  },

  async delete(id: string) {
    const arrear = await prisma.arrear.findUnique({ where: { id } });
    if (!arrear) throw new NotFoundError("Arrear");
    await prisma.arrear.delete({ where: { id } });
    return { success: true };
  },
};
