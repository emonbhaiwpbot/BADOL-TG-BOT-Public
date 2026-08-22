// ✅ BADOL TG BOT V8.6 - XX VIDEO SEARCH & DOWNLOADER CONVERTED
const axios = require("axios");

if (!global.xSearchSessions) global.xSearchSessions = new Map();

// ✅ Restricted Group Add করা হলো
const restrictedGroups = [-1002036630134, -1003128747983, -1002843537512, -1003706703054];

module.exports = {
    config: {
        name: "xx",
        version: "12.0-TG-FIXED",
        author: "MOHAMMAD-BADOL",
        role: 0,
        credit: "MOHAMMAD BADOL",
        description: "Video Search & Downloader",
        category: "media",
        prefix: true,
        cooldown: 5,
        aliases: ["xsearch", "xvideo2"]
    },

    BADOL: async function({ api, chatId, ctx, event, args }) {
        const msg = event || ctx?.message || {};
        const senderId = msg.from?.id;

        // ✅ Group Check
        if (restrictedGroups.includes(Number(chatId))) {
            return await api.sendMessage(chatId, "⚠️ **দুঃখিত, এই গ্রুপে এই কমান্ডটি ব্যবহার করা নিষিদ্ধ!**");
        }

        const query = args.join(" ").trim();
        if (!query) return await api.sendMessage(chatId, "⚠️ **অনুগ্রহ করে সার্চ টেক্সট লিখুন!**\nUsage: /xx <query>");

        const loadingMsg = await api.sendMessage(chatId, "⏳ **Searching videos... please wait.**");

        try {
            const res = await axios.get(`https://x-search-api-sagor.vercel.app/sagor?apikey=sagor&q=${encodeURIComponent(query)}`);
            let results = res.data.data || [];

            // Filter: 10 min+
            results = results.filter(i => {
                const t = (i.title || "").toLowerCase();
                if (t.includes("sex") || t.includes("porn") || t.includes("xxx")) return false;
                const d = (i.duration || "").toLowerCase();
                if (d.includes("min")) {
                    const min = parseInt(d);
                    return min <= 10;
                }
                if (d.includes("sec")) return true;
                return false;
            });

            const list = results.slice(0, 6);

            if (list.length === 0) {
                try {
                    return await api.editMessageText("❌ **কোনো রেজাল্ট পাওয়া যায়নি (অথবা ভিডিও ১০ মিনিটের বেশি)।**", {
                        chat_id: chatId,
                        message_id: loadingMsg.message_id
                    });
                } catch {
                    return await api.sendMessage(chatId, "❌ **কোনো রেজাল্ট পাওয়া যায়নি!**");
                }
            }

            let responseText = `🔎 **Video Search Results (≤10 Min)**\n━━━━━━━━━━━━━━━━━━━━\n`;
            list.forEach((item, i) => {
                responseText += `**${i + 1}.** ${item.title}\n⏱ Duration: ${item.duration}\n\n`;
            });
            responseText += `━━━━━━━━━━━━━━━━━━━━\n💬 **ডাউনলোড করতে (1-${list.length}) লিখে রিপ্লাই দিন।**\n👤 **Credit: MOHAMMAD BADOL**`;

            const mediaGroup = list.map(item => ({
                type: 'photo',
                media: item.thumbnail || "https://placehold.co/600x400?text=No+Thumbnail"
            }));

            try {
                await api.sendMediaGroup(chatId, mediaGroup);
            } catch (e) {
                console.log("MediaGroup Fail:", e.message);
            }

            await api.sendMessage(chatId, responseText);

            // Session Save
            global.xSearchSessions.set(chatId + "_" + senderId, {
                list: list,
                timestamp: Date.now()
            });

            try { await api.deleteMessage(chatId, loadingMsg.message_id); } catch {}

        } catch (e) {
            console.error("XX Search Error:", e.message);
            try {
                await api.editMessageText("❌ **API থেকে তথ্য নিতে সমস্যা হচ্ছে!**", {
                    chat_id: chatId,
                    message_id: loadingMsg.message_id
                });
            } catch {
                await api.sendMessage(chatId, "❌ **API থেকে তথ্য নিতে সমস্যা হচ্ছে!**");
            }
        }
    },

    // ✅ Reply Number Handler
    onChat: async function({ api, chatId, event }) {
        const msg = event;
        if (!msg ||!msg.text) return;
        if (msg.text.startsWith("/")) return;
        if (isNaN(msg.text.trim())) return;

        const senderId = msg.from?.id;
        const sessionKey = chatId + "_" + senderId;
        const session = global.xSearchSessions.get(sessionKey);
        if (!session) return;

        if (Date.now() - session.timestamp > 600000) {
            global.xSearchSessions.delete(sessionKey);
            return;
        }

        const index = parseInt(msg.text.trim());
        if (index < 1 || index > session.list.length) return;

        const selected = session.list[index - 1];
        const statusMsg = await api.sendMessage(chatId, "📥 **ভিডিও প্রসেস হচ্ছে... দয়া করে অপেক্ষা করুন।**");

        try {
            const dlRes = await axios.get(`https://x-down-api-sagor.vercel.app/sagor?apikey=sagor&q=${encodeURIComponent(selected.url)}`);
            const data = dlRes.data.data;
            let videoUrl = data?.downloads?.[0]?.url;
            if (!videoUrl) throw new Error("Video link not found");

            await api.sendVideo(chatId, videoUrl, {
                caption: `🎬 **Title:** ${data.title}\n⏱ **Duration:** ${data.duration}\n\n👤 **Credit: MOHAMMAD BADOL**`
            });

            try { await api.deleteMessage(chatId, statusMsg.message_id); } catch {}
            global.xSearchSessions.delete(sessionKey);

        } catch (e) {
            console.error("XX DL Error:", e.message);
            try {
                await api.editMessageText("❌ **ডাউনলোড এরর! ভিডিওটি অনেক বড় অথবা লিঙ্ক কাজ করছে না।**", {
                    chat_id: chatId,
                    message_id: statusMsg.message_id
                });
            } catch {
                await api.sendMessage(chatId, "❌ **ডাউনলোড এরর!**");
            }
        }
    }
};