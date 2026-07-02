import { Router } from "express";
import { returnsController } from "./returns.controller";
import { validate } from "../../middleware/validate";
import { createReturnSchema } from "./returns.schema";

const router = Router();

router.get("/", returnsController.list);
router.post("/", validate(createReturnSchema), returnsController.create);

export { router as returnsRoutes };
