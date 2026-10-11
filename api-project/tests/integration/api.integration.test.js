import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createApp } from "../../src/app.js";
import { env } from "../../src/config/env.js";
import { pool } from "../../src/config/database.js";
import { createProductRepository } from "../../src/repositories/product.repository.js";

let server;
let baseUrl;
let createdProductId;
const productId = "b6ed8dd3-03d6-4b7e-8a92-659f5cbdde78";

before(async () => {
  await pool.query("SELECT 1");
  const app = await createApp();
  server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (createdProductId) await pool.query("DELETE FROM products WHERE id = $1", [createdProductId]);
  if (server) await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

function jsonApiHeaders(extra = {}) {
  return { Accept: "application/vnd.api+json", "Content-Type": "application/vnd.api+json", ...extra };
}

function createBody(name = `Integration product ${randomUUID()}`) {
  return {
    data: {
      type: "products",
      attributes: {
        name,
        price: 123450,
        image: "/images/integration-product.jpg",
        description: "Product created by integration verification.",
        variants: { colorOrSize: [{ name: "Default", stock: 3 }] },
      },
    },
  };
}

test("HTTP API list, detail, errors, create, and Swagger follow their contracts", async () => {
  const listResponse = await fetch(`${baseUrl}/api/products`);
  assert.equal(listResponse.status, 200);
  assert.match(listResponse.headers.get("content-type"), /application\/vnd\.api\+json/);
  const list = await listResponse.json();
  assert.ok(list.data.some((product) => product.id === productId));
  const seededProduct = list.data.find((product) => product.id === productId);
  assert.equal(seededProduct.attributes.stock, 12);

  const detailResponse = await fetch(`${baseUrl}/api/products/${productId}`);
  assert.equal(detailResponse.status, 200);
  assert.equal((await detailResponse.json()).data.attributes.variants.colorOrSize.length, 3);

  const malformedId = await fetch(`${baseUrl}/api/products/not-a-uuid`);
  assert.equal(malformedId.status, 400);
  assert.equal((await malformedId.json()).errors[0].code, "INVALID_PRODUCT_ID");

  const missingIdResponse = await fetch(`${baseUrl}/api/products/${randomUUID()}`);
  assert.equal(missingIdResponse.status, 404);
  assert.equal((await missingIdResponse.json()).errors[0].code, "PRODUCT_NOT_FOUND");

  const unknownRoute = await fetch(`${baseUrl}/api/no-such-route`);
  assert.equal(unknownRoute.status, 404);
  assert.equal((await unknownRoute.json()).errors[0].code, "ROUTE_NOT_FOUND");

  const unacceptable = await fetch(`${baseUrl}/api/products`, { headers: { Accept: "application/json" } });
  assert.equal(unacceptable.status, 406);

  const allowedOrigin = await fetch(`${baseUrl}/api/products`, { headers: { Origin: "http://localhost:5173" } });
  assert.equal(allowedOrigin.headers.get("access-control-allow-origin"), "http://localhost:5173");
  const deniedOrigin = await fetch(`${baseUrl}/api/products`, { headers: { Origin: "https://untrusted.example" } });
  assert.equal(deniedOrigin.status, 403);

  const unauthorized = await fetch(`${baseUrl}/api/products`, {
    method: "POST",
    headers: jsonApiHeaders(),
    body: JSON.stringify(createBody()),
  });
  assert.equal(unauthorized.status, 401);
  assert.doesNotMatch(JSON.stringify(await unauthorized.json()), /stack|password|PRODUCT_WRITE_API_KEY/i);

  const wrongMediaType = await fetch(`${baseUrl}/api/products`, {
    method: "POST",
    headers: { Accept: "application/vnd.api+json", "Content-Type": "application/json", "X-API-Key": env.productWriteApiKey },
    body: JSON.stringify(createBody()),
  });
  assert.equal(wrongMediaType.status, 415);

  const malformedJson = await fetch(`${baseUrl}/api/products`, {
    method: "POST",
    headers: jsonApiHeaders({ "X-API-Key": env.productWriteApiKey }),
    body: "{",
  });
  assert.equal(malformedJson.status, 400);
  assert.equal((await malformedJson.json()).errors[0].code, "INVALID_JSON");

  const oversized = await fetch(`${baseUrl}/api/products`, {
    method: "POST",
    headers: jsonApiHeaders({ "X-API-Key": env.productWriteApiKey }),
    body: `{"data":"${"x".repeat(33_000)}"}`,
  });
  assert.equal(oversized.status, 413);

  const invalidBody = createBody();
  invalidBody.data.attributes.variants.colorOrSize[0].stock = -1;
  const invalidResponse = await fetch(`${baseUrl}/api/products`, {
    method: "POST",
    headers: jsonApiHeaders({ "X-API-Key": env.productWriteApiKey }),
    body: JSON.stringify(invalidBody),
  });
  assert.equal(invalidResponse.status, 400);
  const invalidError = await invalidResponse.json();
  assert.ok(invalidError.errors.some((error) => error.source.pointer.endsWith("/stock")));

  const createdResponse = await fetch(`${baseUrl}/api/products`, {
    method: "POST",
    headers: jsonApiHeaders({ "X-API-Key": env.productWriteApiKey }),
    body: JSON.stringify(createBody()),
  });
  assert.equal(createdResponse.status, 201);
  assert.match(createdResponse.headers.get("content-type"), /application\/vnd\.api\+json/);
  const location = createdResponse.headers.get("location");
  assert.ok(location.startsWith("/api/products/"));
  const created = await createdResponse.json();
  createdProductId = created.data.id;
  assert.equal(created.data.attributes.stock, 3);
  assert.equal(created.data.attributes.variants.colorOrSize[0].stock, 3);

  await assert.rejects(
    pool.query(
      "INSERT INTO products (id, name, price, photo_url, description) VALUES ($1, $2, $3, $4, $5)",
      [randomUUID(), "Invalid database price", -1, "/images/invalid.jpg", "Constraint probe"],
    ),
    (error) => error.code === "23514",
  );

  const swagger = await fetch(`${baseUrl}/api-docs/`);
  assert.equal(swagger.status, 200);
  const spec = await fetch(`${baseUrl}/api-docs/openapi.yaml`);
  assert.equal(spec.status, 200);
  assert.match(await spec.text(), /openapi: 3\.1\.0/);
});

test("product create repository rolls back product and prior variants when a later insert conflicts", async () => {
  const repository = createProductRepository(pool);
  const id = randomUUID();
  await assert.rejects(repository.create({
    id,
    name: "Rollback integration probe",
    price: 1,
    image: "/images/probe.jpg",
    description: "Rollback verification.",
    variants: [
      { id: randomUUID(), name: "Same", stock: 1 },
      { id: randomUUID(), name: "same", stock: 2 },
    ],
  }), (error) => error.status === 409 && error.code === "PRODUCT_CONFLICT");

  const result = await pool.query("SELECT 1 FROM products WHERE id = $1", [id]);
  assert.equal(result.rowCount, 0);
});

test("GET list returns an empty JSON:API collection when the catalog has no products", async () => {
  const products = await pool.query(`
    SELECT id, name, price, photo_url, description, created_at, updated_at
    FROM products
  `);
  const variants = await pool.query(`
    SELECT id, product_id, name, photo_url, quantity, created_at, updated_at
    FROM product_variants
  `);

  await pool.query("TRUNCATE products CASCADE");
  try {
    const response = await fetch(`${baseUrl}/api/products`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { data: [] });
  } finally {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const product of products.rows) {
        await client.query(
          `INSERT INTO products (id, name, price, photo_url, description, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [product.id, product.name, product.price, product.photo_url, product.description, product.created_at, product.updated_at],
        );
      }
      for (const variant of variants.rows) {
        await client.query(
          `INSERT INTO product_variants (id, product_id, name, photo_url, quantity, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [variant.id, variant.product_id, variant.name, variant.photo_url, variant.quantity, variant.created_at, variant.updated_at],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
});
