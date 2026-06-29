// Capture a full-page reference screenshot + text outline of cursor.com
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME = '/usr/local/bin/google-chrome';
const URL = process.argv[2] || 'https://cursor.com';
const OUT_PNG = process.argv[3] || '/workspace/reference/cursor-full.png';
const OUT_TXT = process.argv[4] || '/workspace/reference/cursor-outline.json';
const WIDTH = parseInt(process.argv[5] || '1440', 10);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: 900, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 120000 }).catch(e => console.log('nav warn', e.message));
  // give animations/lazy content time + scroll to trigger lazy loads
  await page.evaluate(async () => {
    await new Promise(res => {
      let y = 0;
      const t = setInterval(() => {
        window.scrollBy(0, 600);
        y += 600;
        if (y > document.body.scrollHeight + 2000) { clearInterval(t); res(); }
      }, 100);
    });
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 2500));

  // Extract a structural outline of headings / buttons / nav / sections
  const outline = await page.evaluate(() => {
    const clean = s => (s || '').replace(/\s+/g, ' ').trim();
    const pick = sel => Array.from(document.querySelectorAll(sel))
      .map(el => clean(el.innerText)).filter(Boolean);
    const sections = Array.from(document.querySelectorAll('section, header, footer')).map(s => {
      const r = s.getBoundingClientRect();
      return {
        tag: s.tagName.toLowerCase(),
        label: s.getAttribute('aria-label') || '',
        top: Math.round(r.top + window.scrollY),
        height: Math.round(r.height),
        headings: Array.from(s.querySelectorAll('h1,h2,h3')).map(h => clean(h.innerText)).filter(Boolean).slice(0, 8),
      };
    });
    return {
      title: document.title,
      pageHeight: document.body.scrollHeight,
      h1: pick('h1'),
      h2: pick('h2'),
      h3: pick('h3'),
      navLinks: pick('header a').slice(0, 30),
      buttons: pick('header button, header a.btn, a[class*=btn]').slice(0, 20),
      footerLinks: pick('footer a').slice(0, 80),
      sections,
    };
  });
  fs.writeFileSync(OUT_TXT, JSON.stringify(outline, null, 2));

  await page.screenshot({ path: OUT_PNG, fullPage: true });
  console.log('Saved', OUT_PNG, 'and', OUT_TXT, 'pageHeight=', outline.pageHeight);
  await browser.close();
})();
