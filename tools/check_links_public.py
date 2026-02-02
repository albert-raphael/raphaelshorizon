#!/usr/bin/env python3
"""
Simple link and asset checker for local HTML files.
- Scans `public/` for HTML files and checks local href/src references.
- Flags missing files and invalid anchors.
- Skips remote links (http[s]://), mailto:, tel:

Run from repository root: python tools/check_links_public.py
"""
import os
import sys
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FRONTEND_DIR = os.path.join(ROOT, 'public')

class LinkCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs = []
        self.srcs = []
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and 'href' in attrs:
            self.hrefs.append(attrs['href'])
        if tag in ('img','script') and 'src' in attrs:
            self.srcs.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') == 'stylesheet' and 'href' in attrs:
            self.srcs.append(attrs['href'])
        if 'id' in attrs:
            self.ids.add(attrs['id'])

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)


# Utilities

def is_local_link(link):
    if not link:
        return False
    lp = link.strip()
    # Skip anchors, protocols
    if lp.startswith('#'):
        return False
    if lp.startswith('mailto:') or lp.startswith('tel:') or lp.startswith('javascript:'):
        return False
    parsed = urlparse(lp)
    if parsed.scheme in ('http','https'):
        return False
    # images or relative files are local
    return True


def resolve_path(base_file, link):
    """Resolve a relative link against base html file (local filesystem)."""
    # Remove query and fragment
    parsed = urlparse(link)
    path = unquote(parsed.path)
    if path.startswith('/'):
        # treat as relative to FRONTEND_DIR root
        return os.path.normpath(os.path.join(FRONTEND_DIR, path.lstrip('/')))
    # otherwise relative to base file directory
    base_dir = os.path.dirname(base_file)
    return os.path.normpath(os.path.join(base_dir, path))


# Walk frontend directory
html_files = []
for root, dirs, files in os.walk(FRONTEND_DIR):
    for f in files:
        if f.lower().endswith('.html'):
            html_files.append(os.path.join(root, f))

# Collect issues
missing_files = []
broken_anchors = []
missing_assets = []

print('Scanning', len(html_files), 'html files...')
for html_file in html_files:
    with open(html_file, 'r', encoding='utf-8') as fh:
        text = fh.read()
    parser = LinkCollector()
    parser.feed(text)

    # Build set of ids defined in the page
    local_ids = parser.ids

    # Hrefs
    for href in parser.hrefs:
        href = href.strip()
        if not href:
            continue
        # Skip external
        if not is_local_link(href):
            continue
        # If it's an anchor-only link like '#section', check it in same page
        if href.startswith('#'):
            if href[1:] and href[1:] not in local_ids:
                broken_anchors.append((html_file, href))
            continue
        # For links with fragments
        target_file = resolve_path(html_file, href)
        # If anchor in uri: a.html#section
        parsed = urlparse(href)
        frag = parsed.fragment
        if not os.path.exists(target_file):
            missing_files.append((html_file, href, target_file))
        else:
            if frag:
                with open(target_file, 'r', encoding='utf-8') as fh2:
                    t = fh2.read()
                if f'id="{frag}"' not in t and f"id='{frag}'" not in t and f"name=\"{frag}\"" not in t:
                    broken_anchors.append((html_file, href))

    # Sources (images, scripts, css)
    for src in parser.srcs:
        src = src.strip()
        if not src:
            continue
        if not is_local_link(src):
            continue
        target_file = resolve_path(html_file, src)
        if not os.path.exists(target_file):
            missing_assets.append((html_file, src, target_file))

# Print report
print('\nReport:')
print('Missing files (hrefs):', len(missing_files))
for f,h,t in missing_files:
    print('  Page:', os.path.relpath(f, ROOT), '->', h, 'expected at', os.path.relpath(t, ROOT))

print('\nMissing assets (src/href for CSS/IMG/SCRIPT):', len(missing_assets))
for f,s,t in missing_assets:
    print('  Page:', os.path.relpath(f, ROOT), '->', s, 'expected at', os.path.relpath(t, ROOT))

print('\nBroken anchors (fragments):', len(broken_anchors))
for f,h in broken_anchors:
    print('  Page:', os.path.relpath(f, ROOT), '->', h)

# Exit with nonzero if issues found
count = len(missing_files) + len(missing_assets) + len(broken_anchors)
if count:
    print('\nIssues found:', count)
    sys.exit(2)
else:
    print('\nNo issues found')
    sys.exit(0)