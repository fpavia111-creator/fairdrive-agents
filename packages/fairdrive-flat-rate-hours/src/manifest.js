import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { FLAG_FIELDS, CLOCK_FIELDS, checkFlatRate, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  flags: { type: 'string', description: 'Technician flag report under --root (CSV, Excel or JSON) from the DMS or shop system: technician, RO number, date, labor type, flagged hours, actual hours punched on the job' },
  clock: { type: 'string', description: 'Attendance clock: technician, date, hours clocked in' },
  floor_pct: { type: 'number', minimum: 1, maximum: 300, description: 'Proficiency (flagged over clocked) below this percent is flagged (default 85)' },
  ratio: { type: 'number', minimum: 1.5, maximum: 20, description: 'A job flagged at this many times the time punched or more is flagged (default 3)' },
};
const run = (a, ctx) => checkFlatRate(ctx.records(a.flags), ctx.records(a.clock), { floorPct: a.floor_pct ?? 85, ratio: a.ratio ?? 3 });

export const manifest = checkAgent({
  name: 'fairdrive-flat-rate-hours', version: pkg.version, prefix: 'flatrate',
  description: 'Compares each technician\'s flagged (sold) hours with attendance hours clocked and the time punched on repair orders, works out proficiency, efficiency and productivity, and lists technicians under your proficiency floor, jobs flagged with no time punched, jobs flagged far above the time punched and days with flags but no clock-in. It never changes hours, flags or payroll.',
  sources: { flags: { label: 'Technician flag report', args: ['flags'], fields: FLAG_FIELDS }, clock: { label: 'Attendance clock', args: ['clock'], fields: CLOCK_FIELDS } },
  args, required: ['flags', 'clock'], run, line,
  scan: { name: 'flatrate_check', title: 'Check flagged hours against clocked hours', description: 'Findings (flagged_no_time, flag_far_above_time, flags_without_clock, below_proficiency_floor) and one row per technician: hours clocked, flagged and punched, proficiency, efficiency, productivity.' },
  report: { base: 'flat-rate-hours', what: 'flat-rate report', title: 'Flagged hours against clocked hours', columns: ['finding', 'technician', 'ro_number', 'date', 'labor_type', 'flag_hours', 'actual_hours', 'why'],
    sections: (r) => [{ title: 'By technician', rows: r.by_technician, columns: ['technician', 'attendance_hours', 'flagged_hours', 'actual_hours', 'proficiency_pct', 'efficiency_pct', 'productivity_pct'] }],
    limits: [LIMITS.files, 'Proficiency is flagged over clocked hours; efficiency is flagged over time punched on jobs. Stores define these differently; the figures follow those definitions.', 'It points at hours to look at. It does not judge a technician, and pay is decided by a person under your pay plan and the law.'] },
  refused: [{ name: 'payroll_submit_hours', category: 'move_money', description: 'It never submits hours or pay to payroll.' }, { name: 'dms_edit_flag_hours', category: 'production_deploy', description: 'It never changes flagged hours, punches or repair orders.' }],
  prompt: { name: 'flat_rate_review', title: 'Review flat-rate hours', description: 'Walks the host model through a flat-rate review.', arguments: [{ name: 'flags', description: 'Flag report', required: true }, { name: 'clock', description: 'Attendance', required: true }],
    text: 'You are helping a service manager with fairdrive-flat-rate-hours. Flags: {{flags}}. Clock: {{clock}}.\n\nRules: it reads files and writes a report. It never changes hours or pay. It points at hours to look at; it does not judge anyone.\n\n1. Call flatrate_check. Give shop proficiency, then jobs flagged with no time and days with flags but no clock-in.\n2. Call flatrate_write_report.' },
});
