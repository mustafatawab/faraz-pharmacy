import type { Request, Response, NextFunction } from "express";
import { salesService } from "./sales.service";

export const salesController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const sale = await salesService.create(req.body);
      res.json(sale);
    } catch (err) { next(err); }
  },

  async listRecent(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const sales = await salesService.listRecent(limit);
      res.json(sales);
    } catch (err) { next(err); }
  },

  async listByDate(req: Request, res: Response, next: NextFunction) {
    try {
      const sales = await salesService.listByDate(req.params.date);
      res.json(sales);
    } catch (err) { next(err); }
  },

  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const sales = await salesService.listAll({
        search: req.query.search as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
      });
      res.json(sales);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const sale = await salesService.getById(req.params.id);
      res.json(sale);
    } catch (err) { next(err); }
  },
};
