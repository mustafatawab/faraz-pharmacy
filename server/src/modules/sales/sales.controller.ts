import type { Request, Response, NextFunction } from "express";
import { salesService } from "./sales.service";

function normalizeSale(s: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!s) return null;
  return {
    id: s.id,
    customer_id: s.customerId ?? null,
    customer_name: (s as any).customer?.name ?? null,
    subtotal: s.subtotal,
    discount: s.discount,
    total: s.total,
    amount_paid: s.amountPaid,
    change: s.change,
    status: s.status,
    created_at: s.createdAt,
    items: (s as any).items ?? [],
    item_count: (s as any)._count?.items ?? (s as any).items?.length ?? 0,
    return_count: (s as any)._count?.returns ?? 0,
  };
}

export const salesController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const sale = await salesService.create(req.body);
      res.json(normalizeSale(sale));
    } catch (err) { next(err); }
  },

  async listRecent(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const sales = await salesService.listRecent(limit);
      res.json(sales.map(normalizeSale));
    } catch (err) { next(err); }
  },

  async listByDate(req: Request, res: Response, next: NextFunction) {
    try {
      const sales = await salesService.listByDate(req.params.date);
      res.json(sales.map(normalizeSale));
    } catch (err) { next(err); }
  },

  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const sales = await salesService.listAll({
        search: req.query.search as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
      });
      res.json(sales.map(normalizeSale));
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const sale = await salesService.getById(req.params.id);
      res.json(normalizeSale(sale));
    } catch (err) { next(err); }
  },
};
