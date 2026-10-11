import { Router } from "express";
import { negotiateJsonApi } from "../middleware/negotiate-jsonapi.js";
import { productRouter } from "./product.routes.js";

export const apiRouter = Router();
apiRouter.use(negotiateJsonApi);
apiRouter.use("/products", productRouter);
