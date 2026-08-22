// ╔════════════════════════════════════════════════════╗
// ║ BADOL-CMDS/cmds/userlock.js - V3.2 ║
// ║ Tracked Users + ON/OFF/Cancel ║
// ╚════════════════════════════════════════════════════╝

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, "../../data/nametracker.json");
const SETTING_PATH = path.join(__dirname, "../../data/namewatch.json");

function getDB() {
  try {
    if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch { return {}; }
}
function saveDB(data) {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); } catch {}
}
function getSettingDB() {
  try {
    if (!fs.existsSync(SETTING_PATH)) fs.writeFileSync(SETTING_PATH, JSON.stringify({ globalEnabled: true }, null, 2));
    return JSON.parse(fs.readFileSync(SETTING_PATH, 'utf8'));
  } catch { return { globalEnabled: true }; }
}
function saveSettingDB(data) {
  try { fs.writeFileSync(SETTING_PATH, JSON.stringify(data, null, 2)); } catch {}
}
function isEnabled() { return getSettingDB().globalEnabled!== false; }

module.exports = {
  config: {
    name: "userlock",
    aliases: ["namewatch", "ulock"],
    author: "MOHAMMAD BADOL",
    version: "3.2",
    description: "UserLock - Tracked + 3 Button",
    category: "security",
    usePrefix: true,
    role: 1,
    cooldown: 2
  },

  BADOL: async function({ api, chatId }) {
    return sendPanel(api, chatId, null, null);
  },

  onCallback: async function({ event, api, ctx }) {
    const data = event.data || event.callback_query?.data;
    const chatId = event.message.chat.id;
    const msgId = event.message.message_id;
    try { await ctx.answerCbQuery(); } catch {}

    if (data === "ulock_on") {
      let db = getSettingDB(); db.globalEnabled = true; saveSettingDB(db);
      try { await api.sendMessage(chatId, `✅ UserLock Global ON!`); } catch {}
      try { await api.deleteMessage(chatId, msgId).catch(()=>{}); } catch {}
      return;
    }
    if (data === "ulock_off") {
      let db = getSettingDB(); db.globalEnabled = false; saveSettingDB(db);
      try { await api.sendMessage(chatId, `❌ UserLock Global OFF!`); } catch {}
      try { await api.deleteMessage(chatId, msgId).catch(()=>{}); } catch {}
      return;
    }
    if (data === "ulock_cancel") {
      try { await api.deleteMessage(chatId, msgId).catch(()=>{}); } catch {}
      return;
    }
  },

  onChat: async function({ api, msg, chatId }) {
    try {
      if (!msg ||!chatId) return;
      if (!String(chatId).startsWith("-")) return;
      if (!isEnabled()) return;
      if (!msg.from) return;
      const from = msg.from;
      const userId = String(from.id);
      const current = {
        first_name: (from.first_name || "").trim(),
        last_name: (from.last_name || "").trim(),
        username: (from.username || "").trim(),
        date: new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })
      };
      const db = getDB();
      const old = db[userId];
      if (!old) { db[userId] = { current, history: [] }; saveDB(db); return; }
      const oldFirst = (old.current.first_name||"").trim();
      const oldLast = (old.current.last_name||"").trim();
      const oldUser = (old.current.username||"").trim();
      if (oldFirst===current.first_name && oldLast===current.last_name && oldUser===current.username) return;

      if (!old.history) old.history = [];
      old.history.push({...old.current});
      if (old.history.length > 20) old.history.shift();

      let notice = `🚨 <b>USERLOCK DETECTED!</b>\n━━━━━━━━━━━━━━━━━━\n`;
      notice += `👤 নাম: <b>${current.first_name} ${current.last_name||""}</b>\n`;
      notice += `🆔 আইডি: <code>${userId}</code>\n`;
      notice += `🔗 মেনশন: <a href="tg://user?id=${userId}">${current.first_name}</a>\n`;
      notice += `━━━━━━━━━━━━━━━━━━\n\n📝 <b>পরিবর্তন বিবরণ:</b>\n`;
      if (oldFirst!==current.first_name) notice += `• First: <b>${oldFirst||"নাই"}</b> → <b>${current.first_name||"নাই"}</b>\n`;
      if (oldLast!==current.last_name) notice += `• Last: <b>${oldLast||"নাই"}</b> → <b>${current.last_name||"নাই"}</b>\n`;
      if (oldUser!==current.username) notice += `• Username: @${oldUser||"নাই"} → @${current.username||"নাই"}\n`;
      notice += `\n━━━━━━━━━━━━━━━━━━\n⏰ ${current.date}`;
      await api.sendMessage(chatId, notice, { parse_mode: "HTML" }).catch(()=>{});
      db[userId] = { current, history: old.history }; saveDB(db);
    } catch {}
  }
};

async function sendPanel(api, chatId, ctx, extra="") {
  const enabled = isEnabled();
  const db = getDB();
  const total = Object.keys(db).length; // ✅ Tracked Users Count

  const text = `${extra||""}╭─❖─〔 UserLock Panel 〕─❖─╮\n│ Status: ${enabled? "🟢 ON" : "🔴 OFF"} (All Groups)\n│ 📊 Tracked Users: ${total} জন\n│\n│ • নাম Change করলে Notice দিবে\n╰─❖─〔 BADOL TG BOT 〕─❖─╯`;

  const kb = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🟢 ON", callback_data: "ulock_on" }, { text: "🔴 OFF", callback_data: "ulock_off" }],
        [{ text: "❌ Cancel", callback_data: "ulock_cancel" }]
      ]
    }
  };
  if (ctx) { try { await ctx.editMessageText(text, kb); } catch {} }
  else { await api.sendMessage(chatId, text, kb).catch(()=>{}); }
}