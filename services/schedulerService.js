const cron = require("node-cron");
const config = require("../config");
const stateService = require("./stateService");
const geetaService = require("./geetaService");

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function initScheduler(client) {
  cron.schedule(config.SCHEDULER_CRON, () => {
    log("Running daily shloka scheduler...");
    sendDailyShloka(client);
  }, {
    timezone: config.TIMEZONE,
  });
  log(`Daily scheduler initialized (${config.SCHEDULER_CRON} ${config.TIMEZONE}).`);
}

function hasRealInsight(insight) {
  return insight && !insight.includes("No commentary");
}

function formatShloka(shloka) {
  const parts = [
    `*🕉 Chapter ${shloka.chapter}, Verse ${shloka.verse}*`,
    shloka.sanskrit,
  ];
  if (shloka.hindi) parts.push(`*अर्थ (Hindi):* ${shloka.hindi}`);
  if (shloka.english) parts.push(`*Meaning (English):* ${shloka.english}`);
  return parts.join("\n\n");
}

// Fetch a natural group of shlokas — stops when it finds a verse with real commentary
async function fetchShlokaGroup(startChapter, startVerse) {
  const chapters = await stateService.getChapterMeta();
  const shlokas = [];
  let ch = startChapter;
  let v = startVerse;
  const MAX_GROUP = 8;

  for (let i = 0; i < MAX_GROUP; i++) {
    const shloka = await geetaService.getShloka(ch, v);
    if (!shloka) break;
    shlokas.push(shloka);

    if (hasRealInsight(shloka.insight)) break; // end of natural group

    // advance to next verse
    const meta = chapters.find(c => c.chapter_number === ch);
    if (meta && v < meta.verses_count) {
      v++;
    } else if (ch < 18) {
      ch++;
      v = 1;
    } else {
      ch = 1;
      v = 1;
      break;
    }
  }

  return shlokas;
}

async function sendDailyShloka(client) {
  const groupId = stateService.getGroupId();
  if (!groupId) {
    log("No group ID set. Skipping daily send — bot has not found the group yet.");
    return;
  }

  const { chapter, verse } = stateService.getProgress();
  log(`Fetching shloka group starting at Chapter ${chapter}, Verse ${verse}...`);

  const shlokas = await fetchShlokaGroup(chapter, verse);
  if (shlokas.length === 0) {
    log("Failed to fetch shlokas. Will try again tomorrow.");
    return;
  }

  const last = shlokas[shlokas.length - 1];
  const insight = shlokas.map(s => s.insight).find(hasRealInsight) || null;

  const header = `*Bhagavad Gita — Daily Shlokas* 🙏`;
  const bodies = shlokas.map(s => formatShloka(s));
  const footer = insight ? `*💡 Insight (Chinmayananda):*\n${insight}` : null;

  const parts = [header, ...bodies];
  if (footer) parts.push(footer);
  const message = parts.join("\n\n─────────────────\n\n");

  try {
    await client.sendMessage(groupId, message);
    log(`Sent ${shlokas.length} shloka(s) to group (${groupId}).`);
    await advanceProgress(chapter, verse, shlokas.length);
  } catch (error) {
    log(`Failed to send message to group: ${error.message}`);
  }
}

async function advanceProgress(currentChapter, currentVerse, steps = 1) {
  const chapters = await stateService.getChapterMeta();
  let ch = currentChapter;
  let v = currentVerse;

  for (let i = 0; i < steps; i++) {
    const chapterMeta = chapters.find(c => c.chapter_number === ch);
    if (!chapterMeta) {
      log("Could not find chapter metadata. Progress not updated.");
      return;
    }
    if (v < chapterMeta.verses_count) {
      v += 1;
    } else if (ch < 18) {
      ch += 1;
      v = 1;
    } else {
      ch = 1;
      v = 1;
      log("Completed all 700 shlokas! Restarting from Chapter 1, Verse 1.");
    }
  }

  stateService.updateProgress(ch, v);
  log(`Progress → Chapter ${ch}, Verse ${v}`);
}

module.exports = {
  initScheduler,
  sendDailyShloka,
  advanceProgress,
};
