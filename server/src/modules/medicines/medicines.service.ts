import { prisma } from "../../services/prisma";
import { NotFoundError } from "../../utils/errors";
import type { CreateProductInput } from "./medicines.schema";

export const medicinesService = {
  async list(includeArchived = false) {
    const where = includeArchived ? {} : { active: 1 };
    return prisma.product.findMany({ where, orderBy: { name: "asc" } });
  },

  async search(query: string) {
    const q = `%${query}%`;
    return prisma.$queryRawUnsafe<unknown[]>(
      `SELECT * FROM products WHERE active = 1 AND (barcode ILIKE $1 OR name ILIKE $1) ORDER BY name LIMIT 50`,
      q,
    );
  },

  async getByBarcode(barcode: string) {
    return prisma.product.findUnique({ where: { barcode } });
  },

  async getById(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError("Product");
    return product;
  },

  async create(data: CreateProductInput) {
    const salePrice = data.salePrice && data.salePrice > 0
      ? data.salePrice
      : Math.round(data.purchasePrice * (1 + (data.markupPercent ?? 20) / 100));

    return prisma.product.create({
      data: {
        barcode: data.barcode,
        name: data.name,
        company: data.company ?? "",
        category: data.category ?? "",
        location: data.location ?? "",
        distributorId: data.distributorId ?? null,
        salePrice,
        purchasePrice: data.purchasePrice,
        markupPercent: data.markupPercent ?? 20,
        stockQty: data.stockQty ?? 0,
        expiry: data.expiry ?? null,
      },
    });
  },

  async update(id: string, data: CreateProductInput) {
    const old = await prisma.product.findUnique({ where: { id } });
    if (!old) throw new NotFoundError("Product");

    const salePrice = data.salePrice && data.salePrice > 0
      ? data.salePrice
      : Math.round(data.purchasePrice * (1 + (data.markupPercent ?? old.markupPercent) / 100));

    return prisma.product.update({
      where: { id },
      data: {
        barcode: data.barcode,
        name: data.name,
        company: data.company ?? "",
        category: data.category ?? "",
        location: data.location ?? "",
        distributorId: data.distributorId ?? null,
        salePrice,
        purchasePrice: data.purchasePrice,
        markupPercent: data.markupPercent ?? old.markupPercent,
        stockQty: data.stockQty ?? 0,
        expiry: data.expiry ?? null,
      },
    });
  },

  async archive(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError("Product");
    return prisma.product.update({ where: { id }, data: { active: 0 } });
  },

  async restore(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError("Product");
    return prisma.product.update({ where: { id }, data: { active: 1 } });
  },
};
