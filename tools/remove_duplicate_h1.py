#!/usr/bin/env python3
"""
Remove first <h1> tag in HTML files when multiple <h1> tags exist and the first <h1> appears immediately under <body>.
- This keeps the hero/main <h1> and removes the redundant one at the body start.
- Backs up original file to .bak if a change is made.
"""

import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / 'frontend'

changed_files = []
for root, dirs, files in os.walk(FRONTEND):
    for f in files:
        if not f.lower().endswith('.html'):
            continue
        path = Path(root) / f
        with open(path, 'r', encoding='utf-8') as fh:
            data = fh.read()
        h1_count = len(re.findall(r'<h1\b', data, flags=re.IGNORECASE))
        if h1_count > 1:
            # look for a first <body> followed by a top-level <h1> and remove that one
            new = re.sub(r'(<body[^>]*>\s*)<h1[\s\S]*?</h1>\s*', r'\1', data, count=1, flags=re.IGNORECASE)
            if new != data:
                bak = str(path) + '.bak'
                if not os.path.exists(bak):
                    with open(bak, 'wb') as bfh:
                        bfh.write(data.encode('utf-8'))
                with open(path, 'w', encoding='utf-8') as fh:
                    fh.write(new)
                changed_files.append(str(path.relative_to(ROOT)))

print('Updated files:')
for p in changed_files:
    print('  ', p)
print('Done')
