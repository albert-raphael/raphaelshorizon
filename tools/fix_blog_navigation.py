#!/usr/bin/env python3
"""
Fix blog index links and post previous/next navigation.
- Build mapping from blog posts filenames to H1 title
- Update blog index Read More links to point to the correct post based on title matching
- Update each post's previous/next nav to point to the numeric adjacent posts if present, else back to index.html

Run: python tools/fix_blog_navigation.py
"""
import os
import re
from bs4 import BeautifulSoup

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BLOG_DIR = os.path.join(ROOT, 'frontend', 'pages', 'blog')

# Build mapping
posts = []
for fname in os.listdir(BLOG_DIR):
    if re.match(r'post-(\d+)\.html$', fname):
        num = int(re.match(r'post-(\d+)\.html$', fname).group(1))
        path = os.path.join(BLOG_DIR, fname)
        with open(path, 'r', encoding='utf-8') as fh:
            soup = BeautifulSoup(fh, 'html.parser')
        h1 = soup.find('h1')
        title = h1.string.strip() if h1 and h1.string else None
        posts.append((num, fname, title))

posts.sort(key=lambda x: x[0])
# title to filename
title_to_fname = {t: f for _, f, t in posts if t}
# numeric list for prev/next
nums = [n for n,_,_ in posts]

# Update index.html
index_path = os.path.join(BLOG_DIR, 'index.html')
with open(index_path, 'r', encoding='utf-8') as fh:
    soup = BeautifulSoup(fh, 'html.parser')

# Find article cards and try to map by title
articles = soup.select('.article-card')
for article in articles:
    title_elem = article.select_one('.article-title')
    if not title_elem:
        continue
    title_text = title_elem.get_text(strip=True)
    # find matching post by title
    if title_text in title_to_fname:
        link = article.select_one('a.read-more')
        if link:
            link['href'] = title_to_fname[title_text]

# Also fix featured article read link
featured = soup.select_one('.featured-article')
if featured:
    featured_title = featured.select_one('.article-title')
    if featured_title:
        ft = featured_title.get_text(strip=True)
        if ft in title_to_fname:
            a = featured.select_one('a.read-more')
            if a:
                a['href'] = title_to_fname[ft]

with open(index_path, 'w', encoding='utf-8') as fh:
    fh.write(str(soup))

# Update each post prev/next links
for i, (num, fname, title) in enumerate(posts):
    path = os.path.join(BLOG_DIR, fname)
    with open(path, 'r', encoding='utf-8') as fh:
        soup = BeautifulSoup(fh, 'html.parser')

    prev_num = posts[i-1][0] if i > 0 else None
    next_num = posts[i+1][0] if i < len(posts)-1 else None

    # find navigation links
    nav = soup.select_one('.post-navigation')
    if nav:
        prev_link = nav.find('a', class_='nav-link')
        next_link = nav.find_all('a', class_='nav-link')[-1] if len(nav.find_all('a', class_='nav-link'))>1 else None
        # prev
        if prev_link:
            if prev_num:
                prev_link['href'] = f'post-{prev_num}.html'
            else:
                prev_link['href'] = 'index.html'
        # next
        if next_link:
            if next_num:
                next_link['href'] = f'post-{next_num}.html'
            else:
                next_link['href'] = 'index.html'

    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(str(soup))

print('Updated blog index and post navigation')
