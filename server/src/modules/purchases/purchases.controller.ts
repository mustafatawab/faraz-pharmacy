import type { Request, Response, NextFunction } from "express";
import { purchasesService } from "./purchases.service";

export const purchasesController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const stock = await purchasesService.list();
      res.json(stock);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await purchasesService.create(req.body);
      res.json(result);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await purchasesService.update(req.params.id, req.body);
      res.json(result);
    } catch (err) { next(err); }
  },
};
