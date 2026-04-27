#!/usr/bin/env node
/**
 * Facebook Business MCP — plugin launcher.
 *
 * Executed by Claude Code when the plugin's MCP server starts. Ensures the
 * runtime dependencies are installed (first run only), then hands off to the
 * compiled server entry.
 *
 * IMPORTANT: anything written to stdout is interpreted as MCP protocol traffic
 * by the host. All informational output goes to stderr.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = process.env.FB_MCP_ROOT
  ? process.env.FB_MCP_ROOT
  : path.resolve(__dirname, '..');

const nodeModules = path.join(root, 'node_modules');
const buildEntry = path.join(root, 'build', 'index.js');

function log(msg) {
  process.stderr.write(`[facebook-business-mcp] ${msg}\n`);
}

function run(cmd, args, label) {
  log(label);
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: ['ignore', 'pipe', 'inherit'],
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    log(`${label} failed (exit ${result.status}).`);
    process.exit(result.status || 1);
  }
}

if (!fs.existsSync(nodeModules)) {
  run('npm', ['install', '--omit=dev', '--no-audit', '--no-fund', '--silent'],
      'First run: installing runtime dependencies (this happens once)...');
}

if (!fs.existsSync(buildEntry)) {
  run('npm', ['install', '--no-audit', '--no-fund', '--silent'],
      'Build output missing — installing dev deps...');
  run('npm', ['run', 'build'],
      'Compiling TypeScript...');
}

require(buildEntry);
