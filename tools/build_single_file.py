"""Bundle index.html, the CSS, the scripts and the KOL data into one self-contained HTML file.
Usage: python3 tools/build_single_file.py [output.html]"""
import os, re, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
read = lambda p: open(os.path.join(root, p), encoding='utf-8').read()
html = read('index.html')
html = html.replace('<link rel="stylesheet" href="css/styles.css">', '<style>\n' + read('css/styles.css') + '</style>')
for src in re.findall(r'<script src="([^"]+)"></script>', html):
    html = html.replace('<script src="%s"></script>' % src, '<script>\n' + read(src).replace('</script', '<\\/script') + '</script>')
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'TummyTroubleTool_single.html')
open(out, 'w', encoding='utf-8').write(html)
print('wrote', out, len(html), 'bytes')
