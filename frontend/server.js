import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { parse } from 'node:url';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.FRONTEND_PORT || 5500);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
createServer(async (request, response) => {
  const pathname = parse(request.url || '/').pathname || '/';
  const requestedPath = pathname === '/frontend' || pathname === '/frontend/' ? '/' : pathname.replace(/^\/frontend(?=\/)/, '') || '/';
  const requested = requestedPath === '/' ? '/index.html' : requestedPath;
  const filePath = normalize(join(root, requested));
  if (!filePath.startsWith(root)) { response.writeHead(403); response.end('Forbidden'); return; }
  try { const content = await readFile(filePath); response.writeHead(200, { 'Content-Type': types[extname(filePath)] || 'application/octet-stream' }); response.end(content); }
  catch { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Product detail frontend listening on http://localhost:${port}/frontend/`));
