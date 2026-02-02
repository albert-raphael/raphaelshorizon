#!/usr/bin/env python3
"""
Simple audit of frontend HTML pages for common best practices.
Checks:
- Each page has one <title>
- Each page has one <meta name="viewport">
- Each page has html[lang]
- Each page has at least one <h1>
- No <img> without alt text (or alt empty)
- External links with target="_blank" should have rel="noopener noreferrer"
- Flag uses of href="#" as placeholder links

Run from repo root: python tools/audit_public.py
"""
import os
import re
from html.parser import HTMLParser

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FRONTEND_DIR = os.path.join(ROOT, 'public')

class PageAudit(HTMLParser):
    def __init__(self):
        super().__init__()
        self.titles = 0
        self.has_viewport = False
        self.lang = None
        self.h1_count = 0
        self.imgs_missing_alt = []
        self.external_blank_no_rel = []
        self.has_html_lang = False
        self.placeholder_links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'title':
            self.titles += 1
        if tag == 'meta' and attrs.get('name') == 'viewport':
            self.has_viewport = True
        if tag == 'html' and 'lang' in attrs:
            self.has_html_lang = True
            self.lang = attrs['lang']
        if tag == 'h1':
            self.h1_count += 1
        if tag == 'img':
            alt = attrs.get('alt')
            if alt is None or alt.strip() == '':
                self.imgs_missing_alt.append(attrs.get('src', ''))
        if tag == 'a' and attrs.get('target') == '_blank':
            rel = attrs.get('rel','')
            if 'noopener' not in rel or 'noreferrer' not in rel:
                self.external_blank_no_rel.append(attrs.get('href',''))
        if tag == 'a' and attrs.get('href') == '#':
            self.placeholder_links.append(attrs.get('href'))


def audit_file(file_path):
    a = PageAudit()
    with open(file_path, 'r', encoding='utf-8') as fh:
        content = fh.read()
    a.feed(content)
    return a

html_files = []
for root, dirs, files in os.walk(FRONTEND_DIR):
    for f in files:
        if f.lower().endswith('.html'):
            html_files.append(os.path.join(root, f))

issues = []
print('Auditing {} pages...'.format(len(html_files)))
for hf in html_files:
    audit = audit_file(hf)
    page_issues = []

    if audit.titles == 0:
        page_issues.append('Missing <title>')
    if not audit.has_viewport:
        page_issues.append('Missing <meta name="viewport">')
    if not audit.has_html_lang:
        page_issues.append('<html> tag missing lang attribute')
    if audit.h1_count == 0:
        page_issues.append('No <h1> found')
    elif audit.h1_count > 1:
        page_issues.append('Multiple <h1> tags ({})'.format(audit.h1_count))
    if audit.imgs_missing_alt:
        page_issues.append('Images with missing/empty alt: {}'.format(', '.join(audit.imgs_missing_alt[:5])))
    if audit.external_blank_no_rel:
        page_issues.append('External links with target=_blank missing rel=noopener noreferrer: {}'.format(', '.join(audit.external_blank_no_rel[:5])))
    if audit.placeholder_links:
        page_issues.append('Placeholder links (href="#") count: {}'.format(len(audit.placeholder_links)))

    if page_issues:
        issues.append((os.path.relpath(hf, ROOT), page_issues))

print('\nAudit Results:')
if not issues:
    print('No issues detected')
else:
    for page, ps in issues:
        print('- {}: '.format(page))
        for p in ps:
            print('    -', p)

# Exit nonzero if issues found
if issues:
    raise SystemExit(1)
else:
    print('\nAll pages passed the audit')