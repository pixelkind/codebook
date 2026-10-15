'use strict';
// Loads and validates codebook.config.json. Paths are resolved relative to the config file.

const fs = require('fs');
const path = require('path');

class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

const WIDGETS = ['buttons', 'dropdown', 'textarea'];

function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
function str(v, name, required) {
  if (v == null || v === '') { if (required) throw new ConfigError(`"${name}" is required`); return undefined; }
  if (typeof v !== 'string') throw new ConfigError(`"${name}" must be a string`);
  return v;
}

function normalize(raw, configPath) {
  if (!isObj(raw)) throw new ConfigError('Config must be a JSON object');
  const base = path.dirname(configPath);
  const cfg = {
    configPath,
    codebook: path.resolve(base, str(raw.codebook, 'codebook', true)),
    data: path.resolve(base, str(raw.data, 'data', true)),
    section: str(raw.section, 'section', false) || null,
    coder: str(raw.coder, 'coder', false) || '',
    port: raw.port == null ? 3000 : raw.port,
    autoAdvance: raw.autoAdvance == null ? true : !!raw.autoAdvance,
    display: { idColumn: 'row_id', meta: [], text: [] },
    groups: null,
    fields: {},
  };
  if (!Number.isInteger(cfg.port) || cfg.port < 0 || cfg.port > 65535) throw new ConfigError('"port" must be an integer between 0 and 65535');

  const d = raw.display == null ? {} : raw.display;
  if (!isObj(d)) throw new ConfigError('"display" must be an object');
  cfg.display.idColumn = str(d.idColumn, 'display.idColumn', false) || 'row_id';
  if (d.meta != null) {
    if (!Array.isArray(d.meta) || d.meta.some((m) => typeof m !== 'string')) throw new ConfigError('"display.meta" must be a list of column names');
    cfg.display.meta = d.meta.slice();
  }
  if (d.text != null) {
    if (!Array.isArray(d.text)) throw new ConfigError('"display.text" must be a list');
    cfg.display.text = d.text.map((t, i) => {
      if (typeof t === 'string') t = { column: t };
      if (!isObj(t)) throw new ConfigError(`"display.text[${i}]" must be an object or a column name`);
      const column = str(t.column, `display.text[${i}].column`, true);
      return { column, label: str(t.label, `display.text[${i}].label`, false) || column, markdown: t.markdown !== false, collapsed: !!t.collapsed };
    });
  }

  if (raw.groups != null) {
    if (!Array.isArray(raw.groups)) throw new ConfigError('"groups" must be a list');
    cfg.groups = raw.groups.map((g, i) => {
      if (!isObj(g)) throw new ConfigError(`"groups[${i}]" must be an object`);
      const title = str(g.title, `groups[${i}].title`, true);
      const match = str(g.match, `groups[${i}].match`, true);
      if (match !== '*') {
        try { new RegExp(match); } catch (e) { throw new ConfigError(`"groups[${i}].match" is not a valid regular expression: ${e.message}`); }
      }
      return { title, range: str(g.range, `groups[${i}].range`, false) || '', match };
    });
  }

  if (raw.fields != null) {
    if (!isObj(raw.fields)) throw new ConfigError('"fields" must be an object keyed by code');
    for (const [code, f] of Object.entries(raw.fields)) {
      if (!isObj(f)) throw new ConfigError(`"fields.${code}" must be an object`);
      if (f.widget != null && !WIDGETS.includes(f.widget)) throw new ConfigError(`"fields.${code}.widget" must be one of ${WIDGETS.join(', ')}`);
      if (f.rows != null && !(Number.isInteger(f.rows) && f.rows > 0)) throw new ConfigError(`"fields.${code}.rows" must be a positive integer`);
      cfg.fields[code] = {
        label: str(f.label, `fields.${code}.label`, false),
        widget: f.widget,
        rows: f.rows,
        placeholder: str(f.placeholder, `fields.${code}.placeholder`, false),
      };
    }
  }
  return cfg;
}

function loadConfig(configPath) {
  const abs = path.resolve(configPath);
  let text;
  try { text = fs.readFileSync(abs, 'utf8'); } catch (e) {
    throw new ConfigError(e.code === 'ENOENT' ? `Config file not found: ${abs}` : `Cannot read config file: ${e.message}`);
  }
  let raw;
  try { raw = JSON.parse(text); } catch (e) { throw new ConfigError(`Config file is not valid JSON: ${e.message}`); }
  return normalize(raw, abs);
}

module.exports = { loadConfig, normalize, ConfigError };
