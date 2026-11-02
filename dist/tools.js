import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { InputError, getApScoreDistribution, estimateApPercentile, compareApExams, listApExams, estimateApScoreFromComposite, YEARS, LATEST, WORKSHEETS } from './core.js';
export const SERVER_NAME = 'ap-score-distributions-mcp';
export const SERVER_VERSION = '1.0.0';
const RO = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
function wrap(fn) {
    return async (args) => {
        try {
            const out = fn(args);
            return { content: [{ type: 'text', text: `${out.summary}\n\n${JSON.stringify(out, null, 2)}` }], structuredContent: out };
        }
        catch (e) {
            const msg = e instanceof InputError ? e.message : `Unexpected error: ${e.message}`;
            return { content: [{ type: 'text', text: msg }], isError: true };
        }
    };
}
const examSchema = z.string().min(1).max(80).describe('AP exam name or common short name, e.g. "AP Biology", "APUSH", "Calc BC", "Lang", "Physics 1", "APES".');
const yearSchema = z.number().int().min(2024).max(2030).describe(`Exam year (May administration). Available: ${YEARS.join(', ')}. Default ${LATEST}, the latest College Board release.`).optional();
export function registerTools(server) {
    server.registerTool('get_ap_score_distribution', {
        title: 'Get the official AP score distribution for an exam',
        description: `Returns the College Board score distribution (percent of students scoring 5, 4, 3, 2, 1 and 3 or higher) for an AP exam and year, plus student counts, mean and standard deviation where College Board published them (2024 and 2025 PDFs). Includes the May 2026 results from the College Board 2026 AP Score Distributions page, which are newer than most model training data. Shows the ${YEARS.join('/')} history for the exam.`,
        inputSchema: { exam: examSchema, year: yearSchema },
        annotations: { title: 'AP score distribution', ...RO },
    }, wrap(getApScoreDistribution));
    server.registerTool('estimate_ap_percentile', {
        title: 'Estimate the percentile of an AP score',
        description: 'For an AP exam, year and score from 1 to 5, returns the percent of test takers who scored lower, the same and higher, and the midpoint percentile rank, from the official College Board distribution. Uses exact counts for 2024 and 2025 and the published whole percents for 2026.',
        inputSchema: { exam: examSchema, score: z.number().int().min(1).max(5).describe('AP score, 1 to 5.'), year: yearSchema },
        annotations: { title: 'AP score percentile', ...RO },
    }, wrap(estimateApPercentile));
    server.registerTool('compare_ap_exams', {
        title: 'Compare AP exams by pass rate or share of 5s',
        description: 'Ranks AP exams for one year by pass rate (share scoring 3 or higher), share of 5s, mean score or number of test takers (mean and test takers for 2024 and 2025 only), using the official College Board distributions. Give a list of exams to compare a few, or leave it empty to rank all of them.',
        inputSchema: {
            exams: z.array(z.string().min(1).max(80)).max(60).describe('Exams to compare, e.g. ["Calc AB", "Calc BC", "Statistics"]. Empty means all exams.').optional(),
            year: yearSchema,
            sort_by: z.enum(['pass_rate', 'five_rate', 'mean', 'test_takers']).describe('Ranking key. Default pass_rate (3 or higher).').optional(),
            order: z.enum(['desc', 'asc']).describe('desc = highest first (default), asc = lowest first.').optional(),
            limit: z.number().int().min(1).max(60).describe('Maximum rows. Default 50.').optional(),
        },
        annotations: { title: 'Compare AP exams', ...RO },
    }, wrap(compareApExams));
    server.registerTool('list_ap_exams', {
        title: 'List AP exams and years with data',
        description: 'Lists every AP exam with College Board score distributions in this server, the years available for each, the source of each year, and which exams have a College Board scoring worksheet for composite score estimates.',
        inputSchema: { year: yearSchema },
        annotations: { title: 'List AP exams', ...RO },
    }, wrap(listApExams));
    server.registerTool('estimate_ap_score_from_composite', {
        title: 'Estimate an AP score from practice exam raw points',
        description: `Converts multiple-choice correct answers and free-response points into a weighted composite and an estimated AP score, using the scoring worksheet and conversion chart College Board printed in its official practice exams. Only for the ${WORKSHEETS.length} exams with such a worksheet: ${WORKSHEETS.map((w) => `${w.exam} (${w.exam_year_format})`).join(', ')}. Cut scores are never invented; other exams return an error.`,
        inputSchema: {
            exam: examSchema,
            multiple_choice_correct: z.number().min(0).max(200).describe('Number of multiple-choice questions answered correctly.'),
            free_response_points: z.array(z.number().min(0).max(100)).min(1).max(12).describe('Points earned on each free-response question, in order. The error message lists how many questions and the maximum for each.'),
        },
        annotations: { title: 'Estimate AP score', ...RO },
    }, wrap(estimateApScoreFromComposite));
}
export function createServer() {
    const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
    registerTools(server);
    return server;
}
