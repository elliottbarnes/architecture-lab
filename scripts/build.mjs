import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url);
const out = new URL('../dist/', import.meta.url);

export async function buildSite() {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  for (const file of ['index.html', 'favicon.svg', 'src']) {
    await cp(new URL(file, root), new URL(file, out), { recursive: true });
  }
  const result = await build({
    absWorkingDir: fileURLToPath(root),
    entryPoints: ['src/main.js'],
    outfile: fileURLToPath(new URL('src/main.js', out)),
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    minify: true,
    legalComments: 'eof',
    metafile: true,
    logLevel: 'warning',
  });
  const externalImports = Object.values(result.metafile.outputs).flatMap(output => output.imports).filter(item => item.external);
  if (externalImports.length) throw new Error(`The browser bundle still requires external imports: ${externalImports.map(item => item.path).join(', ')}`);
  // Pages caches files independently. Version entry assets so a new HTML page
  // cannot boot with the previous JavaScript or styles still in a browser cache.
  let html = await readFile(new URL('index.html', out), 'utf8');
  const references = [...new Set([...html.matchAll(/(?:src|href)="(\.\/(?:src\/[^"]+|favicon\.svg))"/g)].map(match => match[1]))];
  for (const reference of references) {
    const bytes = await readFile(new URL(reference, out));
    const version = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
    html = html.replaceAll(`"${reference}"`, `"${reference}?v=${version}"`);
  }
  await writeFile(new URL('index.html', out), html);
  await writeFile(new URL('.nojekyll', out), '');
  console.log('Built static site in dist/ (browser dependencies bundled locally).');
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await buildSite();
