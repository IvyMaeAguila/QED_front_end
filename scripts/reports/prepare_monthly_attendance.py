"""Prepare the official vector PDF: replace fixed dates/signatories only.
Usage: python scripts/reports/prepare_monthly_attendance.py INPUT_PDF OUTPUT_PDF
The original document is never overwritten. Existing grid, fonts, headings and footer remain.
"""
import sys
from pathlib import Path
import pymupdf
from pypdf import PdfReader

source, target = map(Path, sys.argv[1:])
if source.resolve() == target.resolve():
    raise ValueError('Use a separate output path.')
reader = PdfReader(source)
if len(reader.pages) != 1:
    raise ValueError('Expected the supplied one-page official form.')
rects = {str(a.get_object().get('/T')): list(a.get_object()['/Rect']) for a in reader.pages[0]['/Annots']}
doc = pymupdf.open(source)
page = doc[0]
height = page.rect.height
# Date-column interiors; preserve all vector borders and all other static text.
for row in range(1, 23):
    x0, y0, x1, y1 = rects[f'Row_{row:02d}_Enrollment_Male']
    page.add_redact_annot(pymupdf.Rect(37, height-y1-0.3, 70, height-y0+0.3), fill=False)
# Fixed sample principal and adviser caption become report-only inputs.
page.add_redact_annot(pymupdf.Rect(35, 701, 310, 733), fill=False)
page.add_redact_annot(pymupdf.Rect(358, 718, 565, 733), fill=False)
page.apply_redactions(images=0, graphics=0, text=0)

def text_field(name, rect, size=10):
    widget = pymupdf.Widget()
    widget.field_name = name
    widget.field_type = pymupdf.PDF_WIDGET_TYPE_TEXT
    widget.rect = rect
    widget.text_font = 'TiRo'
    widget.text_fontsize = size
    widget.text_color = (0,0,0)
    page.add_widget(widget)

for row in range(1,23):
    _, y0, _, y1 = rects[f'Row_{row:02d}_Enrollment_Male']
    text_field(f'Row_{row:02d}_Date', pymupdf.Rect(38, height-y1, 69, height-y0), 10)
text_field('Principal_Name', pymupdf.Rect(36, 702, 310, 717), 12)
text_field('Principal_Designation', pymupdf.Rect(36, 718, 310, 733), 12)
text_field('Adviser_Designation', pymupdf.Rect(360, 718, 565, 733), 12)
page = None
doc.save(target, garbage=4, deflate=True)
doc.close()
fields = PdfReader(target).get_fields()
assert all(f'Row_{i:02d}_Date' in fields for i in range(1,27))
assert 'MARIA TERESA' not in PdfReader(target).pages[0].extract_text()
print(f'Prepared {target}: {len(fields)} fields; vector page retained.')
