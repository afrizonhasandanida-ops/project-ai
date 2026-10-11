import { serializeProduct, serializeProducts } from "../serializers/product.serializer.js";
import { productService } from "../services/product.service.js";

export function createProductController(service = productService) {
  return {
    async list(_req, res) {
      const products = await service.listProducts();
      res.type("application/vnd.api+json").status(200).json(serializeProducts(products));
    },

    async getById(req, res) {
      const product = await service.getProduct(req.params.id);
      res.type("application/vnd.api+json").status(200).json(serializeProduct(product));
    },

    async create(req, res) {
      const product = await service.createProduct(req.body.data.attributes);
      res.location(`/api/products/${product.id}`)
        .type("application/vnd.api+json")
        .status(201)
        .json(serializeProduct(product));
    },
  };
}

export const productController = createProductController();
