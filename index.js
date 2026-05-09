const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const { exec } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");
const config = require("./config");
const stateService = require("./services/stateService");
const schedulerService = require("./services/schedulerService");
const geetaService = require("./services/geetaService");

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    protocolTimeout: 120000,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-sync",
      "--metrics-recording-only",
      "--no-default-browser-check",
      "--aggressive-cache-discard",
      "--disable-application-cache",
    ],
  },
});

let qrServer = null;

client.on("qr", async (qr) => {
  const qrFile = path.join(__dirname, "qr.png");
  await qrcode.toFile(qrFile, qr, { width: 400 });

  if (!qrServer) {
    qrServer = http.createServer((req, res) => {
      const img = fs.readFileSync(qrFile);
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end(img);
    }).listen(3000);
  }

  log("QR ready — open http://92.4.92.81:3000 in your browser and scan with WhatsApp.");
  exec(`xdg-open "${qrFile}" 2>/dev/null || true`);
});

client.on("ready", async () => {
  log("WhatsApp client ready.");
  if (qrServer) { qrServer.close(); qrServer = null; }
  await findAndSaveGroup();
  schedulerService.initScheduler(client);
});

client.on("auth_failure", (msg) => {
  log(`Authentication failed: ${msg}. Delete .wwebjs_auth/ and restart to re-scan QR.`);
});

client.on("disconnected", (reason) => {
  log(`Client disconnected: ${reason}. Reconnecting...`);
  client.initialize();
});

// Find the target group by name and save its chat ID
// Skipped if group ID is already saved (only needed once on first run)
async function findAndSaveGroup(attempt = 1) {
  const existing = stateService.getGroupId();
  if (existing) {
    log(`Group ID already saved (${existing}). Skipping search.`);
    return;
  }

  try {
    log(`Searching for group "${config.TARGET_GROUP_NAME}" (attempt ${attempt})...`);
    const chats = await client.getChats();
    const group = chats.find(c => c.isGroup && c.name === config.TARGET_GROUP_NAME);

    if (group) {
      stateService.setGroupId(group.id._serialized);
      log(`Group found: "${config.TARGET_GROUP_NAME}" (${group.id._serialized})`);
    } else {
      log(`Group not found. Available groups: ${chats.filter(c => c.isGroup).map(c => `"${c.name}"`).join(", ") || "none"}`);
      log(`Make sure the group is named exactly "${config.TARGET_GROUP_NAME}". Retrying in 30s...`);
      setTimeout(() => findAndSaveGroup(attempt + 1), 30000);
    }
  } catch (error) {
    log(`Error searching for group (attempt ${attempt}): ${error.message}. Retrying in 30s...`);
    setTimeout(() => findAndSaveGroup(attempt + 1), 30000);
  }
}

// Admin commands — triggered by any message you send yourself (fromMe)
client.on("message_create", async (message) => {
  if (!message.fromMe) return;

  const body = message.body.trim();
  if (!body.startsWith("/")) return;

  if (body === "/today") {
    const groupId = stateService.getGroupId();
    if (!groupId) {
      await message.reply(`Group not found yet. Make sure a group named "${config.TARGET_GROUP_NAME}" exists.`);
      return;
    }
    await message.reply("Sending today's shloka to the group...");
    await schedulerService.sendDailyShloka(client);
    await message.reply("Done.");

  } else if (body === "/progress") {
    const { chapter, verse } = stateService.getProgress();
    const groupId = stateService.getGroupId();
    await message.reply(
      `*Geeta Bot Status*\n\nNext shloka: Chapter ${chapter}, Verse ${verse}\nGroup: ${groupId ? config.TARGET_GROUP_NAME : "not found yet"}`
    );

  } else if (body === "/reset") {
    stateService.resetProgress();
    await message.reply("Progress reset to Chapter 1, Verse 1.");

  } else if (body === "/help") {
    await message.reply(
      `*Geeta Bot — Admin Commands*\n\n/today — Send today's shloka to the group now\n/progress — Show current chapter & verse\n/reset — Restart from Chapter 1, Verse 1`
    );
  }
});

client.initialize();
