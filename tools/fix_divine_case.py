#!/usr/bin/env python3
from pathlib import Path
paths = list(Path('public').rglob('*.html')) + list(Path('public').rglob('*.js')) + list(Path('public').rglob('*.css'))
modified = []
for f in paths:
    s = f.read_text(encoding='utf-8')
    if 'divine-Jurisprudence' in s:
        ns = s.replace('divine-Jurisprudence', 'divine-jurisprudence')
        f.write_text(ns, encoding='utf-8')
        modified.append(str(f))
print('Modified files:')
for m in modified:
    print(m)
