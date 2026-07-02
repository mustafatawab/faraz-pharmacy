import { prisma } from "../../services/prisma";
import { NotFoundError, BadRequestError } from "../../utils/errors";
import type { CreateCustomerInput } from "./customers.schema";

export const customersService = {
  async list() {
    return prisma.customer.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { sales: true } },
        arrears: { where: { status: "pending" }, select: { balanceDue: true } },
      },
    });
  },

  async search(query: string) {
    const q = `%${query}%`;
    return prisma.$queryRawUnsafe<unknown[]>(
      `SELECT * FROM customers WHERE name ILIKE $1 OR phone ILIKE $1 ORDER BY name LIMIT 20`,
      q,
    );
  },

  async getById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: { select: { sales: true } },
        arrears: { where: { status: "pending" }, select: { balanceDue: true } },
        sales: {
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { items: true } } },
        },
      },
    });
    if (!customer) throw new NotFoundError("Customer");
    return customer;
  },

  async create(data: CreateCustomerInput) {
    return prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone ?? "",
        address: data.address ?? "",
      },
    });
  },

  async update(id: string, data: CreateCustomerInput) {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Customer");

    return prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone ?? "",
        address: data.address ?? "",
      },
    });
  },

  async delete(id: string, force = false) {
    const salesCount = await prisma.sale.count({ where: { customerId: id } });
    const arrearsCount = await prisma.arrear.count({ where: { customerId: id } });

    if ((salesCount > 0 || arrearsCount > 0) && !force) {
      throw new BadRequestError(
        `Customer has ${salesCount} invoice(s) and ${arrearsCount} arrear(s). Use force delete to remove.`,
      );
    }

    return prisma.$transaction(async (tx) => {
      if (force) {
        await tx.sale.updateMany({ where: { customerId: id }, data: { customerId: null } });
        await tx.arrear.deleteMany({ where: { customerId: id } });
      }
      await tx.customer.delete({ where: { id } });
      return { success: true };
    });
  },
};
