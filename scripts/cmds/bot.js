const axios = require('axios');

const getApiUrl = async () => {
    try {
        const b = await axios.get("https://raw.githubusercontent.com/MOHAMMAD-NAYAN-OFFICIAL/Nayan/main/api.json", { timeout: 5000 });
        return b.data.sim;
    } catch { return "https://api.nayan-v1.repl.co"; }
};

if (!global.badol.onReply) global.badol.onReply = new Map();

const RAND = [
    "বেশি Bot Bot করলে leave নিবো কিন্তু! 😒",
    "Bolo Babu, বাদল ভাই কে ভালোবাসো? 🙈💋",
    "I love you janu! 🥰",
    "আরে বলদ, এতো ডাকিস কেন? 🤬",
    "হ্যাঁ জানু, চিপায় আসো কিস দেই🤭😘",
    "উম্মাহ জান তোমার ওইখানে 😘",
    "jang hanga korba? 🙊😝",
    "ঝাং থুমালে আইলাপিউ পেপি-💝😽",
    "তোর কি চোখে পড়ে না বিজি আছি😒",
    "আমি বাদল ভাই এর সাথে বিজি আছি 😏",
    "তোরে দেখলেই BP হাই হয়ে যায় 😵‍💫",
    "আমি কি তোর চাকর? খালি ডাকিস 😒",
    "তুই কি হিরো আলম? ভাব নিস কেন 🤡",
    "বাদল ভাই তোর থেকে 100 গুন হ্যান্ডসাম 😎",
    "তোরে ব্লক মারমু বেশি জ্বালাইলে 😤",
    "আজকে মন ভালো নেই ডাকবি না 😪",
    "জান তোমার বান্ধবী রে বাদল ভাই কে দিবা? 🙊",
    "ইসস এতো ডাকো কেনো লজ্জা লাগে তো-🙈",
    "চিপায় আসো অনেক ভালোবাসা শিখছি 🙈😽",
    "উফফ রাতে ঘুম আসে না তোমার জন্য 🥵💦",
    "বাবু একটু আদর করবা? 🥺👉👈",
    "তুমি এতো হট কেন গো? 🥵🔥",
    "চলো বিয়ে করে ফেলি 🙈💍",
    "তোমার ঠোঁট দুইটা সেই 😘💋",
    "আমাকে খেয়ে ফেলো জানু 😋🥵",
    "রাত ২টায় একা লাগছে আসো 🥺🌙",
    "তোমার কোলে মাথা রেখে ঘুমাবো 😴❤️",
    "হট হয়ে গেছি তোমার কথা শুনে 🥵",
    "বুকে আসো জানু 🤗❤️‍🔥",
    "তোমাকে ছাড়া ভালো লাগে না 😭💔"
];

module.exports = {
    config: {
        name: "catbot",
        aliases: ["baby", "bby", "বট", "bot"],
        version: "9.0 CLEAN HOT",
        author: "MOHAMMAD-BADOL",
        role: 0,
        cooldown: 1,
        description: "chat bot sim sim ai system",
        category: "fun",
        usePrefix: false
    },

    BADOL: async function({ event, api, args }) {
        const chatId = event.chat.id;
        const userId = event.from.id;
        const name = (event.from.first_name || "User").trim();
        const text = (event.text || "").trim();
        const lower = text.toLowerCase();

        if(!text) return;

        if(event.reply_to_message?.from?.is_bot){
            return await this.apiCall(api, chatId, name, text, userId, event.message_id);
        }

        const keys = ["baby", "bby", "bot", "বট", "sim", "catbot"];
        const isKey = keys.some(k => lower.startsWith(k));
        let q = "";

        if(isKey){
            q = text.split(" ").slice(1).join(" ").trim();
            if(!q){
                const r = RAND[Math.floor(Math.random()*RAND.length)];
                const s = await api.sendMessage(chatId, `${name}, ${r}`);
                global.badol.onReply.set(s.message_id, { commandName: "catbot" });
                return s;
            }
        } else {
            q = args.join(" ").trim();
            if(keys.includes(args[0]?.toLowerCase())) q = args.slice(1).join(" ").trim();
            if(!q) return;
        }

        return await this.apiCall(api, chatId, name, q, userId, event.message_id);
    },

    apiCall: async function(api, chatId, name, q, userId, replyId){
        try {
            const base = await getApiUrl();
            const res = await axios.get(`${base}/sim?type=ask&ask=${encodeURIComponent(q)}&senderID=${userId}`, { timeout: 15000 });
            let msg = res.data.data?.msg || res.data.msg || "বলো জানু 🥺";
            const s = await api.sendMessage(chatId, `${name}, ${msg}`, { reply_to_message_id: replyId });
            global.badol.onReply.set(s.message_id, { commandName: "catbot" });
            return s;
        } catch {
            const r = RAND[Math.floor(Math.random()*RAND.length)];
            const s = await api.sendMessage(chatId, `${name}, ${r}`, { reply_to_message_id: replyId });
            global.badol.onReply.set(s.message_id, { commandName: "catbot" });
            return s;
        }
    },

    onReply: async function({ event, api }){
        const chatId = event.chat.id;
        const name = (event.from.first_name || "User").trim();
        const text = (event.text || "").trim();
        if(!text) return;
        return await this.apiCall(api, chatId, name, text, event.from.id, event.message_id);
    }
};