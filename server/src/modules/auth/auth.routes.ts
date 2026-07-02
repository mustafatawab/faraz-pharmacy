import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../middleware/validate";
import { verifyPasswordSchema, recoverPasswordSchema } from "./auth.schema";

const router = Router();

router.post("/login", authController.login);
router.post("/verify-password", validate(verifyPasswordSchema), authController.verifyPassword);
router.post("/generate-recovery-key", authController.generateRecoveryKey);
router.post("/recover-password", validate(recoverPasswordSchema), authController.recoverPassword);

export { router as authRoutes };
