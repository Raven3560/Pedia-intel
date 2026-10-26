"""Regenerate data/kol-data.js from data/kol-data.json after editing the KOL data.
Usage: python3 tools/build_kol_data_js.py"""
import json, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data = json.load(open(os.path.join(root, 'data', 'kol-data.json'), encoding='utf-8'))
with open(os.path.join(root, 'data', 'kol-data.js'), 'w', encoding='utf-8') as f:
    f.write('/* KOL finder data (generated from kol-data.json). Loaded as a script so index.html also works when opened from disk. */\n')
    f.write('window.KOL_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('wrote data/kol-data.js with', len(data['kols']), 'profiles')
