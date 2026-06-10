#!/usr/bin/env node
/**
 * Scans each module directory under releases/ and regenerates its index.json.
 *
 * Run after adding a new release JSON:
 *   node scripts/generate-indexes.js
 *
 * Each module's index.json is an array of release entries sorted newest-first:
 *   [{ "version": "2026.6", "date": "June 11, 2026", "file": "2026.6.json" }, ...]
 */

const fs   = require('fs');
const path = require('path');

const ROOT      = path.resolve(__dirname, '..');
const MANIFEST  = path.join(ROOT, 'releases', 'manifest.json');

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

for (const mod of manifest.modules) {
  const dir = path.join(ROOT, mod.dir);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const releaseFiles = fs.readdirSync(dir).filter(
    f => f.endsWith('.json') && f !== 'index.json'
  );

  const entries = releaseFiles.map(filename => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, filename), 'utf8'));
    return { version: data.version, date: data.date, file: filename };
  });

  // Sort newest-first by version string (e.g. "2026.6" > "2026.5")
  entries.sort((a, b) => {
    const [aY, aM = 0] = a.version.split('.').map(Number);
    const [bY, bM = 0] = b.version.split('.').map(Number);
    return bY !== aY ? bY - aY : bM - aM;
  });

  const indexPath = path.join(dir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(entries, null, 2) + '\n');
  console.log(`${mod.id}: ${entries.length} release(s) → ${path.relative(ROOT, indexPath)}`);
}

console.log('\nDone.');
