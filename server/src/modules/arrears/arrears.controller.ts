import type { Request, Response, NextFunction } from "express";
import { arrearsService } from "./arrears.service";

export const arrearsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const arrears = await arrearsService.list(status);
      res.json(arrears);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const arrear = await arrearsService.create(req.body);
      res.json(arrear);
    } catch (err) { next(err); }
  },

  async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await arrearsService.recordPayment(req.params.id, req.body.amount);
      res.json(result);
    } catch (err) { next(err); }
  },

  async settle(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await arrearsService.settle(req.params.id);
      res.json(result);
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await arrearsService.delete(req.params.id);
      res.json(result);
    } catch (err) { next(err); }
  },
};
