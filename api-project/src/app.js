import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { mountSwagger } from "./config/swagger.js";
import { ApiError } from "./errors/api-error.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { requestId } from "./middleware/request-id.js";
import { requestLogger } from "./middleware/request-logger.js";
import { apiRouter } from "./routes/index.js";

export async function createApp() {
  const app = express();
  const productImageDirectory = fileURLToPath(new URL("../../Page2/project-AI/images/", import.meta.url));
  app.disable("x-powered-by");
  app.use(requestId);
  app.use(requestLogger);
  app.use(cors({
    origin(origin, callback) {
      // File pages send Origin: null. Allow it only in development; production uses the allowlist.
      if (!origin || env.corsOrigins.includes(origin) || (env.nodeEnv === "development" && origin === "null")) {
        return callback(null, true);
      }
      return callback(new ApiError(403, "CORS_ORIGIN_DENIED", "Origin not allowed", "This origin is not allowed to access the API."));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Accept", "Content-Type", "X-API-Key", "X-Request-ID"],
    exposedHeaders: ["Location", "X-Request-ID"],
    credentials: false,
  }));
  app.use(express.json({
    type: "application/vnd.api+json",
    limit: "32kb",
    strict: true,
  }));
  app.use("/images", express.static(productImageDirectory, { fallthrough: true }));

  await mountSwagger(app);
  app.use("/api", apiRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
