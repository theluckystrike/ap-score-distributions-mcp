# AP Score Distributions MCP

Official College Board AP score distributions for AI assistants: the May 2026, 2025 and 2024 results for every AP exam, with percentiles, pass rate rankings and practice exam score estimates.

Hosted MCP URL (no sign-in, no token): `https://ap-score-distributions-mcp.lipmichal.workers.dev/mcp`

AP score calculators on the web: [examscorecalc.com](https://examscorecalc.com/ap-score-distributions/?utm_source=github&utm_medium=ap-score-distributions-mcp)

## Tools

| Tool | What it does |
| --- | --- |
| `get_ap_score_distribution` | Percent of students scoring 5, 4, 3, 2 and 1, and 3 or higher, for an exam and year. Counts, mean and standard deviation for 2024 and 2025. History across all three years. |
| `estimate_ap_percentile` | Percent of test takers below, at and above a score, and the midpoint percentile rank. |
| `compare_ap_exams` | Ranks exams by pass rate (3 or higher), share of 5s, mean score or test takers, for a list of exams or all 40. |
| `list_ap_exams` | Exams and years with data, the source of each year, and which exams have a composite estimator. |
| `estimate_ap_score_from_composite` | Weighted composite and estimated AP score from multiple-choice and free-response points, using the scoring worksheet College Board printed in its practice exams. Only 7 exams. |

Every result has structured JSON, a one-paragraph summary, an `as_of` date, a `source` URL on collegeboard.org and a `more` link to the matching examscorecalc.com page.

## What it knows that your model does not

- The May 2026 results. College Board posted the 2026 AP Score Distributions after the 2026 exams, which is newer than most model training data. For example, 46% of AP Calculus BC students scored a 5 in 2026, and AP Biology's pass rate was 71%.
- Exact 2024 and 2025 counts. 287,232 students took AP Biology in May 2025 and 70.4% scored 3 or higher, with a mean of 3.24. All 49 rows per year (40 exams, 3 subscores, 6 Standard Group language rows) pass a check that counts add to the printed total and 5 + 4 + 3 equals the printed 3 or higher count.
- Which cut charts exist. College Board does not publish cut scores for live exams. The estimator uses only the 7 conversion charts College Board printed in its practice exams (Calculus AB 2012, Biology 2013, Statistics 2012, World History 2013, Psychology 2012, Macroeconomics 2012, Microeconomics 2012) and refuses every other exam rather than invent a cut.

## Install

### Claude.ai custom connector, ChatGPT developer mode

Paste this URL as a custom connector. No token or sign-in.

```
https://ap-score-distributions-mcp.lipmichal.workers.dev/mcp
```

### Claude Code

```
claude mcp add --transport http ap-scores https://ap-score-distributions-mcp.lipmichal.workers.dev/mcp
```

Or run it locally over stdio:

```
claude mcp add ap-scores -- npx -y github:theluckystrike/ap-score-distributions-mcp
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ap-scores": {
      "command": "npx",
      "args": ["-y", "github:theluckystrike/ap-score-distributions-mcp"]
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ap-scores": { "url": "https://ap-score-distributions-mcp.lipmichal.workers.dev/mcp" }
  }
}
```

### VS Code

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "ap-scores": { "type": "http", "url": "https://ap-score-distributions-mcp.lipmichal.workers.dev/mcp" }
  }
}
```

### Test with curl

```
curl -s -X POST https://ap-score-distributions-mcp.lipmichal.workers.dev/mcp \
  -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_ap_score_distribution","arguments":{"exam":"APUSH","year":2026}}}'
```

## Example prompts

- "What percent of students got a 5 on AP Calculus BC in 2026?"
- "I got a 4 on AP Biology. What percentile is that?"
- "Which AP exams had the lowest pass rates in 2026?"
- "Compare the pass rates of Calc AB, Calc BC, Statistics and Precalculus."
- "On the 2012 Calculus AB practice exam I got 30 multiple choice right and 5 points on each free response. What score is that?"

## How it works

- Exam names accept common short forms: APUSH, Lang, Lit, Calc AB, Calc BC, Stats, Psych, APES, HUG, Euro, Gov, CSA, CSP, Physics 1, Physics C E&M and others.
- Percentiles use exact counts for 2024 and 2025. For 2026 they use the whole-number percents College Board posted, so they can be off by about 1 point.
- The composite estimator multiplies each section by the worksheet weights, adds them without rounding the parts, rounds the composite to a whole number and reads the band from that practice exam's conversion chart, as the worksheet instructs.

15 test fixtures check values transcribed from the College Board files and arithmetic worked by hand. The expected values come from `scripts/expected.py`, not from the server code.

## Data sources

See [DATA_SOURCES.md](DATA_SOURCES.md) for every URL, its HTTP status, sha256 and fetch date (2026-11-02).

- 2026: https://apstudents.collegeboard.org/about-ap-scores/score-distributions
- 2025: https://apcentral.collegeboard.org/media/pdf/ap-score-distributions-by-subject-2025.pdf
- 2024: https://apcentral.collegeboard.org/media/pdf/ap-score-distributions-by-subject-2024.pdf
- Scoring worksheets: College Board practice exams under https://secure-media.collegeboard.org/digitalServices/pdf/ap/

## Limitations

- 2026 has percents only. College Board has not published 2026 student counts, means or standard deviations, so `mean` and `test_takers` ranking work for 2024 and 2025 only. The 2026 page says it is updated on a rolling basis.
- 2026 covers the 40 Total Group exams. Subscores and Standard Group rows are in 2024 and 2025 only.
- The composite charts belong to the 2012 and 2013 practice exam formats. Current exam formats may differ (not checked against the current Course and Exam Descriptions), and cut points move every year. Treat any estimate as a rough guide and check the current Course and Exam Description.
- A pass rate reflects who takes an exam, not only how hard it is.
- Not affiliated with College Board. AP is a registered trademark of College Board.

## Development

```
npm install
npm run build
npm test
npx wrangler deploy
```

`src/core.ts` holds the pure logic and `src/data.ts` the generated table from `data/ap.json`. `src/stdio.ts` and `src/worker.ts` are thin entries over the same tool registry in `src/tools.ts`.

## License

MIT

Part of the Zovo MCP collection: https://mcp.zovo.one

<!-- data-servers:start -->
## More data servers from the same author

Each one is free, needs no API key and has a hosted URL you can paste into Claude or ChatGPT.

| server | tools | hosted URL |
|---|---|---|
| [cups-to-grams-mcp](https://github.com/theluckystrike/cups-to-grams-mcp) | convert_ingredient, search_ingredients, scale_recipe, convert_oven_temperature | `https://cups-to-grams-mcp.lipmichal.workers.dev/mcp` |
| [dscr-loan-calculator-mcp](https://github.com/theluckystrike/dscr-loan-calculator-mcp) | calculate_dscr, max_loan_for_target_dscr, rent_needed_for_target_dscr, compare_scenarios, amortization_summary | `https://dscr-loan-calculator-mcp.lipmichal.workers.dev/mcp` |
| [gold-price-per-gram-mcp](https://github.com/theluckystrike/gold-price-per-gram-mcp) | get_gold_price_per_gram, get_metal_prices, calculate_jewelry_value, convert_gold_units | `https://gold-price-per-gram-mcp.lipmichal.workers.dev/mcp` |
| [lake-level-mcp](https://github.com/theluckystrike/lake-level-mcp) | search_lakes, get_lake_level, get_lake_history, compare_lakes | `https://lake-level-mcp.lipmichal.workers.dev/mcp` |
| [minimum-wage-mcp](https://github.com/theluckystrike/minimum-wage-mcp) | get_minimum_wage, list_upcoming_increases, compare_states, annual_income_at_minimum_wage | `https://minimum-wage-mcp.lipmichal.workers.dev/mcp` |
| [no-tax-on-overtime-mcp](https://github.com/theluckystrike/no-tax-on-overtime-mcp) | calculate_overtime_deduction, calculate_tips_deduction, calculate_senior_deduction, estimate_tax_savings, explain_eligibility | `https://no-tax-on-overtime-mcp.lipmichal.workers.dev/mcp` |
| [paycheck-calculator-mcp](https://github.com/theluckystrike/paycheck-calculator-mcp) | calculate_take_home_pay, compare_states_take_home, salary_to_hourly, hourly_to_salary, get_federal_tax_brackets | `https://paycheck-calculator-mcp.lipmichal.workers.dev/mcp` |
| [uk-income-tax-salary-mcp](https://github.com/theluckystrike/uk-income-tax-salary-mcp) | calculate_uk_take_home, get_uk_tax_bands, compare_salaries, marginal_rate_at_income | `https://uk-income-tax-salary-mcp.lipmichal.workers.dev/mcp` |
| [us-federal-holidays-business-days-mcp](https://github.com/theluckystrike/us-federal-holidays-business-days-mcp) | list_federal_holidays, is_business_day, add_business_days, count_business_days, invoice_due_date | `https://us-federal-holidays-business-days-mcp.lipmichal.workers.dev/mcp` |
| [ab-test-sample-size-calculator-mcp](https://github.com/theluckystrike/ab-test-sample-size-calculator-mcp) | calculate_sample_size, estimate_test_duration, test_ab_significance, fisher_exact_test, check_peeking_risk | `https://ab-test-sample-size-calculator-mcp.lipmichal.workers.dev/mcp` |
| [aca-premium-tax-credit-calculator-mcp](https://github.com/theluckystrike/aca-premium-tax-credit-calculator-mcp) | get_federal_poverty_level, calculate_premium_tax_credit, check_subsidy_cliff, get_aptc_repayment_cap | `https://aca-premium-tax-credit-calculator-mcp.lipmichal.workers.dev/mcp` |
| [car-loan-interest-deduction-calculator-mcp](https://github.com/theluckystrike/car-loan-interest-deduction-calculator-mcp) | calculate_car_loan_interest_deduction, calculate_salt_deduction, get_tax_brackets_and_standard_deduction, calculate_child_tax_credit | `https://car-loan-interest-deduction-calculator-mcp.lipmichal.workers.dev/mcp` |
| [recipe-nutrition-calculator-mcp](https://github.com/theluckystrike/recipe-nutrition-calculator-mcp) | lookup_ingredient_nutrition, calculate_recipe_nutrition, round_nutrition_label, scale_recipe_nutrition | `https://recipe-nutrition-calculator-mcp.lipmichal.workers.dev/mcp` |
| [retirement-contribution-limits-2027-mcp](https://github.com/theluckystrike/retirement-contribution-limits-2027-mcp) | get_contribution_limits, calculate_max_contribution, get_social_security_cola, compare_years | `https://retirement-contribution-limits-2027-mcp.lipmichal.workers.dev/mcp` |
| [section-179-deduction-calculator-mcp](https://github.com/theluckystrike/section-179-deduction-calculator-mcp) | calculate_section_179, calculate_bonus_depreciation, get_vehicle_depreciation_limits, calculate_asset_loan_payment | `https://section-179-deduction-calculator-mcp.lipmichal.workers.dev/mcp` |
| [student-loan-repayment-assistance-plan-calculator-mcp](https://github.com/theluckystrike/student-loan-repayment-assistance-plan-calculator-mcp) | calculate_rap_payment, compare_rap_vs_standard, get_federal_loan_limits, get_plan_transition_dates | `https://student-loan-repayment-assistance-plan-calculator-mcp.lipmichal.workers.dev/mcp` |
| [subdomain-finder-mcp](https://github.com/theluckystrike/subdomain-finder-mcp) | find_subdomains, resolve_subdomains, get_certificate_history, summarize_attack_surface | `https://subdomain-finder-mcp.lipmichal.workers.dev/mcp` |

The paid back-office collection (invoices, VAT, PDFs, spreadsheets) is at https://mcp.zovo.one
<!-- data-servers:end -->
