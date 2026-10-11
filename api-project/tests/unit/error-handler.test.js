import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../../src/middleware/error-handler.js";

test("does not return internal error messages or stack traces to API clients", () => {
  let statusCode;
  let contentType;
  let responseBody;
  const response = {
    headersSent: false,
    status(status) { statusCode = status; return this; },
    type(type) { contentType = type; return this; },
    json(body) { responseBody = body; return this; },
  };
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    errorHandler(new Error("sensitive postgres password and stack"), { id: "request-test" }, response, () => {});
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(statusCode, 500);
  assert.equal(contentType, "application/vnd.api+json");
  assert.equal(responseBody.errors[0].code, "INTERNAL_ERROR");
  assert.doesNotMatch(JSON.stringify(responseBody), /sensitive|password|stack/i);
});
