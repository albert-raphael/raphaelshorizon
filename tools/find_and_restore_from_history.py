#!/usr/bin/env python3
"""
For each file specified or from DEFAULT_FILES, look at its commit history and restore main content (</header>.. <footer>) from the latest commit that contains it.
"""
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / 'frontend'

DEFAULT_FILES = [
    'frontend/pages/blog/post-7.html',
    'frontend/pages/blog/post-8.html',
    'frontend/pages/blog/post-10.html',
    'frontend/pages/blog/post-11.html',
    'frontend/pages/blog/post-12.html',
    'frontend/pages/blog/post-13.html',
    'frontend/pages/blog/post-14.html',
    'frontend/pages/blog/post-15.html',
    'frontend/pages/profile/index.html',
    'frontend/pages/profile/library.html',
    'frontend/pages/profile/subscription.html',
]

MAIN_CONTENT_KEYWORDS = [
    'class="post-content"',
    'class="blog-content"',
    'class="books-hero"',
    'class="author-intro"',
    'class="post-article"',
    'class="book-hero"',
    '<article class="post-article"',
]


def git_commits_for_file(path):
    cmd = ['git', 'log', '--pretty=%H', '--', path]
    out = subprocess.check_output(cmd, cwd=ROOT, stderr=subprocess.DEVNULL)
    commits = out.decode('utf-8', errors='replace').strip().split('\n')
    return commits if commits != [''] else []


def git_show(commit, path):
    cmd = ['git', 'show', f'{commit}:{path}']
    try:
        out = subprocess.check_output(cmd, cwd=ROOT, stderr=subprocess.DEVNULL)
        return out.decode('utf-8', errors='replace')
    except subprocess.CalledProcessError:
        return None


def extract_main_content(html_text):
    m = re.search(r'</header>([\s\S]*?)<footer', html_text, re.IGNORECASE)
    if m:
        return m.group(1)
    m2 = re.search(r'</header>([\s\S]*)', html_text, re.IGNORECASE)
    return m2.group(1) if m2 else None


def ensure_backup(path):
    bak = str(path) + '.bak'
    if not os.path.exists(bak):
        with open(path, 'rb') as src, open(bak, 'wb') as dst:
            dst.write(src.read())
    return bak


if __name__ == '__main__':
    files = sys.argv[1:] or DEFAULT_FILES
    restored = []
    for f in files:
        print('Checking', f)
        full = ROOT / f
        if not full.exists():
            print('  SKIP: not exists')
            continue
        with open(full, 'r', encoding='utf-8') as fh:
            curr = fh.read()
        if any(k in curr for k in MAIN_CONTENT_KEYWORDS):
            print('  SKIP: already has main content')
            continue
        commits = git_commits_for_file(f)
        if not commits:
            print('  No commits for file')
            continue
        found_commit = None
        found_content = None
        for c in commits:
            h = git_show(c, f)
            if not h:
                continue
            if any(k in h for k in MAIN_CONTENT_KEYWORDS):
                found_commit = c
                found_content = extract_main_content(h)
                break
        if not found_commit:
            print('  No commit contains main content')
            continue
        out = re.sub(r'(</header>)', r'\1\n' + found_content + '\n', curr, count=1, flags=re.IGNORECASE)
        ensure_backup(full)
        with open(full, 'w', encoding='utf-8') as fh:
            fh.write(out)
        restored.append(f)
        print('  RESTORED from', found_commit)

    print('\nDone. Restored:', restored)
