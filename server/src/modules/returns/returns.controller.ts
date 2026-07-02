import type { Request, Response, NextFunction } from "express";
import { returnsService } from "./returns.service";

export const returnsController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const returns = await returnsService.list();
      res.json(returns);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await returnsService.create(req.body);
      res.json(result);
    } catch (err) { next(err); }
  },
};
