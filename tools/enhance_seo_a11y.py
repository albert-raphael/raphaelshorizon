#!/usr/bin/env python3
"""
Enhance SEO and accessibility for all HTML pages under frontend/:
- Ensure <html lang="en"> exists
- Ensure <title> exists (use H1 or filename as fallback)
- Ensure <meta name="viewport"> exists
- Add a H1 if missing (use title fallback)
- Add alt attributes for <img> if missing or empty
- Ensure external links with target="_blank" include rel="noopener noreferrer"

Run from repo root: python tools/enhance_seo_a11y.py
"""
import os
from bs4 import BeautifulSoup

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FRONTEND = os.path.join(ROOT, 'frontend')

html_files = []
for root, dirs, files in os.walk(FRONTEND):
    for f in files:
        if f.lower().endswith('.html'):
            html_files.append(os.path.join(root, f))

changed = []

for page in html_files:
    with open(page, 'r', encoding='utf-8') as fh:
        soup = BeautifulSoup(fh, 'html.parser')

    modified = False
    # lang on html
    html_tag = soup.find('html')
    if html_tag and not html_tag.get('lang'):
        html_tag['lang'] = 'en'
        modified = True

    # title
    head = soup.find('head')
    title_tag = head.find('title') if head else None
    h1_tag = soup.find('h1')
    if not title_tag:
        # try to add title based on first h1 or filename
        if h1_tag and h1_tag.string:
            title_text = h1_tag.string.strip()
        else:
            # fallback to filename
            title_text = os.path.splitext(os.path.basename(page))[0].replace('-', ' ').replace('_', ' ').title()
        new_title = soup.new_tag('title')
        new_title.string = f"{title_text} — Raphael's Horizon"
        if head:
            head.append(new_title)
            modified = True

    # viewport
    viewport = head.find('meta', attrs={'name': 'viewport'}) if head else None
    if not viewport and head:
        meta = soup.new_tag('meta', attrs={'name': 'viewport', 'content': 'width=device-width, initial-scale=1.0'})
        head.append(meta)
        modified = True

    # H1 present
    if not h1_tag:
        # find main title via title tag
        title_text = title_tag.string if title_tag else None
        if not title_text and head:
            t = head.find('title')
            title_text = t.string if t else None
        if not title_text:
            title_text = os.path.splitext(os.path.basename(page))[0].replace('-', ' ').title()
        # Insert H1 at top of body
        body = soup.find('body')
        if body:
            new_h1 = soup.new_tag('h1')
            new_h1.string = title_text
            body.insert(0, new_h1)
            modified = True

    # Images alt text
    images = soup.find_all('img')
    for img in images:
        alt = img.get('alt')
        if alt is None or alt.strip() == '':
            src = img.get('src', '')
            # use filename for alt
            alt_text = os.path.splitext(os.path.basename(src))[0].replace('-', ' ').replace('_', ' ').title()
            img['alt'] = alt_text
            modified = True

    # external target rel
    anchors = soup.find_all('a', target=True)
    for a in anchors:
        if a.get('target') == '_blank':
            rel = a.get('rel', '')
            if isinstance(rel, list):
                rel = ' '.join(rel)
            if 'noopener' not in rel or 'noreferrer' not in rel:
                new_rel = (rel + ' noopener noreferrer').strip()
                a['rel'] = new_rel
                modified = True

    if modified:
        with open(page, 'w', encoding='utf-8') as fh:
            fh.write(str(soup))
        changed.append(os.path.relpath(page, ROOT))

print('Updated files:')
for c in changed:
    print('  ', c)
print('Done')
