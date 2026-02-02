#!/usr/bin/env python3
"""
Apply targeted replacements to HTML files under frontend/ to fix broken links and assets.
"""
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FRONTEND_DIR = os.path.join(ROOT, 'frontend')

replacements = [
    # 1. Replace javascript:void(0) with '#'
    (re.compile(r"javascript:void\(0\);?"), '#'),

    # 2. Fix books links
    (re.compile(r'href="books\.html"'), 'href="/pages/books/books.html"'),
    (re.compile(r'href="books-online\.html"'), 'href="/pages/books/books-online.html"'),
    (re.compile(r'href="audio-books\.html"'), 'href="/pages/books/audio-books.html"'),
    (re.compile(r'href="../books\.html"'), 'href="/pages/books/books.html"'),
    (re.compile(r'href="../books/books\.html"'), 'href="/pages/books/books.html"'),

    # 3. Fix contact
    (re.compile(r'href="contact-us\.html"'), 'href="/pages/contact/contact-us.html"'),
    (re.compile(r'href="../contact/index\.html"'), 'href="/pages/contact/index.html"'),
    (re.compile(r'href="../contact/speaking-request\.html"'), 'href="/pages/contact/speaking-request.html"'),
    (re.compile(r'href="../contact/privacy-policy\.html"'), 'href="/pages/contact/privacy-policy.html"'),

    # 4. Fix about
    (re.compile(r'href="about-us\.html"'), 'href="/pages/about/about-us.html"'),
    (re.compile(r'href="assimagbe-albert-raphael\.html"'), 'href="/pages/about/assimagbe-albert-raphael.html"'),

    # 5. Fix blog
    (re.compile(r'href="blog-template\.html"'), 'href="/pages/blog/blog-template.html"'),
    (re.compile(r'href="categories\.html"'), 'href="/pages/blog/categories.html"'),
    (re.compile(r'href="post-(\d+)\.html"'), 'href="/pages/blog/post-\1.html"'),
    (re.compile(r'href="blog-post-(\d+)\.html"'), 'href="/pages/blog/post-\1.html"'),

    # 6. Fix profile
    (re.compile(r'href="../profile/index\.html"'), 'href="/pages/profile/index.html"'),
    (re.compile(r'href="../profile/subscription\.html"'), 'href="/pages/profile/subscription.html"'),
    (re.compile(r'href="../profile/library\.html"'), 'href="/pages/profile/library.html"'),

    # 7. Fix root index
    (re.compile(r'href="../../index\.html"'), 'href="/index.html"'),
    (re.compile(r'href="../../index\.html"'), 'href="/index.html"'),
    (re.compile(r'href="../../index\.html"'), 'href="/index.html"'),
    (re.compile(r'href="../../index\.html"'), 'href="/index.html"'),

    # 8. JS replacements
    (re.compile(r'src="\.{2}/\.{2}/js/main\.js"'), 'src="/js/scripts.js"'),
    (re.compile(r'src="\.{1}/js/main\.js"'), 'src="/js/scripts.js"'),
    (re.compile(r'src="\.{2}/\.{2}/js/cookies\.js"'), 'src="/js/cookies.js"'),
    (re.compile(r'src="\.{2}/\.{2}/js/auth\.js"'), 'src="/js/auth.js"'),
    (re.compile(r'src="\.\./js/main\.js"'), 'src="/js/scripts.js"'),
    (re.compile(r'src="\.\./js/cookies\.js"'), 'src="/js/cookies.js"'),
    (re.compile(r'src="\.\./js/auth\.js"'), 'src="/js/auth.js"'),

    # 9. Image mappings
    (re.compile(r'assets/images/blog-1\.jpg'), 'assets/images/blog-post-1.png'),
    (re.compile(r'assets/images/blog-2\.jpg'), 'assets/images/blog-post-2.jpg'),
    (re.compile(r'assets/images/blog-3\.jpg'), 'assets/images/blog-post-3.jpg'),
    (re.compile(r'assets/images/blog-4\.jpg'), 'assets/images/blog-post-4.jpg'),
    (re.compile(r'assets/images/blog-5\.jpg'), 'assets/images/blog-post-5.jpg'),
    (re.compile(r'assets/images/blog-6\.jpg'), 'assets/images/blog-post-6.jpg'),
    (re.compile(r'assets/images/blog-featured\.jpg'), 'assets/images/blog-post-1.png'),
    (re.compile(r'assets/images/blog-image\.jpg'), 'assets/images/blog-post-1.png'),
    (re.compile(r'assets/images/blank"'), 'assets/images/quote-1.png"'),
    (re.compile(r'assets/images/author-raphael\.jpg'), 'assets/images/raphael.png'),

    # 10. Contact CTA fix
    (re.compile(r'href="\.{2}/books\.html"'), 'href="/pages/books/books.html"'),
    (re.compile(r'href="\.{2}/books/books-online\.html"'), 'href="/pages/books/books-online.html"'),
    (re.compile(r'href="\.{2}/books/audio-books\.html"'), 'href="/pages/books/audio-books.html"'),
    (re.compile(r'href="\.{2}/contact/index\.html"'), 'href="/pages/contact/index.html"'),

    # 11. remove relative leftover that point to pages root like ../books.html
    (re.compile(r'href="\.{1}/books\.html"'), 'href="/pages/books/books.html"'),
    # Replace invalid blog post placeholders (post-.html) and other placeholder links
    (re.compile(r'href="/pages/blog/post-[^\"]+\.html"'), 'href="#"'),
    (re.compile(r'href="previous-post\.html"'), 'href="#"'),
    (re.compile(r'href="next-post\.html"'), 'href="#"'),
]

# Process files
changed_files = []
for root, dirs, files in os.walk(FRONTEND_DIR):
    for f in files:
        if not f.lower().endswith('.html') and not f.lower().endswith('.css') and not f.lower().endswith('.js'):
            continue
        file_path = os.path.join(root, f)
        with open(file_path, 'r', encoding='utf-8') as fh:
            content = fh.read()
        new_content = content
        for pattern, repl in replacements:
            new_content = pattern.sub(repl, new_content)
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as fh:
                fh.write(new_content)
            changed_files.append(os.path.relpath(file_path, ROOT))

print('Updated files:')
for cf in changed_files:
    print(' ', cf)
print('\nDone')
