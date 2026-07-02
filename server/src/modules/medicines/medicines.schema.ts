import { z } from "zod";

export const createProductSchema = z.object({
  barcode: z.string().min(1),
  name: z.string().min(1),
  company: z.string().optional().default(""),
  category: z.string().optional().default(""),
  location: z.string().optional().default(""),
  distributorId: z.string().optional(),
  salePrice: z.number().optional(),
  purchasePrice: z.number(),
  markupPercent: z.number().optional().default(20),
  stockQty: z.number().int().optional().default(0),
  expiry: z.string().optional(),
});

export const updateProductSchema = createProductSchema;

export type CreateProductInput = z.infer<typeof createProductSchema>;
