import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const errors = [];
const failed404 = [];

page.on('console', msg => {
  if (msg.type() === 'error') errors.push('[CONSOLE ERROR] ' + msg.text());
});
page.on('response', resp => {
  if (resp.status() === 404) failed404.push('[404] ' + resp.url());
});

const pages = [
  'http://localhost:3000/zummp/',
  'http://localhost:3000/zummp/pricing',
  'http://localhost:3000/zummp/compare',
  'http://localhost:3000/zummp/services',
  'http://localhost:3000/zummp/jurisdictions',
  'http://localhost:3000/zummp/jurisdictions/uae',
  'http://localhost:3000/zummp/jurisdictions/singapore',
  'http://localhost:3000/zummp/jurisdictions/cayman',
  'http://localhost:3000/zummp/jurisdictions/uk',
];

for (const url of pages) {
  errors.length = 0;
  failed404.length = 0;
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    const title = await page.title();
    console.log(`\n=== ${url} ===`);
    console.log('Title:', title);
    if (errors.length) console.log('Errors:', errors.slice(0, 3).join('\n'));
    if (failed404.length) console.log('404s:', failed404.slice(0, 5).join('\n'));
    if (!errors.length && !failed404.length) console.log('✅ No errors');
  } catch (e) {
    console.log(`\n=== ${url} ===`);
    console.log('LOAD ERROR:', e.message);
  }
}

await browser.close();
