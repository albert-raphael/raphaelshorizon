#!/usr/bin/env python3
"""
Relativize all local links and asset sources in frontend HTML files.
- For every HTML file under frontend/, find local href/src values (not starting with http(s)/mailto/tel/#)
- Resolve to a filesystem path and make the link relative from the page's directory to that target
- Preserve anchors/fragments
- Skip external and anchor-only links

Run: python tools/relativize_links.py (from repo root)
"""
import os
import re
from urllib.parse import urlparse, urlunparse

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FRONTEND = os.path.join(ROOT, 'frontend')

HTML_FILES = []
for root, dirs, files in os.walk(FRONTEND):
    for f in files:
        if f.lower().endswith('.html'):
            HTML_FILES.append(os.path.join(root, f))

# Patterns to find attributes in HTML: href, src
HREF_SRC_RE = re.compile(r'(href|src)=("|\')([^"\']+)("|\')', re.IGNORECASE)

# Skip if link starts with these
SKIP_PREFIXES = ('http://', 'https://', 'mailto:', 'tel:', 'javascript:')

changed = []

for page in HTML_FILES:
    with open(page, 'r', encoding='utf-8') as f:
        content = f.read()

    def replace_attr(match):
        attr = match.group(1)
        quote = match.group(2)
        value = match.group(3)

        # Skip external and anchor-only
        if not value or value.startswith('#'):
            return match.group(0)
        if value.startswith(SKIP_PREFIXES):
            # For javascript:void(0), it's a placeholder — keep as '#'
            if value.startswith('javascript:void'):
                return f'{attr}={quote}#{quote}'
            return match.group(0)

        # Parse value and preserve fragment
        parsed = urlparse(value)
        frag = parsed.fragment
        path = parsed.path

        # Normalize: treat root-like paths (leading '/' or beginning with these known root folders) as FRONTEND relative
        root_like_prefixes = ('pages/', 'assets/', 'css/', 'js/', 'fonts/')
        if path.startswith('/') or any(path.startswith(pref) for pref in root_like_prefixes):
            target = os.path.normpath(os.path.join(FRONTEND, path.lstrip('/')))
        else:
            # relative to current page
            base_dir = os.path.dirname(page)
            target = os.path.normpath(os.path.join(base_dir, path))

        # If path doesn't exist, try some fallbacks: maybe the path is correct but missing extension
        if not os.path.exists(target):
            # if it's linking to a directory index, try index.html
            if os.path.isdir(target) and os.path.exists(os.path.join(target, 'index.html')):
                target = os.path.join(target, 'index.html')
        # If still missing, try common alt mappings: convert '../books/...', '../about/...' etc to 'pages/books/...', 'pages/about/...'
        if not os.path.exists(target):
            # Attempt to map '../books/books.html' -> 'pages/books/books.html'
            stripped = path.lstrip('./')
            if stripped.startswith('..'):
                # remove leading ../ segments
                s = re.sub(r'^(?:\.\./)+', '', path)
                alt = os.path.normpath(os.path.join(FRONTEND, 'pages', s))
                if os.path.exists(alt):
                    target = alt
            # If direct 'books/books.html' (no pages prefix) found in the top-level pages folder
            if not os.path.exists(target):
                alt2 = os.path.normpath(os.path.join(FRONTEND, 'pages', path.lstrip('/')))
                if os.path.exists(alt2):
                    target = alt2
        # If still missing, leave unchanged
        if not os.path.exists(target):
            return match.group(0)

        # Compute relative path from page dir to target
        page_dir = os.path.dirname(page)
        rel = os.path.relpath(target, page_dir).replace('\\', '/')
        if frag:
            rel = f'{rel}#{frag}'
        # For images and js/css, keep relative
        return f'{attr}={quote}{rel}{quote}'

    new_content = HREF_SRC_RE.sub(replace_attr, content)
    if new_content != content:
        with open(page, 'w', encoding='utf-8') as f:
            f.write(new_content)
        changed.append(os.path.relpath(page, ROOT))

print('Updated files:')
for c in changed:
    print('  ', c)
print('\nDone')
