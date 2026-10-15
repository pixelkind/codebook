'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { readCsv, parseBuffer, toObjects, updateRow, ensureBackup, indexRows } = require('../lib/csv-store');

const example = path.join(__dirname, '..', 'examples', 'snake-sample.csv');

function tmpCopy(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codebook-test-'));
  const file = path.join(dir, 'data.csv');
  if (content == null) fs.copyFileSync(example, file); else fs.writeFileSync(file, content);
  return file;
}

test('reads the example: 5 rows, multiline markdown prompts', () => {
  const rows = toObjects(readCsv(example));
  assert.strictEqual(rows.length, 5);
  assert.match(rows[0].prompt, /```js\nconst state = \{\n/);
  assert.strictEqual(rows[3]['req_A1-R1'], 'maybe');
});

test('roundtrip: only the edited cells change, everything else byte-identical', () => {
  const file = tmpCopy();
  const before = fs.readFileSync(file, 'utf8');
  const row = updateRow(file, 'row_id', 'r_0003', { 'req_A1-R1': 'covered', memo: 'line 1\nline 2, "quoted"', coder: 'tester' });
  assert.strictEqual(row['req_A1-R1'], 'covered');

  const after = fs.readFileSync(file, 'utf8');
  const a = toObjects(readCsv(file));
  const b = toObjects(readCsv(example));
  assert.strictEqual(a.length, 5);
  // Untouched rows are identical; edited row only differs in the edited columns.
  for (let i = 0; i < 5; i++) {
    for (const col of Object.keys(b[i])) {
      if (i === 2 && ['req_A1-R1', 'memo', 'coder'].includes(col)) continue;
      assert.strictEqual(a[i][col], b[i][col], `row ${i} col ${col}`);
    }
  }
  assert.strictEqual(a[2].memo, 'line 1\nline 2, "quoted"');
  assert.strictEqual(a[2].prompt, b[2].prompt);
  // Bytes before and after the edited record are unchanged.
  const csv = readCsv(example);
  const rec = csv.records[2];
  assert.strictEqual(after.slice(0, rec.start), before.slice(0, rec.start));
  assert.ok(after.endsWith(before.slice(csv.records[3].start)));
});

test('preserves unknown columns, CRLF line endings, BOM and a missing final newline', () => {
  const src = '﻿id,extra,code,note\r\n1,"keep\r\nme",,x\r\n2,  odd  spacing ,a,"q"\r\n3,z,,';
  const file = tmpCopy(src);
  updateRow(file, 'id', '3', { code: 'b' });
  assert.strictEqual(fs.readFileSync(file, 'utf8'), '﻿id,extra,code,note\r\n1,"keep\r\nme",,x\r\n2,  odd  spacing ,a,"q"\r\n3,z,b,');
  updateRow(file, 'id', '1', { code: 'c' });
  assert.strictEqual(fs.readFileSync(file, 'utf8'), '﻿id,extra,code,note\r\n1,keep\r\nme,c,x\r\n2,  odd  spacing ,a,"q"\r\n3,z,b,'.replace('1,keep\r\nme', '1,"keep\r\nme"'));
});

test('concurrent external edit to another row survives a save', () => {
  const file = tmpCopy();
  // Simulate the tool having loaded the file, then another program editing r_0005.
  readCsv(file);
  const external = fs.readFileSync(file, 'utf8').replace('one that gives double points', 'one that gives TRIPLE points');
  fs.writeFileSync(file, external);
  updateRow(file, 'row_id', 'r_0002', { 'req_A1-R3': 'absent' });
  const rows = toObjects(readCsv(file));
  assert.match(rows[4].prompt, /TRIPLE points/);
  assert.strictEqual(rows[1]['req_A1-R3'], 'absent');
  // Every other record is byte-identical to the externally edited file.
  const ext = parseBuffer(Buffer.from(external)), now = readCsv(file);
  const raw = (c, i) => c.body.subarray(c.records[i].start, c.records[i].end).toString();
  for (const i of [0, 2, 3, 4]) assert.strictEqual(raw(now, i), raw(ext, i));
});

test('ids: duplicates and empties are reported', () => {
  const csv = readCsv(tmpCopy('id,a\n1,x\n1,y\n,z\n'));
  const { problems } = indexRows(csv, 'id');
  assert.deepStrictEqual(problems.map((p) => [p.kind, p.row]), [['duplicate', 2], ['empty', 3]]);
});

test('write fails cleanly on a read-only file and leaves it untouched', { skip: process.getuid && process.getuid() === 0 }, () => {
  const file = tmpCopy();
  const before = fs.readFileSync(file, 'utf8');
  fs.chmodSync(file, 0o444);
  assert.throws(() => updateRow(file, 'row_id', 'r_0001', { memo: 'x' }), (e) => e.code === 'EACCES');
  assert.strictEqual(fs.readFileSync(file, 'utf8'), before);
  assert.deepStrictEqual(fs.readdirSync(path.dirname(file)), ['data.csv']);
});

test('backup is created once and never overwritten', () => {
  const file = tmpCopy('id\n1\n');
  assert.strictEqual(ensureBackup(file), true);
  fs.writeFileSync(file, 'id\n2\n');
  assert.strictEqual(ensureBackup(file), false);
  assert.strictEqual(fs.readFileSync(file + '.bak', 'utf8'), 'id\n1\n');
});
