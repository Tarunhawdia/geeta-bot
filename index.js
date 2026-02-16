const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const express = require("express");
const geetaService = require("./services/geetaService");
const stateService = require("./services/stateService");
const schedulerService = require("./services/schedulerService");

// Initialize Express app for Render
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Geeta Bot is running! 🚀");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Initialize the WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth(), // Persist session
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  },
});

// Generate and display QR code for login
client.on("qr", (qr) => {
  console.log("QR RECEIVED");
  qrcode.generate(qr, { small: true });
});

// Log successful client authentication
client.on("ready", async () => {
  console.log("Client is ready!");
  // Initialize scheduler
  schedulerService.initScheduler(client);
});

// Log messages received for debugging
client.on("message", async (message) => {
  console.log(`Message from ${message.from}: ${message.body}`);
  await handleCommand(message);
});

// Also handle messages from the user themselves (for testing)
client.on("message_create", async (message) => {
  if (message.fromMe) {
    console.log(`Message from me: ${message.body}`);
    await handleCommand(message);
  }
});

async function handleCommand(message) {
  const body = message.body.trim();
  // For incoming messages, 'from' is the chat (group/private).
  // For outgoing messages (fromMe), 'to' is the chat.
  const chatId = message.fromMe ? message.to : message.from;

  if (body.startsWith("/geeta")) {
    const args = body.split(" ");
    
    // Check if arguments are provided
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
      const helpMessage = `*Available Commands:*

1. */geeta <chapter> <shloka>*
   - Get a specific shloka.
   - Example: /geeta 1 1
   
2. */subscribe*
   - Subscribe to daily Geeta shloka updates (5 AM IST).

3. */unsubscribe*
   - Stop receiving daily updates.

4. */help*
   - Show this help message.`;
      await message.reply(helpMessage);
  } else if (body === "/subscribe") {
      const added = stateService.addSubscriber(chatId);
      if (added) {
          await message.reply("You have successfully subscribed to daily Geeta shlokas! You will receive one shloka every day at 5 AM IST.");
      } else {
          await message.reply("You are already subscribed.");
      }
  } else if (body === "/unsubscribe") {
      const removed = stateService.removeSubscriber(chatId);
      if (removed) {
          await message.reply("You have successfully unsubscribed from daily updates.");
      } else {
          await message.reply("You are not subscribed.");
      }
  }
}

// Start the client
client.initialize();
