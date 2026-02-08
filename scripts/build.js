#!/usr/bin/env node
/**
 * Run React build without relying on cross-env or shell PATH.
 * Runs npm install first if node_modules/react-scripts is missing (e.g. Render only runs "npm run build").
 * Usage: node scripts/build.js
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const reactScriptsPath = path.join(root, 'node_modules', 'react-scripts', 'bin', 'react-scripts.js');

if (!fs.existsSync(reactScriptsPath)) {
  console.log('react-scripts not found; running npm install...');
  execSync('npm install', { stdio: 'inherit', env: process.env, cwd: root });
}

process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, '--no-deprecation'].filter(Boolean).join(' ');

const cmd = `node "${reactScriptsPath}" build`;
execSync(cmd, { stdio: 'inherit', env: process.env, cwd: root });
