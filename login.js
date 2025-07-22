const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://framer.com/projects/', { waitUntil: 'networkidle2' });

  console.log('\n🔐 Please log in to Framer manually...');
  console.log('✅ After logging in and reaching your dashboard, press ENTER here to save cookies.\n');

  process.stdin.once('data', async () => {
    const cookies = await page.cookies();
    fs.writeFileSync('cookies.json', JSON.stringify(cookies, null, 2));
    console.log('🍪 Cookies saved to cookies.json');
    await browser.close();
    process.exit(0);
  });
})();
