import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { REPORT_TEXT, reportText, writeWorklist, LANGS } from '../src/index.js';

const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join(' ');

test('report text: every phrase has all eight translations and keeps its placeholders', () => {
  for (const [name, cat] of Object.entries(REPORT_TEXT)) for (const [en, list] of Object.entries(cat)) {
    assert.equal(list.length, 8, `${name}: ${en}`);
    for (const s of list) { assert.ok(typeof s === 'string' && s.trim(), `${name}: ${en} has an empty translation`); if (name !== 'columns') assert.equal(ph(s), ph(en), `${name}: ${en} -> ${s}`); assert.doesNotMatch(s, /[<>]/, `${name}: ${en}`); }
  }
});

test('report text: dates and numbers in a heading are carried into the translation', () => {
  const de = reportText('de'), ja = reportText('ja');
  assert.equal(de.title('Warranty claims at 2026-11-16'), 'Garantieanträge, Stand 2026-11-16');
  assert.equal(de.title('Open repair orders at 2026-11-16 10:00'), 'Offene Werkstattaufträge, Stand 2026-11-16 10:00');
  assert.equal(ja.page('All rows (12)'), '全行（12）');
  assert.equal(ja.title('Contracts in transit at 2026-11-15'), '未入金のローン契約（2026-11-15 時点）');
});

test('report text: English is untouched, an unknown phrase or column stays English, a regional tag falls back to its language', () => {
  const en = reportText('en');
  assert.equal(en.english, true); assert.equal(en.title('Repair order margins'), 'Repair order margins'); assert.equal(en.column('invoice_number'), 'invoice number');
  const fr = reportText('fr-CA');
  assert.equal(fr.lang, 'fr'); assert.equal(fr.title('A report nobody translated'), 'A report nobody translated'); assert.equal(fr.column('some_new_column'), 'some new column');
  assert.equal(fr.column('lender'), 'Prêteur'); assert.equal(fr.column('deal_number'), 'N° de vente');
  assert.equal(reportText('xx').english, true);
  assert.equal(reportText('constructor').title('toString'), 'toString');
});

test('worklist: the page follows the language, the CSV does not, and a translated page says what is still English', () => {
  const real = (lang) => { const dir = mkdtempSync(join(tmpdir(), 'wl-')); const ctx = { lang, root: dir, outDir: () => dir, writeFile: (d, name, text) => { const f = join(d, name); writeFileSync(f, text); return f; } }; const w = writeWorklist(ctx, 'out', 'x', { title: 'Repair order margins', rows: [{ lender: 'Harbor <b>', amount: 5 }], columns: ['lender', 'amount'], sections: [{ title: 'By lender', rows: [], columns: ['lender'] }], limits: ['A limit.'] }); return { html: readFileSync(join(dir, 'x.html'), 'utf8'), csv: readFileSync(join(dir, 'x.csv'), 'utf8'), sha: w.output_sha256 }; };
  const en = real('en'), ko = real('ko');
  assert.equal(ko.csv, en.csv);
  assert.match(en.html, /<html lang="en"/); assert.match(en.html, /<h1>Repair order margins<\/h1>/); assert.match(en.html, /<th[^>]*>lender<\/th>/); assert.doesNotMatch(en.html, /translated by Claude/);
  assert.match(ko.html, /<html lang="ko"/); assert.match(ko.html, /<h1>수리 오더 마진<\/h1>/); assert.match(ko.html, /<h2>금융사별<\/h2>/); assert.match(ko.html, /<th[^>]*>금융사<\/th><th[^>]*>금액<\/th>/); assert.match(ko.html, /<h2>한계<\/h2>/);
  assert.match(ko.html, /Claude가 번역/); assert.match(ko.html, /Harbor &lt;b&gt;/); assert.match(ko.html, /A limit\./);
  for (const l of LANGS) assert.match(real(l).html, /<h1>/);
});
