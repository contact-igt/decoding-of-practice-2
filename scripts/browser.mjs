import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const axe = require.resolve('axe-core/axe.min.js');
const origin = process.env.DOP_TEST_ORIGIN || 'http://127.0.0.1:3000';
const path = '/decoding-of-practice';
const route = origin + path;
const output = process.env.DOP_TEST_OUTPUT || 'outputs';
const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePath = process.env.CHROME_PATH || (existsSync(macChrome) ? macChrome : undefined);
const browser = await chromium.launch({ executablePath, headless: true });
const widths = [320, 375, 390, 430, 768, 1024, 1440, 1920];
mkdirSync(output, { recursive: true });

async function errors(page) {
  await page.addScriptTag({ path: axe });
  return page.evaluate(async () => {
    const result = await window.axe.run({ runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return result.violations.map(issue => ({ id: issue.id, nodes: issue.nodes.map(node => node.target) }));
  });
}

try {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: width < 700 ? 844 : 980 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
    const page = await context.newPage();
    const consoleErrors = [];
    const resourceErrors = [];
    page.on('pageerror', error => consoleErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text() + ' ' + message.location().url); });
    page.on('response', response => { if (response.url().startsWith(origin) && response.status() >= 400) resourceErrors.push(response.url() + ' ' + response.status()); });
    assert.equal((await page.goto(route, { waitUntil: 'networkidle' })).status(), 200);
    assert.match(await page.locator('h1').innerText(), /You Studied Law/);
    const metrics = await page.evaluate(async () => {
      await document.fonts.ready;
      for (const image of document.querySelectorAll('img')) image.loading = 'eager';
      await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
      const brokenImages = [...document.images].filter(image => image.naturalWidth === 0).map(image => image.src);
      const brokenAnchors = [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(link => !document.getElementById(link.slice(1)));
      return { overflow: document.documentElement.scrollWidth > innerWidth, brokenImages, brokenAnchors, heroCtaBottom: document.querySelector('.hero .button').getBoundingClientRect().bottom };
    });
    assert.equal(metrics.overflow, false, 'horizontal overflow at ' + width);
    assert.deepEqual(metrics.brokenImages, []);
    assert.deepEqual(metrics.brokenAnchors, []);
    assert.ok(metrics.heroCtaBottom < (width < 700 ? 844 : 980), 'hero conversion action below fold');
    if (width === 390 || width === 1440) {
      assert.deepEqual(await errors(page), [], 'axe violations at ' + width);
      await page.screenshot({ path: join(output, width === 390 ? 'vls-dop-mobile.png' : 'vls-dop-desktop.png'), fullPage: true, animations: 'disabled' });
      if (width === 1440) await page.screenshot({ path: join(output, 'vls-dop-preview.png'), animations: 'disabled' });
    }
    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(resourceErrors, []);
    console.log('PASS layout, images, anchors and console at ' + width + 'px');
    await context.close();
  }

  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noJs.newPage();
  await staticPage.goto(route);
  await staticPage.locator('#case-journey summary').filter({ hasText: 'Facts and legal analysis' }).click();
  assert.equal(await staticPage.getByText('Put the purchase, complaints and responses', { exact: false }).isVisible(), true);
  await noJs.close();
  console.log('PASS native case journey with JavaScript disabled');

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  await page.goto(origin + '/?variant=B&utm_source=meta&utm_campaign=pilot&fbclid=sample');
  assert.match(await page.locator('h1').innerText(), /First Client/);
  await page.goto(route + '?variant=C&utm_source=google&gclid=click_123');
  assert.match(await page.locator('h1').innerText(), /LLB Was the Beginning/);
  await page.goto(route + '?variant=E');
  assert.match(await page.locator('h1').innerText(), /You Studied Law/);
  assert.equal(await page.locator('text=₹35,000').count(), 0);
  assert.equal(await page.locator('#experiences').count(), 0);
  assert.equal(await page.locator('#curriculum a[download]').count(), 0);
  await page.goto(route + '?variant=B');
  await page.locator('.mobile-nav summary').focus();
  await page.keyboard.press('Enter');
  assert.ok(await page.locator('.mobile-nav nav').isVisible());
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.mobile-nav nav').isVisible(), false);
  await page.locator('.mobile-nav summary').click();
  await page.getByRole('navigation', { name: 'Mobile programme navigation' }).getByRole('link', { name: 'Curriculum' }).click();
  assert.match(page.url(), /#curriculum$/);
  assert.equal(await page.locator('.mobile-nav nav').isVisible(), false);
  for (const [scope, label] of [['#case-journey','Litigation strategy'], ['#curriculum', 'Civil Procedure'], ['#faqs','What is the fee?']]) {
    const summary = page.locator(scope + ' summary').filter({ hasText: label });
    await summary.focus();
    await page.keyboard.press('Enter');
    assert.equal(await summary.locator('..').getAttribute('open'), '');
  }
  await page.locator('.hero .button').click();
  assert.equal(await page.locator('a[data-track="assessment_cta_click"]').evaluateAll(links => links.every(a => ['#admission','#form-title'].includes(a.hash))),true);
  const submit=page.getByRole('button',{name:'Register & Start Assessment'});
  await submit.click();
  await page.getByText('Enter your full name.').waitFor();
  await page.getByLabel('Full name').fill('Fictional Applicant');
  const phone='+1202'+String(Date.now()).slice(-7);
  await page.getByLabel('Mobile number').fill(phone);
  await page.getByLabel('Current professional status').selectOption('Law graduate');
  await page.locator('#dop-consent').check();
  await page.locator('.admission-form').screenshot({path:join(output,'m7-registration.png')});
  let retryKey, failures=0;
  await page.route('**/api/dop-enquiry',async r=>{
    if(r.request().method()==='POST' && !failures++){
      retryKey=r.request().headers()['idempotency-key'];
      const body=r.request().postDataJSON();
      assert.equal(body.attribution.first.utm_source,'meta'); assert.equal(body.attribution.latest.utm_source,'google');
      await r.fulfill({status:503,json:{message:'Isolated retry test.'}});
    } else {
      if(r.request().method()==='POST') assert.equal(r.request().headers()['idempotency-key'],retryKey);
      await r.continue();
    }
  });
  await submit.click(); await page.getByText('Isolated retry test.').waitFor();
  assert.equal(await page.locator('input[type="radio"]').count(),0);
  await page.addInitScript(()=>{
    const layer=[]; const push=layer.push.bind(layer);
    layer.push=(...events)=>{
      for(const e of events) if(e?.event) {
        const history=JSON.parse(sessionStorage.getItem('qaEvents')||'[]'); history.push(e); sessionStorage.setItem('qaEvents',JSON.stringify(history));
      }
      return push(...events);
    };
    window.dataLayer=layer;
  });
  const response=page.waitForResponse(r=>r.url().endsWith('/api/dop-enquiry')&&r.request().method()==='POST');
  await submit.click();assert.equal((await response).status(),200);
  await page.waitForURL('**/assessment');
  await page.getByText('Question 1 of 9').waitFor();
  assert.equal(await page.getByRole('button',{name:'Next'}).isDisabled(),true);
  const api=origin+'/api/dop-assessment', snapshot=async()=> (await context.request.get(api)).json();
  const before=await snapshot(); assert.equal(before.questions.length,9);
  assert.equal(before.variant,'B');
  for(const question of before.questions) assert.deepEqual(Object.keys(question).sort(),['choices','prompt','subject']);
  assert.equal((await context.request.post(api,{data:{revision:before.revision,score:9}})).status(),422);
  const foreign=await browser.newContext();
  assert.equal((await foreign.request.get(api)).status(),401);
  await foreign.request.put(origin+'/api/dop-enquiry');
  assert.equal((await foreign.request.post(origin+'/api/dop-enquiry',{headers:{'Idempotency-Key':randomUUID()},data:{fullName:'Fictional Applicant',phone,status:'Law graduate',consent:true}})).status(),409);
  await foreign.close();
  for(let i=0;i<9;i++){
    const q=before.questions[i];
    const selected=q.prompt.match(/“(.+?)”/)[1];
    const radio=page.getByRole('radio',{name:selected,exact:true});
    await radio.check(); await page.waitForFunction(()=>!document.querySelector('.exam-nav .button')?.disabled);
    if(!i) {
      await page.reload(); await page.getByText('Question 1 of 9').waitFor();assert.equal(await radio.isChecked(),true);
      assert.deepEqual((await snapshot()).questions,before.questions); assert.deepEqual(await errors(page),[]);
      await page.screenshot({path:join(output,'m7-assessment.png')});
    }
    await page.getByRole('button',{name:i===8?'Review answers':'Next',exact:true}).click();
    if(i===0) {
      await page.getByText('Question 2 of 9').waitFor();
      await page.getByRole('button',{name:'Previous'}).click();await page.getByText('Question 1 of 9').waitFor();
      assert.equal(await radio.isChecked(),true);await page.getByRole('button',{name:'Next',exact:true}).click();
    }
  }
  await page.getByRole('heading',{name:'Review your answers'}).waitFor();
  const rev=(await snapshot()).revision;
  await page.getByRole('button',{name:'Submit assessment'}).click(); await page.waitForURL('**/assessment/result');
  await page.getByText('Qualified for admissions review').waitFor(); await page.reload(); await page.getByText('Qualified for admissions review').waitFor();
  assert.equal((await snapshot()).result.score,9);
  assert.deepEqual(await errors(page),[]);
  await page.screenshot({path:join(output,'m7-result.png'),fullPage:true});
  assert.equal((await (await context.request.post(api,{data:{revision:rev,score:0}})).json()).changed,false);
  const events=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('qaEvents')));
  for(const e of ['assessment_completed','assessment_qualified']) assert.equal(events.filter(item=>item.event===e).length,1);
  assert.ok(!JSON.stringify(events).includes(phone));
  assert.match(await page.locator('meta[name="robots"]').getAttribute('content'),/noindex/);
  assert.equal((await context.request.patch(api,{headers:{Origin:'https://example.test'},data:{}})).status(),403);
  console.log('PASS registration, retry, attribution, privacy, nine-question navigation, resume, ownership, finalisation and conversions');
  await context.close();
} finally { await browser.close(); }
