import { z } from "zod";

export const createArrearSchema = z.object({
  customerId: z.string(),
  totalBill: z.number(),
  amountPaid: z.number().optional().default(0),
  saleId: z.string().optional(),
});

export const payArrearSchema = z.object({
  amount: z.number().positive(),
});

export type CreateArrearInput = z.infer<typeof createArrearSchema>;
