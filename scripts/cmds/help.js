const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "help",
    aliases: ["menu"],
    author: "MOHAMMAD BADOL",
    version: "3.3 Eren-AI FIXED",
    cooldown: 2,
    role: 0,
    description: "Help with button system - Eren-AI",
    category: "system",
    usePrefix: true
  },

  BADOL: async function ({ event, api, args, message, chatId }) {
    let prefix = global.config.botInfo?.prefix || global.config.prefix || "/";
    try {
      const thread = await global.db.getThread(String(chatId));
      if (thread?.customPrefix) prefix = thread.customPrefix;
    } catch {}

    const HELP_IMG = "https://drive.google.com/uc?export=download&id=1rNQOX6oKLDdrGaWzjRPo1LANlLVzDSu5";
    const botName = global.config.botInfo?.name || global.config.botName || "Eren-AI";

    const allCmdsMap = global.badol.commands || new Map();
    const uniqueCommands = [...new Map([...allCmdsMap.values()].map(c => [c.config.name, c])).values()].sort((a,b)=>a.config.name.localeCompare(b.config.name));
    const totalCommands = uniqueCommands.length;

    if (args[0]?.toLowerCase() === "all") {
      let fullMsg = `📚 ${botName} - All Commands (${totalCommands})\n━━━━━━━━━━━━━━━━\n\n`;
      uniqueCommands.forEach((c,i) => fullMsg += `${i+1}. ${prefix}${c.config.name}\n`);
      fullMsg += `\n━━━━━━━━━━━━━━━━━━━━━━━━\nUse: ${prefix}help <name>\n\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`;
      try {
        if (fullMsg.length > 3500) {
          await api.sendPhoto(chatId, HELP_IMG, { caption: `📋 Total ${totalCommands} Commands - List sent as text - Eren-AI` });
          await api.sendMessage(chatId, fullMsg);
        } else {
          await api.sendPhoto(chatId, HELP_IMG, { caption: fullMsg });
        }
      } catch { await message.reply(fullMsg); }
      return;
    }

    if (args[0] && isNaN(args[0])) {
      const input = args[0].toLowerCase();
      const cmd = allCmdsMap.get(input) || uniqueCommands.find(c => c.config.aliases?.includes(input));
      if (!cmd) return message.reply(`❌ "${args[0]}" পাওয়া যায়নি! - Eren-AI`);

      const cfg = cmd.config;
      let perm = "Everyone 👥";
      if (cfg.role === 1) perm = "Group Admins + Bot Admins 👮";
      if (cfg.role >= 2) perm = "Bot Owner 👑 (2 Owner)";

      let detail = `╭─❖─〔 ${botName} 〕─❖─╮\n`;
      detail += `│ 📘 Name: ${prefix}${cfg.name}\n`;
      detail += `│ 🔁 Aliases: ${cfg.aliases?.length? cfg.aliases.join(", ") : "None"}\n`;
      detail += `│ 👤 Author: ${cfg.author || "Unknown"}\n`;
      detail += `│ 📦 Version: ${cfg.version || "1.0"}\n`;
      detail += `│ 🔑 Role: ${cfg.role} (${perm})\n`;
      detail += `│ 📂 Category: ${cfg.category || "N/A"}\n`;
      detail += `│ ⏱️ Cooldown: ${cfg.cooldown || 3}s\n`;
      detail += `│ 🔧 Prefix: ${cfg.usePrefix? "Yes" : "No"}\n`;
      detail += `│ 📄 Desc: ${cfg.description || "No description"}\n`;
      if (cfg.guide) {
        const guideText = typeof cfg.guide === 'string'? cfg.guide : cfg.guide.en || "";
        if(guideText) detail += `│ 📖 Guide: ${guideText.replaceAll("{pn}", prefix).replaceAll("{p}", prefix)}\n`;
      }
      detail += `├──────────────────────┤\n`;
      detail += `│ 🤖 ${botName}\n`;
      detail += `╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`;

      const btn = { reply_markup: { inline_keyboard: [[{ text: "📋 All", callback_data: "help_all" }, { text: "❌ Close", callback_data: "help_close" }]] } };
      try { await api.sendPhoto(chatId, HELP_IMG, { caption: detail,...btn }); }
      catch { await message.reply(detail, btn); }
      return;
    }

    const perPage = 15;
    let page = parseInt(args[0]) || 1;
    const totalPages = Math.max(1, Math.ceil(totalCommands / perPage));
    if (page < 1) page = 1; if (page > totalPages) page = totalPages;

    const makeCaption = (p) => {
      const s = (p-1)*perPage;
      const slice = uniqueCommands.slice(s, s+perPage);
      const list = slice.map((c,i) => `├‣ ${s+i+1} ✿ ${prefix}${c.config.name}`).join("\n");
      return `╭─❖─〔 ${botName} 〕─❖─╮\n${list}\n├──────────────────────┤\n│ Page: ${p}/${totalPages} | Total: [ ${totalCommands} ]\n│ 🤖 ${botName}\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`;
    };

    const caption = makeCaption(page);
    const buttons = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "◀️ Prev", callback_data: `help_page_${page-1}` }, { text: `${page}/${totalPages}`, callback_data: "help_noop" }, { text: "Next ▶️", callback_data: `help_page_${page+1}` }],
          [{ text: "📋 All Commands", callback_data: "help_all" }, { text: "❌ Close", callback_data: "help_close" }]
        ]
      }
    };

    let sent;
    try {
      const localImg = path.join(__dirname, "help.jpg");
      if (fs.existsSync(localImg)) sent = await api.sendPhoto(chatId, { source: localImg }, { caption,...buttons });
      else sent = await api.sendPhoto(chatId, HELP_IMG, { caption,...buttons });
    } catch {
      sent = await api.sendMessage(chatId, caption, buttons);
    }

    if (sent?.message_id) {
      global.badol.onCallback.set(sent.message_id, {
        commandName: "help",
        page,
        totalPages,
        totalCommands,
        botName,
        prefix,
        HELP_IMG
      });
    }
  },

  onCallback: async function ({ event, api, ctx }) {
    try {
      const data = event.data;
      const chatId = event.message.chat.id;
      const msgId = event.message.message_id;
      let stored = global.badol.onCallback.get(msgId);
      if (!stored) stored = { page: 1, totalPages: 1, prefix: global.config.botInfo?.prefix || "/", botName: "Eren-AI", HELP_IMG: "https://drive.google.com/uc?export=download&id=1rNQOX6oKLDdrGaWzjRPo1LANlLVzDSu5" };

      if (data === "help_close") {
        try { await api.deleteMessage(chatId, msgId); } catch { await ctx.editMessageCaption("❌ Closed - Eren-AI").catch(()=>{}); }
        return await ctx.answerCbQuery("Closed - Eren-AI").catch(()=>{});
      }
      if (data === "help_noop") return await ctx.answerCbQuery(`Page ${stored.page}/${stored.totalPages} - Eren-AI`).catch(()=>{});
      if (data === "help_all") {
        const allCmdsMap = global.badol.commands || new Map();
        const unique = [...new Map([...allCmdsMap.values()].map(c => [c.config.name, c])).values()].sort((a,b)=>a.config.name.localeCompare(b.config.name));
        let fullMsg = `📚 ${stored.botName} - All Commands (${unique.length})\n━━━━━━━━━━━━━━━\n`;
        fullMsg += unique.map((c,i) => `${i+1}. ${stored.prefix}${c.config.name}`).join("\n");
        fullMsg += `\n\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`;
        try { await api.sendMessage(chatId, fullMsg.substring(0,4000)); await ctx.answerCbQuery("Full list sent! - Eren-AI"); }
        catch { await ctx.answerCbQuery("Error!"); }
        return;
      }

      if (data.startsWith("help_page_")) {
        let page = parseInt(data.split("_")[2]);
        if (isNaN(page)) return;
        if (page < 1) page = stored.totalPages;
        if (page > stored.totalPages) page = 1;

        const allCmdsMap = global.badol.commands || new Map();
        const unique = [...new Map([...allCmdsMap.values()].map(c => [c.config.name, c])).values()].sort((a,b)=>a.config.name.localeCompare(b.config.name));
        const perPage = 15;
        const s = (page-1)*perPage;
        const slice = unique.slice(s, s+perPage);
        const list = slice.map((c,i) => `├‣ ${s+i+1} ✿ ${stored.prefix}${c.config.name}`).join("\n");
        const newCaption = `╭─❖─〔 ${stored.botName} 〕─❖─╮\n${list}\n├──────────────────────┤\n│ Page: ${page}/${stored.totalPages} | Total: [ ${stored.totalCommands || unique.length} ]\n│ 🤖 ${stored.botName}\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`;

        const buttons = {
          reply_markup: {
            inline_keyboard: [
              [{ text: "◀️ Prev", callback_data: `help_page_${page-1}` }, { text: `${page}/${stored.totalPages}`, callback_data: "help_noop" }, { text: "Next ▶️", callback_data: `help_page_${page+1}` }],
              [{ text: "📋 All Commands", callback_data: "help_all" }, { text: "❌ Close", callback_data: "help_close" }]
            ]
          }
        };

        try { await ctx.editMessageCaption(newCaption, buttons).catch(async () => await api.editMessageCaption(newCaption, { chat_id: chatId, message_id: msgId,...buttons })); }
        catch { try { await api.editMessageText(chatId, msgId, null, newCaption, buttons); } catch {} }

        stored.page = page;
        global.badol.onCallback.set(msgId, stored);
        return await ctx.answerCbQuery(`Page ${page}/${stored.totalPages} - Eren-AI`).catch(()=>{});
      }
    } catch (e) { console.log("help cb error:", e.message); }
  }
};