const { Client, LocalAuth } = require("whatsapp-web.js");
const geetaService = require("./services/geetaService");

// Mock Client
class MockClient {
    constructor() {
        this.callbacks = {};
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }

    initialize() {
        console.log("Mock Client Initialized");
        if (this.callbacks['ready']) {
            this.callbacks['ready']();
        }
    }

    async emitMessage(body) {
         if (this.callbacks['message']) {
            const mockMessage = {
                from: '12345@c.us',
                body: body,
                reply: async (response) => {
                    console.log(`Mock Reply to "${body}":\n${response}\n`);
                }
            };
            await this.callbacks['message'](mockMessage);
        }
    }
}

// Mock Command Handler logic from index.js for testing without real WhatsApp
async function testBotLogic() {
    console.log("Testing Bot Logic...");
    
    // Simulate what happens in index.js
    const client = new MockClient();
    
    client.on("message", async (message) => {
        console.log(`[Mock] Received: ${message.body}`);
        const body = message.body.trim();

        if (body.startsWith("/geeta")) {
            const args = body.split(" ");
            
            if (args.length < 3) {
            await message.reply("Usage: /geeta <chapter> <shloka>\nExample: /geeta 1 1");
            return;
            }

            const chapter = parseInt(args[1]);
            const shloka = parseInt(args[2]);

            if (isNaN(chapter) || isNaN(shloka)) {
            await message.reply("Please provide valid numbers for chapter and shloka.");
            return;
            }

            try {
            const result = await geetaService.getShloka(chapter, shloka);

            if (result) {
                const response = `*Chapter ${result.chapter}, Shloka ${result.verse}*

${result.sanskrit}

*Meaning (Hindi):*
${result.hindi}

*Meaning (English):*
${result.english}`;
                
                await message.reply(response);
            } else {
                await message.reply("Shloka not found. Please check the chapter and shloka numbers.");
            }
            } catch (error) {
            console.error("Error handling command:", error);
            await message.reply("An error occurred while fetching the shloka.");
            }
        } else if (body === "/help") {
            const helpMessage = `*Available Commands:*...`;
            await message.reply(helpMessage);
        }
    });

    client.initialize();

    // Test Cases
    await client.emitMessage("/help");
    await client.emitMessage("/geeta 1 1");
    await client.emitMessage("/geeta 18 66");
    await client.emitMessage("/geeta 99 99"); // Invalid chapter
    await client.emitMessage("/geeta one one"); // Invalid format
}

testBotLogic();
