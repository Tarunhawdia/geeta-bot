const stateService = require("./services/stateService");
const schedulerService = require("./services/schedulerService");

// Mock Client for testing scheduler
class MockClient {
    async sendMessage(chatId, message) {
        console.log(`[Mock Send to ${chatId}]:\n${message}\n`);
    }
}

async function testScheduler() {
    console.log("Testing Scheduler Logic...");

    // 1. Setup Test Subscriber
    const testId = "test_user_123";
    console.log(`Adding subscriber: ${testId}`);
    stateService.addSubscriber(testId);

    // 2. Check Initial Progress (Should be 1.1)
    let progress = stateService.getProgress();
    console.log("Initial Progress:", progress);

    // 3. Trigger Daily Shloka Manually
    console.log("Triggering daily shloka...");
    const client = new MockClient();
    await schedulerService.sendDailyShloka(client);

    // 4. Check Progress Updated (Should be 1.2)
    progress = stateService.getProgress();
    console.log("Updated Progress:", progress);

    if (progress.chapter === 1 && progress.verse === 2) {
        console.log("SUCCESS: Progress advanced correctly.");
    } else {
        console.error("FAILURE: Progress did not advance correctly.");
    }

    // 5. Cleanup
    console.log("Cleaning up test subscriber...");
    stateService.removeSubscriber(testId);
}

testScheduler();
