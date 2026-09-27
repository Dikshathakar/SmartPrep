const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const InterviewQuestions = require('../models/InterviewQuestions');

const scrapeGeeksforGeeksQuestions = async () => {
  await connectDB();

  const URL = 'https://www.geeksforgeeks.org/company-interview-corner/';
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);
    await page.goto(URL, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('article a', { timeout: 30000 });

    const questions = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('article a'));
      return links
        .filter(link => link.innerText && link.href.includes('geeksforgeeks.org'))
        .map(link => ({
          title: link.innerText.trim(),
          link: link.href,
          company: link.innerText.trim().match(/^[A-Za-z]+/)?.[0] || 'Unknown',
          source: 'GeeksforGeeks'
        }));
    });

    console.log(`✅ Extracted ${questions.length} questions`);
    for (const q of questions) {
      try {
        await InterviewQuestions.findOneAndUpdate({ link: q.link }, q, { upsert: true, new: true });
        /*console.log(`📥 Saved: ${q.title}`); */
      } catch (err) {
        console.error(`❌ Failed to save: ${q.title}`, err);
      }
    }
  } catch (err) {
    console.error('❌ Scraping error:', err);
  } finally {
    if (browser) await browser.close();
    //process.exit();
  }
};

scrapeGeeksforGeeksQuestions();
