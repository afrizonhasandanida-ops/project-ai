import { ApiError } from "../errors/api-error.js";

function jsonApiError(error, requestId) {
  const errors = error.errors?.length
    ? error.errors.map((item) => ({
      status: String(error.status),
      code: item.code,
      title: item.title,
      detail: item.detail,
      ...(item.source ? { source: item.source } : {}),
    }))
    : [{
      status: String(error.status),
      code: error.code,
      title: error.title,
      detail: error.detail,
      ...(error.source ? { source: error.source } : {}),
    }];

  return { errors: errors.map((item) => ({ ...item, meta: { requestId } })) };
}

export function notFound(_req, _res, next) {
  next(new ApiError(404, "ROUTE_NOT_FOUND", "Route not found", "The requested route does not exist."));
}

export function errorHandler(error, req, res, _next) {
  let apiError = error;
  if (error?.type === "entity.parse.failed") {
    apiError = new ApiError(400, "INVALID_JSON", "Invalid JSON", "The request body contains malformed JSON.");
  } else if (error?.type === "entity.too.large") {
    apiError = new ApiError(413, "PAYLOAD_TOO_LARGE", "Payload too large", "The request body exceeds the 32 KB limit.");
  } else if (error instanceof SyntaxError && error.status === 400) {
    apiError = new ApiError(400, "INVALID_JSON", "Invalid JSON", "The request body contains malformed JSON.");
  } else if (!(error instanceof ApiError)) {
    console.error(JSON.stringify({
      level: "error",
      requestId: req.id,
      errorName: error?.name ?? "Error",
      errorCode: error?.code ?? "UNEXPECTED_ERROR",
    }));
    apiError = new ApiError(500, "INTERNAL_ERROR", "Internal server error", "An unexpected error occurred.");
  }

  if (res.headersSent) return;
  res.status(apiError.status)
    .type("application/vnd.api+json")
    .json(jsonApiError(apiError, req.id));
}
