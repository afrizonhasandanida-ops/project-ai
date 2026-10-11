function resource(product) {
  return {
    type: "products",
    id: product.id,
    attributes: {
      name: product.name,
      price: product.price,
      image: product.image,
      description: product.description,
      stock: product.stock,
      variants: {
        colorOrSize: product.variants.map((variant) => ({
          name: variant.name,
          image: variant.image,
          stock: variant.stock,
        })),
      },
      createdAt: new Date(product.createdAt).toISOString(),
    },
    links: { self: `/api/products/${product.id}` },
  };
}

export const serializeProduct = (product) => ({ data: resource(product) });
export const serializeProducts = (products) => ({ data: products.map(resource) });
