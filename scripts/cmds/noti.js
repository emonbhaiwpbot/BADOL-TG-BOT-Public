const fs = require('fs');

module.exports = {
  config: {
    name: "noti",
    aliases: ["broadcast", "announce"],
    author: "MOHAMMAD BADOL",
    version: "10.0-FIXED-ALL",
    cooldown: 3,
    role: 2,
    category: "admin",
    usePrefix: true
  },

  BADOL: async function ({ event, api, args, message, userId }) {
    try {
      if (!args[0] &&!event.reply_to_message) {
        return message.reply(
          "📢 **Noti Guide:**\n\n" +
          "• /noti all <msg> - সব গ্রুপ+ইউজারে (64+19=83)\n" +
          "• /noti <msg> - ফটোতে reply দিয়ে সবাইকে (ফটো সহ)\n" +
          "• /noti list - গ্রুপ লিস্ট দেখবে\n" +
          "• /noti dm - ইউজার লিস্ট দেখবে\n" +
          "• /noti -100xxx <msg> - নির্দিষ্ট গ্রুপে\n" +
          "• /noti <uid> <msg> - নির্দিষ্ট ইউজারে\n" +
          "• Reply: 1,3,5 Hello - list থেকে সিলেক্ট করে"
        );
      }

      const sub = args[0]? args[0].toLowerCase() : "";

      if (sub === 'list') {
        const threads = await global.db.getAllThreads();
        const groups = threads.filter(t => t.type === 'group' || t.type === 'supergroup' || String(t.id).startsWith("-"));
        if (!groups.length) return message.reply('❌ কোনো গ্রুপ নাই।');
        let txt = `📋 All Groups (${groups.length}):\n\n`;
        groups.forEach((g, i) => txt += `${i+1}. ${g.name || 'Unknown'}\nID: ${g.id}\n👥 ${g.totalUsers || 0} members\n\n`);
        txt += `💡 Reply করুন: 1,3,5 আপনার মেসেজ`;
        const sent = await message.reply(txt);
        global.badol.onReply.set(sent.message_id, {
          commandName: "noti",
          type: 'groupList',
          author: userId,
          groups
        });
        return;
      }

      if (sub === 'dm') {
        const users = await global.db.getAllUsers();
        if (!users.length) return message.reply('❌ কোনো DM ইউজার নাই।');
        let txt = `📋 DM Users (${users.length}):\n\n`;
        users.slice(0, 50).forEach((u, i) => {
          const name = u.firstName + (u.lastName? ' ' + u.lastName : '');
          txt += `${i+1}. ${name}\nUID: ${u.id}\n\n`;
        });
        txt += `💡 Reply করুন: 1,3,5 আপনার মেসেজ`;
        const sent = await message.reply(txt);
        global.badol.onReply.set(sent.message_id, {
          commandName: "noti",
          type: 'dmList',
          author: userId,
          users: users
        });
        return;
      }

      let mode = 'all';
      let targets = [];
      let notiMessage = "";

      if (sub === 'all') {
        notiMessage = args.slice(1).join(" ").trim();
        if (!notiMessage && event.reply_to_message) {
          notiMessage = event.reply_to_message.text || event.reply_to_message.caption || "📢 Update";
        }
        mode = 'all';
      }
      else if (args[0] && (/^-?\d+$/.test(args[0]) || args[0].split(',').every(t => /^-?\d+$/.test(t.trim())))) {
        targets = args[0].split(',').map(t => t.trim());
        notiMessage = args.slice(1).join(" ").trim();
        if (!notiMessage && event.reply_to_message) notiMessage = event.reply_to_message.text || event.reply_to_message.caption || "📢 Update";
        mode = 'specific';
      }
      else {
        notiMessage = args.join(" ").trim();
        if (!notiMessage && event.reply_to_message) notiMessage = event.reply_to_message.text || event.reply_to_message.caption || "📢 Update";
        mode = 'all';
      }

      if (!notiMessage) return message.reply("❌ Message দাও!");
      await this.sendBroadcast(api, message, event, notiMessage, mode, targets);

    } catch (e) {
      console.log("Noti BADOL error:", e.message);
    }
  },

  onReply: async function ({ event, api, Reply, message }) {
    try {
      const input = (event.text || '').trim();
      if (!input.includes(' ')) return message.reply('❌ Format: 1,3,5 Hello');
      const parts = input.split(' ');
      const numbers = parts[0].split(',').map(n => parseInt(n.trim()));
      const notiMessage = parts.slice(1).join(' ').trim();
      if (!notiMessage) return message.reply('❌ মেসেজ দাও!');

      let targets = [];
      if (Reply.type === 'groupList') {
        targets = numbers.filter(n =>!isNaN(n) && n >= 1 && n <= Reply.groups.length).map(n => Reply.groups[n - 1].id);
      } else {
        targets = numbers.filter(n =>!isNaN(n) && n >= 1 && n <= Reply.users.length).map(n => Reply.users[n - 1].id);
      }

      if (!targets.length) return message.reply('❌ ভুল নাম্বার!');
      await this.sendBroadcast(api, message, event, notiMessage, 'specific', targets);
    } catch (e) {
      console.log("onReply error:", e.message);
    }
  },

  sendBroadcast: async function (api, message, event, notiMessage, mode = 'all', targets = []) {
    let statusMsg = null;
    try { statusMsg = await message.reply('⏳ Sending... 0%'); } catch {}

    let filePath = null;
    let fileType = null;
    const replyMsg = event.reply_to_message;

    if (replyMsg) {
      try {
        if (replyMsg.photo?.length > 0) {
          const photo = replyMsg.photo[replyMsg.photo.length - 1];
          filePath = await message.downloadAttachment({ type: 'photo', data: photo });
          fileType = 'photo';
        } else if (replyMsg.video) {
          filePath = await message.downloadAttachment({ type: 'video', data: replyMsg.video });
          fileType = 'video';
        } else if (replyMsg.document) {
          filePath = await message.downloadAttachment({ type: 'document', data: replyMsg.document });
          fileType = 'document';
        }
      } catch {}
    }

    let recipients = [];
    if (mode === 'all') {
      try {
        const threads = await global.db.getAllThreads();
        const users = await global.db.getAllUsers();
        // ✅ FIXED: dmApproved Filter বাদ দিলাম! সব User এ যাবে!
        const allGroupIds = threads.filter(t => t.type === 'group' || t.type === 'supergroup' || String(t.id).startsWith("-")).map(t => t.id);
        const allUserIds = users.map(u => u.id); // সব User
        recipients = [...allGroupIds,...allUserIds];
      } catch {}
    } else {
      recipients = targets;
    }

    const button = {
      reply_markup: {
        inline_keyboard: [[{ text: "👤 Owner Contact", url: "https://t.me/B4D9L_007" }]]
      }
    };

    let success = 0, failed = 0, removed = 0;

    for (let i = 0; i < recipients.length; i++) {
      const chatId = recipients[i];
      try {
        if (filePath && fs.existsSync(filePath)) {
          if (notiMessage.length > 900) {
            if (fileType === 'photo') await api.sendPhoto(chatId, { source: filePath }, { caption: "📢 Notification from Admin",...button }).catch(()=>{});
            else if (fileType === 'video') await api.sendVideo(chatId, { source: filePath }, { caption: "📢 Notification",...button }).catch(()=>{});
            else await api.sendDocument(chatId, { source: filePath }, { caption: "📢 Notification",...button }).catch(()=>{});
            await new Promise(r=>setTimeout(r,150));
            await api.sendMessage(chatId, notiMessage, button).catch(()=>{ throw new Error("blocked"); });
          } else {
            if (fileType === 'photo') await api.sendPhoto(chatId, { source: filePath }, { caption: notiMessage,...button });
            else if (fileType === 'video') await api.sendVideo(chatId, { source: filePath }, { caption: notiMessage,...button });
            else await api.sendDocument(chatId, { source: filePath }, { caption: notiMessage,...button });
          }
        } else {
          await api.sendMessage(chatId, notiMessage, button);
        }
        success++;
      } catch (err) {
        failed++;
        const em = (err.message||"").toLowerCase();
        if (em.includes("not found") || em.includes("kicked") || em.includes("blocked") || em.includes("forbidden") || em.includes("deactivated") || em.includes("upgraded")) {
          try {
            if (String(chatId).startsWith("-")) await global.db.deleteThread(String(chatId));
            else await global.db.deleteUser(String(chatId));
            removed++;
          } catch {}
        }
      }
      if (i % 5 === 0 && statusMsg) {
        try { await api.editMessageText(event.chat.id, statusMsg.message_id, null, `⏳ ${Math.floor((i/recipients.length)*100)}% | ✓ ${success} | ✗ ${failed} | 🗑️ ${removed}`); } catch {}
      }
      await new Promise(r=>setTimeout(r, 80));
    }

    if (filePath) try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}

    if (statusMsg) {
      try {
        await api.editMessageText(event.chat.id, statusMsg.message_id, null, `✅ Broadcast Done!\n\n📸 Photo: ${filePath? "Yes" : "No"}\n✓ Sent: ${success}\n✗ Failed: ${failed}\n🗑️ Cleaned: ${removed}\n📊 Total: ${recipients.length}\n\n👥 Users: ${recipients.length - 19} + Groups: 19`);
      } catch {
        await message.reply(`✅ Done! ✓ ${success} | ✗ ${failed} | Total ${recipients.length}`).catch(()=>{});
      }
    }
  }
};