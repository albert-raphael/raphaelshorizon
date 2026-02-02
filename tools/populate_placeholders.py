#!/usr/bin/env python3
"""
Populate empty placeholder HTML files with minimal content to ensure they are valid pages.
- Blog posts (post-7, post-8, post-10..15): copy from blog-template and set title + content.
- Profile pages: copy from index.html and fill with a basic profile layout.

Run: python tools/populate_placeholders.py
"""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / 'frontend'
BLOG_TEMPLATE = FRONTEND / 'pages' / 'blog' / 'blog-template.html'
MAIN_INDEX = FRONTEND / 'index.html'

# Read template content
with open(BLOG_TEMPLATE, 'r', encoding='utf-8') as fh:
    blog_template = fh.read()

with open(MAIN_INDEX, 'r', encoding='utf-8') as fh:
    main_index = fh.read()

# Replace placeholders for title/subtitle/content

def create_blog_post(post_path, title='Coming Soon', subtitle='Content coming soon'):
    content = blog_template
    content = content.replace('POST_TITLE', title)
    content = content.replace('POST_SUBTITLE', subtitle)
    # Minimal body replacement: replace the placeholder content with a coming soon message
    content = content.replace('<p>Start your blog post content here. Just write your paragraphs and wrap them in &lt;p&gt; tags.</p>', '<p>This article is coming soon. Stay tuned for updates.</p>')
    with open(post_path, 'w', encoding='utf-8') as fh:
        fh.write(content)

# Create blog posts if empty
blog_dir = FRONTEND / 'pages' / 'blog'
for n in range(1, 16):
    path = blog_dir / f'post-{n}.html'
    if path.exists():
        if path.stat().st_size == 0:
            create_blog_post(path, title=f'Post {n} — Coming Soon', subtitle='Coming soon — content is being prepared')
            print('Populated', path)
    else:
        # If the file doesn't exist, create one as well?
        # We'll create only for existing placeholders
        pass

# Populate profile pages if empty
profile_dir = FRONTEND / 'pages' / 'profile'
for fname in ['index.html', 'library.html', 'subscription.html']:
    path = profile_dir / fname
    if path.exists() and path.stat().st_size == 0:
        # Simple profile page using main index layout: replace main content area with placeholder
        content = main_index
        # Add page-specific title
        title = fname.replace('.html', '').capitalize()
        content = content.replace('<title>Raphael\'s Horizon</title>', f'<title>{title} — Raphael\'s Horizon</title>')
        # Replace main hero with a small heading
        content = content.replace('<main class="site-main">', f'<main class="site-main">\n    <section class="profile-hero">\n        <div class="container"><h1>{title}</h1><p>Content coming soon</p></div>\n    </section>')
        with open(path, 'w', encoding='utf-8') as fh:
            fh.write(content)
        print('Populated', path)

print('Done')
