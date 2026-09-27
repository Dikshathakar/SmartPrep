const cron = require('node-cron');
const scrapeCareerCupQuestions = require('./scraperGFG');

cron.schedule('* * * * *', async () => {
  console.log('⏰ Running GeeksforGeeks scraper...');
  await scrapeCareerCupQuestions();
});
