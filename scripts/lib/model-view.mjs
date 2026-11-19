// What an AI model sees when it calls an agent's tools, worked out from the agent's own source
// fields and the core masker (fairdrive-core/src/pii.js) in its default mode, "mask".
// Used by agent-readmes.mjs (README section) and model-view.mjs (docs/model-view.md).
import { piiKindOf } from '../../packages/fairdrive-core/src/index.js';

const FREE = /description|reason|concern|stips|note|comment|^item$|^work$|document|remarks/;
const KIND_LABEL = { name: 'customer name', staff: 'staff name', phone: 'phone', email: 'e-mail', address: 'address', ssn: 'SSN', dob: 'date of birth', license: 'licence number', account: 'account or customer number' };

export function modelView(manifest) {
  const seen = new Set(); const v = { masked: [], vin: [], dates: [], amounts: [], free_text: [], clear: [] };
  for (const s of Object.values(manifest.sources || {})) for (const [f, fd] of Object.entries(s.fields || {})) {
    if (seen.has(f)) continue; seen.add(f);
    const kind = (fd && fd.pii === 'name' ? 'name' : fd && fd.pii) || piiKindOf(f, 'mask');
    if (kind) v.masked.push({ field: f, kind, label: KIND_LABEL[kind] || kind });
    else if (/vin/.test(f)) v.vin.push(f);
    else if (fd && fd.type === 'date') v.dates.push(f);
    else if (fd && ['money', 'number', 'integer', 'percent'].includes(fd.type)) v.amounts.push(f);
    else if (FREE.test(f)) v.free_text.push(f);
    else v.clear.push(f);
  }
  return v;
}

const code = (l) => l.map((x) => `\`${x}\``).join(', ');

/** README section body (markdown lines) for one agent. */
export function modelViewLines(manifest) {
  const v = modelView(manifest); const L = [];
  L.push(v.masked.length
    ? `- **Masked** (stable pseudonyms such as \`CU-3f2a9c1d\` and \`ST-8cea1a2d\`, or \`[PHONE]\`-style placeholders): ${v.masked.map((m) => `${m.label} (\`${m.field}\`)`).join(', ')}. Where these values appear inside other text they are replaced too.`
    : '- **Masked:** this agent reads no customer or staff column. Anything that looks like a phone number, e-mail or SSN is still replaced in every result.');
  const clear = [v.clear.length && `ids, codes and names of businesses (${code(v.clear)})`, v.vin.length && `VINs (${code(v.vin)}; pseudonymised with \`--pii strict\`)`, v.dates.length && `dates (${code(v.dates)})`, v.amounts.length && `amounts and counts (${code(v.amounts)})`].filter(Boolean);
  if (clear.length) L.push(`- **Sent as they are:** ${clear.join('; ')}.`);
  if (v.free_text.length) L.push(`- **Free text sent as written** (known names, phone numbers, e-mails and SSN-like numbers inside it are replaced; anything else typed there is not): ${code(v.free_text)}.`);
  L.push('- Results go to whatever model your AI assistant uses. For data you may not share with that provider, use a local model or one covered by your agreements with it. The CSV and HTML files written on your machine keep the real values for the people working the list: keep them in a secure folder.');
  return L;
}
