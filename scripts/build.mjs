import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
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
  await writeFile(new URL('.nojekyll', out), '');
  console.log('Built static site in dist/ (browser dependencies bundled locally).');
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await buildSite();
