// ✅ Eren-AI - ADMIN ONLY - V1.7 - Eren.js Same Logic
// 100% Same Save Logic as Setting.js V6.2 - Guaranteed Work!

const fs = require('fs');
const path = require('path');

const ADMINONLY_FILE = path.join(__dirname, "../../data/adminonly.json");
const CONFIG_FILE = path.join(__dirname, "../../config.json");

module.exports = {
  config: {
    name: "adminonly",
    aliases: ["wl", "whitelist", "adminmode", "onlyadmin"],
    version: "1.7.0 Eren-AI FIXED",
    author: "MOHAMMAD BADOL",
    role: 1, // 1 = Group Admin + Bot Admin (2 Owner Both Can Use)
    description: "Admin Only - Eren-AI - Same as Setting.js",
    category: "admin",
    cooldown: 3,
    usePrefix: true
  },

  BADOL: async function({ api, chatId, args }) {

    function getSettings() {
      const cfg = global.config || {};
      const st = cfg.settings || {};
      let adminOnly = false;
      try {
        if (fs.existsSync(ADMINONLY_FILE)) {
          const data = JSON.parse(fs.readFileSync(ADMINONLY_FILE, 'utf8'));
          adminOnly = data.enabled === true;
        } else {
          if (st.adminOnlyMode!== undefined) adminOnly = st.adminOnlyMode === true;
          else if (st.onlyAdmin!== undefined) adminOnly = st.onlyAdmin === true;
        }
      } catch { adminOnly = st.adminOnlyMode === true || st.onlyAdmin === true; }
      return adminOnly;
    }

    function toggleAdminOnly() {
      if (!global.config.settings) global.config.settings = {};
      const s = global.config.settings;
      const cur = getSettings();
      const newVal =!cur;

      s.adminOnlyMode = newVal;
      s.onlyAdmin = newVal;

      try {
        fs.mkdirSync(path.dirname(ADMINONLY_FILE), { recursive: true });
        fs.writeFileSync(ADMINONLY_FILE, JSON.stringify({ enabled: newVal, time: Date.now() }, null, 2), 'utf8');
      } catch {}

      try {
        let configData = {};
        if (fs.existsSync(CONFIG_FILE)) {
          configData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        } else {
          configData = global.config;
        }
        if (!configData.settings) configData.settings = {};
        configData.settings = {...configData.settings,...global.config.settings };
        configData.settings.onlyAdmin = newVal;
        configData.settings.adminOnlyMode = newVal;
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(configData, null, 2), 'utf8');
      } catch (e) { console.error("Save config error:", e); }

      return newVal;
    }

    function saveState(enabled) {
      if (!global.config.settings) global.config.settings = {};
      global.config.settings.adminOnlyMode = enabled;
      global.config.settings.onlyAdmin = enabled;
      try {
        fs.mkdirSync(path.dirname(ADMINONLY_FILE), { recursive: true });
        fs.writeFileSync(ADMINONLY_FILE, JSON.stringify({ enabled, time: Date.now() }, null, 2), 'utf8');
      } catch {}
      try {
        let configData = fs.existsSync(CONFIG_FILE)? JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) : global.config;
        if (!configData.settings) configData.settings = {};
        configData.settings.onlyAdmin = enabled;
        configData.settings.adminOnlyMode = enabled;
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(configData, null, 2), 'utf8');
      } catch {}
    }

    const sub = (args[0] || "").toLowerCase();
    const current = getSettings();
    const botName = global.config?.botInfo?.name || global.config?.botName || "Eren-AI";

    if (!sub ||!["on", "off", "status", "toggle"].includes(sub)) {
      return await api.sendMessage(chatId, `╭─❖─〔 ${botName} 〕─❖─╮\n│ Status: ${current? "ON 🔒" : "OFF 🔓"}\n│ /wl on | /wl off | /wl status\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
    }

    if (sub === "status") {
      return await api.sendMessage(chatId, `╭─❖─〔 ${botName} 〕─❖─╮\n│ Status: ${current? "ON 🔒 - Only Admins" : "OFF 🔓 - Everyone"}\n│ File: ${fs.existsSync(ADMINONLY_FILE)? "✅" : "❌"} - Eren-AI\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
    }

    if (sub === "on") {
      if (current) return await api.sendMessage(chatId, `╭─❖─〔 ${botName} 〕─❖─╮\n│ ⚠️ Already ON! 🔒\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
      saveState(true);
      return await api.sendMessage(chatId, `╭─❖─〔 ${botName} 〕─❖─╮\n│ ✅ ADMIN ONLY ON! 🔒\n│ Only Admins can use!\n│ 💾 Restart Safe 100% - Eren-AI\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
    }

    if (sub === "off") {
      if (!current) return await api.sendMessage(chatId, `╭─❖─〔 ${botName} 〕─❖─╮\n│ ⚠️ Already OFF! 🔓\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
      saveState(false);
      return await api.sendMessage(chatId, `╭─❖─〔 ${botName} 〕─❖─╮\n│ ✅ ADMIN ONLY OFF! 🔓\n│ Everyone can use!\n│ 💾 Restart Safe - Eren-AI\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
    }

    if (sub === "toggle") {
      const newVal = toggleAdminOnly();
      return await api.sendMessage(chatId, `╭─❖─〔 ${botName} 〕─❖─╮\n│ ${newVal? "✅ ON 🔒" : "✅ OFF 🔓"}\n│ Toggled - Eren-AI\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
    }
  }
};