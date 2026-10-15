'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { build } = require('../lib/startup');

const ex = path.join(__dirname, '..', 'examples');

function sandbox(mutate = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codebook-startup-'));
  for (const f of ['codebook.md', 'snake-sample.csv', 'codebook.config.json']) {
    let text = fs.readFileSync(path.join(ex, f), 'utf8');
    if (mutate[f]) text = mutate[f](text);
    fs.writeFileSync(path.join(dir, f), text);
  }
  return path.join(dir, 'codebook.config.json');
}

test('example builds: groups, notes, rows', () => {
  const r = build(path.join(ex, 'codebook.config.json'));
  assert.ok(r.ok, r.error && r.error.details);
  const m = r.model;
  assert.deepStrictEqual(m.groups.map((g) => [g.title, g.fields.length]), [['Requirements', 6], ['Decisions', 5], ['Prompt qualities', 4]]);
  assert.deepStrictEqual(m.notes.map((n) => n.code), ['note_student_decisions', 'note_agent_decisions', 'memo']);
  assert.strictEqual(m.notes[0].label, 'Decisions the student made');
  assert.strictEqual(m.rows.length, 5);
  assert.ok(m.groups[0].fields.every((f) => f.widget === 'buttons'));
});

test('missing column → mismatch error naming the code', () => {
  const r = build(sandbox({ 'codebook.md': (t) => t.replace('| `req_A1-D1`', '| `req_A1-R7` | covered / absent | New | | | |\n| `req_A1-D1`') }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.error.title, 'Codebook and CSV do not match');
  assert.deepStrictEqual(r.error.items.map((i) => [i.tag, i.code]), [['Missing column', 'req_A1-R7']]);
  assert.match(r.error.details, /add a req_A1-R7 column to snake-sample\.csv/);
});

test('duplicate ids, unknown section and parse errors are reported', () => {
  let r = build(sandbox({ 'snake-sample.csv': (t) => t.replace('r_0002', 'r_0001') }));
  assert.strictEqual(r.error.title, 'Row ids are not unique');
  assert.strictEqual(r.error.items[0].code, 'r_0001');

  r = build(sandbox({ 'codebook.config.json': (t) => t.replace('"prompts_A1"', '"nope"') }));
  assert.strictEqual(r.error.title, 'Section not found in codebook');
  assert.deepStrictEqual(r.error.items.map((i) => i.code), ['prompts_A1']);

  r = build(sandbox({ 'codebook.md': (t) => t.replace('| `req_A1-R2`           | covered / partial / absent |', '| `req_A1-R2` |') }));
  assert.strictEqual(r.error.title, 'Codebook could not be parsed');
  assert.match(r.error.message, /section prompts_A1, line \d+/);
});
