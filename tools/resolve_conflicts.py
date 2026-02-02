#!/usr/bin/env python3
"""Resolve simple git conflict blocks by choosing the 'incoming' (after =======) side.
Usage: python tools/resolve_conflicts.py [paths...]
If no paths provided, defaults to frontend/ and backend/.
This script makes in-place edits and prints files modified. Review before committing.
"""
import sys
from pathlib import Path
import re

paths = sys.argv[1:] or ['frontend', 'backend']
pattern = re.compile(r'<<<<<<<.*?=======(.*?)>>>>>>>.*?\n', re.DOTALL)

modified = []
for p in paths:
    for f in Path(p).rglob('*'):
        if f.is_file():
            try:
                s = f.read_text(encoding='utf-8')
            except Exception:
                continue
            if '<<<<<<<' in s and '=======' in s and '>>>>>>>' in s:
                new_s = pattern.sub(lambda m: m.group(1), s)
                if new_s != s:
                    f.write_text(new_s, encoding='utf-8')
                    modified.append(str(f))

print('Modified files:')
for m in modified:
    print(m)
print('Done. Please review changes before committing.')
