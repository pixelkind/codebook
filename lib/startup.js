'use strict';
// Runs all startup validation (config, codebook, CSV) and builds the model the browser renders.
// Never throws: problems come back as a structured error for the startup error screen.

const fs = require('fs');
const path = require('path');
const { loadConfig } = require('./config');
const { parseCodebook } = require('./codebook-parser');
const { readCsv, indexRows, toObjects } = require('./csv-store');

const SUBTITLE = 'Codebook could not start, and nothing has been changed.';

function startupError(title, { message = '', items = [], files = [], fix = null } = {}) {
  const err = { title, subtitle: SUBTITLE, message, items, files, fix };
  err.details = formatDetails(err);
  return err;
}

function formatDetails(err) {
  const out = [err.title, err.subtitle];
  if (err.message) out.push('', err.message);
  if (err.items.length) out.push('', ...err.items.map((i) => `${i.tag}: ${i.code}${i.text ? ' ' + i.text : ''}`));
  if (err.files.length) out.push('', ...err.files.map((f) => `${f.label}: ${f.value}${f.note ? ' ' + f.note : ''}`));
  if (err.fix) out.push('', 'To fix: ' + err.fix.map((p) => (typeof p === 'string' ? p : p.code)).join(''));
  return out.join('\n');
}

function humanize(code) {
  const s = code.replace(/[_-]+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fileList(cfg, extra = {}) {
  const files = [
    { label: 'Codebook', value: path.basename(cfg.codebook) },
    { label: 'Data file', value: path.basename(cfg.data), note: '— not modified' },
  ];
  if (extra.dataset) files.push({ label: 'Dataset', value: extra.dataset });
  return files;
}

function buildGroups(cfg, section, valueFields) {
  if (!cfg.groups) {
    return [{ title: section.title || section.id, range: '', fields: valueFields }];
  }
  const groups = cfg.groups.map((g) => ({ title: g.title, range: g.range, fields: [], re: g.match === '*' ? null : new RegExp(g.match) }));
  const unassigned = [];
  for (const f of valueFields) {
    const g = groups.find((x) => (x.re ? x.re.test(f.code) : true));
    if (g) g.fields.push(f); else unassigned.push(f);
  }
  const out = groups.filter((g) => g.fields.length).map(({ re, ...g }) => g);
  if (unassigned.length) out.push({ title: 'Other', range: '', fields: unassigned });
  return out;
}

function build(configPath) {
  let cfg;
  try {
    cfg = loadConfig(configPath);
  } catch (e) {
    return { ok: false, error: startupError('Config file could not be loaded', {
      message: e.message,
      files: [{ label: 'Config', value: path.basename(configPath) }],
      fix: ['correct ', { code: path.basename(configPath) }, '. Then reload.'],
    }) };
  }
  const cbName = path.basename(cfg.codebook);
  const dataName = path.basename(cfg.data);

  // ---- codebook
  let cb;
  try {
    cb = parseCodebook(fs.readFileSync(cfg.codebook, 'utf8'));
  } catch (e) {
    const notFound = e.code === 'ENOENT';
    return { ok: false, error: startupError(notFound ? 'Codebook file not found' : 'Codebook could not be parsed', {
      message: notFound ? `No file at ${cfg.codebook}` : e.message,
      items: e.line ? [{ tag: 'Line ' + e.line, code: e.section || cbName, text: e.reason }] : [],
      files: fileList(cfg),
      fix: notFound ? ['check the ', { code: 'codebook' }, ' path in the config file. Then reload.']
        : ['correct ', { code: cbName }, e.line ? ` at line ${e.line}` : '', '. Then reload.'],
    }) };
  }

  let section;
  if (cfg.section) {
    section = cb.sections.find((s) => s.id === cfg.section);
    if (!section) {
      return { ok: false, error: startupError('Section not found in codebook', {
        message: `The config asks for section "${cfg.section}", but ${cbName} does not define it.`,
        items: cb.sections.map((s) => ({ tag: 'Available section', code: s.id, text: s.title ? `— ${s.title}` : '' })),
        files: fileList(cfg, { dataset: cfg.section }),
        fix: ['set ', { code: 'section' }, ' in the config file to one of the sections above. Then reload.'],
      }) };
    }
  } else if (cb.sections.length === 1) {
    section = cb.sections[0];
  } else {
    return { ok: false, error: startupError('Choose a codebook section', {
      message: `${cbName} defines ${cb.sections.length} sections and the config does not say which one to code.`,
      items: cb.sections.map((s) => ({ tag: 'Available section', code: s.id, text: s.title ? `— ${s.title}` : '' })),
      files: fileList(cfg),
      fix: ['add ', { code: '"section": "<id>"' }, ' to the config file. Then reload.'],
    }) };
  }
  const files = fileList(cfg, { dataset: section.id });

  // ---- CSV
  let csv;
  try {
    csv = readCsv(cfg.data);
  } catch (e) {
    const notFound = e.code === 'ENOENT';
    return { ok: false, error: startupError(notFound ? 'Data file not found' : 'Data file could not be read', {
      message: notFound ? `No file at ${cfg.data}` : e.message,
      files,
      fix: notFound ? ['check the ', { code: 'data' }, ' path in the config file. Then reload.'] : ['correct ', { code: dataName }, '. Then reload.'],
    }) };
  }
  const header = csv.header;
  const has = (c) => header.includes(c);

  const freeText = section.freeText.slice();
  if (has('memo') && !freeText.includes('memo') && !section.fields.some((f) => f.code === 'memo')) freeText.push('memo');

  // ---- column checks
  const missing = [];
  for (const f of section.fields) if (!has(f.code)) missing.push({ code: f.code, text: 'is defined in the codebook but not in the CSV.' });
  for (const c of freeText) if (!has(c)) missing.push({ code: c, text: 'is a free-text column in the codebook but not in the CSV.' });
  const displayCols = [cfg.display.idColumn, ...cfg.display.meta, ...cfg.display.text.map((t) => t.column)];
  for (const c of displayCols) if (!has(c) && !missing.some((m) => m.code === c)) missing.push({ code: c, text: 'is named under "display" in the config but not in the CSV.' });
  if (missing.length) {
    const first = missing[0].code;
    const fromCodebook = section.fields.some((f) => f.code === first) || freeText.includes(first);
    return { ok: false, error: startupError('Codebook and CSV do not match', {
      items: missing.map((m) => ({ tag: 'Missing column', code: m.code, text: m.text })),
      files,
      fix: missing.length === 1
        ? (fromCodebook
          ? ['add a ', { code: first }, ' column to ', { code: dataName }, ', or remove that field from the codebook. Then reload.']
          : ['add a ', { code: first }, ' column to ', { code: dataName }, ', or remove it from the config. Then reload.'])
        : ['add the missing columns to ', { code: dataName }, ', or remove those fields from the codebook or config. Then reload.'],
    }) };
  }

  const idx = indexRows(csv, cfg.display.idColumn);
  if (idx.problems.length) {
    return { ok: false, error: startupError('Row ids are not unique', {
      message: `Every row needs a unique, non-empty value in "${cfg.display.idColumn}".`,
      items: idx.problems.slice(0, 20).map((p) => p.kind === 'duplicate'
        ? { tag: 'Duplicate id', code: p.id, text: `appears again in data row ${p.row} (line ${p.line}).` }
        : { tag: 'Empty id', code: `data row ${p.row}`, text: `(line ${p.line}) has no ${cfg.display.idColumn}.` }),
      files,
      fix: ['give every row in ', { code: dataName }, ' its own ', { code: cfg.display.idColumn }, '. Then reload.'],
    }) };
  }
  if (!csv.records.length) {
    return { ok: false, error: startupError('Data file has no rows', {
      message: `${dataName} has a header but no data rows to code.`,
      files,
      fix: ['add rows to ', { code: dataName }, ', or point ', { code: 'data' }, ' in the config at another file. Then reload.'],
    }) };
  }

  // ---- model
  const valueFields = section.fields.map((f) => {
    const o = cfg.fields[f.code] || {};
    let widget;
    if (!f.values.length) widget = o.widget === 'textarea' ? 'textarea' : 'text';
    else if (o.widget === 'buttons' || o.widget === 'dropdown') widget = o.widget;
    else widget = f.values.length <= 4 ? 'buttons' : 'dropdown';
    return {
      code: f.code,
      label: o.label || f.hint || humanize(f.code),
      values: f.values,
      widget,
      constrained: f.values.length > 0,
      rows: o.rows || 2,
      placeholder: o.placeholder || '',
      help: { def: f.definition, inc: f.include, exc: f.exclude },
    };
  });
  const notes = freeText.map((code) => {
    const o = cfg.fields[code] || {};
    return { code, label: o.label || humanize(code), rows: o.rows || (code === 'memo' ? 3 : 2), placeholder: o.placeholder || '' };
  });
  const editable = [...valueFields.map((f) => f.code), ...notes.map((n) => n.code)];
  const rows = toObjects(csv).map((r) => ({
    id: r[cfg.display.idColumn].trim(),
    meta: Object.fromEntries(cfg.display.meta.map((c) => [c, r[c]])),
    text: Object.fromEntries(cfg.display.text.map((t) => [t.column, r[t.column]])),
    values: Object.fromEntries(editable.map((c) => [c, r[c]])),
  }));

  return {
    ok: true,
    cfg,
    model: {
      dataset: section.id,
      sectionTitle: section.title,
      unit: section.unit,
      description: cb.description,
      coder: cfg.coder,
      hasCoderColumn: has('coder'),
      autoAdvance: cfg.autoAdvance,
      dataFile: dataName,
      codebookFile: cbName,
      idColumn: cfg.display.idColumn,
      meta: cfg.display.meta,
      text: cfg.display.text,
      groups: buildGroups(cfg, section, valueFields),
      notes,
      rows,
    },
  };
}

module.exports = { build, startupError };
