#!/usr/bin/env python3
"""
Insert default content into profile pages when they lack main content.
- Adds a hero, main content, and a sample subscription/library layout.
- Backs up original files to .bak
"""

import os
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / 'frontend'

PAGES = [
    'frontend/pages/profile/index.html',
    'frontend/pages/profile/library.html',
    'frontend/pages/profile/subscription.html',
]

TEMPLATES = {
    'frontend/pages/profile/index.html': '''
    <!-- PROFILE HERO -->
    <section class="profile-hero">
        <div class="container">
            <div class="section-header">
                <h1>My Profile</h1>
                <p>Welcome to your profile. Manage your account, view library, and manage subscriptions.</p>
            </div>
        </div>
    </section>

    <section class="profile-content">
        <div class="container">
            <div class="profile-actions">
                <a href="subscription.html" class="btn btn-primary">View Subscription</a>
                <a href="library.html" class="btn btn-secondary">My Library</a>
            </div>
        </div>
    </section>
    ''',

    'frontend/pages/profile/library.html': '''
    <!-- PROFILE LIBRARY -->
    <section class="library-hero">
        <div class="container">
            <div class="section-header">
                <h1>My Library</h1>
                <p>Your purchased and saved books are listed here.</p>
            </div>
        </div>
    </section>

    <section class="library-content">
        <div class="container">
            <div class="books-grid">
                <div class="book-card">
                    <div class="book-cover"><img src="../../assets/images/light-after-the-tunnel-english.jpg" alt="The Light After the Tunnel"/></div>
                    <div class="book-info">
                        <h4>The Light After the Tunnel</h4>
                        <p>English edition</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
    ''',

    'frontend/pages/profile/subscription.html': '''
    <!-- PROFILE SUBSCRIPTION -->
    <section class="subscription-hero">
        <div class="container">
            <div class="section-header">
                <h1>Subscription Plans</h1>
                <p>Choose a plan that suits you.</p>
            </div>
        </div>
    </section>

    <section class="subscription-content">
        <div class="container">
            <div class="plans-grid">
                <div class="plan-card">
                    <h4>Free</h4>
                    <p>Access to limited resources</p>
                </div>
                <div class="plan-card">
                    <h4>Premium</h4>
                    <p>Full access to library and premium content</p>
                </div>
            </div>
        </div>
    </section>
    ''',
}


for p in PAGES:
    fp = ROOT / p
    if not fp.exists():
        print('Missing', p)
        continue
    with open(fp, 'r', encoding='utf-8') as fh:
        data = fh.read()
    if r'class="post-content"' in data or r'class="profile-content"' in data or 'class="library-hero"' in data:
        print('Skip, already has content:', p)
        continue
    # Insert template after </header>
    new = re.sub(r'(</header>)', r'\1\n' + TEMPLATES[p] + '\n', data, count=1, flags=re.IGNORECASE)
    bak = str(fp) + '.bak'
    if not os.path.exists(bak):
        with open(bak, 'wb') as bfh:
            bfh.write(data.encode('utf-8'))
    with open(fp, 'w', encoding='utf-8') as fh:
        fh.write(new)
    print('Inserted content into', p)

print('Done')
