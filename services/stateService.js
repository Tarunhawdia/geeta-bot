const fs = require("fs");
const path = require("path");
const axios = require("axios");

const DATA_DIR = path.join(__dirname, "../data");
const PROGRESS_FILE = path.join(DATA_DIR, "progress.json");
const CHAPTERS_FILE = path.join(DATA_DIR, "chapters.json");
const GROUP_FILE = path.join(DATA_DIR, "group.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function readJson(file, defaultValue) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    }
  } catch (error) {
    log(`Error reading ${file}: ${error.message}`);
  }
  return defaultValue;
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (error) {
    log(`Error writing ${file}: ${error.message}`);
  }
}

// Progress tracking
function getProgress() {
  return readJson(PROGRESS_FILE, { chapter: 1, verse: 1 });
}

function updateProgress(chapter, verse) {
  writeJson(PROGRESS_FILE, { chapter, verse });
}

function resetProgress() {
  writeJson(PROGRESS_FILE, { chapter: 1, verse: 1 });
}

// Group ID persistence
function getGroupId() {
  const data = readJson(GROUP_FILE, null);
  return data ? data.chatId : null;
}

function setGroupId(chatId) {
  writeJson(GROUP_FILE, { chatId });
}

// Chapter metadata (verse counts)
async function getChapterMeta() {
  let chapters = readJson(CHAPTERS_FILE, null);
  if (!chapters) {
    try {
      log("Fetching chapter metadata from API...");
      const response = await axios.get("https://vedicscriptures.github.io/chapters", { timeout: 10000 });
      chapters = response.data;
      writeJson(CHAPTERS_FILE, chapters);
    } catch (error) {
      log(`Error fetching chapter metadata: ${error.message}`);
      return [];
    }
  }
  return chapters;
}

module.exports = {
  getProgress,
  updateProgress,
  resetProgress,
  getGroupId,
  setGroupId,
  getChapterMeta,
};
