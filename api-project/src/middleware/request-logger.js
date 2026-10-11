export function requestLogger(req, res, next) {
  const started = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    console.log(JSON.stringify({
      level: "info",
      requestId: req.id,
      method: req.method,
      path: req.originalUrl.split("?", 1)[0],
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    }));
  });
  next();
}
