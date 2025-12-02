#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const defaultSource = path.resolve(projectRoot, '..', 'proto', 'docs', 'examples', 'reviews_search_schema.json');
const destination = path.resolve(projectRoot, 'apps', 'web', 'src', 'config', 'generated', 'hybrid_search_schema.json');

const sourcePath = process.env.I4G_SCHEMA_SNAPSHOT || defaultSource;

function log(message) {
  console.log(`[schema-sync] ${message}`);
}

if (!fs.existsSync(sourcePath)) {
  log(`Source snapshot not found at ${sourcePath}. Set I4G_SCHEMA_SNAPSHOT or run the proto refresher; skipping copy.`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(destination), { recursive: true });
const contents = fs.readFileSync(sourcePath, 'utf-8');
fs.writeFileSync(destination, contents);
log(`Copied schema snapshot from ${sourcePath} to ${destination}`);
