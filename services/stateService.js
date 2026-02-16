const fs = require("fs");
const path = require("path");
const axios = require("axios");

const DATA_DIR = path.join(__dirname, "../data");
const SUBSCRIBERS_FILE = path.join(DATA_DIR, "subscribers.json");
const PROGRESS_FILE = path.join(DATA_DIR, "progress.json");
const CHAPTERS_FILE = path.join(DATA_DIR, "chapters.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Helper to read JSON file
function readJson(file, defaultValue) {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading ${file}:`, error.message);
  }
  return defaultValue;
}

// Helper to write JSON file
function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${file}:`, error.message);
  }
}

// Subscribers Management
function getSubscribers() {
  return readJson(SUBSCRIBERS_FILE, []);
}

function addSubscriber(chatId) {
  const subscribers = getSubscribers();
  if (!subscribers.includes(chatId)) {
    subscribers.push(chatId);
    writeJson(SUBSCRIBERS_FILE, subscribers);
    return true;
  }
  return false;
}

function removeSubscriber(chatId) {
  let subscribers = getSubscribers();
  const initialLength = subscribers.length;
  subscribers = subscribers.filter((id) => id !== chatId);
  if (subscribers.length !== initialLength) {
    writeJson(SUBSCRIBERS_FILE, subscribers);
    return true;
  }
  return false;
}

// Progress Management
function getProgress() {
  // Default to Chapter 1, Verse 1 if not set
  return readJson(PROGRESS_FILE, { chapter: 1, verse: 1 });
}

function updateProgress(chapter, verse) {
  writeJson(PROGRESS_FILE, { chapter, verse });
}

// Chapter Metadata (Verse Counts)
async function getChapterMeta() {
  let chapters = readJson(CHAPTERS_FILE, null);
  
  if (!chapters) {
    try {
      console.log("Fetching chapter metadata from API...");
      const response = await axios.get("https://vedicscriptures.github.io/chapters");
      chapters = response.data;
      writeJson(CHAPTERS_FILE, chapters);
    } catch (error) {
       console.error("Error fetching chapter metadata:", error.message);
       // Fallback or retry logic could go here
       return [];
    }
  }
  return chapters;
}

module.exports = {
  getSubscribers,
  addSubscriber,
  removeSubscriber,
  getProgress,
  updateProgress,
  getChapterMeta
};
