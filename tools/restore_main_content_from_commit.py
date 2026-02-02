#!/usr/bin/env python3
"""
Restore page main content from a specified git commit into current HTML files under frontend.
- For each file in the list, fetch content at specified commit (git show <commit>:path)
- Extract the content between the end of the header (</header>) and start of footer (<footer), but keep header and footer from the current file
- If current file already appears to have a main content (checks for keywords), skip to prevent overwriting
- Backup current file to .bak before writing
- After restoration, print summary of restored files

Usage:
    python tools/restore_main_content_from_commit.py <commit> [<file-path> ...]

If no file paths are specified, script will restore a default list of known pages (blog index, posts, books, home, contact pages, profile pages).
"""

import os
import sys
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / 'frontend'

# Default list of known HTML pages to restore
DEFAULT_FILES = [
    'frontend/index.html',
    'frontend/pages/blog/index.html',
    'frontend/pages/blog/post-1.html',
    'frontend/pages/blog/post-2.html',
    'frontend/pages/blog/post-3.html',
    'frontend/pages/blog/post-4.html',
    'frontend/pages/blog/post-5.html',
    'frontend/pages/blog/post-6.html',
    'frontend/pages/blog/post-7.html',
    'frontend/pages/blog/post-8.html',
    'frontend/pages/blog/post-9.html',
    'frontend/pages/blog/post-10.html',
    'frontend/pages/blog/post-11.html',
    'frontend/pages/blog/post-12.html',
    'frontend/pages/blog/post-13.html',
    'frontend/pages/blog/post-14.html',
    'frontend/pages/blog/post-15.html',
    'frontend/pages/blog/blog-template.html',
    'frontend/pages/blog/categories.html',
    'frontend/pages/books/books.html',
    'frontend/pages/books/books-online.html',
    'frontend/pages/books/audio-books.html',
    'frontend/pages/contact/index.html',
    'frontend/pages/contact/contact-us.html',
    'frontend/pages/contact/speaking-request.html',
    'frontend/pages/contact/privacy-policy.html',
    'frontend/pages/about/index.html',
    'frontend/pages/about/about-us.html',
    'frontend/pages/about/assimagbe-albert-raphael.html',
    'frontend/pages/profile/index.html',
    'frontend/pages/profile/library.html',
    'frontend/pages/profile/subscription.html',
]

# Keywords that indicate the file already has main content; skip if found
MAIN_CONTENT_KEYWORDS = [
    'class="post-content"',
    'class="blog-content"',
    'class="books-hero"',
    'class="author-intro"',
    'class="post-article"',
    'class="book-hero"',
    '<article class="post-article"',
]


def git_show(commit, path):
    cmd = ['git', 'show', f'{commit}:{path}']
    try:
        out = subprocess.check_output(cmd, cwd=ROOT, stderr=subprocess.DEVNULL)
        return out.decode('utf-8', errors='replace')
    except subprocess.CalledProcessError:
        return None


def extract_main_content(html_text):
    # Extract content between </header> and <footer
    m = re.search(r'</header>([\s\S]*?)<footer', html_text, re.IGNORECASE)
    if m:
        content = m.group(1)
        return content
    # fallback: If footer not found, try capturing everything after </header>
    m2 = re.search(r'</header>([\s\S]*)', html_text, re.IGNORECASE)
    if m2:
        return m2.group(1)
    return None


def ensure_backup(path):
    bak = str(path) + '.bak'
    if not os.path.exists(bak):
        with open(path, 'rb') as src, open(bak, 'wb') as dst:
            dst.write(src.read())
    return bak


def restore_from_commit(commit, rel_path):
    file_path = ROOT / rel_path
    if not file_path.exists():
        print(f'WARN: path does not exist: {rel_path} (skipping)')
        return False

    # Read current file
    with open(file_path, 'r', encoding='utf-8') as fh:
        curr_data = fh.read()

    # Skip if file contains main content keywords
    if any(kw in curr_data for kw in MAIN_CONTENT_KEYWORDS):
        print(f'SKIP: {rel_path} already contains main content')
        return False

    older = git_show(commit, rel_path)
    if older is None:
        print(f'ERR: could not retrieve {rel_path} at commit {commit}')
        return False

    old_main = extract_main_content(older)
    if not old_main:
        print(f'ERR: could not find main content in historical file for {rel_path} at commit {commit}')
        return False

    # Insert old_main after current </header>
    out = re.sub(r'(</header>)', r'\1\n' + old_main + '\n', curr_data, count=1, flags=re.IGNORECASE)

    # Backup current file
    ensure_backup(file_path)

    with open(file_path, 'w', encoding='utf-8') as fh:
        fh.write(out)

    print(f'RESTORED: {rel_path} from {commit}')
    return True


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python tools/restore_main_content_from_commit.py <commit> [<file-path> ...]')
        sys.exit(1)

    commit = sys.argv[1]
    files = sys.argv[2:] if len(sys.argv) > 2 else DEFAULT_FILES

    restored = []
    for f in files:
        r = restore_from_commit(commit, f)
        if r:
            restored.append(f)

    print('\nDone. Restored files:')
    for r in restored:
        print(' -', r)
    if not restored:
        print(' (none)')
