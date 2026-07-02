import type { Request, Response, NextFunction } from "express";
import { companiesService } from "./companies.service";

export const companiesController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const companies = await companiesService.list();
      res.json(companies);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await companiesService.create(req.body);
      res.json(company);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await companiesService.update(req.params.id, req.body);
      res.json(company);
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await companiesService.remove(req.params.id);
      res.json(result);
    } catch (err) { next(err); }
  },
};
