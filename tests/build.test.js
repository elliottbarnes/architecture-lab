import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { buildSite } from '../scripts/build.mjs';

test('published entry assets use their actual content hashes to prevent mixed cached releases', async () => {
  const result = await buildSite();
  const output = new URL('../dist/', import.meta.url);
  const html = await readFile(new URL('index.html', output), 'utf8');
  const references = [...html.matchAll(/(?:src|href)="(\.\/(?:src\/[^"?]+|favicon\.svg))\?v=([a-f0-9]{12})"/g)];
  assert.equal(references.length, 4);
  for (const [, path, version] of references) {
    const contents = await readFile(new URL(path, output));
    assert.equal(version, createHash('sha256').update(contents).digest('hex').slice(0, 12), path);
  }
  assert.equal(Object.values(result.metafile.outputs).flatMap(file => file.imports).filter(item => item.external).length, 0);
  assert.match(html, /connect-src 'none'/);
});
