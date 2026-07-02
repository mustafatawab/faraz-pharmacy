import { Router } from "express";
import { arrearsController } from "./arrears.controller";
import { validate } from "../../middleware/validate";
import { createArrearSchema, payArrearSchema } from "./arrears.schema";

const router = Router();

router.get("/", arrearsController.list);
router.post("/", validate(createArrearSchema), arrearsController.create);
router.post("/:id/pay", validate(payArrearSchema), arrearsController.recordPayment);
router.post("/:id/settle", arrearsController.settle);
router.delete("/:id", arrearsController.delete);

export { router as arrearsRoutes };
