# Codebook

A small local tool for qualitative coding. It shows one CSV row at a time (text columns rendered as Markdown) next to a form generated from a Markdown codebook, and writes your answers back into the CSV.

Single user, runs on `127.0.0.1` only, no build step.

## Install

Requires Node.js 18 or newer.

```bash
npm install
```

## Run

```bash
node codebook.js codebook.config.json
```

The URL is printed and the browser opens automatically (pass `--no-open` to skip that). To try the synthetic example:

```bash
npm run example
```

If something is wrong (codebook parse error, missing columns, duplicate ids, unknown section…), the server still starts and the page shows an error screen explaining what to fix. The same message is printed in the terminal. Fix the file and press **Reload**. Nothing is written while the error screen is shown.

Row contents are never printed to the terminal.

## Config file

JSON. Paths are relative to the config file.

```json
{
  "codebook": "codebook.md",
  "section": "prompts_A1",
  "data": "data.csv",
  "coder": "garrit",
  "port": 3000,
  "autoAdvance": true,
  "display": {
    "idColumn": "row_id",
    "meta": ["student_id", "condition", "version"],
    "text": [
      { "column": "instructions", "label": "Instructions", "markdown": true, "collapsed": true },
      { "column": "prompt", "label": "Prompt", "markdown": true }
    ]
  },
  "groups": [
    { "title": "Requirements", "range": "R1–R6", "match": "^req_A1-R" },
    { "title": "Decisions", "range": "D1–D5", "match": "^req_A1-D" },
    { "title": "Prompt qualities", "match": "*" }
  ],
  "fields": {
    "decision_ownership": { "widget": "buttons" },
    "memo": { "label": "Memo", "rows": 3, "placeholder": "Anything that does not fit the codebook…" }
  }
}
```

| Key | Required | Meaning |
| --- | --- | --- |
| `codebook` | yes | Markdown codebook file. |
| `data` | yes | CSV file to code. |
| `section` | if the codebook has several sections | Section id to code. |
| `coder` | no | Shown in the top bar and written to the `coder` column (if the CSV has one) for every row you save. |
| `port` | no | Default `3000`. |
| `autoAdvance` | no | Default `true`. After choosing a value with a number key, focus moves to the next field. |
| `display.idColumn` | no | Column with unique row ids. Default `row_id`. Duplicate or empty ids stop startup. |
| `display.meta` | no | Columns shown as key/value chips under the row id. |
| `display.text` | no | Text columns shown in the left pane. `label` (defaults to the column name), `markdown` (default `true`, otherwise plain text), `collapsed` (a collapsible block, closed by default, in a smaller type size). With several entries, each gets a small uppercase label. |
| `groups` | no | Groups for the form. Each coded field goes into the first group whose `match` regex matches its code; `"*"` catches the rest. `range` is optional small text next to the title. Without `groups`, there is one group per codebook section. Free-text fields always form a final **Notes** group. |
| `fields.<code>` | no | Per-field overrides: `label`, `widget` (`buttons`, `dropdown` or `textarea`), `rows`, `placeholder`. By default, fields with up to 4 values use buttons and fields with more use a dropdown. `textarea` applies to fields without allowed values. |

## Codebook format

```markdown
# Codebook: My study

Free text before the first `##` heading is the general description,
shown under "About this codebook" (book icon in the top bar).

## `prompts_A1`: Prompts, A1A and A1B

Unit: one row per prompt.

| code        | values                     | hint                             | definition | include example | exclude example |
| ----------- | -------------------------- | -------------------------------- | ---------- | --------------- | --------------- |
| `req_A1-R1` | covered / partial / absent | At least two different power-ups | …          | …               | …               |

Free-text columns: `note_student_decisions`, `note_agent_decisions`
```

- `code` is the CSV column name (backticks are stripped).
- `values` are the allowed values, slash-separated, in display order. Each field takes a single choice. An empty `values` cell means no constraint: the field gets a free text input and does not count towards coding status.
- `hint` is the field label.
- `definition`, `include example` and `exclude example` (all optional) appear in an info panel next to the field. The info icon only shows when at least one of them is filled in.
- `Free-text columns:` lists textarea columns. A CSV column called `memo` is always treated as free text too.
- Parse errors report the section and line number.

## How data is written

- Each save re-reads the CSV from disk, replaces only the edited cells of that row (plus `coder`), and writes atomically (temp file and rename). All other rows, unknown columns, column order, quoting, line endings and a BOM are kept byte for byte, so edits made in another program to other rows are not lost.
- `<data>.bak` is created once, the first time the tool starts with that file. It is never overwritten.
- Only codebook columns, free-text columns, `memo` and `coder` are ever written.
- An existing value that is not in the allowed values is shown as **invalid value** and kept in the CSV until you pick a new value or press **Clear value**.
- The page reloads all data from disk every time it loads.

**Coding status:** a row is *fully coded* when every constrained field has an allowed value, *uncoded* when none has, and *partially coded* otherwise. Free-text fields do not count. On startup the tool opens the first row that is not fully coded. **Only uncoded rows** limits Prev/Next to rows that are not fully coded.

Prev, Next, jumping to a row and Save & Next save pending changes first. If the save fails, you stay on the row and a banner shows the error.

## Keyboard shortcuts

| Action | Keys |
| --- | --- |
| Choose option in focused field | `1` `2` `3` … |
| Clear focused field | `0` or `⌫` |
| Previous / next field | `↑` `↓` |
| Save | `Ctrl S` / `⌘ S` |
| Save & Next | `Ctrl ↵` / `⌘ ↵` |
| Previous / next row | `Alt ←` `Alt →` |
| Jump to row (index or id) | `/` |
| Show shortcuts | `?` |

Number keys, `0`, `⌫` and the arrow keys only act on the focused field row, and never while you are typing in a text field or dropdown.

## Development

```bash
npm test
```

```
codebook.js            CLI + Express server
lib/config.js          config loading and validation
lib/codebook-parser.js Markdown codebook parser
lib/csv-store.js       CSV read / byte-preserving row update / backup
lib/startup.js         validation and the model sent to the browser
public/                index.html, app.js, style.css (based on design/style.css)
examples/              synthetic codebook + 5-row CSV (Snake power-ups)
test/                  node:test suites
```

Real study data contains student material. `.gitignore` excludes `data*.csv`, `prompts_*.csv` and `*.bak`; keep it that way.
