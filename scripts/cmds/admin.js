const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "admin",
    aliases: ["botadmin", "admins"],
    author: "MOHAMMAD BADOL",
    version: "2.4 Eren-AI FIXED",
    description: "Bot Admin Management - Permanent Save - Eren-AI",
    category: "owner",
    usePrefix: true,
    cooldown: 3,
    role: 2,
    guide: "{pn}admin [add/remove/list] [@mention / reply / UID]"
  },

  BADOL: async function ({ event, api, message, args, chatId, userId }) {
    function safeName(str, len = 28) {
      try {
        if (!str) return "Unknown User";
        str = String(str).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
        if (!str) return "Unknown User";
        const arr = Array.from(str);
        if (arr.length > len) return arr.slice(0, len).join("") + "…";
        return arr.join("");
      } catch { return "Unknown User"; }
    }

    function saveConfig() {
      try {
        const configPath = path.join(process.cwd(), 'config.json');
        if (global.config.ownerInfo?.botAdmins) {
          global.config.adminUID = global.config.ownerInfo.botAdmins;
        }
        fs.writeFileSync(configPath, JSON.stringify(global.config, null, 2), 'utf8');
        return true;
      } catch (e) {
        console.error("Admin Save Error - Eren-AI:", e);
        return false;
      }
    }

    const action = (args[0] || "").toLowerCase();
    const botName = safeName(global.config?.botInfo?.name || "Eren-AI", 18);

    if (action === "list") {
      const botAdmins = global.config?.ownerInfo?.botAdmins || [];
      if (botAdmins.length === 0) {
        return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ ❌ No bot admins found! - Eren-AI\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
      }
      let listText = `╭─❖─〔 ${botName} 〕─❖─╮\n│ 🛡️ Bot Admin List (${botAdmins.length}) - Eren-AI\n├──────────────────────┤`;
      for (let i = 0; i < botAdmins.length; i++) {
        const admId = botAdmins[i];
        let admName = "Admin User";
        let admUsername = "None";
        try {
          const chat = await api.getChat(admId);
          admName = safeName(chat.first_name || chat.title || "Admin", 16);
          admUsername = chat.username? `@${chat.username}` : "None";
        } catch {
          try {
            const dbUser = await global.db.getUser(String(admId));
            if (dbUser?.name) admName = safeName(dbUser.name, 16);
          } catch {}
        }
        listText += `\n│\n│ 📌 Admin #${i + 1}\n│ ├ Name: ${admName}\n│ ├ Username: ${admUsername}\n│ └ ID: ${admId}`;
      }
      listText += `\n├──────────────────────┤\n│ 🤖 ${botName}\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`;
      return await message.reply(listText);
    }

    let targetId = null;
    if (event.reply_to_message) {
      targetId = event.reply_to_message.from.id;
    } else if (args[1]) {
      const query = args[1].replace("@", "").trim();
      if (!isNaN(query)) {
        targetId = query;
      } else {
        try {
          const chatMember = await api.getChat(`@${query}`);
          if (chatMember?.id) targetId = String(chatMember.id);
        } catch {}
      }
    } else if (event.entities) {
      for (const entity of event.entities) {
        if (entity.type === 'text_mention') {
          targetId = String(entity.user.id);
          break;
        }
      }
    }

    if (!targetId && (action === "add" || action === "remove")) {
      return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ ⚠️ Usage:\n│ /admin add @mention/reply/uid\n│ /admin remove @mention/reply/uid\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
    }

    if (!global.config.ownerInfo) global.config.ownerInfo = {};
    if (!global.config.ownerInfo.botAdmins) global.config.ownerInfo.botAdmins = [];

    global.config.ownerInfo.botAdmins = global.config.ownerInfo.botAdmins.map(id => String(id));

    if (action === "add") {
      targetId = String(targetId);
      if (global.config.ownerInfo.botAdmins.includes(targetId)) {
        return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ ⚠️ Already Admin! - Eren-AI\n│ 🆔 ${targetId}\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
      }
      global.config.ownerInfo.botAdmins.push(targetId);
      const saved = saveConfig();
      if (saved) {
        return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ ✅ Admin Added & Saved! - Eren-AI\n│ 🆔 ID: ${targetId}\n│ 💾 Permanent!\n│ 🤖 ${botName}\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
      } else {
        return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ ⚠️ Added to RAM but Save Failed!\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
      }
    }

    if (action === "remove") {
      targetId = String(targetId);
      if (targetId === "6954597258") {
        return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ ❌ Cannot remove Main Owner!\n│ 🤖 ${botName}\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
      }
      const index = global.config.ownerInfo.botAdmins.indexOf(targetId);
      if (index === -1) {
        return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ ❌ Not in Admin List! - Eren-AI\n│ 🆔 ${targetId}\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
      }
      global.config.ownerInfo.botAdmins.splice(index, 1);
      const saved = saveConfig();
      if (saved) {
        return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ ✅ Admin Removed & Saved! - Eren-AI\n│ 🆔 ${targetId}\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
      } else {
        return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ ⚠️ Removed from RAM but Save Failed!\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
      }
    }

    return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ ⚠️ Usage: /admin [add/remove/list] - Eren-AI\n╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯`);
  }
};