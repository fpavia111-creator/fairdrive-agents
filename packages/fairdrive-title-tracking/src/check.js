// Title and registration tracking for delivered deals. Pure functions.
import { str, normId, isoDate, daysBetween, asOfDate, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const DEAL_FIELDS = Object.freeze({
  deal_number: t(['Deal No', 'Deal Number', 'Deal #', 'Deal ID'], { required: true }),
  customer: t(['Customer', 'Customer Name', 'Buyer'], { pii: 'name' }),
  vin: t(['VIN', 'Vehicle VIN']),
  delivery_date: t(['Delivery Date', 'Delivered', 'Sold Date', 'Deal Date'], { type: 'date', required: true }),
  state: t(['State', 'Registration State', 'Title State']),
  trade_vin: t(['Trade VIN', 'Trade 1 VIN', 'Trade-In VIN']),
  trade_title_received: t(['Trade Title Received', 'Title In', 'Trade Title Date'], { type: 'date' }),
  title_application_sent: t(['Title Application Sent', 'Title App Sent', 'Sent to DMV', 'Submitted to Tag Agency'], { type: 'date' }),
  registration_issued: t(['Registration Issued', 'Plates Issued', 'Registration Date', 'Title Issued'], { type: 'date' }),
  temp_tag_expires: t(['Temp Tag Expires', 'Temporary Tag Expiration', 'Temp Tag Exp'], { type: 'date' }),
});

/** Check every delivered deal's title and registration against the days set. */
export function trackTitles(deals, { asOf, submitDays = 30, tradeTitleDays = 15, tagWarningDays = 7, registrationDays = 45 } = {}) {
  const today = asOfDate(asOf);
  const seen = new Set(); const items = []; let deals_ = 0;
  for (const d of [...deals].filter((x) => normId(x.deal_number) && isoDate(x.delivery_date)).sort(by('delivery_date', 'deal_number'))) {
    const id = normId(d.deal_number); if (seen.has(id)) continue; seen.add(id); deals_++;
    const delivered = isoDate(d.delivery_date); const days = daysBetween(delivered, today);
    const sent = isoDate(d.title_application_sent), reg = isoDate(d.registration_issued), tag = isoDate(d.temp_tag_expires), tradeIn = isoDate(d.trade_title_received);
    const findings = []; const why = [];
    if (!sent && days > submitDays) { findings.push('application_late'); why.push(`Delivered ${days} days ago; no title application sent (your limit: ${submitDays} days).`); }
    else if (!sent && submitDays - days <= 7) { findings.push('application_due_soon'); why.push(`Title application due within ${submitDays - days} day(s).`); }
    if (str(d.trade_vin) && !tradeIn && days > tradeTitleDays) { findings.push('trade_title_missing'); why.push(`Trade-in title not received ${days} days after delivery.`); }
    if (!reg && tag) {
      const left = daysBetween(today, tag);
      if (left < 0) { findings.push('temp_tag_expired'); why.push(`Temporary tag expired ${-left} day(s) ago and no registration is recorded.`); }
      else if (left <= tagWarningDays) { findings.push('temp_tag_expiring'); why.push(`Temporary tag expires in ${left} day(s).`); }
    }
    if (sent && !reg && daysBetween(sent, today) > registrationDays) { findings.push('registration_pending'); why.push(`Application sent ${daysBetween(sent, today)} days ago and no registration is recorded.`); }
    if (findings.length) items.push({ deal_number: str(d.deal_number), customer: str(d.customer), vin: str(d.vin), state: str(d.state), delivery_date: delivered, days_since_delivery: days, title_application_sent: sent, registration_issued: reg, temp_tag_expires: tag, trade_vin: str(d.trade_vin), trade_title_received: tradeIn, findings, why: why.join(' ') });
  }
  items.sort(by('-days_since_delivery', 'deal_number'));
  const n = (f) => items.filter((i) => i.findings.includes(f)).length;
  return { as_of: today, deals: deals_, needing_action: items.length, application_late: n('application_late'), application_due_soon: n('application_due_soon'), trade_title_missing: n('trade_title_missing'), temp_tag_expired: n('temp_tag_expired'), temp_tag_expiring: n('temp_tag_expiring'), registration_pending: n('registration_pending'), settings: { submit_days: submitDays, trade_title_days: tradeTitleDays, tag_warning_days: tagWarningDays, registration_days: registrationDays }, items };
}

export const line = (r) => `${r.deals} delivered deal(s), ${r.needing_action} needing action: ${r.application_late} title application(s) late, ${r.application_due_soon} due within a week, ${r.trade_title_missing} trade title(s) missing, ${r.temp_tag_expired} temporary tag(s) expired and ${r.temp_tag_expiring} expiring, ${r.registration_pending} registration(s) pending too long.`;
