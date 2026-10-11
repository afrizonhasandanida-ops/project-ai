import test from "node:test";
import assert from "node:assert/strict";
import { serializeProduct, serializeProducts } from "../../src/serializers/product.serializer.js";

const product = {
  id: "b6ed8dd3-03d6-4b7e-8a92-659f5cbdde78",
  name: "MW75",
  price: 8999000,
  image: "/images/mw75.jpg",
  description: "Wireless headphones",
  stock: 4,
  variants: [{ name: "Matte Black", image: "/images/mw75.jpg", stock: 4 }],
  createdAt: "2026-10-09T00:00:00.000Z",
};

test("serializes a product as a JSON:API resource", () => {
  assert.deepEqual(serializeProduct(product), {
    data: {
      type: "products",
      id: product.id,
      attributes: {
        name: "MW75",
        price: 8999000,
        image: "/images/mw75.jpg",
        description: "Wireless headphones",
        stock: 4,
        variants: { colorOrSize: [{ name: "Matte Black", image: "/images/mw75.jpg", stock: 4 }] },
        createdAt: "2026-10-09T00:00:00.000Z",
      },
      links: { self: `/api/products/${product.id}` },
    },
  });
});

test("serializes an empty product collection", () => {
  assert.deepEqual(serializeProducts([]), { data: [] });
});
