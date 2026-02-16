const cron = require("node-cron");
const stateService = require("./stateService");
const geetaService = require("./geetaService");

function initScheduler(client) {
  // Schedule task for 5:00 AM daily in Asia/Kolkata
  cron.schedule("0 5 * * *", () => {
    console.log("Running daily shloka scheduler...");
    sendDailyShloka(client);
  }, {
    timezone: "Asia/Kolkata"
  });
  console.log("Daily scheduler initialized (5:00 AM IST).");
}

async function sendDailyShloka(client) {
  const subscribers = stateService.getSubscribers();
  if (subscribers.length === 0) {
    console.log("No subscribers for daily shloka.");
    return;
  }

  const progress = stateService.getProgress();
  const currentChapter = progress.chapter;
  const currentVerse = progress.verse;

  console.log(`Fetching daily shloka: Chapter ${currentChapter}, Verse ${currentVerse}`);
  const shloka = await geetaService.getShloka(currentChapter, currentVerse);

  if (shloka) {
    const message = `*Daily Geeta Shloka* 🌅

*Chapter ${shloka.chapter}, Shloka ${shloka.verse}*

${shloka.sanskrit}

*Meaning (Hindi):*
${shloka.hindi}

*Meaning (English):*
${shloka.english}

_To unsubscribe, reply with /unsubscribe_`;

    for (const chatId of subscribers) {
      try {
        await client.sendMessage(chatId, message);
        console.log(`Sent daily shloka to ${chatId}`);
      } catch (error) {
        console.error(`Failed to send to ${chatId}:`, error.message);
      }
    }

    // Advance to next shloka
    await advanceProgress(currentChapter, currentVerse);
  } else {
    console.error("Failed to fetch daily shloka. Retrying same shloka tomorrow.");
  }
}

async function advanceProgress(currentChapter, currentVerse) {
    const chapters = await stateService.getChapterMeta();
    
    // Find metadata for current chapter
    // API returns array: [{ chapter_number: 1, verses_count: 47, ... }, ...]
    const chapterMeta = chapters.find(c => c.chapter_number === currentChapter);

    if (chapterMeta) {
        if (currentVerse < chapterMeta.verses_count) {
             // Next verse in same chapter
             stateService.updateProgress(currentChapter, currentVerse + 1);
             console.log(`Progress updated to ${currentChapter}.${currentVerse + 1}`);
        } else {
             // Next chapter
             // Check if there is a next chapter (total 18)
             if (currentChapter < 18) {
                 stateService.updateProgress(currentChapter + 1, 1);
                 console.log(`Progress updated to ${currentChapter + 1}.1`);
             } else {
                 // Restart from 1.1 again
                 stateService.updateProgress(1, 1);
                 console.log("Completed Geeta! Restarting from 1.1");
             }
        }
    } else {
        console.error("Could not find chapter metadata. Progress not updated.");
    }
}

module.exports = {
  initScheduler,
  sendDailyShloka, // Exported for manual trigger/testing
  advanceProgress, // Exported for testing
};
