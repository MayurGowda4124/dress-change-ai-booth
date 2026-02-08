#!/usr/bin/env node
/**
 * Run React build without relying on cross-env or shell PATH.
 * Usage: node scripts/build.js
 * Used by: npm run build (and Render/CI)
 */
const path = require('path');
const { execSync } = require('child_process');

const reactScriptsPath = path.join(__dirname, '..', 'node_modules', 'react-scripts', 'bin', 'react-scripts.js');
const cmd = `node "${reactScriptsPath}" build`;

process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, '--no-deprecation'].filter(Boolean).join(' ');

execSync(cmd, {
  stdio: 'inherit',
  env: process.env,
  cwd: path.join(__dirname, '..'),
});
