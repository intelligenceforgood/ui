#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const defaultSource = path.resolve(projectRoot, '..', 'proto', 'docs', 'examples', 'reviews_search_schema.json');
const destination = path.resolve(projectRoot, 'apps', 'web', 'src', 'config', 'generated', 'hybrid_search_schema.json');

const sourcePath = process.env.I4G_SCHEMA_SNAPSHOT || defaultSource;
const checkMode = process.argv.slice(2).includes('--check');

function log(message) {
  console.log(`[schema-sync] ${message}`);
}

if (!fs.existsSync(sourcePath)) {
  const message = `Source snapshot not found at ${sourcePath}. Set I4G_SCHEMA_SNAPSHOT or run the proto refresher.`;
  if (checkMode) {
    console.error(`[schema-sync] ${message}`);
    process.exit(1);
  }
  log(`${message} Skipping copy.`);
  process.exit(0);
}

const contents = fs.readFileSync(sourcePath, 'utf-8');

if (checkMode) {
  if (!fs.existsSync(destination)) {
    console.error(`[schema-sync] Destination not found at ${destination}. Run pnpm run schema:sync.`);
    process.exit(1);
  }
  const existing = fs.readFileSync(destination, 'utf-8');
  if (existing === contents) {
    log('Schema snapshot already in sync.');
    process.exit(0);
  }
  console.error(`[schema-sync] Destination differs from source. Run pnpm run schema:sync.`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, contents);
log(`Copied schema snapshot from ${sourcePath} to ${destination}`);
