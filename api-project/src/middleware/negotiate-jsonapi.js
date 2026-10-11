import { ApiError } from "../errors/api-error.js";

function acceptsJsonApi(header = "*/*") {
  return header.split(",").some((entry) => {
    const [mediaType, ...params] = entry.trim().toLowerCase().split(";");
    const qValue = params.find((part) => part.trim().startsWith("q="))?.split("=")[1];
    const quality = qValue === undefined ? 1 : Number(qValue);
    const matches = mediaType.trim() === "application/vnd.api+json"
      || mediaType.trim() === "application/*"
      || mediaType.trim() === "*/*";
    return matches && Number.isFinite(quality) && quality > 0;
  });
}

export function negotiateJsonApi(req, _res, next) {
  if (!acceptsJsonApi(req.get("accept"))) {
    return next(new ApiError(406, "NOT_ACCEPTABLE", "Not acceptable", "Accept must allow application/vnd.api+json.", {
      header: "Accept",
    }));
  }
  next();
}

export function requireJsonApiContentType(req, _res, next) {
  if (req.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/vnd.api+json") {
    return next(new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Unsupported media type", "Content-Type must be application/vnd.api+json.", {
      header: "Content-Type",
    }));
  }
  next();
}
