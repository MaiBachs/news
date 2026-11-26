import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('..', import.meta.url));
const features = resolve(root, 'server/src/features');
const allowed = {
  domain: ['domain'],
  application: ['application', 'domain'],
  infrastructure: ['infrastructure', 'application', 'domain'],
  web: ['web', 'application', 'domain'],
};

test('backend feature layers keep dependencies pointed inward', () => {
  const files = readdirSync(features, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'));
  assert.ok(files.length > 0, 'No feature files found');

  for (const entry of files) {
    const path = resolve(entry.parentPath, entry.name);
    const [feature, layer] = relative(features, path).split(sep);
    assert.ok(Object.hasOwn(allowed, layer), `${path} must belong to a feature layer`);

    const { importedFiles } = ts.preProcessFile(readFileSync(path, 'utf8'), true);
    for (const { fileName: specifier } of importedFiles) {
      if (!specifier.startsWith('.')) {
        if (specifier === 'express') assert.equal(layer, 'web', `${path} imports Express outside the web layer`);
        if (specifier === 'node:sqlite') assert.equal(layer, 'infrastructure', `${path} imports SQLite outside infrastructure`);
        continue;
      }

      const target = resolve(dirname(path), specifier);
      if (inside(resolve(root, 'shared'), target)) continue;
      assert.ok(inside(features, target), `${path} must use an application port for ${specifier}`);
      const [targetFeature, targetLayer] = relative(features, target).split(sep);
      assert.equal(targetFeature, feature, `${path} directly imports a different feature`);
      assert.ok(allowed[layer].includes(targetLayer), `${layer} cannot import ${targetLayer} in ${path}`);
    }
  }
});

function inside(parent, child) {
  const path = relative(parent, child);
  return path !== '' && path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path);
}
