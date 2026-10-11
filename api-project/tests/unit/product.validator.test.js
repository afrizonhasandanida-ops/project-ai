import test from "node:test";
import assert from "node:assert/strict";
import { validateCreateProduct } from "../../src/validators/product.validator.js";

const validBody = () => ({
  data: {
    type: "products",
    attributes: {
      name: "MW75 Custom Wireless ANC Headphones",
      price: 8999000,
      image: "/images/headphone-matte-black.jpg.jpeg",
      description: "Premium wireless headphones.",
      variants: {
        colorOrSize: [
          { name: "Matte Black", stock: 4 },
          { name: "Silver", image: "https://cdn.example.test/silver.jpg", stock: 8 },
        ],
      },
    },
  },
});

function validate(body) {
  let error;
  validateCreateProduct({ body }, {}, (nextError) => { error = nextError; });
  return error;
}

test("accepts a valid JSON:API create document", () => {
  assert.equal(validate(validBody()), undefined);
});

test("rejects unknown and server-managed fields with JSON pointers", () => {
  const body = validBody();
  body.data.id = "client-id";
  body.data.attributes.extra = true;
  const error = validate(body);
  assert.equal(error.status, 400);
  assert.deepEqual(error.errors.map((item) => item.source.pointer).sort(), ["/data/attributes/extra", "/data/id"]);
  assert.ok(error.errors.every((item) => item.code === "UNKNOWN_FIELD"));
});

test("rejects negative quantity and invalid image protocols", () => {
  const body = validBody();
  body.data.attributes.image = "javascript:alert(1)";
  body.data.attributes.variants.colorOrSize[0].stock = -1;
  const error = validate(body);
  assert.equal(error.status, 400);
  assert.ok(error.errors.some((item) => item.source.pointer === "/data/attributes/image" && item.code === "INVALID_FORMAT"));
  assert.ok(error.errors.some((item) => item.source.pointer === "/data/attributes/variants/colorOrSize/0/stock" && item.code === "OUT_OF_RANGE"));
});

test("rejects duplicate variant names case-insensitively and path traversal", () => {
  const body = validBody();
  body.data.attributes.variants.colorOrSize.push({ name: " matte black ", image: "/images/../secret.jpg", stock: 0 });
  const error = validate(body);
  assert.ok(error.errors.some((item) => item.code === "DUPLICATE_VARIANT"));
  assert.ok(error.errors.some((item) => item.source.pointer.endsWith("/2/image") && item.code === "INVALID_FORMAT"));
});

test("rejects encoded path traversal and backslash image paths", () => {
  for (const image of ["/images/%2e%2e/private.jpg", "/images/..%2fprivate.jpg", "/images\\private.jpg"]) {
    const body = validBody();
    body.data.attributes.image = image;
    const error = validate(body);
    assert.ok(error.errors.some((item) => item.source.pointer === "/data/attributes/image" && item.code === "INVALID_FORMAT"), image);
  }
});
