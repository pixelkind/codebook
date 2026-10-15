'use strict';
// Parses the Markdown codebook format:
//   free text (description)
//   ## `section_id`: Title
//   Unit: ...
//   | code | values | hint | definition | include example | exclude example |
//   Free-text columns: `a`, `b`

class CodebookError extends Error {
  constructor(message, { section = null, line = null } = {}) {
    const where = [section && `section ${section}`, line && `line ${line}`].filter(Boolean).join(', ');
    super(where ? `${message} (${where})` : message);
    this.name = 'CodebookError';
    this.section = section;
    this.line = line;
    this.reason = message;
  }
}

const COLUMN_ALIASES = {
  code: 'code',
  values: 'values',
  hint: 'hint',
  definition: 'definition',
  'include example': 'include',
  include: 'include',
  'exclude example': 'exclude',
  exclude: 'exclude',
};

function stripTicks(s) {
  return s.trim().replace(/^`+|`+$/g, '').trim();
}

// Split a Markdown table row into cells; honours escaped pipes (\|) and pipes inside `code spans`.
function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  const cells = [];
  let cur = '';
  let inCode = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '\\' && s[i + 1] === '|') { cur += '|'; i++; continue; }
    if (ch === '`') inCode = !inCode;
    if (ch === '|' && !inCode) { cells.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function isSeparatorRow(line) {
  return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line.trim());
}

function parseSectionHeading(text, lineNo) {
  // `## \`id\`: Title`, also tolerates `## id: Title` and `## \`id\``
  const m = text.match(/^##\s+(`[^`]+`|[^:\s]+)\s*(?::\s*(.*))?$/);
  if (!m) throw new CodebookError(`Cannot read section heading "${text.trim()}"; expected "## \`section_id\`: Title"`, { line: lineNo });
  return { id: stripTicks(m[1]), title: (m[2] || '').trim() };
}

function parseFreeText(rest, section, lineNo) {
  const ticked = [...rest.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim());
  const names = ticked.length ? ticked : rest.split(',').map((s) => s.trim()).filter(Boolean);
  if (!names.length) throw new CodebookError('"Free-text columns:" lists no columns', { section, line: lineNo });
  return names;
}

function parseCodebook(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  const descLines = [];
  const sections = [];
  let sec = null;
  let table = null; // { headerLine, cols, sawSeparator }

  const finishTable = () => {
    if (table && !table.sawSeparator) {
      throw new CodebookError('Table header is not followed by a separator row (| --- | --- |)', { section: sec.id, line: table.headerLine });
    }
    table = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const line = lines[i];
    const trimmed = line.trim();

    if (/^##\s/.test(line) && !/^###/.test(line)) {
      if (sec) finishTable();
      const h = parseSectionHeading(line, lineNo);
      if (sections.some((s) => s.id === h.id)) throw new CodebookError(`Duplicate section "${h.id}"`, { section: h.id, line: lineNo });
      sec = { id: h.id, title: h.title, unit: '', line: lineNo, fields: [], freeText: [], hasTable: false };
      sections.push(sec);
      continue;
    }
    if (!sec) { descLines.push(line); continue; }

    if (trimmed.startsWith('|')) {
      if (!table) {
        if (sec.hasTable) throw new CodebookError('Section has more than one table', { section: sec.id, line: lineNo });
        const headers = splitRow(trimmed).map((h) => h.toLowerCase().replace(/\s+/g, ' '));
        const cols = headers.map((h) => COLUMN_ALIASES[h] || null);
        for (const req of ['code', 'values', 'hint']) {
          if (!cols.includes(req)) throw new CodebookError(`Table has no "${req}" column`, { section: sec.id, line: lineNo });
        }
        table = { headerLine: lineNo, cols, sawSeparator: false };
        sec.hasTable = true;
        continue;
      }
      if (!table.sawSeparator) {
        if (!isSeparatorRow(trimmed)) throw new CodebookError('Expected a separator row (| --- | --- |) after the table header', { section: sec.id, line: lineNo });
        table.sawSeparator = true;
        continue;
      }
      const cells = splitRow(trimmed);
      if (cells.length !== table.cols.length) {
        throw new CodebookError(`Table row has ${cells.length} cells, header has ${table.cols.length}`, { section: sec.id, line: lineNo });
      }
      const f = { code: '', values: [], hint: '', definition: '', include: '', exclude: '', line: lineNo };
      table.cols.forEach((key, idx) => { if (key) f[key] = cells[idx]; });
      f.code = stripTicks(f.code);
      if (!f.code) throw new CodebookError('Table row has an empty code', { section: sec.id, line: lineNo });
      if (sec.fields.some((x) => x.code === f.code)) throw new CodebookError(`Duplicate code "${f.code}"`, { section: sec.id, line: lineNo });
      f.values = f.values ? f.values.split('/').map(stripTicks).filter(Boolean) : [];
      if (new Set(f.values).size !== f.values.length) throw new CodebookError(`Code "${f.code}" lists a value twice`, { section: sec.id, line: lineNo });
      sec.fields.push(f);
      continue;
    }
    if (table) finishTable();

    let m;
    if ((m = trimmed.match(/^Unit:\s*(.*)$/i))) { sec.unit = m[1].trim(); continue; }
    if ((m = trimmed.match(/^Free-text columns:\s*(.*)$/i))) {
      for (const name of parseFreeText(m[1], sec.id, lineNo)) {
        if (sec.fields.some((x) => x.code === name)) throw new CodebookError(`"${name}" is both a coded and a free-text column`, { section: sec.id, line: lineNo });
        if (!sec.freeText.includes(name)) sec.freeText.push(name);
      }
      continue;
    }
  }
  if (sec) finishTable();

  for (const s of sections) {
    if (!s.hasTable || !s.fields.length) throw new CodebookError('Section has no codes table', { section: s.id, line: s.line });
    delete s.hasTable;
  }
  if (!sections.length) throw new CodebookError('No sections found; expected at least one "## `section_id`: Title" heading', { line: lines.length });

  return { description: descLines.join('\n').trim(), sections };
}

module.exports = { parseCodebook, CodebookError, splitRow };
