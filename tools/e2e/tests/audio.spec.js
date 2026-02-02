const { test, expect } = require('@playwright/test');

const BASE = 'http://127.0.0.1:5500/frontend';
const AUDIO_PAGE = '/pages/books/audio-books/audio-books.html';

test.describe('Audio books smoke tests', () => {
  test('unauthenticated users are gated from listening', async ({ page }) => {
    await page.goto(BASE + AUDIO_PAGE);
    await page.waitForSelector('.audio-book-card', { timeout: 5000 });

    // Click first play button
    const firstBtn = await page.$('.play-audio-btn');
    await firstBtn.click();

    // Check returnTo session value set
    const returnTo = await page.evaluate(() => sessionStorage.getItem('returnTo'));
    expect(returnTo).toBeTruthy();
  });
});
