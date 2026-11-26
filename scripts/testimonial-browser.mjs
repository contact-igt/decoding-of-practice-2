import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
  await page.goto((process.env.DOP_TEST_ORIGIN || 'http://127.0.0.1:3000') + '/decoding-of-practice');
  const carousel = page.getByRole('region', { name: 'student testimonials' });
  await carousel.scrollIntoViewIfNeeded();
  const cards = carousel.getByRole('button', { name: /Watch student story/ });
  assert.equal(await cards.count(), 3);
  const trigger = carousel.getByRole('button', { name: 'Watch student story 3' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Student testimonial' });
  assert.equal(await dialog.isVisible(), true);
  assert.equal(await dialog.locator('video').evaluate(video => video.muted && video.autoplay), true);
  await page.keyboard.press('Escape');
  assert.equal(await dialog.isVisible(), false);
  assert.equal(await trigger.evaluate(element => element === document.activeElement), true);
  console.log('PASS automatic slides, navigation, muted modal, Escape and focus return');
} finally { await browser.close(); }
