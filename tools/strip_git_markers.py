#!/usr/bin/env python3
"""Strip leftover Git conflict markers like <<<<<<<, =======, >>>>>>> from files.
Backs up files by creating .bak if changed.
"""
import sys
from pathlib import Path
import re
paths = sys.argv[1:] or ['frontend', 'backend']
marker_re = re.compile(r'^(?:<{7,}.*|>{7,}.*|={7,}\s*)$', re.MULTILINE)
modified = []
for p in paths:
    for f in Path(p).rglob('*'):
        if f.is_file():
            try:
                s = f.read_text(encoding='utf-8')
            except Exception:
                continue
            if re.search(marker_re, s):
                new_s = re.sub(marker_re, '', s)
                if new_s != s:
                    backup = str(f) + '.bak'
                    Path(backup).write_text(s, encoding='utf-8')
                    f.write_text(new_s, encoding='utf-8')
                    modified.append(str(f))
print('Stripped markers from:')
for m in modified:
    print(m)
print('Done.')
