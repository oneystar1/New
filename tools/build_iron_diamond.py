"""Inline Iron Diamond into one HTML page (for publishing as a single-file artifact).
Usage: python3 tools/build_iron_diamond.py OUT.html [--fragment]
--fragment drops the doctype/html/head/body wrapper (the artifact host adds its own)."""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent / 'iron-diamond'
html = (root / 'index.html').read_text()
def inline(m):
    return '<script>\n' + (root / m.group(1)).read_text() + '\n</script>'
html = re.sub(r'<script src="((?:src|vendor)/[^"]+)"></script>', inline, html)
if '--fragment' in sys.argv:
    html = re.sub(r'<!doctype html>\s*', '', html, flags=re.I)
    html = re.sub(r'</?(html|body)[^>]*>\s*', '', html)
    html = re.sub(r'</?head>\s*', '', html)
    html = re.sub(r'<meta charset="utf-8">\s*', '', html)
pathlib.Path(sys.argv[1]).write_text(html)
print('wrote', sys.argv[1], len(html) // 1024, 'KB')
