const geetaService = require("./services/geetaService");

async function testService() {
  console.log("Testing Geeta Service...");

  const chapter = 1;
  const shloka = 1;

  const result = await geetaService.getShloka(chapter, shloka);

  if (result) {
    console.log("--------------------------------------------------");
    console.log(`Chapter ${result.chapter}, Verse ${result.verse}`);
    console.log("--------------------------------------------------");
    console.log("Sanskrit:");
    console.log(result.sanskrit);
    console.log("\nMeaning (Hindi):");
    console.log(result.hindi);
    console.log("\nMeaning (English):");
    console.log(result.english);
    console.log("--------------------------------------------------");
  } else {
    console.log("Failed to fetch shloka.");
  }

  // Test error case
  console.log("\nTesting invalid shloka...");
  const invalidResult = await geetaService.getShloka(99, 99);
  if (invalidResult === null) {
      console.log("Successfully handled invalid shloka.");
  } else {
      console.log("Failed to handle invalid shloka.");
  }
}

testService();
