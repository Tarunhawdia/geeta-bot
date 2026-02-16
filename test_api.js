const axios = require("axios");
const fs = require("fs");

async function testApi() {
  try {
    const shloka = await axios.get("https://vedicscriptures.github.io/slok/1/1");
    fs.writeFileSync("api_response.json", JSON.stringify(shloka.data, null, 2));
    console.log("API response written to api_response.json");
  } catch (error) {
    console.error("API Test Failed:", error.message);
  }
}

testApi();
