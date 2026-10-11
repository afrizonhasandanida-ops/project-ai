import { Router } from "express";
import { productController } from "../controllers/product.controller.js";
import { requireJsonApiContentType } from "../middleware/negotiate-jsonapi.js";
import { requireWriteKey } from "../middleware/require-write-key.js";
import { validateCreateProduct } from "../validators/product.validator.js";

export const productRouter = Router();

productRouter.get("/", productController.list);
productRouter.get("/:id", productController.getById);
productRouter.post(
  "/",
  requireJsonApiContentType,
  requireWriteKey,
  validateCreateProduct,
  productController.create,
);
