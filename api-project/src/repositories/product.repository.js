import { pool } from "../config/database.js";
import { ApiError } from "../errors/api-error.js";

const selectProductRows = `
  SELECT
    p.id,
    p.name,
    p.price,
    p.photo_url AS image,
    p.description,
    p.created_at AS "createdAt",
    COALESCE(SUM(pv.quantity), 0)::INTEGER AS stock,
    COALESCE(
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'name', pv.name,
          'image', COALESCE(pv.photo_url, p.photo_url),
          'stock', pv.quantity
        ) ORDER BY pv.name
      ) FILTER (WHERE pv.id IS NOT NULL),
      '[]'::JSONB
    ) AS variants
  FROM products p
  LEFT JOIN product_variants pv ON pv.product_id = p.id
`;

function mapProduct(row) {
  return {
    ...row,
    price: Number(row.price),
    stock: Number(row.stock),
    variants: row.variants,
  };
}

export function createProductRepository(database = pool) {
  return {
    async list() {
      const result = await database.query(
        `${selectProductRows} GROUP BY p.id ORDER BY p.created_at DESC, p.id ASC`,
      );
      return result.rows.map(mapProduct);
    },

    async findById(id, client = database) {
      const result = await client.query(
        `${selectProductRows} WHERE p.id = $1 GROUP BY p.id`,
        [id],
      );
      return result.rows[0] ? mapProduct(result.rows[0]) : null;
    },

    async create(product) {
      const client = await database.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          `INSERT INTO products (id, name, price, photo_url, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [product.id, product.name, product.price, product.image, product.description],
        );

        for (const variant of product.variants) {
          await client.query(
            `INSERT INTO product_variants (id, product_id, name, photo_url, quantity)
             VALUES ($1, $2, $3, $4, $5)`,
            [variant.id, product.id, variant.name, variant.image ?? null, variant.stock],
          );
        }

        const created = await this.findById(product.id, client);
        await client.query("COMMIT");
        return created;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        if (error.code === "23505") {
          throw new ApiError(409, "PRODUCT_CONFLICT", "Product conflict", "A product or variant with the same identifier already exists.");
        }
        throw error;
      } finally {
        client.release();
      }
    },
  };
}

export const productRepository = createProductRepository();
