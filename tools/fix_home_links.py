#!/usr/bin/env python3
"""
Ensure all `index.html` links point to site root index.html (frontend/index.html) rather than folder-local index.html.
- For each HTML file, find href values to index.html and replace them with the relative path to ROOT/index.html

Run: python tools/fix_home_links.py
"""
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FRONTEND = os.path.join(ROOT, 'frontend')

html_files = []
for root, dirs, files in os.walk(FRONTEND):
    for f in files:
        if f.lower().endswith('.html'):
            html_files.append(os.path.join(root, f))

INDEX_PATH = os.path.join(FRONTEND, 'index.html')

pattern = re.compile(r'href=("|\')([^"\']*index\.html)("|\')', re.IGNORECASE)
changed = []
for page in html_files:
    with open(page, 'r', encoding='utf-8') as fh:
        content = fh.read()

    def repl(m):
        quote = m.group(1)
        value = m.group(2)
        # Compute relative path to root index
        page_dir = os.path.dirname(page)
        rel = os.path.relpath(INDEX_PATH, page_dir).replace('\\', '/')
        return f'href={quote}{rel}{quote}'

    new = pattern.sub(repl, content)
    if new != content:
        with open(page, 'w', encoding='utf-8') as fh:
            fh.write(new)
        changed.append(os.path.relpath(page, ROOT))

print('Updated files:')
for c in changed:
    print('  ', c)
print('Done')
