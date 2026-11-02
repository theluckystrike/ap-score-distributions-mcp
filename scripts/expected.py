"""Write test/fixtures.json. Every expected number below was transcribed by hand from the College Board
source files (the 2024 and 2025 Student Score Distributions PDFs, the 2026 AP Score Distributions page and
the practice exam scoring worksheets; URLs in DATA_SOURCES.md), and derived values are worked out here
with plain arithmetic, not by the server code. usage: python3 -I expected.py test/fixtures.json"""
import json, sys
FX = []
def fx(name, tool, inp, expect): FX.append({'name': name, 'tool': tool, 'input': inp, 'expect': expect})
r2 = lambda x: round(x + 1e-12, 2)
r1 = lambda x: round(x + 1e-12, 1)

# 2025 PDF, Biology column: N 54,186 / 69,276 / 78,700 / 60,445 / 24,625; 287,232 students; 3+ 202,162 (70.4%); mean 3.24; SD 1.22
bio = {'5': 54186, '4': 69276, '3': 78700, '2': 60445, '1': 24625}
fx('2025 Biology counts from the PDF', 'get_ap_score_distribution', {'exam': 'AP Biology', 'year': 2025},
   {'total_students': 287232, 'counts.5': 54186, 'counts.1': 24625, 'three_plus.count': 202162, 'three_plus.percent': 70.4, 'mean': 3.24, 'sd': 1.22, 'percents.5': 18.9})
# 2025 PDF, Calculus BC: 5 = 70,565 (44.0%), students 160,436, mean 3.82, 3+ 78.6%
fx('2025 Calc BC by short name', 'get_ap_score_distribution', {'exam': 'calc bc', 'year': 2025},
   {'exam': 'AP Calculus BC', 'counts.5': 70565, 'percents.5': 44.0, 'total_students': 160436, 'mean': 3.82, 'three_plus.percent': 78.6})
# 2025 PDF, English Language & Comp: 616,294 students, 5 = 82,614 (13.4%)
fx('2025 English Language by short name', 'get_ap_score_distribution', {'exam': 'Lang', 'year': 2025},
   {'exam': 'AP English Language and Composition', 'total_students': 616294, 'counts.5': 82614, 'percents.5': 13.4})
# 2024 PDF, United States History: 62,610 / 162,967 / 127,117 / 94,957 / 41,037; 488,688; 3+ 352,694 (72.2%); mean 3.23; SD 1.15
fx('2024 US History from the PDF', 'get_ap_score_distribution', {'exam': 'APUSH', 'year': 2024},
   {'exam': 'AP United States History', 'total_students': 488688, 'counts.4': 162967, 'three_plus.count': 352694, 'three_plus.percent': 72.2, 'mean': 3.23, 'sd': 1.15})
# 2024 PDF, World History: Modern: 379,385 students, 2 = 104,072 (27.4%), mean 3.11
fx('2024 World History Modern', 'get_ap_score_distribution', {'exam': 'AP World History: Modern', 'year': 2024},
   {'total_students': 379385, 'counts.2': 104072, 'percents.2': 27.4, 'mean': 3.11})
# 2026 page rows: "AP United States History 14% 37% 23% 18% 8% 74%", "AP Calculus BC 46% 22% 14% 14% 4% 82%", "AP Psychology 15% 35% 24% 18% 8% 74%"
fx('2026 US History is the default year, percents only', 'get_ap_score_distribution', {'exam': 'AP United States History'},
   {'year': 2026, 'percents': {'5': 14, '4': 37, '3': 23, '2': 18, '1': 8}, 'three_plus.percent': 74, 'total_students': None, 'mean': None})
fx('2026 Calculus BC', 'get_ap_score_distribution', {'exam': 'AP Calculus BC', 'year': 2026},
   {'percents': {'5': 46, '4': 22, '3': 14, '2': 14, '1': 4}, 'three_plus.percent': 82})
# percentile, 2025 Biology score 4: lower = (78,700 + 60,445 + 24,625) / 287,232; same = 69,276 / 287,232
low = (bio['3'] + bio['2'] + bio['1']) / 287232 * 100
same = bio['4'] / 287232 * 100
fx('percentile of a 4 in 2025 Biology from counts', 'estimate_ap_percentile', {'exam': 'AP Biology', 'score': 4, 'year': 2025},
   {'percent_scored_lower': r2(low), 'percent_scored_same': r2(same), 'percentile_rank_midpoint': r1(low + same / 2), 'basis': 'counts'})
# percentile, 2026 Psychology score 5: lower = 35 + 24 + 18 + 8 = 85, same 15, midpoint 92.5
fx('percentile of a 5 in 2026 Psychology from published percents', 'estimate_ap_percentile', {'exam': 'psych', 'score': 5},
   {'percent_scored_lower': 85, 'percent_scored_same': 15, 'percent_scored_higher': 0, 'percentile_rank_midpoint': 92.5, 'basis': 'published_whole_percents'})
# compare 2025: Calc BC 3+ 78.6 vs Calc AB 64.2 (PDF)
fx('compare Calc AB and BC pass rates, 2025', 'compare_ap_exams', {'exams': ['Calc AB', 'Calc BC'], 'year': 2025},
   {'exams.0.exam': 'AP Calculus BC', 'exams.0.pass_rate_3_plus': 78.6, 'exams.1.exam': 'AP Calculus AB', 'exams.1.pass_rate_3_plus': 64.2})
fx('compare 2024 by test takers: US History 488,688 above Biology 260,062', 'compare_ap_exams', {'exams': ['AP Biology', 'APUSH'], 'year': 2024, 'sort_by': 'test_takers'},
   {'exams.0.exam': 'AP United States History', 'exams.0.test_takers': 488688, 'exams.1.test_takers': 260062})
fx('list has 40 exams in 2026', 'list_ap_exams', {'year': 2026}, {'latest_year': 2026, 'years_available': [2024, 2025, 2026]})
# worksheets
# Calculus AB 2012: MC x 1.2000 (out of 45), six FR x 1.0000 (out of 9); chart 67-108 = 5, 54-66 = 4, 41-53 = 3
fx('Calc AB 2012 worksheet: 30 MC and 5 on each FR = 66 -> 4', 'estimate_ap_score_from_composite', {'exam': 'AP Calculus AB', 'multiple_choice_correct': 30, 'free_response_points': [5, 5, 5, 5, 5, 5]},
   {'composite_score': round(30 * 1.2 + 6 * 5 * 1.0), 'estimated_ap_score': 4, 'points_to_next_score': 67 - 66, 'composite_max': 108})
# Statistics 2012: MC x 1.2820 (out of 39), Q1-5 x 1.8750, Q6 x 3.1250 (out of 4); chart 70-100 = 5, 57-69 = 4, 44-56 = 3
st = 20 * 1.282 + 5 * 2 * 1.875 + 2 * 3.125
fx('Statistics 2012 worksheet: 20 MC and 2 on each FR -> 3', 'estimate_ap_score_from_composite', {'exam': 'stats', 'multiple_choice_correct': 20, 'free_response_points': [2, 2, 2, 2, 2, 2]},
   {'composite_score': round(st), 'estimated_ap_score': 3, 'composite_max': 100})
# Macroeconomics 2012: MC x 1.0 (out of 60), Q1 x 1.25 (12), Q2 x 1.5 (5), Q3 x 1.25 (6); chart 71-90 = 5, 59-70 = 4, 51-58 = 3
mac = 40 + 6 * 1.25 + 3 * 1.5 + 3 * 1.25
fx('Macroeconomics 2012 worksheet: 40 MC, FR 6/3/3 -> 3', 'estimate_ap_score_from_composite', {'exam': 'macro', 'multiple_choice_correct': 40, 'free_response_points': [6, 3, 3]},
   {'composite_score': round(mac), 'estimated_ap_score': 3, 'band.min': 51, 'band.max': 58})
json.dump(FX, open(sys.argv[1], 'w'), indent=1)
print(len(FX), 'fixtures')
