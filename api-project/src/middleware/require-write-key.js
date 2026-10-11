import { timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { ApiError } from "../errors/api-error.js";

export function requireWriteKey(req, _res, next) {
  const candidate = req.get("x-api-key") ?? "";
  const expectedBuffer = Buffer.from(env.productWriteApiKey);
  const candidateBuffer = Buffer.from(candidate);
  const valid = candidateBuffer.length === expectedBuffer.length
    && timingSafeEqual(candidateBuffer, expectedBuffer);

  if (!valid) {
    return next(new ApiError(401, "UNAUTHORIZED", "Unauthorized", "A valid X-API-Key is required."));
  }
  next();
}
