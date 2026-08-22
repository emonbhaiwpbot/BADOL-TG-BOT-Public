const fs = require("fs");
const path = require("path");
const express = require("express");
const colors = require("colors");
const { spawn } = require("child_process");

const Logger = require("./logger/logs");
const log = new Logger("Asia/Dhaka");

const app = express();
const port = process.env.PORT || 5000;

let botProcess;

const botPath = path.join(__dirname, "Eren.js");

if (!fs.existsSync(botPath)) {
  console.error("⛔ Eren.js not found!");
  process.exit(1);
}

app.get("/", (req, res) => {
  res.status(200).send("Eren-AI V2.0 is running! 🚀");
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.get("/uptime", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    message: "Eren-AI is alive"
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`🌐 Server is running on port ${port}`.cyan);
});

function startProject() {
  log.info("🚀 Starting Eren-AI V2.0...");

  botProcess = spawn("node", ["Eren.js"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true
  });

  botProcess.on("close", (code) => {
    log.info(`⚠️ Eren-AI stopped with code: ${code}`);
    log.info("🔄 Restarting in 3 seconds...");

    setTimeout(() => {
      startProject();
    }, 3000);
  });

  botProcess.on("error", (err) => {
    log.error(`❌ Bot process error: ${err.message}`);
  });
}

startProject();