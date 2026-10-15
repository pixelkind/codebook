'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { parseCodebook, CodebookError, splitRow } = require('../lib/codebook-parser');

const root = path.join(__dirname, '..');
// The real study codebook (no student data); fall back to the example copy if it is not checked out.
const realPath = fs.existsSync(path.join(root, 'CODEBOOK.md')) ? path.join(root, 'CODEBOOK.md') : path.join(root, 'examples/codebook.md');

test('parses the real codebook', () => {
  const cb = parseCodebook(fs.readFileSync(realPath, 'utf8'));
  assert.match(cb.description, /^# Codebook/);
  assert.strictEqual(cb.sections.length, 1);
  const s = cb.sections[0];
  assert.strictEqual(s.id, 'prompts_A1');
  assert.strictEqual(s.title, 'Prompts, A1A and A1B');
  assert.strictEqual(s.unit, 'one row per prompt.');
  assert.deepStrictEqual(s.fields.map((f) => f.code), [
    'req_A1-R1', 'req_A1-R2', 'req_A1-R3', 'req_A1-R4', 'req_A1-R5', 'req_A1-R6',
    'req_A1-D1', 'req_A1-D2', 'req_A1-D3', 'req_A1-D4', 'req_A1-D5',
    'constraints', 'acceptance_criteria', 'over_specification', 'decision_ownership',
  ]);
  assert.deepStrictEqual(s.fields[0].values, ['covered', 'partial', 'absent']);
  assert.deepStrictEqual(s.fields.find((f) => f.code === 'over_specification').values, ['yes', 'no']);
  assert.deepStrictEqual(s.fields.find((f) => f.code === 'decision_ownership').values, ['student', 'mixed', 'agent']);
  assert.strictEqual(s.fields[0].hint, 'At least two different power-ups');
  assert.deepStrictEqual(s.freeText, ['note_student_decisions', 'note_agent_decisions']);
});

test('example codebook carries definitions and examples', () => {
  const cb = parseCodebook(fs.readFileSync(path.join(root, 'examples/codebook.md'), 'utf8'));
  const r1 = cb.sections[0].fields[0];
  assert.match(r1.definition, /two or more distinct power-ups/);
  assert.match(r1.include, /speed boost/);
  assert.match(r1.exclude, /without naming/);
});

const mini = (body) => `Intro\n\n## \`s1\`: One\n\nUnit: row\n\n| code | values | hint |\n| --- | --- | --- |\n${body}\n`;

test('empty values means unconstrained', () => {
  const cb = parseCodebook(mini('| `a` | x / y | A |\n| `b` |  | B |'));
  assert.deepStrictEqual(cb.sections[0].fields.map((f) => f.values), [['x', 'y'], []]);
});

test('multiple sections', () => {
  const text = mini('| `a` | x | A |') + '\n## `s2`: Two\n\n| code | values | hint |\n|---|---|---|\n| b | y | B |\n\nFree-text columns: `n1`, `n2`\n';
  const cb = parseCodebook(text);
  assert.deepStrictEqual(cb.sections.map((s) => s.id), ['s1', 's2']);
  assert.deepStrictEqual(cb.sections[1].freeText, ['n1', 'n2']);
});

test('reports section and line for a malformed row', () => {
  assert.throws(() => parseCodebook(mini('| `a` | x | A |\n| `b` | y |')), (e) => {
    assert.ok(e instanceof CodebookError);
    assert.strictEqual(e.section, 's1');
    assert.strictEqual(e.line, 10);
    assert.match(e.message, /2 cells, header has 3.*section s1, line 10/);
    return true;
  });
});

test('reports duplicate codes, missing columns, missing separator', () => {
  assert.throws(() => parseCodebook(mini('| `a` | x | A |\n| `a` | y | B |')), /Duplicate code "a".*line 10/);
  assert.throws(() => parseCodebook('## `s`: S\n\n| code | hint |\n| --- | --- |\n| a | b |\n'), /no "values" column.*line 3/);
  assert.throws(() => parseCodebook('## `s`: S\n\n| code | values | hint |\n| a | b | c |\n'), /separator.*line 4/);
  assert.throws(() => parseCodebook('just text\n'), /No sections/);
  assert.throws(() => parseCodebook('## `s`: S\n\nUnit: x\n'), /no codes table.*section s, line 1/);
});

test('splitRow handles escaped pipes and code spans', () => {
  assert.deepStrictEqual(splitRow('| a | b \\| c | `x|y` |'), ['a', 'b | c', '`x|y`']);
});
