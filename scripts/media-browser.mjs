import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  let requests = 0;
  page.on('request', request => { if (/youtube|ytimg|googlevideo/.test(request.url())) requests++; });
  await page.route('https://www.youtube.com/iframe_api', route => route.fulfill({ contentType: 'text/javascript', body: `
    window.YT={Player:class {constructor(el,o){this.o=o;this.f=document.createElement('iframe');el.replaceWith(this.f);setTimeout(()=>o.events.onReady({target:this}),0)}
    getIframe(){return this.f} mute(){window.muted=true} playVideo(){window.played=true} pauseVideo(){} destroy(){window.destroyed=true;this.f.remove()}}};
    window.onYouTubeIframeAPIReady();` }));
  await page.goto((process.env.DOP_TEST_ORIGIN || 'http://127.0.0.1:3000') + '/decoding-of-practice');
  const clip = page.locator('.academy-video').first();
  await clip.scrollIntoViewIfNeeded();
  assert.equal(requests, 0);
  const trigger = clip.getByRole('button', { name: /Play video:/ });
  await trigger.click();
  const dialog = clip.getByRole('dialog');
  assert.equal(await dialog.isVisible(), true);
  await page.waitForFunction(() => window.played);
  assert.equal(await page.evaluate(() => window.muted), true);
  const bounds = await dialog.boundingBox();
  assert.ok(bounds && Math.abs(bounds.x + bounds.width / 2 - 195) < 2 && Math.abs(bounds.y + bounds.height / 2 - 422) < 2);
  await page.keyboard.press('Escape');
  assert.equal(await dialog.isVisible(), false);
  await page.waitForFunction(() => window.destroyed);
  assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
  const caption = await clip.locator('figcaption strong').boundingBox();
  assert.ok(caption);
  await page.mouse.click(caption.x + caption.width / 2, caption.y + caption.height / 2);
  assert.equal(await dialog.isVisible(), true);
  await dialog.getByRole('button', { name: 'Close video' }).click();
  console.log('PASS click-to-play modal, consent, Escape, player cleanup and focus return');
} finally { await browser.close(); }
