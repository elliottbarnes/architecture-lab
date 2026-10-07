import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const out = new URL('../dist/', import.meta.url);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const file of ['index.html', 'favicon.svg', 'src']) await cp(new URL(file, root), new URL(file, out), { recursive: true });
await writeFile(new URL('.nojekyll', out), '');
console.log('Built static site in dist/ (no runtime dependencies).');
