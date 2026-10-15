'use strict';
// CSV access that never rewrites what it does not need to: a save re-reads the file,
// re-serialises only the one record being changed, and splices it back between the
// original bytes of every other record. Header, quoting, line endings, BOM and
// unknown columns of all other rows stay byte-identical.

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

class CsvError extends Error {
  constructor(message, extra = {}) {
    super(message);
    this.name = 'CsvError';
    Object.assign(this, extra);
  }
}

function parseBuffer(buf) {
  const hasBom = buf.length >= 3 && buf.subarray(0, 3).equals(BOM);
  const body = hasBom ? buf.subarray(3) : buf;
  let parsed;
  try {
    parsed = parse(body, { info: true, relax_column_count: true, skip_empty_lines: true });
  } catch (e) {
    throw new CsvError(`CSV could not be parsed: ${e.message}`, { line: e.lines });
  }
  if (!parsed.length) throw new CsvError('CSV file is empty (no header row)');
  const records = [];
  let prev = 0;
  for (const p of parsed) {
    const end = p.info.bytes;
    // Blank lines skipped by the parser end up at the front of the next segment; leave them out.
    let start = prev;
    while (start < end && (body[start] === 0x0a || body[start] === 0x0d)) start++;
    records.push({ fields: p.record, start, end, line: p.info.lines });
    prev = end;
  }
  const header = records.shift().fields;
  return { hasBom, body, header, records };
}

function readCsv(file) {
  return parseBuffer(fs.readFileSync(file));
}

// Index records by id column; reports duplicate / empty ids.
function indexRows(csv, idColumn) {
  const idIdx = csv.header.indexOf(idColumn);
  if (idIdx < 0) throw new CsvError(`Id column "${idColumn}" not found`, { kind: 'missing-id-column' });
  const byId = new Map();
  const problems = [];
  csv.records.forEach((r, i) => {
    const id = (r.fields[idIdx] || '').trim();
    if (!id) problems.push({ kind: 'empty', id: '', row: i + 1, line: r.line });
    else if (byId.has(id)) problems.push({ kind: 'duplicate', id, row: i + 1, line: r.line });
    else byId.set(id, i);
  });
  return { idIdx, byId, problems };
}

function toObjects(csv) {
  return csv.records.map((r) => {
    const o = {};
    csv.header.forEach((h, i) => { o[h] = r.fields[i] ?? ''; });
    return o;
  });
}

function lineEnding(seg) {
  if (seg.endsWith('\r\n')) return '\r\n';
  if (seg.endsWith('\n')) return '\n';
  if (seg.endsWith('\r')) return '\r';
  return '';
}

function detectEol(csv) {
  const first = csv.body.subarray(0, csv.records.length ? csv.records[0].start : csv.body.length).toString('utf8');
  return lineEnding(first) || '\n';
}

function writeAtomic(file, data) {
  // Fail early (and with a clear code) on a read-only data file: rename() would happily replace it.
  fs.accessSync(file, fs.constants.W_OK);
  const dir = path.dirname(file);
  const tmp = path.join(dir, `.${path.basename(file)}.${process.pid}.${Date.now()}.tmp`);
  const mode = fs.statSync(file).mode;
  try {
    fs.writeFileSync(tmp, data, { mode });
    fs.renameSync(tmp, file);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    throw e;
  }
}

/**
 * Update the record with the given id. `changes` maps column name to new string value;
 * columns not in `changes` keep their current on-disk values. Returns the updated row object.
 */
function updateRow(file, idColumn, id, changes) {
  const csv = readCsv(file);
  const { byId, idIdx } = indexRows(csv, idColumn);
  if (!byId.has(id)) throw new CsvError(`Row "${id}" no longer exists in ${path.basename(file)}`, { kind: 'missing-row' });
  const rec = csv.records[byId.get(id)];

  const fields = csv.header.map((_, i) => rec.fields[i] ?? '');
  // Keep any extra trailing cells a ragged row may have.
  for (let i = csv.header.length; i < rec.fields.length; i++) fields.push(rec.fields[i]);
  for (const [col, value] of Object.entries(changes)) {
    const i = csv.header.indexOf(col);
    if (i < 0) throw new CsvError(`Column "${col}" not found`, { kind: 'missing-column' });
    if (i === idIdx) throw new CsvError('The id column cannot be changed');
    fields[i] = value == null ? '' : String(value);
  }

  const oldSeg = csv.body.subarray(rec.start, rec.end).toString('utf8');
  const eol = lineEnding(oldSeg) || (rec.end === csv.body.length ? '' : detectEol(csv));
  const newSeg = stringify([fields], { record_delimiter: 'unix' }).replace(/\n$/, '') + eol;

  const out = Buffer.concat([
    csv.hasBom ? BOM : Buffer.alloc(0),
    csv.body.subarray(0, rec.start),
    Buffer.from(newSeg, 'utf8'),
    csv.body.subarray(rec.end),
  ]);
  writeAtomic(file, out);

  const o = {};
  csv.header.forEach((h, i) => { o[h] = fields[i]; });
  return o;
}

// Create `<file>.bak` once; never overwrite an existing backup.
function ensureBackup(file) {
  const bak = `${file}.bak`;
  if (fs.existsSync(bak)) return false;
  fs.copyFileSync(file, bak, fs.constants.COPYFILE_EXCL);
  return true;
}

module.exports = { readCsv, parseBuffer, indexRows, toObjects, updateRow, ensureBackup, CsvError };
