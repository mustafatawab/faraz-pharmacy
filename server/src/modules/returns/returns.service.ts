import { prisma } from "../../services/prisma";
import { BadRequestError, NotFoundError } from "../../utils/errors";
import { emitEvent } from "../../socket";
import type { CreateReturnInput } from "./returns.schema";
import { Prisma } from "../../generated/prisma/client";

export const returnsService = {
  async list() {
    return prisma.returnEntry.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        sale: { include: { customer: { select: { name: true } } } },
      },
    });
  },

  async getById(id: string) {
    const entry = await prisma.returnEntry.findUnique({
      where: { id },
      include: {
        items: true,
        sale: { include: { customer: { select: { name: true } } } },
      },
    });
    if (!entry) throw new NotFoundError("Return");
    return entry;
  },

  async create(data: CreateReturnInput) {
    const existing = await prisma.returnEntry.findFirst({ where: { saleId: data.saleId } });
    if (existing) throw new BadRequestError("This sale has already been returned");

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const returnEntry = await tx.returnEntry.create({
        data: {
          saleId: data.saleId,
          refundAmount: data.refundAmount,
          reason: data.reason ?? "",
        },
      });

      for (const item of data.items) {
        await tx.returnItem.create({
          data: {
            returnId: returnEntry.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            refundAmount: item.refundAmount,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: item.quantity } },
        });
      }

      const result = await tx.returnEntry.findUnique({
        where: { id: returnEntry.id },
        include: {
          items: true,
          sale: { include: { customer: { select: { name: true } } } },
        },
      });

      emitEvent("return:created", result);
      return result;
    });
  },
};
