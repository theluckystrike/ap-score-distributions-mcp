"""Build data/ap.json from the parsed College Board files.
usage: python3 -I build_data.py <ap_distributions.json> <ap_worksheets.json> <out.json>
ap_distributions.json was parsed from the College Board PDFs (2024, 2025) and the 2026 HTML page;
ap_worksheets.json from the College Board practice exam PDFs. See DATA_SOURCES.md."""
import json, sys
dist, ws, out = sys.argv[1:4]
d = json.load(open(dist, encoding='utf8'))
w = json.load(open(ws, encoding='utf8'))
years = {}
for y, v in d['years'].items():
    years[y] = {
        'source_url': v['source_url'], 'source_title': v.get('source_title'), 'fetched': v['fetched'], 'data_kind': v.get('data_kind'),
        'note': v.get('note'), 'footnote': v.get('footnote'),
        'exams': [{k: e.get(k) for k in ('exam', 'label_in_source', 'kind', 'counts', 'total', 'percents', 'three_plus', 'mean', 'sd')} for e in v['exams']],
    }
sheets = []
for s in w['worksheets']:
    sheets.append({k: s[k] for k in ('exam', 'source_url', 'document', 'exam_year_format', 'section_1_multiple_choice', 'section_2_free_response', 'composite_rule', 'conversion_chart', 'notes')})
json.dump({'years': years, 'worksheets': sheets, 'worksheet_caveat': w['caveat']}, open(out, 'w', encoding='utf8'), indent=1, ensure_ascii=False)
print(len(years), 'years', {y: len(v['exams']) for y, v in years.items()}, len(sheets), 'worksheets')
