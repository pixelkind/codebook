/* Codebook front end: vanilla JS, no build step. Markup follows design variant A. */
(() => {
  'use strict';

  const app = document.getElementById('app');

  // ---------- icons (static, trusted markup)
  const I = {
    left: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 8H3M7 4L3 8l4 4"/></svg>',
    right: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>',
    warn14: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2.2l6 10.6H2z"/><path d="M8 6.6v3M8 11.5v.1"/></svg>',
    warn16: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2.2l6 10.6H2z"/><path d="M8 6.6v3M8 11.5v.1"/></svg>',
    warn22: '<svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none;margin-top:2px"><path d="M8 2.2l6 10.6H2z"/><path d="M8 6.6v3M8 11.5v.1"/></svg>',
    sun: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="2.8"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/></svg>',
    moon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8z"/></svg>',
    book: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 3.2c1.8-.6 3.9-.5 5.5.6 1.6-1.1 3.7-1.2 5.5-.6v9.4c-1.8-.6-3.9-.5-5.5.6-1.6-1.1-3.7-1.2-5.5-.6z"/><path d="M8 3.8v9.4"/></svg>',
    info: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="M8 7.2v3.6M8 5.2v.1"/></svg>',
    info16: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="M8 7.2v3.6M8 5.2v.1"/></svg>',
    close: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
    chev: '<svg class="chev" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5"/></svg>',
    stCoded: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-label="Coded" role="img"><circle cx="8" cy="8" r="6.2"/><path d="M5.2 8.2l2 2 3.6-4"/></svg>',
    stInvalid: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-label="Invalid value" role="img"><path d="M8 2.2l6 10.6H2z"/><path d="M8 6.6v3M8 11.5v.1"/></svg>',
    stEmpty: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2.4" aria-label="Not coded" role="img"><circle cx="8" cy="8" r="6.2"/></svg>',
  };

  // ---------- tiny DOM helper
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v; // only used with constant icon strings / sanitized markdown
      else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }
  const icon = (svg) => h('span', { class: 'ico', html: svg });

  // ---------- markdown
  if (window.DOMPurify) {
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A') { node.setAttribute('target', '_blank'); node.setAttribute('rel', 'noopener noreferrer'); }
    });
  }
  function md(text, inline) {
    const html = inline ? marked.parseInline(text || '') : marked.parse(text || '');
    return DOMPurify.sanitize(html);
  }

  // ---------- theme & density
  const THEME_KEY = 'codebook-theme';
  function storedTheme() { try { return localStorage.getItem(THEME_KEY); } catch { return null; } }
  let dark = storedTheme() ? storedTheme() === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  function applyRootClasses() {
    app.classList.toggle('dark', dark);
    app.classList.toggle('compact', window.innerHeight < 800);
  }
  applyRootClasses();
  window.addEventListener('resize', applyRootClasses);

  // ---------- state
  const S = {
    model: null,
    rows: [],
    idx: 0,
    draft: {},
    failed: false,      // last save attempt failed (until a save succeeds or the row changes)
    saving: null,       // in-flight save promise
    onlyUncoded: false,
    helpOpen: new Set(),
    textOpen: new Set(),
    sheetOpen: false,
    aboutOpen: false,
    banner: null,       // { kind: 'err', message, file, rowId } | { kind: 'last' }
  };
  let R = {}; // element references of the coding screen

  const valueFields = () => S.model.groups.flatMap((g) => g.fields);
  const constrainedFields = () => valueFields().filter((f) => f.constrained);
  const editable = () => [...valueFields().map((f) => f.code), ...S.model.notes.map((n) => n.code)];
  const cur = () => S.rows[S.idx];

  function fieldState(f, v) {
    if (!f.constrained) return 'free';
    if (!v) return 'empty';
    return f.values.includes(v) ? 'coded' : 'invalid';
  }
  function rowCounts(values) {
    const fs = constrainedFields();
    const done = fs.filter((f) => fieldState(f, values[f.code]) === 'coded').length;
    return { done, total: fs.length };
  }
  const valuesAt = (i) => (i === S.idx ? S.draft : S.rows[i].values);
  function isFull(i) { const c = rowCounts(valuesAt(i)); return c.done === c.total; }
  const isDirty = () => editable().some((c) => (S.draft[c] || '') !== (cur().values[c] || ''));

  function nextIndex(from, dir) {
    for (let i = from + dir; i >= 0 && i < S.rows.length; i += dir) {
      if (!S.onlyUncoded || !isFull(i)) return i;
    }
    return -1;
  }
  const firstNotFull = () => S.rows.findIndex((_, i) => !isFull(i));
  const notFullCount = () => S.rows.filter((_, i) => !isFull(i)).length;

  // ---------- loading
  async function init() {
    let data;
    try {
      const res = await fetch('api/state', { cache: 'no-store' });
      data = await res.json();
    } catch (e) {
      renderFatal({
        title: 'Could not reach the Codebook server',
        subtitle: 'Is it still running in the terminal?',
        message: String(e.message || e), items: [], files: [], fix: null,
        details: 'Could not reach the Codebook server: ' + (e.message || e),
      });
      return;
    }
    if (!data.ok) { renderFatal(data.error); return; }
    S.model = data.model;
    S.rows = data.model.rows;
    S.banner = null;
    S.failed = false;
    const hashId = decodeURIComponent(location.hash.slice(1));
    const fromHash = hashId ? S.rows.findIndex((r) => r.id === hashId) : -1;
    if (fromHash >= 0) S.idx = fromHash;
    else {
      const f = S.rows.findIndex((r) => { const c = rowCounts(r.values); return c.done < c.total; });
      S.idx = f < 0 ? 0 : f;
    }
    S.draft = { ...cur().values };
    document.title = `Codebook · ${S.model.dataset}`;
    renderShell();
    renderRow();
  }

  // ---------- startup error screen
  function renderFatal(err) {
    document.title = 'Codebook · could not start';
    const note = h('span', { class: 'note', 'aria-live': 'polite' });
    const fixParts = (err.fix || []).map((p) => (typeof p === 'string' ? p : h('code', { text: p.code })));
    app.replaceChildren(
      h('header', { class: 'topbar' }, h('span', { class: 'brand', text: 'Codebook' }), themeButton()),
      h('main', { class: 'stage' },
        h('section', { class: 'panel', role: 'alert', 'aria-labelledby': 'err-title' },
          h('div', { class: 'ph' }, icon(I.warn22),
            h('div', null, h('h1', { id: 'err-title', text: err.title }), h('p', { text: err.subtitle }))),
          h('div', { class: 'pb' },
            err.message ? h('p', { class: 'msg', text: err.message }) : null,
            err.items.map((it) => h('div', { class: 'miss' },
              h('span', { class: 'tag', text: it.tag }), h('code', { text: it.code }),
              it.text ? h('span', { style: 'color:var(--tx2)', text: it.text }) : null)),
            err.files.length ? h('dl', { class: 'files' }, err.files.map((f) => [
              h('dt', { text: f.label }), h('dd', null, h('code', { text: f.value }), f.note ? ' ' + f.note : '')])) : null,
            fixParts.length ? h('p', { class: 'fix' }, h('b', { text: 'To fix:' }), ' ', fixParts) : null),
          h('div', { class: 'pf' },
            h('button', { class: 'btn primary', type: 'button', onclick: () => { app.querySelector('.stage .panel').setAttribute('aria-busy', 'true'); init(); } }, 'Reload'),
            h('button', { class: 'btn', type: 'button', onclick: async () => {
              try { await navigator.clipboard.writeText(err.details); note.textContent = 'Copied to clipboard'; } catch { note.textContent = 'Copy failed — select the text above instead'; }
            } }, 'Copy error details'),
            note))));
  }

  function themeButton() {
    const b = h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Toggle dark mode', title: 'Light / dark' });
    const paint = () => { b.innerHTML = dark ? I.sun : I.moon; b.setAttribute('aria-pressed', String(dark)); };
    paint();
    b.addEventListener('click', () => {
      dark = !dark;
      try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch { /* private mode */ }
      applyRootClasses();
      paint();
    });
    return b;
  }

  // ---------- coding screen: static frame
  function renderShell() {
    const m = S.model;
    R = {};
    R.prevTop = h('button', { class: 'btn', type: 'button', title: 'Previous row (Alt+←)', onclick: () => goPrev() }, icon(I.left), 'Prev');
    R.nextTop = h('button', { class: 'btn', type: 'button', title: 'Next row (Alt+→)', onclick: () => goNext() }, 'Next', icon(I.right));
    R.jump = h('input', { type: 'text', placeholder: 'Row # or r_id', autocomplete: 'off', spellcheck: 'false' });
    R.jump.addEventListener('keydown', onJumpKey);
    R.jump.addEventListener('input', () => { R.jump.removeAttribute('aria-invalid'); R.jump.removeAttribute('title'); });
    R.sw = h('button', { class: 'sw', type: 'button', role: 'switch', 'aria-checked': String(S.onlyUncoded), onclick: toggleOnlyUncoded },
      h('span', { class: 'track' }), 'Only uncoded rows');
    R.prog = h('span', { class: 'prog' });
    R.save = h('span', { class: 'save ok', role: 'status' });
    R.progress = h('i');
    R.aboutBtn = m.description ? h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'About this codebook', title: 'About this codebook', 'aria-expanded': 'false', html: I.book, onclick: () => toggleAbout() }) : null;

    const topbar = h('header', { class: 'topbar' },
      h('div', { class: 'tg' },
        h('span', { class: 'brand', text: 'Codebook' }),
        h('span', { class: 'vsep' }),
        h('span', { class: 'tg', title: 'Dataset / section' + (m.sectionTitle ? ': ' + m.sectionTitle : '') },
          h('span', { class: 'lbl', text: 'Dataset' }), h('span', { class: 'chipd mono', text: m.dataset })),
        m.coder ? h('span', { class: 'tg', title: 'Coder' }, h('span', { class: 'lbl', text: 'Coder' }), h('span', { style: 'font-weight:600', text: m.coder })) : null),
      h('div', { class: 'tg' },
        R.prevTop,
        h('label', { class: 'jump' }, h('span', { class: 'sr', text: `Jump to row index or ${m.idColumn}` }), R.jump),
        R.nextTop,
        R.sw),
      h('div', { class: 'tg' }, R.prog, R.save, R.aboutBtn, themeButton()),
      h('div', { class: 'progress', 'aria-hidden': 'true' }, R.progress));

    R.banners = h('div', { class: 'banners' });
    R.left = h('section', { class: 'pane left', 'aria-label': 'Record' });
    R.scroll = h('div', { class: 'scroll' });
    R.sheetBtn = h('button', { class: 'btn', type: 'button', 'aria-expanded': 'false', title: 'Keyboard shortcuts (?)', onclick: () => toggleSheet() },
      h('span', { class: 'k', style: 'border-color:transparent;background:transparent;font-size:13px;font-weight:700;min-width:0;padding:0', text: '?' }), 'Shortcuts');
    R.prevFoot = h('button', { class: 'btn', type: 'button', title: 'Previous row', onclick: () => goPrev() }, icon(I.left), 'Previous');
    R.sheetSlot = h('div');
    const foot = h('footer', { class: 'foot' },
      R.sheetBtn,
      h('div', { class: 'r' },
        R.prevFoot,
        h('button', { class: 'btn', type: 'button', onclick: () => saveNow() }, 'Save ', h('kbd', { text: 'Ctrl S' })),
        R.saveNext = h('button', { class: 'btn primary', type: 'button', onclick: () => saveAndNext() }, 'Save & Next ', h('kbd', { text: 'Ctrl ↵' }))),
      R.sheetSlot);
    R.aboutSlot = h('div');

    app.replaceChildren(topbar, R.banners,
      h('div', { class: 'main' }, R.left, h('section', { class: 'right', 'aria-label': 'Coding form' }, R.scroll, foot)),
      R.aboutSlot);
    renderSheet();
    renderAbout();
  }

  // ---------- one row
  function renderRow() {
    const m = S.model;
    const row = cur();
    R.fields = {};
    R.groupCounts = [];

    // left pane
    R.status = h('span', { class: 'status' });
    const multi = m.text.length > 1;
    const rec = h('div', { class: 'rec' },
      h('div', { class: 'rec-head' }, h('h1', { class: 'rowid', text: row.id }), R.status),
      m.meta.length ? h('ul', { class: 'meta mono', 'aria-label': 'Row metadata' },
        m.meta.map((c) => h('li', null, h('span', { class: 'k', text: c }), h('span', { class: 'v', text: row.meta[c] === '' ? '—' : row.meta[c] })))) : null,
      m.text.map((t) => textBlock(t, row.text[t.column] || '', multi)));
    R.left.replaceChildren(rec);
    R.left.scrollTop = 0;

    // right pane
    const groups = m.groups.map((g, gi) => {
      const cnt = h('span', { class: 'cnt' });
      R.groupCounts[gi] = { el: cnt, fields: g.fields.filter((f) => f.constrained) };
      return h('div', { class: 'grp' },
        h('div', { class: 'grp-h' }, h('h2', { text: g.title }), g.range ? h('span', { class: 'rng mono', text: g.range }) : null, cnt),
        g.fields.map(fieldRow));
    });
    const notes = m.notes.length ? h('div', { class: 'grp' },
      h('div', { class: 'grp-h' }, h('h2', { text: 'Notes' })),
      m.notes.map((n) => {
        const id = 'note-' + n.code;
        const ta = h('textarea', { id, rows: n.rows, placeholder: n.placeholder || null });
        ta.value = S.draft[n.code] || '';
        ta.addEventListener('input', () => { S.draft[n.code] = ta.value; updateSummary(); });
        return h('div', { class: 'note' },
          h('label', { for: id }, h('span', { class: 'hint', text: n.label }), h('code', { class: 'code', text: n.code })), ta);
      })) : null;
    R.scroll.replaceChildren(...groups, notes);
    R.scroll.scrollTop = 0;

    for (const f of valueFields()) updateField(f);
    updateSummary();
    renderBanners();
    history.replaceState(null, '', '#' + encodeURIComponent(row.id));
  }

  function textBlock(t, value, multi) {
    const article = h('article', { class: 'md' + (t.collapsed ? ' sm' : ''), 'aria-label': t.label + ' text' });
    if (!value.trim()) article.append(h('p', { class: 'empty', text: '(empty)' }));
    else if (t.markdown) article.innerHTML = md(value);
    else article.append(h('div', { class: 'plain', text: value }));
    if (!t.collapsed) return [multi ? h('div', { class: 'plabel', text: t.label }) : null, article];

    const open = S.textOpen.has(t.column);
    const hr = h('span', { class: 'hr', text: open ? 'Click to collapse' : 'Collapsed' });
    const body = h('div', { class: 'instr-b', id: 'tx-' + t.column }, article);
    body.hidden = !open;
    const btn = h('button', { class: 'instr-h', type: 'button', 'aria-expanded': String(open), 'aria-controls': body.id },
      icon(I.chev), t.label, hr);
    btn.addEventListener('click', () => {
      const now = !S.textOpen.has(t.column);
      if (now) S.textOpen.add(t.column); else S.textOpen.delete(t.column);
      btn.setAttribute('aria-expanded', String(now));
      body.hidden = !now;
      hr.textContent = now ? 'Click to collapse' : 'Collapsed';
    });
    return h('div', { class: 'instr' }, btn, body);
  }

  function fieldRow(f) {
    const ref = { f };
    R.fields[f.code] = ref;
    ref.st = h('span', { class: 'st' });
    const hasHelp = !!(f.help.def || f.help.inc || f.help.exc);
    const helpId = 'help-' + f.code;
    ref.helpBtn = hasHelp ? h('button', { class: 'iconbtn sm', type: 'button', 'aria-expanded': 'false', 'aria-controls': helpId,
      'aria-label': `Definition and examples for ${f.code}`, html: I.info, onclick: () => toggleHelp(f) }) : null;

    let control;
    if (f.widget === 'buttons') {
      ref.opts = f.values.map((v, i) => h('button', { class: 'opt', type: 'button', 'aria-pressed': 'false',
        onclick: () => setValue(f, S.draft[f.code] === v ? '' : v) }, h('span', { text: v }), i < 9 ? h('kbd', { text: String(i + 1) }) : null));
      control = h('div', { class: 'seg', role: 'group', 'aria-label': f.code }, ref.opts);
    } else if (f.widget === 'dropdown') {
      ref.select = h('select', { class: 'sel', 'aria-label': f.code },
        h('option', { value: '', text: '— choose —' }), f.values.map((v) => h('option', { value: v, text: v })));
      ref.select.addEventListener('change', () => setValue(f, ref.select.value));
      control = ref.select;
    } else if (f.widget === 'text') {
      ref.input = h('input', { class: 'sel', type: 'text', 'aria-label': f.code, placeholder: f.placeholder || null });
      ref.input.value = S.draft[f.code] || '';
      ref.input.addEventListener('input', () => { S.draft[f.code] = ref.input.value; updateSummary(); });
      control = ref.input;
    } else {
      control = h('span');
    }
    let below = null;
    if (f.widget === 'textarea') {
      ref.input = h('textarea', { rows: f.rows, 'aria-label': f.code, placeholder: f.placeholder || null });
      ref.input.value = S.draft[f.code] || '';
      ref.input.addEventListener('input', () => { S.draft[f.code] = ref.input.value; updateSummary(); });
      below = h('div', { class: 'note inline' }, ref.input);
    }

    ref.invSlot = h('div');
    ref.help = hasHelp ? h('div', { class: 'help', id: helpId },
      f.help.def ? h('p', null, h('b', { text: 'Definition.' }), ' ', h('span', { html: md(f.help.def, true) })) : null,
      f.help.inc ? h('p', null, h('b', { text: 'Include:' }), ' ', h('span', { html: md(f.help.inc, true) })) : null,
      f.help.exc ? h('p', null, h('b', { text: 'Exclude:' }), ' ', h('span', { html: md(f.help.exc, true) })) : null) : null;
    if (ref.help) ref.help.hidden = !S.helpOpen.has(f.code);
    if (ref.helpBtn) ref.helpBtn.setAttribute('aria-expanded', String(S.helpOpen.has(f.code)));

    ref.el = h('div', { class: 'frow', tabindex: '-1', 'data-code': f.code },
      h('div', { class: 'row' },
        ref.st,
        h('div', { class: 'lab' }, h('span', { class: 'hint', text: f.label }), h('code', { class: 'code', text: f.code })),
        h('span', { class: 'ib' }, ref.helpBtn),
        control),
      below, ref.invSlot, ref.help);
    return ref.el;
  }

  function updateField(f) {
    const ref = R.fields[f.code];
    if (!ref) return;
    const v = S.draft[f.code] || '';
    const st = fieldState(f, v);
    ref.el.className = 'frow' + (st === 'coded' ? ' is-coded' : st === 'invalid' ? ' is-invalid' : st === 'empty' ? ' is-empty' : '');
    ref.st.innerHTML = st === 'coded' ? I.stCoded : st === 'invalid' ? I.stInvalid : st === 'empty' ? I.stEmpty : '';
    if (ref.opts) ref.opts.forEach((b, i) => {
      const on = f.values[i] === v;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (ref.select) ref.select.value = st === 'coded' ? v : '';
    if (st === 'invalid') {
      ref.invSlot.replaceChildren(h('div', { class: 'inv' },
        h('span', { text: `invalid value: '${v}'` }),
        h('span', { style: 'font-weight:400', text: 'Pick a value to replace it, or' }),
        h('button', { class: 'btn sm', type: 'button', onclick: () => { setValue(f, ''); focusField(ref.el); } }, 'Clear value')));
    } else {
      ref.invSlot.replaceChildren();
    }
  }

  function setValue(f, v) {
    S.draft[f.code] = v;
    updateField(f);
    updateSummary();
  }

  function toggleHelp(f) {
    const ref = R.fields[f.code];
    const open = !S.helpOpen.has(f.code);
    if (open) S.helpOpen.add(f.code); else S.helpOpen.delete(f.code);
    ref.help.hidden = !open;
    ref.helpBtn.setAttribute('aria-expanded', String(open));
  }

  // Everything that depends on counts / dirtiness: status pill, group counts, top bar, buttons.
  function updateSummary() {
    const c = rowCounts(S.draft);
    R.status.className = 'status' + (c.done === 0 ? '' : c.done === c.total ? ' st-full' : ' st-part');
    R.status.textContent = c.done === 0 ? 'Uncoded' : c.done === c.total ? 'Fully coded' : `Partially coded · ${c.done}/${c.total}`;
    for (const g of R.groupCounts) {
      if (!g.fields.length) { g.el.textContent = ''; continue; }
      const d = g.fields.filter((f) => fieldState(f, S.draft[f.code]) === 'coded').length;
      g.el.textContent = `${d}/${g.fields.length} coded`;
    }
    const coded = S.rows.filter((_, i) => isFull(i)).length;
    R.prog.replaceChildren('Row ', h('b', { text: String(S.idx + 1) }), ` of ${S.rows.length} · `, h('b', { text: String(coded) }), ' coded');
    R.progress.style.width = (S.rows.length ? (100 * coded) / S.rows.length : 0).toFixed(2) + '%';

    const dirty = isDirty();
    const kind = S.failed ? 'fail' : dirty ? 'dirty' : 'ok';
    R.save.className = 'save ' + kind;
    R.save.replaceChildren(
      kind === 'ok' ? icon(I.check) : kind === 'dirty' ? h('span', { class: 'dot', 'aria-hidden': 'true' }) : icon(I.warn14),
      kind === 'ok' ? 'Saved' : kind === 'dirty' ? 'Unsaved changes' : 'Not saved');

    const noPrev = nextIndex(S.idx, -1) < 0;
    R.prevTop.disabled = noPrev;
    R.prevFoot.disabled = noPrev;
  }

  // ---------- banners
  function renderBanners() {
    const b = S.banner;
    if (!b) { R.banners.replaceChildren(); return; }
    if (b.kind === 'err') {
      R.banners.replaceChildren(h('div', { class: 'banner err', role: 'alert' },
        icon(I.warn16),
        h('span', null, h('strong', null, 'Could not write ', h('span', { class: 'mono', text: b.file }), '.'), ` ${b.message} Your answers for ${b.rowId} are still in this tab.`),
        h('span', { class: 'sp' }),
        h('button', { class: 'btn sm', type: 'button', onclick: () => saveNow() }, 'Retry save'),
        h('button', { class: 'btn sm', type: 'button', onclick: dismissBanner }, 'Dismiss')));
    } else {
      const n = notFullCount();
      const jump = n ? h('button', { class: 'btn sm primary', type: 'button', onclick: async () => {
        dismissBanner();
        const i = firstNotFull();
        if (i >= 0) await goTo(i);
      } }, 'Jump to first uncoded') : null;
      R.banners.replaceChildren(h('div', { class: 'banner info', role: 'status' },
        icon(I.info16),
        n ? h('span', null, h('strong', { text: 'All rows reached.' }), ` ${n} uncoded ${n === 1 ? 'row remains' : 'rows remain'}.`)
          : h('span', null, h('strong', { text: 'All rows are coded.' })),
        h('span', { class: 'sp' }),
        jump,
        h('button', { class: 'btn sm', type: 'button', onclick: dismissBanner }, 'Dismiss')));
      (jump || R.banners.querySelector('button')).focus();
    }
  }
  function dismissBanner() { S.banner = null; renderBanners(); }

  // ---------- saving & navigation
  async function postSave() {
    const row = cur();
    const rowIdx = S.idx;
    const changes = {};
    for (const c of editable()) if ((S.draft[c] || '') !== (row.values[c] || '')) changes[c] = S.draft[c] || '';
    const sent = { ...S.draft };
    let res, body;
    try {
      res = await fetch('api/rows/' + encodeURIComponent(row.id), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ changes }),
      });
      body = await res.json().catch(() => ({}));
    } catch (e) {
      return { ok: false, message: 'Could not reach the Codebook server — is it still running?', file: S.model.dataFile, rowId: row.id };
    }
    if (!res.ok) return { ok: false, message: body.error || `Server error ${res.status}.`, file: body.file || S.model.dataFile, rowId: row.id };
    row.values = body.values;
    // Keep edits made while the request was in flight.
    if (S.idx === rowIdx) {
      for (const c of editable()) if ((S.draft[c] || '') === (sent[c] || '')) S.draft[c] = body.values[c] || '';
    }
    return { ok: true };
  }

  async function saveNow() {
    if (S.saving) await S.saving;
    S.saving = postSave();
    const r = await S.saving;
    S.saving = null;
    if (r.ok) {
      S.failed = false;
      if (S.banner && S.banner.kind === 'err') S.banner = null;
    } else {
      S.failed = true;
      S.banner = { kind: 'err', message: r.message, file: r.file, rowId: r.rowId };
    }
    renderBanners();
    updateSummary();
    return r.ok;
  }

  // Silent save before leaving a row; navigation is cancelled if it fails.
  async function saveIfDirty() {
    if (!isDirty()) return true;
    return saveNow();
  }

  async function goTo(i) {
    if (i < 0 || i >= S.rows.length) return false;
    if (!(await saveIfDirty())) return false;
    S.idx = i;
    S.draft = { ...cur().values };
    S.failed = false;
    if (S.banner && S.banner.kind === 'err') S.banner = null;
    renderRow();
    return true;
  }

  async function goPrev() {
    const i = nextIndex(S.idx, -1);
    if (i >= 0) await goTo(i);
  }

  async function goNext() {
    if (!(await saveIfDirty())) return;
    const i = nextIndex(S.idx, 1);
    if (i < 0) { S.banner = { kind: 'last' }; renderBanners(); return; }
    await goTo(i);
  }

  async function saveAndNext() {
    if (!(await saveNow())) return;
    await goNext();
    focusFirstField();
  }

  function toggleOnlyUncoded() {
    S.onlyUncoded = !S.onlyUncoded;
    R.sw.setAttribute('aria-checked', String(S.onlyUncoded));
    updateSummary();
  }

  async function onJumpKey(e) {
    if (e.key === 'Escape') { R.jump.value = ''; R.jump.blur(); return; }
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const q = R.jump.value.trim();
    if (!q) return;
    let i = S.rows.findIndex((r) => r.id === q);
    if (i < 0) i = S.rows.findIndex((r) => r.id.toLowerCase() === q.toLowerCase());
    if (i < 0 && /^\d+$/.test(q) && +q >= 1 && +q <= S.rows.length) i = +q - 1;
    if (i < 0) {
      R.jump.setAttribute('aria-invalid', 'true');
      R.jump.title = `No row "${q}" (1–${S.rows.length} or a ${S.model.idColumn})`;
      return;
    }
    if (await goTo(i)) { R.jump.value = ''; focusFirstField(); }
  }

  // ---------- focus helpers
  function focusField(frow) {
    if (!frow) return;
    const target = frow.querySelector('.opt.on') || frow.querySelector('.opt') || frow.querySelector('input, textarea');
    (target || frow).focus();
    frow.scrollIntoView({ block: 'nearest' });
  }
  function focusFirstField() { focusField(R.scroll.querySelector('.frow')); }
  function moveFocus(fromRow, dir) {
    const rows = [...R.scroll.querySelectorAll('.frow')];
    if (!rows.length) return;
    const i = fromRow ? rows.indexOf(fromRow) : -1;
    const j = i < 0 ? (dir > 0 ? 0 : rows.length - 1) : i + dir;
    if (j >= 0 && j < rows.length) focusField(rows[j]);
    else if (j >= rows.length) R.saveNext.focus();
  }

  // ---------- popovers
  function renderSheet() {
    R.sheetBtn.setAttribute('aria-expanded', String(S.sheetOpen));
    if (!S.sheetOpen) { R.sheetSlot.replaceChildren(); return; }
    const k = (...keys) => keys.map((x) => h('span', { class: 'k', text: x }));
    R.sheetSlot.replaceChildren(h('div', { class: 'sheet', role: 'dialog', 'aria-label': 'Keyboard shortcuts' },
      h('div', { class: 'sheet-h' }, h('h3', { text: 'Keyboard shortcuts' }),
        h('button', { class: 'iconbtn sm', type: 'button', 'aria-label': 'Close shortcuts', html: I.close, onclick: () => toggleSheet(false) })),
      h('dl', null,
        h('dt', { text: 'Choose option in focused field' }), h('dd', null, k('1', '2', '3')),
        h('dt', { text: 'Clear focused field' }), h('dd', null, k('0', '⌫')),
        h('dt', { text: 'Previous / next field' }), h('dd', null, k('↑', '↓')),
        h('dt', { text: 'Save' }), h('dd', null, k('Ctrl', 'S')),
        h('dt', { text: 'Save & Next' }), h('dd', null, k('Ctrl', '↵')),
        h('dt', { text: 'Previous / next row' }), h('dd', null, k('Alt', '←', '→')),
        h('dt', { text: 'Jump to row' }), h('dd', null, k('/')),
        h('dt', { text: 'Show this sheet' }), h('dd', null, k('?')))));
  }
  function toggleSheet(force) {
    S.sheetOpen = force === undefined ? !S.sheetOpen : force;
    renderSheet();
  }

  function renderAbout() {
    if (!R.aboutBtn) return;
    R.aboutBtn.setAttribute('aria-expanded', String(S.aboutOpen));
    if (!S.aboutOpen) { R.aboutSlot.replaceChildren(); return; }
    const m = S.model;
    const art = h('article', { class: 'md sm' });
    art.innerHTML = md(m.description);
    R.aboutSlot.replaceChildren(h('div', { class: 'sheet about', role: 'dialog', 'aria-label': 'About this codebook' },
      h('div', { class: 'sheet-h' }, h('h3', { text: 'About this codebook' }),
        h('button', { class: 'iconbtn sm', type: 'button', 'aria-label': 'Close', html: I.close, onclick: () => toggleAbout(false) })),
      art,
      h('dl', { class: 'files' },
        h('dt', { text: 'Section' }), h('dd', null, h('code', { text: m.dataset }), m.sectionTitle ? ' — ' + m.sectionTitle : ''),
        m.unit ? [h('dt', { text: 'Unit' }), h('dd', { text: m.unit })] : null,
        h('dt', { text: 'Codebook' }), h('dd', null, h('code', { text: m.codebookFile })),
        h('dt', { text: 'Data file' }), h('dd', null, h('code', { text: m.dataFile })))));
  }
  function toggleAbout(force) {
    S.aboutOpen = force === undefined ? !S.aboutOpen : force;
    renderAbout();
  }

  // ---------- keyboard
  const isTyping = (el) => !!el && (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable
    || (el.tagName === 'INPUT' && !['button', 'checkbox', 'radio'].includes(el.type)));

  document.addEventListener('keydown', (e) => {
    if (!S.model || !R.scroll || !R.scroll.isConnected) return;
    const a = document.activeElement;
    const mod = e.ctrlKey || e.metaKey;

    if (mod && !e.altKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); saveNow(); return; }
    if (mod && e.key === 'Enter') { e.preventDefault(); saveAndNext(); return; }
    if (e.altKey && !mod && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      if (isTyping(a)) return;
      e.preventDefault();
      if (e.key === 'ArrowLeft') goPrev(); else goNext();
      return;
    }
    if (e.key === 'Escape') {
      if (S.sheetOpen) { toggleSheet(false); R.sheetBtn.focus(); return; }
      if (S.aboutOpen) { toggleAbout(false); R.aboutBtn.focus(); return; }
      return;
    }
    if (isTyping(a) || mod || e.altKey || e.isComposing) return;

    if (e.key === '/') { e.preventDefault(); R.jump.focus(); R.jump.select(); return; }
    if (e.key === '?') { e.preventDefault(); toggleSheet(); return; }

    const frow = a && a.closest ? a.closest('.right .frow') : null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!frow && a && a !== document.body && !R.scroll.contains(a)) return; // leave arrows alone elsewhere
      e.preventDefault();
      moveFocus(frow, e.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (!frow) return;
    const ref = R.fields[frow.dataset.code];
    if (!ref || !ref.f.constrained) return;
    const f = ref.f;
    if (/^[1-9]$/.test(e.key)) {
      const n = +e.key;
      if (n > f.values.length) return;
      e.preventDefault();
      setValue(f, f.values[n - 1]);
      if (S.model.autoAdvance) moveFocus(frow, 1); else focusField(frow);
    } else if (e.key === '0' || e.key === 'Backspace') {
      e.preventDefault();
      setValue(f, '');
      focusField(frow);
    }
  });

  // Close popovers on outside click.
  document.addEventListener('mousedown', (e) => {
    if (S.sheetOpen && !e.target.closest('.sheet') && !R.sheetBtn.contains(e.target)) toggleSheet(false);
    if (S.aboutOpen && !e.target.closest('.sheet.about') && !(R.aboutBtn && R.aboutBtn.contains(e.target))) toggleAbout(false);
  });

  window.addEventListener('beforeunload', (e) => {
    if (S.model && S.rows.length && R.scroll && R.scroll.isConnected && (isDirty() || S.failed)) { e.preventDefault(); e.returnValue = ''; }
  });

  init();
})();
