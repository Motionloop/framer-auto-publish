const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.post('/trigger', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://framer.com/projects');
    
    // your sync and publish logic here
    
    await browser.close();
    res.send('Done');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed');
  }
});

app.listen(process.env.PORT || 3000);
