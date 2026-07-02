import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body.username, req.body.password);
      res.json(result);
    } catch (err) { next(err); }
  },

  async verifyPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.verifyPassword(req.body.password);
      res.json(result);
    } catch (err) { next(err); }
  },

  async generateRecoveryKey(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.generateRecoveryKey();
      res.json(result);
    } catch (err) { next(err); }
  },

  async recoverPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.recoverPassword(req.body.phrase, req.body.newPassword);
      res.json(result);
    } catch (err) { next(err); }
  },
};
