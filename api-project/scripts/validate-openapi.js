import SwaggerParser from "@apidevtools/swagger-parser";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const specPath = join(fileURLToPath(new URL("..", import.meta.url)), "docs/openapi.yaml");
const document = await SwaggerParser.validate(specPath);

if (document.openapi !== "3.1.0") {
  throw new Error(`Expected OpenAPI 3.1.0, received ${document.openapi}`);
}

console.log(`OpenAPI valid: ${document.info.title} ${document.info.version}`);
