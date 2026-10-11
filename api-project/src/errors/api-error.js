export class ApiError extends Error {
  constructor(status, code, title, detail, source, errors) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.title = title;
    this.detail = detail;
    this.source = source;
    this.errors = errors;
  }
}

export function validationError(errors) {
  const error = new ApiError(400, "VALIDATION_ERROR", "Request validation failed", "One or more request fields are invalid.");
  error.errors = errors;
  return error;
}
