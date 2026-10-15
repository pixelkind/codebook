#!/usr/bin/env node
'use strict';
// Codebook: local qualitative coding tool.  Usage: node codebook.js codebook.config.json [--no-open]

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const express = require('express');
const { build } = require('./lib/startup');
const { updateRow, ensureBackup } = require('./lib/csv-store');

function usage() {
  console.error('Usage: node codebook.js <codebook.config.json> [--no-open]');
  process.exit(2);
}

function friendlyWriteError(e) {
  if (e.code === 'EACCES' || e.code === 'EPERM') return 'Permission denied — is the file open in another program?';
  if (e.code === 'EBUSY') return 'The file is locked — is it open in another program?';
  if (e.code === 'ENOENT') return 'The file no longer exists.';
  if (e.code === 'ENOSPC') return 'The disk is full.';
  return e.message;
}

function printStartupError(err) {
  console.error('\n  Codebook could not start: ' + err.title);
  for (const line of err.details.split('\n').slice(2)) console.error('  ' + line);
  console.error('');
}

function createServer(configPath, { log = console } = {}) {
  let lastErrorShown = null;

  // Re-run all validation from disk. Errors go to the terminal once per distinct error.
  function load() {
    const res = build(configPath);
    if (!res.ok) {
      if (lastErrorShown !== res.error.details) { printStartupError(res.error); lastErrorShown = res.error.details; }
      return res;
    }
    lastErrorShown = null;
    try {
      if (ensureBackup(res.cfg.data)) log.log(`  Backup written: ${path.basename(res.cfg.data)}.bak`);
    } catch (e) {
      log.error(`  Warning: could not write backup: ${e.message}`);
    }
    return res;
  }

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/state', (req, res) => {
    const r = load();
    res.set('Cache-Control', 'no-store');
    res.json(r.ok ? { ok: true, model: r.model } : { ok: false, error: r.error });
  });

  app.post('/api/rows/:id', (req, res) => {
    const r = build(configPath);
    if (!r.ok) return res.status(409).json({ error: `${r.error.title}. Reload the page.` });
    const { model, cfg } = r;
    const row = model.rows.find((x) => x.id === req.params.id);
    if (!row) return res.status(404).json({ error: `Row ${req.params.id} no longer exists in ${model.dataFile}.` });

    const changes = (req.body && req.body.changes) || {};
    if (typeof changes !== 'object' || Array.isArray(changes)) return res.status(400).json({ error: 'Bad request.' });
    const fields = new Map(model.groups.flatMap((g) => g.fields).map((f) => [f.code, f]));
    const notes = new Set(model.notes.map((n) => n.code));
    const out = {};
    for (const [col, raw] of Object.entries(changes)) {
      const value = raw == null ? '' : String(raw);
      if (notes.has(col)) { out[col] = value; continue; }
      const f = fields.get(col);
      if (!f) return res.status(400).json({ error: `Column "${col}" cannot be edited.` });
      // An existing, invalid value may be kept as is; anything new must be an allowed value.
      if (f.constrained && value !== '' && !f.values.includes(value) && value !== row.values[col]) {
        return res.status(400).json({ error: `"${value}" is not an allowed value for ${col}.` });
      }
      out[col] = value;
    }
    if (model.hasCoderColumn && cfg.coder) out.coder = cfg.coder;

    try {
      const saved = updateRow(cfg.data, cfg.display.idColumn, row.id, out);
      const values = Object.fromEntries(Object.keys(row.values).map((c) => [c, saved[c] ?? '']));
      log.log(`  Saved ${row.id}`);
      res.json({ ok: true, values });
    } catch (e) {
      log.error(`  Could not write ${model.dataFile}: ${e.code || ''} ${e.message}`);
      res.status(500).json({ error: friendlyWriteError(e), file: model.dataFile });
    }
  });

  const nm = path.join(__dirname, 'node_modules');
  app.get('/vendor/marked.js', (req, res) => res.sendFile(path.join(nm, 'marked/lib/marked.umd.js')));
  app.get('/vendor/purify.js', (req, res) => res.sendFile(path.join(nm, 'dompurify/dist/purify.min.js')));
  app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html' }));

  return { app, load };
}

function openBrowser(url) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  try {
    const p = spawn(cmd, args, { stdio: 'ignore', detached: true });
    p.on('error', () => {});
    p.unref();
  } catch { /* opening the browser is best effort */ }
}

function main() {
  const args = process.argv.slice(2);
  const noOpen = args.includes('--no-open') || process.env.CODEBOOK_NO_OPEN === '1';
  const configArg = args.find((a) => !a.startsWith('--'));
  if (!configArg) usage();
  const configPath = path.resolve(configArg);

  // Port comes from the config if it is readable; otherwise we still start (error screen) on 3000.
  let port = 3000;
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (Number.isInteger(raw.port)) port = raw.port;
  } catch { /* reported by load() */ }

  const { app, load } = createServer(configPath);
  const first = load();
  if (first.ok) {
    const m = first.model;
    const fields = m.groups.reduce((n, g) => n + g.fields.length, 0);
    console.log(`  Codebook: section ${m.dataset}, ${fields} coded fields, ${m.notes.length} free-text fields`);
    console.log(`  Data: ${m.dataFile}, ${m.rows.length} rows`);
  } else {
    console.error('  Starting anyway so the error screen can be shown; fix the problem and press Reload.');
  }

  const server = app.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${server.address().port}/`;
    console.log(`\n  Codebook running at ${url}\n  Press Ctrl+C to stop.\n`);
    if (!noOpen) openBrowser(url);
  });
  server.on('error', (e) => {
    console.error(e.code === 'EADDRINUSE' ? `  Port ${port} is already in use. Set another "port" in the config.` : `  Server error: ${e.message}`);
    process.exit(1);
  });
}

if (require.main === module) main();

module.exports = { createServer };
