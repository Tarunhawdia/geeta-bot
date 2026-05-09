const axios = require("axios");

const BASE_URL = "https://vedicscriptures.github.io";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getShloka(chapter, shloka) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(`${BASE_URL}/slok/${chapter}/${shloka}`, { timeout: 10000 });
      const data = response.data;
      return {
        chapter: data.chapter,
        verse: data.verse,
        sanskrit: data.slok,
        hindi: data.tej ? data.tej.ht : null,
        english: data.siva ? data.siva.et : null,
        insight: data.chinmay ? data.chinmay.hc : null,
      };
    } catch (error) {
      log(`Error fetching shloka ${chapter}.${shloka} (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }
  return null;
}

module.exports = { getShloka };
