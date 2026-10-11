import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSite } from './build.mjs';

await buildSite();
const root = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').includes('..')) { res.writeHead(404).end(); return; }
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + sep) || (!['/index.html', '/favicon.svg'].includes(pathname) && pathname !== '/' && !pathname.startsWith('/src/'))) { res.writeHead(404).end(); return; }
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }).end(req.method === 'HEAD' ? undefined : content);
  } catch { res.writeHead(404).end('Not found'); }
});
server.listen(Number(process.env.PORT || 4173), '127.0.0.1', () => console.log(`Architecture Lab: http://127.0.0.1:${server.address().port} (serving dist/; rebuild after source changes)`));
