// Pure core. No I/O. Data comes from data/ap.json, built by scripts/build_data.py from the
// College Board score distribution files (2024 and 2025 PDFs, 2026 web page) and the
// College Board practice exam scoring worksheets. See DATA_SOURCES.md.
import { DATA } from './data.js';

export const AS_OF = '2026-11-02';
export const REPO = 'ap-score-distributions-mcp';
const SITE = 'https://examscorecalc.com';

export class InputError extends Error {}

export function more(path: string): string {
  return `${SITE}${path}?utm_source=mcp&utm_medium=${REPO}`;
}

type Score = '5' | '4' | '3' | '2' | '1';
const SCORES: Score[] = ['5', '4', '3', '2', '1'];
export interface ExamRow {
  exam: string; label_in_source: string; kind: 'exam' | 'subscore' | 'standard_group';
  counts: Record<Score, number> | null; total: number | null; percents: Record<Score, number>;
  three_plus: { count: number | null; percent: number }; mean: number | null; sd: number | null;
}
interface Year { source_url: string; source_title: string; fetched: string; data_kind: string; note: string | null; footnote: unknown; exams: ExamRow[] }
interface Worksheet {
  exam: string; source_url: string; document: string; exam_year_format: number;
  section_1_multiple_choice: { max_raw: number; multiplier: number };
  section_2_free_response: { question: number; max_raw: number; multiplier: number }[];
  composite_rule: string; conversion_chart: { ap_score: number; composite_min: number; composite_max: number }[]; notes: string[];
}
const D = DATA as unknown as { years: Record<string, Year>; worksheets: Worksheet[]; worksheet_caveat: string };
export const YEARS = Object.keys(D.years).sort();
export const LATEST = YEARS[YEARS.length - 1];
export const WORKSHEETS = D.worksheets;

// ---------- exam name matching ----------
const ALIAS: Record<string, string> = {
  apush: 'AP United States History', 'us history': 'AP United States History', 'u s history': 'AP United States History', ush: 'AP United States History',
  'us gov': 'AP United States Government and Politics', 'us government': 'AP United States Government and Politics', gov: 'AP United States Government and Politics', 'ap gov': 'AP United States Government and Politics', usgov: 'AP United States Government and Politics',
  'comp gov': 'AP Comparative Government and Politics', 'comparative government': 'AP Comparative Government and Politics',
  lang: 'AP English Language and Composition', 'english language': 'AP English Language and Composition', 'english lang': 'AP English Language and Composition', 'ap lang': 'AP English Language and Composition',
  lit: 'AP English Literature and Composition', 'english literature': 'AP English Literature and Composition', 'english lit': 'AP English Literature and Composition', 'ap lit': 'AP English Literature and Composition',
  bio: 'AP Biology', chem: 'AP Chemistry', stats: 'AP Statistics', stat: 'AP Statistics', psych: 'AP Psychology', apes: 'AP Environmental Science', 'environmental science': 'AP Environmental Science', enviro: 'AP Environmental Science',
  hug: 'AP Human Geography', aphg: 'AP Human Geography', 'human geo': 'AP Human Geography', euro: 'AP European History', apeuro: 'AP European History', 'european history': 'AP European History',
  world: 'AP World History: Modern', 'world history': 'AP World History: Modern', apwh: 'AP World History: Modern', whap: 'AP World History: Modern',
  macro: 'AP Macroeconomics', micro: 'AP Microeconomics', 'calc ab': 'AP Calculus AB', 'calculus ab': 'AP Calculus AB', 'calc bc': 'AP Calculus BC', 'calculus bc': 'AP Calculus BC',
  csa: 'AP Computer Science A', 'comp sci a': 'AP Computer Science A', 'computer science a': 'AP Computer Science A', csp: 'AP Computer Science Principles', 'comp sci principles': 'AP Computer Science Principles', 'computer science principles': 'AP Computer Science Principles',
  'physics 1': 'AP Physics 1: Algebra-Based', 'physics 2': 'AP Physics 2: Algebra-Based', 'physics c mechanics': 'AP Physics C: Mechanics', 'physics c mech': 'AP Physics C: Mechanics', 'physics c e&m': 'AP Physics C: Electricity and Magnetism', 'physics c em': 'AP Physics C: Electricity and Magnetism', 'physics c e m': 'AP Physics C: Electricity and Magnetism', 'e&m': 'AP Physics C: Electricity and Magnetism',
  precalc: 'AP Precalculus', precalculus: 'AP Precalculus', spanish: 'AP Spanish Language and Culture', 'spanish lang': 'AP Spanish Language and Culture', 'spanish lit': 'AP Spanish Literature and Culture', french: 'AP French Language and Culture', german: 'AP German Language and Culture', italian: 'AP Italian Language and Culture', japanese: 'AP Japanese Language and Culture', chinese: 'AP Chinese Language and Culture',
  afam: 'AP African American Studies', 'african american studies': 'AP African American Studies', seminar: 'AP Seminar', research: 'AP Research', 'art history': 'AP Art History', 'music theory': 'AP Music Theory', '2d art': 'AP 2-D Art and Design', '3d art': 'AP 3-D Art and Design', drawing: 'AP Drawing', latin: 'AP Latin',
};
const norm = (s: string) => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\bap\b/g, ' ').replace(/\s+/g, ' ').trim();
function trigrams(s: string): Set<string> {
  const p = `  ${s} `;
  const out = new Set<string>();
  for (let i = 0; i < p.length - 2; i++) out.add(p.slice(i, i + 3));
  return out;
}
function dice(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return (2 * n) / (a.size + b.size || 1);
}
export function allExamNames(includeSub = false): string[] {
  const s = new Set<string>();
  for (const y of YEARS) for (const e of D.years[y].exams) if (includeSub || e.kind === 'exam') s.add(e.exam);
  return [...s].sort();
}
export function findExam(q: string): string {
  const raw = String(q ?? '').trim();
  if (!raw) throw new InputError('exam is required, e.g. "AP Biology", "APUSH" or "Calc BC".');
  const names = allExamNames(true);
  const exact = names.find((n) => n.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;
  const nq = norm(raw);
  const al = ALIAS[raw.toLowerCase().replace(/^ap\s+/, '').trim()] ?? ALIAS[nq];
  if (al) return al;
  const normed = names.map((n) => ({ n, k: norm(n) }));
  const hit = normed.find((x) => x.k === nq);
  if (hit) return hit.n;
  const qg = trigrams(nq);
  const qt = nq.split(' ');
  const ranked = normed.map((x) => {
    const xt = x.k.split(' ');
    const cover = qt.filter((w) => xt.includes(w)).length / qt.length;
    return { n: x.n, s: 0.6 * cover + 0.4 * dice(qg, trigrams(x.k)) - (x.n.includes('(') || x.n.includes(':') && x.n.includes('Subscore') ? 0.05 : 0) };
  }).sort((a, b) => b.s - a.s);
  if (ranked[0].s < 0.5) throw new InputError(`No AP exam matched "${raw}". Closest: ${ranked.slice(0, 4).map((r) => r.n).join('; ')}. Call list_ap_exams for the full list.`);
  return ranked[0].n;
}
function yearOf(y: unknown): string {
  const s = y == null ? LATEST : String(y);
  if (!D.years[s]) throw new InputError(`year must be one of ${YEARS.join(', ')}. ${LATEST} is the latest College Board release (May ${LATEST} exams).`);
  return s;
}
function row(exam: string, year: string): ExamRow | null {
  return D.years[year].exams.find((e) => e.exam === exam) ?? null;
}
const slug: Record<string, string> = {
  'AP United States History': '/ap/ap-us-history/', 'AP English Language and Composition': '/ap/ap-english-language/', 'AP Calculus AB': '/ap/ap-calculus-ab/',
  'AP Calculus BC': '/ap/ap-calculus-bc/', 'AP Biology': '/ap/ap-biology/', 'AP Chemistry': '/ap/ap-chemistry/', 'AP Psychology': '/ap/ap-psychology/',
  'AP United States Government and Politics': '/ap/ap-us-government/', 'AP English Literature and Composition': '/ap/ap-english-literature/',
};
const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;
function srcFor(year: string) { return D.years[year].source_url; }
function kindNote(year: string): string {
  return D.years[year].data_kind?.includes('percent') || year === '2026'
    ? `${year} figures are the whole-number percentages College Board posted on its 2026 AP Score Distributions page; College Board has not published ${year} student counts, means or standard deviations.`
    : `${year} figures are counts and percentages from the College Board Student Score Distributions PDF for the May ${year} exams.`;
}

// ---------- get_ap_score_distribution ----------
export function getApScoreDistribution(i: Record<string, unknown>) {
  const exam = findExam(String(i.exam ?? ''));
  const year = yearOf(i.year);
  const r = row(exam, year);
  if (!r) throw new InputError(`${exam} has no ${year} row in the College Board release. Years with data: ${YEARS.filter((y) => row(exam, y)).join(', ') || 'none'}.`);
  const history = YEARS.map((y) => row(exam, y) && { year: Number(y), percent_5: row(exam, y)!.percents['5'], percent_3_plus: row(exam, y)!.three_plus.percent, mean: row(exam, y)!.mean, students: row(exam, y)!.total }).filter(Boolean);
  const p = r.percents;
  const summary = `${exam}, May ${year}: ${p['5']}% scored 5, ${p['4']}% 4, ${p['3']}% 3, ${p['2']}% 2, ${p['1']}% 1; ${r.three_plus.percent}% scored 3 or higher` +
    (r.total ? ` out of ${r.total.toLocaleString('en-US')} students (mean ${r.mean}, SD ${r.sd}).` : '.') + ` ${kindNote(year)}`;
  return {
    summary, exam, year: Number(year), kind: r.kind,
    percents: r.percents, counts: r.counts, total_students: r.total, three_plus: r.three_plus, mean: r.mean, sd: r.sd,
    history, as_of: AS_OF, source: srcFor(year), source_title: D.years[year].source_title,
    more: more(slug[exam] ?? '/ap-score-distributions/'),
  };
}

// ---------- estimate_ap_percentile ----------
export function estimateApPercentile(i: Record<string, unknown>) {
  const exam = findExam(String(i.exam ?? ''));
  const year = yearOf(i.year);
  const score = Number(i.score);
  if (![1, 2, 3, 4, 5].includes(score)) throw new InputError('score must be a whole AP score from 1 to 5.');
  const r = row(exam, year);
  if (!r) throw new InputError(`${exam} has no ${year} row. Try year ${YEARS.filter((y) => row(exam, y)).join(' or ')}.`);
  const useCounts = r.counts && r.total;
  const pct = (s: number) => (useCounts ? (r.counts![String(s) as Score] / r.total!) * 100 : r.percents[String(s) as Score]);
  let below = 0;
  for (let s = 1; s < score; s++) below += pct(s);
  const at = pct(score);
  const above = 100 - below - at;
  const mid = below + at / 2;
  const summary = `A ${score} on ${exam} (May ${year}): ${r2(below)}% of test takers scored lower, ${r2(at)}% scored ${score}, ${r2(Math.max(0, above))}% scored higher. ` +
    `Percentile rank (scoring lower plus half of those tied) is ${r1(mid)}. ` + (useCounts ? `Computed from College Board counts (${r.total!.toLocaleString('en-US')} students).` : `Computed from the whole-number percentages College Board posted for ${year}, so it can be off by about 1 point.`);
  return {
    summary, exam, year: Number(year), score,
    percent_scored_lower: r2(below), percent_scored_same: r2(at), percent_scored_higher: r2(Math.max(0, above)),
    percentile_rank_midpoint: r1(mid), percent_at_or_below: r2(below + at),
    basis: useCounts ? 'counts' : 'published_whole_percents',
    as_of: AS_OF, source: srcFor(year), more: more('/ap-score-distributions/'),
  };
}

// ---------- compare_ap_exams ----------
export function compareApExams(i: Record<string, unknown>) {
  const year = yearOf(i.year);
  const sortBy = String(i.sort_by ?? 'pass_rate');
  if (!['pass_rate', 'five_rate', 'mean', 'test_takers'].includes(sortBy)) throw new InputError('sort_by must be pass_rate, five_rate, mean or test_takers.');
  if ((sortBy === 'mean' || sortBy === 'test_takers') && !row('AP Biology', year)?.total) throw new InputError(`College Board has not published ${year} means or student counts. Use sort_by pass_rate or five_rate, or year ${YEARS.filter((y) => row('AP Biology', y)?.total).slice(-1)[0]}.`);
  const list = Array.isArray(i.exams) && (i.exams as unknown[]).length ? (i.exams as string[]).map(findExam) : allExamNames(false).filter((n) => row(n, year)?.kind === 'exam');
  const order = String(i.order ?? 'desc');
  const limit = Math.min(Math.max(Number(i.limit ?? 50), 1), 60);
  const rows = list.map((exam) => {
    const r = row(exam, year);
    if (!r) return { exam, missing: true };
    return { exam, pass_rate_3_plus: r.three_plus.percent, percent_5: r.percents['5'], percent_1: r.percents['1'], mean: r.mean, test_takers: r.total };
  });
  const val = (x: Record<string, unknown>) => Number(sortBy === 'pass_rate' ? x.pass_rate_3_plus : sortBy === 'five_rate' ? x.percent_5 : sortBy === 'mean' ? x.mean : x.test_takers);
  const ranked = rows.filter((x) => !('missing' in x)).sort((a, b) => (order === 'asc' ? val(a) - val(b) : val(b) - val(a)) || a.exam.localeCompare(b.exam)).slice(0, limit)
    .map((x, k) => ({ rank: k + 1, ...x }));
  const missing = rows.filter((x) => 'missing' in x).map((x) => x.exam);
  const label = sortBy === 'pass_rate' ? 'share scoring 3 or higher' : sortBy === 'five_rate' ? 'share scoring 5' : sortBy === 'mean' ? 'mean score' : 'test takers';
  const top = ranked.slice(0, 3).map((x) => `${x.exam} ${sortBy === 'pass_rate' ? `${x.pass_rate_3_plus}%` : sortBy === 'five_rate' ? `${x.percent_5}%` : sortBy === 'mean' ? x.mean : x.test_takers?.toLocaleString('en-US')}`).join('; ');
  const summary = `${ranked.length} AP exam${ranked.length === 1 ? '' : 's'} from May ${year} ranked by ${label} (${order === 'asc' ? 'lowest' : 'highest'} first). Top: ${top}.` +
    (missing.length ? ` No ${year} row for: ${missing.join(', ')}.` : '') + ` ${kindNote(year)} Pass rate reflects who takes the exam, not only its difficulty.`;
  return { summary, year: Number(year), sort_by: sortBy, order, exams: ranked, missing, as_of: AS_OF, source: srcFor(year), more: more('/ap-score-distributions/') };
}

// ---------- list_ap_exams ----------
export function listApExams(i: Record<string, unknown>) {
  const year = i.year == null ? null : yearOf(i.year);
  const ys = year ? [year] : YEARS;
  const names = allExamNames(true).filter((n) => ys.some((y) => row(n, y)));
  const exams = names.map((n) => ({
    exam: n, kind: row(n, ys.find((y) => row(n, y))!)!.kind, years: YEARS.filter((y) => row(n, y)).map(Number),
    composite_estimator: WORKSHEETS.some((w) => w.exam === n) ? WORKSHEETS.find((w) => w.exam === n)!.document : null,
  }));
  const summary = `${exams.filter((e) => e.kind === 'exam').length} AP exams with College Board score distributions for ${ys.join(', ')}` +
    `${exams.length > exams.filter((e) => e.kind === 'exam').length ? `, plus ${exams.length - exams.filter((e) => e.kind === 'exam').length} subscore and Standard Group rows` : ''}. ` +
    `Composite score estimates are available for ${WORKSHEETS.length} exams with a College Board scoring worksheet: ${WORKSHEETS.map((w) => w.exam.replace('AP ', '')).join(', ')}.`;
  return {
    summary, years_available: YEARS.map(Number), latest_year: Number(LATEST),
    year_sources: Object.fromEntries(YEARS.map((y) => [y, { url: D.years[y].source_url, kind: y === '2026' ? 'whole percents only' : 'counts, percents, mean, SD' }])),
    exams, as_of: AS_OF, source: srcFor(LATEST), more: more('/ap/'),
  };
}

// ---------- estimate_ap_score_from_composite ----------
export function estimateApScoreFromComposite(i: Record<string, unknown>) {
  const rawExam = String(i.exam ?? '').trim();
  // "AP World History" (the 2013 course, before World History: Modern) exists only as a worksheet.
  const direct = WORKSHEETS.find((x) => x.exam.toLowerCase() === rawExam.toLowerCase());
  const exam = direct ? direct.exam : findExam(rawExam);
  const w = direct ?? WORKSHEETS.find((x) => x.exam === exam);
  if (!w) throw new InputError(`College Board has not published a scoring worksheet with a composite score conversion chart for ${exam} that this server could find. Estimates are only given for ${WORKSHEETS.map((x) => x.exam).join(', ')}. Cut scores are never invented.`);
  const mc = Number(i.multiple_choice_correct);
  const mcMax = w.section_1_multiple_choice.max_raw;
  if (!Number.isFinite(mc) || mc < 0 || mc > mcMax) throw new InputError(`multiple_choice_correct must be from 0 to ${mcMax} for the ${w.document}.`);
  const fr = (i.free_response_points as number[]) ?? [];
  const q = w.section_2_free_response;
  if (!Array.isArray(fr) || fr.length !== q.length) throw new InputError(`free_response_points needs ${q.length} numbers, one per question, with maximums ${q.map((x) => x.max_raw).join(', ')} (${w.document}).`);
  fr.forEach((v, k) => {
    if (!Number.isFinite(Number(v)) || Number(v) < 0 || Number(v) > q[k].max_raw) throw new InputError(`Free-response question ${k + 1} is scored out of ${q[k].max_raw}; got ${v}.`);
  });
  const s1 = mc * w.section_1_multiple_choice.multiplier;
  const s2 = fr.reduce((a, v, k) => a + Number(v) * q[k].multiplier, 0);
  const composite = Math.round(s1 + s2);
  const max = Math.round(mcMax * w.section_1_multiple_choice.multiplier + q.reduce((a, x) => a + x.max_raw * x.multiplier, 0));
  const band = w.conversion_chart.find((c) => composite >= c.composite_min && composite <= c.composite_max)!;
  const next = w.conversion_chart.find((c) => c.ap_score === band.ap_score + 1);
  const summary = `Estimated AP score ${band.ap_score} for ${exam}: composite ${composite} of ${max} (Section I ${r2(s1)} + Section II ${r2(s2)}), in the ${band.composite_min}-${band.composite_max} band of the conversion chart College Board printed in the ${w.document}.` +
    (next ? ` ${next.composite_min - composite} more composite points would reach a ${next.ap_score}.` : '') +
    ` This chart belongs to that ${w.exam_year_format} practice exam format; College Board sets cut scores for each live exam and does not publish them, so treat this as an estimate.`;
  return {
    summary, exam, estimated_ap_score: band.ap_score,
    composite_score: composite, composite_max: max, weighted_section_1: r2(s1), weighted_section_2: r2(s2),
    band: { min: band.composite_min, max: band.composite_max }, points_to_next_score: next ? next.composite_min - composite : null,
    worksheet: { document: w.document, format_year: w.exam_year_format, multiple_choice: w.section_1_multiple_choice, free_response: q, conversion_chart: w.conversion_chart, notes: w.notes },
    caveat: D.worksheet_caveat,
    as_of: AS_OF, source: w.source_url, more: more(slug[exam] ?? '/ap/raw-score-for-a-5/'),
  };
}
