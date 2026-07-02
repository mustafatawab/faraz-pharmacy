import { prisma } from "../../services/prisma";
import { BadRequestError } from "../../utils/errors";
import { emitEvent } from "../../socket";
import type { CreateReturnInput } from "./returns.schema";

export const returnsService = {
  async list() {
    return prisma.returnEntry.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async create(data: CreateReturnInput) {
    const existing = await prisma.returnEntry.findFirst({ where: { saleId: data.saleId } });
    if (existing) throw new BadRequestError("This sale has already been returned");

    return prisma.$transaction(async (tx) => {
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

      const result = await tx.returnEntry.findUnique({ where: { id: returnEntry.id } });
      emitEvent("return:created", result);
      return result;
    });
  },
};
