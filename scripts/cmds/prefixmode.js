const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "prefixmode",
    version: "1.0 Eren-AI FIXED",
    author: "BADOL",
    role: 2,
    category: "admin",
    description: "Toggle all commands to no-prefix mode - Eren-AI",
    usePrefix: true,
    cooldown: 3
  },

  BADOL: async function({ event, api, args, message }) {
    const dataPath = path.join(__dirname, "../../data/prefixmode.json");
    const botName = global.config?.botInfo?.name || "Eren-AI";
    const prefix = global.config?.botInfo?.prefix || global.config?.prefix || "/";

    if (!fs.existsSync(path.dirname(dataPath))) {
      fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    }

    let data = { enabled: false };
    if (fs.existsSync(dataPath)) {
      try { data = JSON.parse(fs.readFileSync(dataPath, "utf8")); } catch {}
    }

    const action = args[0]?.toLowerCase();

    if (!action ||!["on","off","status"].includes(action)) {
      return message.reply(
        `╭─❖─〔 ${botName} 〕─❖─╮\n`+
        `│ ⚙️ PrefixMode System\n`+
        `│ 📌 Current: ${data.enabled? "ON (All No-Prefix)" : "OFF (Normal)"}\n`+
        `├────────────────\n`+
        `│ • ${prefix}prefixmode on - সব কমান্ড No Prefix\n`+
        `│ • ${prefix}prefixmode off - আগের মতো\n`+
        `│ • ${prefix}prefixmode status - স্ট্যাটাস\n`+
        `╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`
      );
    }

    if (action === "status") {
      return message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ 📌 PrefixMode: ${data.enabled? "ON ✅" : "OFF ❌"}\n│ ${data.enabled? "এখন সব কমান্ড Prefix ছাড়াই কাজ করবে।" : "এখন config অনুযায়ী কাজ করবে।"}\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
    }

    if (action === "on") {
      data.enabled = true;
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      global.config.prefixModeEnabled = true;
      global.config.settings = global.config.settings || {};
      global.config.settings.prefixModeEnabled = true;
      return message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ ✅ PrefixMode ON\n│ সব কমান্ড Prefix ছাড়া কাজ করবে\n│ Off: ${prefix}prefixmode off\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
    }

    if (action === "off") {
      data.enabled = false;
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      global.config.prefixModeEnabled = false;
      global.config.settings = global.config.settings || {};
      global.config.settings.prefixModeEnabled = false;
      return message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ ❌ PrefixMode OFF\n│ আগের মতো usePrefix অনুযায়ী\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
    }
  }
};