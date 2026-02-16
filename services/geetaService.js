const axios = require("axios");

const BASE_URL = "https://vedicscriptures.github.io";

/**
 * Fetches a specific Shloka from the API.
 * @param {number} chapter - The chapter number.
 * @param {number} shloka - The shloka number.
 * @returns {Promise<Object>} - The formatted shloka object or null if not found.
 */
async function getShloka(chapter, shloka) {
  try {
    const response = await axios.get(`${BASE_URL}/slok/${chapter}/${shloka}`);
    const data = response.data;

    return {
      chapter: data.chapter,
      verse: data.verse,
      sanskrit: data.slok,
      hindi: data.tej ? data.tej.ht : "Hindi translation not available.",
      english: data.siva ? data.siva.et : "English translation not available."
    };
  } catch (error) {
    console.error(`Error fetching shloka ${chapter}.${shloka}:`, error.message);
    return null;
  }
}

module.exports = {
  getShloka,
};
