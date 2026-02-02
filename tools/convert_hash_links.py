#!/usr/bin/env python3
"""
Convert anchors with href="#" used as UI controls to <button> elements while preserving class, onclick, role, aria attributes.
- Converts anchors where href="#" and either onclick exists OR class contains 'dropdown-toggle' OR class contains 'modal' or 'btn-cookie-preferences' etc.
- Preserves inner HTML content.
- Leaves other href="#" anchors unchanged (if they are real anchors for same-page links, but those are usually '#id' and not '#').

Caution: This naively transforms strings; validate resulting HTML if page relies on 'a' selectors.
"""
import os
import re
from bs4 import BeautifulSoup

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FRONTEND = os.path.join(ROOT, 'frontend')

html_files = []
for root, dirs, files in os.walk(FRONTEND):
    for f in files:
        if f.lower().endswith('.html'):
            html_files.append(os.path.join(root, f))

converted = []
for page in html_files:
    with open(page, 'r', encoding='utf-8') as fh:
        content = fh.read()
    soup = BeautifulSoup(content, 'html.parser')
    changed = False
    anchors = soup.find_all('a', href=True)
    for a in anchors:
        href = a.get('href')
        if href and href.strip() == '#':
            # Heuristics: convert only if onclick present, or class indicates UI control (dropdown-toggle, mobile-menu-toggle, cookie preferences), or element has aria-controls
            classes = a.get('class') or []
            onclick = a.get('onclick')
            convert_if = False
            if onclick:
                convert_if = True
            if any('dropdown-toggle' in c or 'mobile-menu-toggle' in c or 'btn-cookie-preferences' in c or 'cookie-preferences' in c or 'modal-close' in c for c in classes):
                convert_if = True
            if a.get('aria-controls'):
                convert_if = True
            # Convert pagination anchors (href="#") to buttons if they are inside a .pagination parent or contain numeric text
            parent = a.find_parent()
            inner_text = (a.get_text() or '').strip()
            if parent and parent.get('class') and any('pagination' in c for c in parent.get('class')):
                convert_if = True
            if re.match(r'^\d+$', inner_text):
                convert_if = True
            # Convert anchors that are visually buttons
            if any('btn' in c or 'btn-' in c for c in classes):
                convert_if = True
            # Convert placeholder nav links used for pagination or post navigation
            if any('nav-link' in c for c in classes) and not onclick:
                convert_if = True
            if convert_if:
                # Create a button element
                btn = soup.new_tag('button')
                # Transfer attributes except href and attributes not valid on <button>
                invalid_attrs = {'href', 'target', 'rel', 'download', 'hreflang', 'ping'}
                for attr, val in a.attrs.items():
                    if attr in invalid_attrs:
                        continue
                    btn[attr] = val
                # Ensure type=button to avoid form submit
                btn['type'] = 'button'
                # Replace element preserving contents (append children)
                for child in list(a.contents):
                    btn.append(child)
                a.replace_with(btn)
                changed = True
    if changed:
        with open(page, 'w', encoding='utf-8') as fh:
            fh.write(str(soup))
        converted.append(os.path.relpath(page, ROOT))

print('Converted files:')
for c in converted:
    print('  ', c)
print('Done')
