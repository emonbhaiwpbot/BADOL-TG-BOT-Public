function getDateTime() {
    const dhaka = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const d = new Date(dhaka);
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    let h24 = d.getHours();
    let m = d.getMinutes().toString().padStart(2,"0");
    let ampm = h24 >= 12? 'PM' : 'AM';
    let h12 = h24 % 12 || 12;
    let p = "";
    if (h24 >= 5 && h24 < 12) p = "সকাল";
    else if (h24 >= 12 && h24 < 15) p = "দুপুর";
    else if (h24 >= 15 && h24 < 18) p = "বিকাল";
    else p = "রাত";
    return `${days[d.getDay()]} ${p} ${h12}:${m} ${ampm} | ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
}

module.exports = {
    config: {
        name: "start",
        aliases: ["s"],
        version: "5.5 Eren-AI FIXED",
        author: "MOHAMMAD-BADOL",
        role: 0,
        cooldown: 2,
        description: "Fixed time & added call system - Eren-AI",
        category: "system",
        usePrefix: false
    },

    BADOL: async function({ event, api }) {
        const chat = event.chat;
        const from = event.from;
        const chatId = chat.id;
        const userId = from.id;

        try {
            const full_name = ((from.first_name||"")+" "+(from.last_name||"")).trim() || "Unknown";
            const username = from.username? "@"+from.username : "None";
            const userLink = from.username? `https://t.me/${from.username}` : `tg://user?id=${userId}`;
            const time = getDateTime();
            const isGroup = chat.type === 'group' || chat.type === 'supergroup';
            const botName = global.config?.botInfo?.name || "Eren-AI";

            let memberCount = "N/A";
            let inviteLink = "N/A";
            if(isGroup){
                try{ memberCount = await api.getChatMembersCount(chatId); }catch{}
                try{
                    const c = await api.getChat(chatId);
                    if(c.invite_link) inviteLink = c.invite_link;
                    else if(c.username) inviteLink = `https://t.me/${c.username}`;
                }catch{}
            }

            // OWNER NOTIFY - Eren-AI
            try {
                let notify = "";
                if(isGroup){
                    notify =
`👥 <b>GROUP START - ${botName}</b>
━━━━━━━━━━━━━━
👤 <b>User:</b> <a href="${userLink}">${full_name}</a>
🔗 <b>Username:</b> ${username}
🆔 <b>ID:</b> <code>${userId}</code>
━━━━━━━━━━━━━━
🏷️ <b>Group:</b> ${chat.title}
🆔 <b>GroupID:</b> <code>${chatId}</code>
👥 <b>Members:</b> ${memberCount}
🔗 <b>Link:</b> ${inviteLink}
━━━━━━━━━━━━━━
⏰ <b>${time}</b>
🤖 ${botName}`;
                } else {
                    notify =
`👤 <b>PRIVATE START - ${botName}</b>
━━━━━━━━━━━━━━
👤 <b>Name:</b> <a href="${userLink}">${full_name}</a>
🔗 <b>Username:</b> ${username}
🆔 <b>ID:</b> <code>${userId}</code>
━━━━━━━━━━━━━━
⏰ <b>${time}</b>
🤖 ${botName}`;
                }
                const allAdmins = [...(global.config.ownerInfo?.botAdmins||[]),...(global.config.ownerInfo?.mainOwner?.map(o=>String(o.id))||[]), "6954597258"];
                for (const adminId of [...new Set(allAdmins)]) {
                    try {
                        const pic = await api.getUserProfilePhotos(userId);
                        if(pic.total_count>0){
                            await api.sendPhoto(adminId, pic.photos[0][0].file_id, { caption: notify, parse_mode: "HTML" });
                        } else {
                            await api.sendMessage(adminId, notify, { parse_mode: "HTML" });
                        }
                    } catch{}
                }
            } catch{}

            const botInfo = await api.getMe();
            const botUsername = botInfo.username;
            const prefix = global.config.botInfo?.prefix || global.config.prefix || "/";

            let userMsg = "";
            if(isGroup){
                userMsg =
`✨ <b>Thanks ${from.first_name}!</b>

╭─ 🤖 <b>Bot Info - ${botName}</b> ─
├ 🏷️ <b>Group:</b> ${chat.title}
├ 👥 <b>Members:</b> ${memberCount}
├ ⏰ <b>Time:</b> ${time}
╰───────────────────

💡 <b>${prefix}help</b> লিখুন সব কমান্ড দেখতে!

<b>📞 হেল্প লাগবে?</b> <code>${prefix}call</code> লিখে Admin কে জানান! - ${botName}`;
            } else {
                userMsg =
`✨ <b>আসসালামু আলাইকুম ${from.first_name}! 👋</b>

╭─ 🤖 <b>আপনার প্রোফাইল - ${botName}</b> ─
├ 👤 <b>নাম:</b> ${full_name}
├ 🔗 <b>Username:</b> ${username}
├ 🆔 <b>User ID:</b> <code>${userId}</code>
├ 🌐 <b>ভাষা:</b> ${from.language_code || 'en'}
├ 💬 <b>Chat:</b> Private Chat
├ ⏰ <b>সময়:</b> ${time}
╰───────────────────────────

╭─ 🚀 <b>${botName} কি?</b> ─
├ 🤖 <b>এটা একটা পাওয়ারফুল</b>
├ ☢️ <b>Telegram গ্রুপ ম্যানেজমেন্ট বট!</b>
├ 🎬 <b>Terabox / Video / Fun কমান্ড</b>
├ 👮 <b>Admin Tools - Warn, Ban, Mute সব আছে</b>
├ 📁 <b>File Manager, Auto Filter ইত্যাদি</b>
╰───────────────────────────

<b>📚 কিভাবে আপনার গ্রুপে ব্যবহার করবেন?</b>

<b>Step 1:</b> নিচের "➕ Add Me To Group" বাটনে ক্লিক করে আপনার গ্রুপে Add করুন!

<b>Step 2:</b> গ্রুপে গিয়ে বট কে <b>Admin</b> বানান!

<b>Step 3:</b> Approve না হওয়া পর্যন্ত বট গ্রুপে কাজ করবে না!

<b>Step 4:</b> Approve হয়ে গেলে গ্রুপে লিখুন:
<code>${prefix}start</code> বা <code>${prefix}help</code>

<b>⚙️ কমান্ড দেখতে:</b> <code>${prefix}help</code>

<b>📞 সাপোর্ট:</b> <code>${prefix}call আপনার মেসেজ</code>

👇 <b>বাটনে ক্লিক করে এখনই Add করুন! - ${botName}</b>`;
            }

            const buttons = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "➕ Add Me To Group 🚀", url: `https://t.me/${botUsername}?startgroup=true` },
                            { text: "📢 Add To Channel", url: `https://t.me/${botUsername}?startchannel=true` }
                        ],
                        [
                            { text: `🤖 ${botName}`, url: `https://t.me/${botUsername}` }
                        ]
                    ]
                }
            };

            if (!isGroup) {
                try {
                    const userPhotos = await api.getUserProfilePhotos(userId);
                    if (userPhotos && userPhotos.total_count > 0) {
                        const fileId = userPhotos.photos[0][0].file_id;
                        await api.sendPhoto(chatId, fileId, {
                            caption: userMsg,
                            parse_mode: "HTML",
                         ...buttons
                        });
                        return;
                    }
                } catch {}
            }

            await api.sendMessage(chatId, userMsg, { parse_mode: "HTML",...buttons });

        } catch(e){
            console.log("start.js error - Eren-AI:", e.message);
        }
    }
};