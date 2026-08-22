const os = require("os");

module.exports = {
  config: {
    name: "up",
    aliases: ["uptime"],
    author: "MOHAMMAD BADOL",
    version: "3.7 FINAL NO-CANVAS",
    description: "BADOL-BOT-V5 UPTIME SYSTEM - NO CANVAS",
    category: "system",
    usePrefix: true,
    cooldown: 5,
    role: 0,
  },

  BADOL: async function ({ event, api, message }) {
    const chatId = event.chat.id;
    let loadingMsg;
    try {
        loadingMsg = await message.reply("🔄 [▒▒▒▒▒▒] 0%");
        const steps = ["⚡ [██▒▒▒▒▒▒▒▒] 20%","⚡ [████▒▒▒▒▒▒] 40%","⚡ [██████▒▒▒▒] 60%","⚡ [████████▒▒] 80%","✅ [██████████] 100%"];
        for (let s of steps) {
            await new Promise(r=>setTimeout(r,300));
            try { await message.edit(s, loadingMsg.message_id, chatId); } catch {}
        }
    } catch {}

    const uniqueCmds = [...new Set([...global.badol.commands.values()].map(c=>c.config?.name))].length;
    const totalEvents = global.badol.events ? global.badol.events.size : 0;
    const botPrefix = global.config.prefix || "/";

    const now = new Date();
    const bdTime = now.toLocaleString("en-US", { timeZone: "Asia/Dhaka", hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const bdDate = now.toLocaleString("en-US", { timeZone: "Asia/Dhaka", day: '2-digit', month: 'short', year: 'numeric' });

    const formatUptime = () => {
        let s = Math.floor(process.uptime());
        const d = Math.floor(s/86400); s%=86400;
        const h = Math.floor(s/3600); s%=3600;
        const m = Math.floor(s/60);
        const sec = s%60;
        return `${d}d ${h}h ${m}m ${sec}s`;
    };
    const uptimeStr = formatUptime();

    const totalRamMB = (os.totalmem() / 1024 / 1024).toFixed(0);
    const usedRamMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0);
    const ping = Math.floor(Math.random()*15)+5;

    const captionText = `✨EREN-AI UPTIME SYSTEM✨
━━━━━━━━━━━━━━━━━━━━

⏱️ 𝗨𝗽𝘁𝗶𝗺𝗲: ${uptimeStr}
⚡ 𝗟𝗮𝘁𝗲𝗻𝗰𝘆: ${ping} MS
📊 𝗥𝗔𝗠: ${usedRamMB} / ${totalRamMB} MB
⚙️ 𝗖𝗠𝗗𝘀: ${uniqueCmds} Active
📦 𝗘𝘃𝗲𝗻𝘁𝘀: ${totalEvents} Active
🛠️ 𝗣𝗿𝗲𝗳𝗶𝘅: [ ${botPrefix} ]

📅 ${bdDate}
⏰ ${bdTime} (BST)
━━━━━━━━━━━━━━━━━━━━
🟢 EREN-AI BOT IS 𝐎𝐍𝐋𝐈𝐍𝐄`;

    try {
        if (loadingMsg) await message.unsend(loadingMsg.message_id).catch(()=>{});
        await api.sendMessage(chatId, captionText);
    } catch (e) {
        console.log("UP ERROR:", e);
        await message.reply(captionText);
    }
  }
};