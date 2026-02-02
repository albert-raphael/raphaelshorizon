#!/usr/bin/env python3
"""
Quick replacement script to fix known broken paths and asset names.
"""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / 'frontend'

REPLACE_MAP = {
    # pages: ../books.html -> ../books/books.html
    'href="../books.html"': 'href="../books/books.html"',
    "href='../books.html'": "href='../books/books.html'",
    # blog prev/next placeholders -> blog index
    'href="previous-post.html"': 'href="index.html"',
    'href="next-post.html"': 'href="index.html"',
    "href='../blog/previous-post.html'": 'href="../blog/index.html"',
    # assets mapping
    'assets/images/blog-1.jpg': 'assets/images/blog-post-1.png',
    'assets/images/blog-2.jpg': 'assets/images/blog-post-2.jpg',
    'assets/images/blog-3.jpg': 'assets/images/blog-post-3.jpg',
    'assets/images/blog-4.jpg': 'assets/images/blog-post-4.jpg',
    'assets/images/blog-5.jpg': 'assets/images/blog-post-5.jpg',
    'assets/images/blog-6.jpg': 'assets/images/blog-post-6.jpg',
    'assets/images/blog-featured.jpg': 'assets/images/blog-post-1.png',
    'assets/images/blog-image.jpg': 'assets/images/blog-post-1.png',
    'assets/images/author-raphael.jpg': 'assets/images/raphael.png',
    "../../assets/images/blank": "../../assets/images/raphael.png",
    # other patterns
    'href="../books.html"': 'href="../books/books.html"',
}

import re

# Replace occurrences in all html files
nd = []
for root, dirs, files in os.walk(FRONTEND):
    for f in files:
        if not f.lower().endswith('.html'):
            continue
        path = Path(root) / f
        with open(path, 'r', encoding='utf-8') as fh:
            data = fh.read()
        new = data
        for k, v in REPLACE_MAP.items():
            new = new.replace(k, v)
        # regex-based fixes
        # blog-post-N.html -> post-N.html
        new = re.sub(r'blog-post-(\d+)\.html', r'post-\1.html', new)
        if new != data:
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(new)
            nd.append(str(path.relative_to(ROOT)))

print('Updated files:')
for p in sorted(set(nd)):
    print('  ', p)

print('Done')
