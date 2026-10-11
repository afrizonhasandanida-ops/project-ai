import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const openapiPath = join(projectRoot, "docs/openapi.yaml");

export async function mountSwagger(app) {
  const openapiText = await readFile(openapiPath, "utf8");
  const openapiDocument = YAML.parse(openapiText);
  app.get("/api-docs/openapi.yaml", (_req, res) => {
    res.type("application/yaml").send(openapiText);
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));
}
