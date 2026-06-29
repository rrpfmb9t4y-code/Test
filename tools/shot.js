// Screenshot a URL full-page at a given width. Usage: node shot.js <url> <out.png> [width]
const puppeteer = require('puppeteer-core');
const CHROME = '/usr/local/bin/google-chrome';
const url = process.argv[2];
const out = process.argv[3];
const width = parseInt(process.argv[4] || '1440', 10);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars', '--force-color-profile=srgb'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }).catch(e => console.log('warn', e.message));
  await new Promise(r => setTimeout(r, 1200));
  const h = await page.evaluate(() => document.body.scrollHeight);
  await page.screenshot({ path: out, fullPage: true });
  console.log('Saved', out, 'height=', h);
  await browser.close();
})();
