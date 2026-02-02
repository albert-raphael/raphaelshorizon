#!/usr/bin/env python3
"""
Restore header navigation (`<ul class="nav-menu">` ... `</ul>`) across frontend HTML files using a canonical snippet from `temp_original_blog_index.html`.
- Reads the snippet from temp_original_blog_index.html (which contains a complete nav).
- Replaces `<ul class="nav-menu">` ... `</ul>` in all frontend HTML pages with the canonical snippet.

Caution: This script modifies files in-place. Make backups or commit changes before running.
"""
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FRONTEND = os.path.join(ROOT, 'frontend')
TEMPLATE = os.path.join(ROOT, 'temp_original_blog_index.html')

# Read template and extract the <ul class="nav-menu"> ... </ul> snippet
def read_template(path):
    encs = ['utf-8', 'utf-16', 'iso-8859-1', 'latin-1']
    last_error = None
    for enc in encs:
        try:
            with open(path, 'r', encoding=enc) as f:
                return f.read()
        except Exception as e:
            last_error = e
            continue
    # If all failed, raise the last error
    raise last_error

template = read_template(TEMPLATE)

m = re.search(r'(<ul\s+class="nav-menu">[\s\S]*?</ul>)', template, re.IGNORECASE)
if not m:
    print('Error: Could not find nav snippet in template file')
    exit(1)

nav_snippet = m.group(1)

# Normalize nav_snippet to canonical absolute paths for consistent per-file relative computation
def normalize_nav(snippet):
    replacements = [
        ('href="../../index.html"', 'href="/index.html"'),
        ('href="../books/books.html"', 'href="/pages/books/books.html"'),
        ('href="../books/books-online.html"', 'href="/pages/books/books-online.html"'),
        ('href="../books/audio-books.html"', 'href="/pages/books/audio-books.html"'),
        ('href="../about/about-us.html"', 'href="/pages/about/about-us.html"'),
        ('href="../about/assimagbe-albert-raphael.html"', 'href="/pages/about/assimagbe-albert-raphael.html"'),
        ('href="../contact/index.html"', 'href="/pages/contact/index.html"'),
        ('href="../contact/speaking-request.html"', 'href="/pages/contact/speaking-request.html"'),
        ('href="../contact/privacy-policy.html"', 'href="/pages/contact/privacy-policy.html"'),
        ('href="index.html"', 'href="/pages/blog/index.html"'),
        ('href="categories.html"', 'href="/pages/blog/categories.html"'),
        ('href="../profile/index.html"', 'href="/pages/profile/index.html"'),
        ('href="../profile/subscription.html"', 'href="/pages/profile/subscription.html"'),
        ('href="../profile/library.html"', 'href="/pages/profile/library.html"')
    ]
    out = snippet
    for src, dst in replacements:
        out = out.replace(src, dst)
    return out

nav_snippet = normalize_nav(nav_snippet)

# Write a normalized UTF-8 version of the template for future runs
try:
    with open(os.path.join(ROOT, 'temp_original_blog_index.utf8.html'), 'w', encoding='utf-8') as wf:
        wf.write(template)
except Exception:
    pass

# A helper to convert a canonical absolute path like '/pages/books/books.html' into a relative
# path from the current page file. We'll compute a proper relative path so file:// navigation
# works for local viewing.
def to_relative(href_abs, page_path):
    # If href_abs starts with /, treat it as rooted under FRONTEND (strip leading /)
    if href_abs.startswith('/'):
        target = os.path.join(FRONTEND, href_abs.lstrip('/'))
    else:
        target = os.path.join(FRONTEND, href_abs)
    rel = os.path.relpath(target, os.path.dirname(page_path)).replace('\\', '/')
    return rel

# Replace snippet in all frontend HTML files
changed_files = []
for root, dirs, files in os.walk(FRONTEND):
    for fname in files:
        if not fname.lower().endswith('.html'):
            continue
        fpath = os.path.join(root, fname)
        with open(fpath, 'r', encoding='utf-8') as fh:
            data = fh.read()
        # Check for existing <ul class="nav-menu"> snippet
        if re.search(r'<ul\s+class="nav-menu">[\s\S]*?</ul>', data, re.IGNORECASE):
            # Build a per-file version of nav_snippet where root-based hrefs become relative
            per_file_snippet = nav_snippet
            # A list of canonical absolute paths we expect in the normalized nav_snippet.
            # Important: sort by length-descending to avoid accidental partial substitutions
            replaces = [
                '/pages/books/books-online.html',
                '/pages/books/audio-books.html',
                '/pages/books/books.html',
                '/pages/about/assimagbe-albert-raphael.html',
                '/pages/about/about-us.html',
                '/pages/contact/privacy-policy.html',
                '/pages/contact/speaking-request.html',
                '/pages/contact/index.html',
                '/pages/profile/subscription.html',
                '/pages/profile/library.html',
                '/pages/profile/index.html',
                '/pages/blog/categories.html',
                '/pages/blog/index.html',
                '/index.html',
            ]
            # Sort by length to ensure /pages/blog/index.html is replaced before /index.html
            # Use a regex to replace href="/path" occurrences only, to avoid partial substring replacement
            import html
            import re as _re
            for abs_path in sorted(replaces, key=len, reverse=True):
                rel_path = to_relative(abs_path, fpath)
                # replace only within href attributes
                per_file_snippet = _re.sub(r'(href=["\'])' + _re.escape(abs_path) + r'(["\'])', r"\1" + rel_path + r"\2", per_file_snippet)

            new = re.sub(r'<ul\s+class="nav-menu">[\s\S]*?</ul>', per_file_snippet, data, flags=re.IGNORECASE)
            if new != data:
                with open(fpath, 'w', encoding='utf-8') as fh:
                    fh.write(new)
                changed_files.append(os.path.relpath(fpath, ROOT))

print('Restored header in files:')
for c in changed_files:
    print('  ', c)
print('Done')
