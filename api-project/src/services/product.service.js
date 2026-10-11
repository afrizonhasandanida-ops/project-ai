import { randomUUID } from "node:crypto";
import { ApiError } from "../errors/api-error.js";
import { productRepository } from "../repositories/product.repository.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createProductService(repository = productRepository) {
  return {
    listProducts: () => repository.list(),

    async getProduct(id) {
      if (!uuidPattern.test(id)) {
        throw new ApiError(400, "INVALID_PRODUCT_ID", "Invalid product ID", "The product ID must be a valid UUID.", {
          parameter: "id",
        });
      }
      const product = await repository.findById(id);
      if (!product) {
        throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found", `Product '${id}' was not found.`);
      }
      return product;
    },

    createProduct(attributes) {
      if (!attributes.variants.colorOrSize.length) {
        throw new ApiError(400, "VALIDATION_ERROR", "Request validation failed", "At least one product variant is required.", {
          pointer: "/data/attributes/variants/colorOrSize",
        });
      }

      return repository.create({
        id: randomUUID(),
        name: attributes.name,
        price: attributes.price,
        image: attributes.image,
        description: attributes.description,
        variants: attributes.variants.colorOrSize.map((variant) => ({
          id: randomUUID(),
          name: variant.name,
          image: variant.image,
          stock: variant.stock,
        })),
      });
    },
  };
}

export const productService = createProductService();
