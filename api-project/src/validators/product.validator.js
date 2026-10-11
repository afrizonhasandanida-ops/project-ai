import Ajv from "ajv";
import addFormats from "ajv-formats";
import { validationError } from "../errors/api-error.js";

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

const createProductSchema = {
  type: "object",
  required: ["data"],
  additionalProperties: false,
  properties: {
    data: {
      type: "object",
      required: ["type", "attributes"],
      additionalProperties: false,
      properties: {
        type: { const: "products" },
        attributes: {
          type: "object",
          required: ["name", "price", "image", "description", "variants"],
          additionalProperties: false,
          properties: {
            name: { type: "string", minLength: 1, maxLength: 120 },
            price: { type: "integer", minimum: 0, maximum: 2147483647 },
            image: { type: "string", minLength: 1, maxLength: 2048 },
            description: { type: "string", minLength: 1, maxLength: 2000 },
            variants: {
              type: "object",
              required: ["colorOrSize"],
              additionalProperties: false,
              properties: {
                colorOrSize: {
                  type: "array",
                  minItems: 1,
                  maxItems: 50,
                  items: {
                    type: "object",
                    required: ["name", "stock"],
                    additionalProperties: false,
                    properties: {
                      name: { type: "string", minLength: 1, maxLength: 60 },
                      image: { type: "string", minLength: 1, maxLength: 2048 },
                      stock: { type: "integer", minimum: 0, maximum: 1000000 },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const validateSchema = ajv.compile(createProductSchema);
const escapePointer = (part) => String(part).replaceAll("~", "~0").replaceAll("/", "~1");

function errorCode(error) {
  if (error.keyword === "required") return "REQUIRED";
  if (error.keyword === "additionalProperties") return "UNKNOWN_FIELD";
  if (error.keyword === "type") return "INVALID_TYPE";
  if (["minLength", "maxLength", "minimum", "maximum", "minItems", "maxItems"].includes(error.keyword)) return "OUT_OF_RANGE";
  return "INVALID_VALUE";
}

function errorPointer(error) {
  const base = error.instancePath ?? "";
  if (error.keyword === "required") return `${base}/${escapePointer(error.params.missingProperty)}`;
  if (error.keyword === "additionalProperties") return `${base}/${escapePointer(error.params.additionalProperty)}`;
  return base || "/data";
}

function isAllowedPhotoReference(value) {
  if (typeof value !== "string" || value.trim() !== value) return false;
  if (/[\\\u0000-\u001f]/.test(value)) return false;
  if (value.startsWith("/images/") || value.startsWith("images/")) {
    let decodedPath;
    try {
      decodedPath = decodeURIComponent(value.split(/[?#]/, 1)[0]);
    } catch {
      return false;
    }
    return !decodedPath.includes("\\")
      && !decodedPath.split("/").some((segment) => segment === ".." || segment === ".");
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function validateCreateProduct(req, _res, next) {
  const body = req.body;
  validateSchema(body);
  const errors = (validateSchema.errors ?? []).map((error) => ({
    code: errorCode(error),
    title: error.keyword === "required" ? "Required field missing" : "Invalid request field",
    detail: `${errorPointer(error)} ${error.message ?? "is invalid"}.`,
    source: { pointer: errorPointer(error) },
  }));

  if (body?.data?.attributes && typeof body.data.attributes === "object") {
    const { attributes } = body.data;
    const variants = Array.isArray(attributes.variants?.colorOrSize) ? attributes.variants.colorOrSize : [];
    const photoFields = [
      ...(attributes.image === undefined ? [] : [["/data/attributes/image", attributes.image]]),
      ...variants.flatMap((variant, index) => (
        variant?.image === undefined ? [] : [[`/data/attributes/variants/colorOrSize/${index}/image`, variant.image]]
      )),
    ];

    for (const [pointer, photo] of photoFields) {
      if (!isAllowedPhotoReference(photo)) {
        errors.push({
          code: "INVALID_FORMAT",
          title: "Invalid image reference",
          detail: "Image must be an allowed local /images path or an HTTPS URL without credentials.",
          source: { pointer },
        });
      }
    }

    const names = new Set();
    variants.forEach((variant, index) => {
      if (typeof variant?.name !== "string") return;
      const normalized = variant.name.trim().toLocaleLowerCase("en-US");
      if (names.has(normalized)) {
        errors.push({
          code: "DUPLICATE_VARIANT",
          title: "Duplicate product variant",
          detail: "Variant names must be unique for a product, ignoring letter case.",
          source: { pointer: `/data/attributes/variants/colorOrSize/${index}/name` },
        });
      }
      names.add(normalized);
      if (variant.name.trim() !== variant.name) {
        errors.push({
          code: "INVALID_FORMAT",
          title: "Invalid variant name",
          detail: "Variant names must not start or end with whitespace.",
          source: { pointer: `/data/attributes/variants/colorOrSize/${index}/name` },
        });
      }
    });

    for (const [field, value] of [["name", attributes.name], ["description", attributes.description]]) {
      if (typeof value === "string" && value.trim() !== value) {
        errors.push({
          code: "INVALID_FORMAT",
          title: "Invalid field format",
          detail: `${field} must not start or end with whitespace.`,
          source: { pointer: `/data/attributes/${field}` },
        });
      }
    }
  }

  if (errors.length) return next(validationError(errors));
  next();
}
