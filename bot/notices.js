const fs = require('fs');
const path = require('path');

const APPROVED_FILE = path.join(__dirname, "../data/approvedGroups.json");
const ADMINONLY_FILE = path.join(__dirname, "../data/adminonly.json");

function getConfig() {
  const cfg = global.config;
  if (!cfg) return { adminUID: [], onlyAdmin: false, prefix: '/', botName: 'Eren-AI', ownerName: 'MOHAMMAD BADOL' };

  // 2 Owner Support for ownerName
  let ownerName = 'MOHAMMAD BADOL';
  const mainOwner = cfg.ownerInfo?.mainOwner;
  if(Array.isArray(mainOwner)) ownerName = mainOwner.map(o=>o.name).join(" & ");
  else if(mainOwner?.name) ownerName = mainOwner.name;
  else if(cfg.ownerName) ownerName = cfg.ownerName;

  return {
    adminUID: cfg.ownerInfo?.botAdmins || cfg.adminUID || [],
    onlyAdmin: cfg.ownerInfo?.onlyAdmin?? cfg.onlyAdmin?? false,
    onlyAdminMessage: cfg.ownerInfo?.onlyAdminMessage || cfg.onlyAdminMessage || "⚠️ Admin only mode",
    prefix: cfg.botInfo?.prefix || cfg.prefix || '/',
    botName: cfg.botInfo?.name || cfg.botName || 'Eren-AI',
    ownerName: ownerName,
    bannedUsers: cfg.banSystem?.bannedUsers || [],
    bannedGroups: cfg.banSystem?.bannedGroups || []
  };
}

function safeName(str, len=28){
  try{
    if(!str) return "Unknown";
    str=String(str).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
    if(!str) return "Unknown";
    const arr=Array.from(str);
    if(arr.length>len) return arr.slice(0,len).join("")+"…";
    return arr.join("");
  }catch{ return "Group"; }
}

function isBotAdminCheck(userId) {
  const cfg = getConfig();
  return cfg.adminUID.map(String).includes(String(userId)) || String(userId) === "6954597258";
}

// 2 Owner Check Function
function isOwnerCheck(userId){
  const uid = String(userId);
  if(uid === "6954597258") return true;
  const mainOwner = global.config?.ownerInfo?.mainOwner;
  if(Array.isArray(mainOwner)){
    return mainOwner.map(o=>String(o.id)).includes(uid);
  }
  const ownerId = String(global.config?.ownerInfo?.mainOwner?.id || global.config?.ownerInfo?.ownerId || "6954597258");
  return uid === ownerId;
}

function getApprovedGroups() {
  try {
    if (fs.existsSync(APPROVED_FILE)) return JSON.parse(fs.readFileSync(APPROVED_FILE, 'utf8'));
    return [];
  } catch { return []; }
}

function getAdminOnlyState() {
  try {
    if (fs.existsSync(ADMINONLY_FILE)) {
      const data = JSON.parse(fs.readFileSync(ADMINONLY_FILE, 'utf8'));
      if (typeof data.enabled === 'boolean') return data.enabled;
    }
  } catch {}
  const st = global.config?.settings || {};
  if (st.adminOnlyMode!== undefined) return st.adminOnlyMode === true;
  if (st.onlyAdmin!== undefined) return st.onlyAdmin === true;
  return false;
}

function getGroupApprovalEnabled() {
  const st = global.config?.settings || {};
  if (st.groupApprovalEnabled!== undefined) return st.groupApprovalEnabled!== false;
  if (st.groupApproval && typeof st.groupApproval.enabled!== 'undefined') return st.groupApproval.enabled!== false;
  return true;
}

function getDMApprovalEnabled() {
  const st = global.config?.settings || {};
  if (st.dmApprovalEnabled!== undefined) return st.dmApprovalEnabled === true;
  if (st.dmApproval && typeof st.dmApproval.enabled!== 'undefined') return st.dmApproval.enabled === true;
  return false;
}

module.exports = {
  async checkBan({ api, chatId, userId, text, prefix, event }) {
    if (!global.db && getConfig().bannedUsers.length === 0) return { blocked: false };
    if (!userId) return { blocked: false };
    try {
      const cfg = getConfig();
      const uid = String(userId);
      const gid = String(chatId);
      const raw = String(text||"").trim().toLowerCase();
      let _cmd = raw.split(' ')[0] || "";
      if(_cmd.startsWith(prefix)) _cmd = _cmd.slice(prefix.length);
      if(_cmd.startsWith('/')) _cmd = _cmd.slice(1);
      if(_cmd.includes('@')) _cmd = _cmd.split('@')[0];
      const _isRequest = ["request","req","appeal"].includes(_cmd);
      if(_isRequest) return { blocked: false };
      if (cfg.bannedUsers.includes(uid)) {
        let reason = cfg.banSystem?.bannedUsersReason?.[uid] || 'No reason';
        reason = reason.length > 16? reason.slice(0,16)+'..' : reason;
        const msg =
`┏━━━━━━━━━━━━━━━━━━━┓
┃ ⛔ BANNED USER ⛔ ┃
┣━━━━━━━━━━━━━━━━━━━┫
┃ 🚫 Access Denied ┃
┃ 📝 ${reason.padEnd(16)}┃
┃ 💡 ${prefix}request to appeal┃
┣━━━━━━━━━━━━━━━━━━━┫
┃ 🤖 ${cfg.botName.padEnd(13)}┃
┃ 👑 ${cfg.ownerName.padEnd(13)}┃
┗━━━━━━━━━━━━━━━━━━━┛`;
        if (text.startsWith(prefix) || text.startsWith('/')) {
          await api.sendMessage(chatId, msg, { reply_to_message_id: event.message_id }).catch(()=>{});
        }
        return { blocked: true, silent: false };
      }
      if (cfg.bannedGroups.includes(gid)) {
        return { blocked: true, silent: true };
      }
      if (global.db) {
        const isBanned = await global.db.isUserBanned(String(userId));
        if (!isBanned) return { blocked: false };
        if (!text.startsWith(prefix) &&!text.startsWith('/')) {
          return { blocked: true, silent: true };
        }
        let reason = 'No reason';
        try {
          const info = await global.db.getBanInfo?.(String(userId)) || {};
          if (info.reason) reason = info.reason;
        } catch {}
        reason = reason.length > 16? reason.slice(0,16)+'..' : reason;
        const msg =
`┏━━━━━━━━━━━━━━━━━━━┓
┃ ⛔ BANNED USER ⛔ ┃
┣━━━━━━━━━━━━━━━━━━━┫
┃ 🚫 Access Denied ┃
┃ 📝 ${reason.padEnd(16)}┃
┃ 💡 ${prefix}request to appeal┃
┣━━━━━━━━━━━━━━━━━━━┫
┃ 🤖 ${cfg.botName.padEnd(13)}┃
┃ 👑 ${cfg.ownerName.padEnd(13)}┃
┗━━━━━━━━━━━━━━━━━━━┛`;
        await api.sendMessage(chatId, msg, { reply_to_message_id: event.message_id }).catch(()=>{});
        return { blocked: true, silent: false };
      }
      return { blocked: false };
    } catch { return { blocked: false }; }
  },

  checkPermission({ command, userId, chatId }) {
    const cfg = getConfig();
    const uid = String(userId);
    const role = command.config.role || 0;
    const isOwner = isOwnerCheck(uid);

    const st = global.config?.settings || {};
    const onlyAdminEnabled = st.onlyAdmin === true || st.adminOnlyMode === true || getAdminOnlyState();
    if (onlyAdminEnabled &&!cfg.adminUID.map(String).includes(uid) &&!isOwner) {
      if (getAdminOnlyState() && (st.adminOnlyMode === true || fs.existsSync(ADMINONLY_FILE))) {
        return { blocked: true, silent: true, msg: null };
      }
      return {
        blocked: true,
        msg: `┏━━━━━━━━━━━━━━━━━━━┓\n┃ ⚠️ ADMIN ONLY ⚠️ ┃\n┣━━━━━━━━━━━━━━━━━━━┫\n┃ Admin mode is ON ┃\n┣━━━━━━━━━━━━━━━━━━━┫\n┃ 🤖 ${cfg.botName.padEnd(13)}┃\n┃ 👑 ${cfg.ownerName.padEnd(13)}┃\n┗━━━━━━━━━━━━━━━━━━━┛`
      };
    }
    if (role === 0) return { blocked: false };
    if (role === 2) {
      if (!isOwner) {
        return {
          blocked: true,
          msg: `┏━━━━━━━━━━━━━━━━━━━┓\n┃ 👑 OWNER ONLY 👑 ┃\n┣━━━━━━━━━━━━━━━━━━━┫\n┃ Only Owner Can Use ┃\n┣━━━━━━━━━━━━━━━━━━━┫\n┃ 🤖 ${cfg.botName.padEnd(13)}┃\n┃ 👑 ${cfg.ownerName.padEnd(13)}┃\n┗━━━━━━━━━━━━━━━━━━━┛`
        };
      }
      return { blocked: false };
    }
    if (role === 1) {
      if (isOwner) return { blocked: false };
      if (cfg.adminUID.map(String).includes(uid)) return { blocked: false };
      try {
        if (chatId && global.badol?.threadAdmins?.has(String(chatId))) {
          const cached = global.badol.threadAdmins.get(String(chatId));
          if (cached?.admins?.map(String).includes(uid)) return { blocked: false };
          if (Array.isArray(cached) && cached.map(String).includes(uid)) return { blocked: false };
        }
      } catch {}
      return {
        blocked: true,
        msg: `┏━━━━━━━━━━━━━━━━━━━┓\n┃ 🔒 ADMIN ONLY 🔒 ┃\n┣━━━━━━━━━━━━━━━━━━━┫\n┃ Bot & Group Admins ┃\n┣━━━━━━━━━━━━━━━━━━━┫\n┃ 🤖 ${cfg.botName.padEnd(13)}┃\n┃ 👑 ${cfg.ownerName.padEnd(13)}┃\n┗━━━━━━━━━━━━━━━━━━━┛`
      };
    }
    return { blocked: false };
  },

  checkCooldown({ command, userId }) {
    const st = global.config?.settings || {};
    const cooldownEnabled = st.cooldownEnabled!== false && st.cooldown?.enabled!== false;
    if (!cooldownEnabled && (st.cooldownEnabled === false || st.cooldown?.enabled === false)) return { blocked: false };
    const cfg = getConfig();
    const key = `${userId}_${command.config.name}`;
    const now = Date.now();
    const amount = (command.config.cooldown || 0) * 1000;
    if (global.badol.cooldowns.has(key)) {
      const exp = global.badol.cooldowns.get(key) + amount;
      if (now < exp) {
        const left = ((exp-now)/1000).toFixed(1);
        return {
          blocked: true,
          msg: `┏━━━━━━━━━━━━━━━━━━━┓\n┃ ⏳ COOLDOWN ⏳ ┃\n┣━━━━━━━━━━━━━━━━━━━┫\n┃ Wait ${left.padEnd(6)}s ┃\n┣━━━━━━━━━━━━━━━━━━━┫\n┃ 🤖 ${cfg.botName.padEnd(13)}┃\n┃ 👑 ${cfg.ownerName.padEnd(13)}┃\n┗━━━━━━━━━━━━━━━━━━━┛`
        };
      }
    }
    global.badol.cooldowns.set(key, now);
    setTimeout(()=>global.badol.cooldowns.delete(key), amount);
    return { blocked: false };
  },

  checkAdminOnly(userId) {
    const enabled = getAdminOnlyState();
    if (!enabled) return { blocked: false };
    if (!isBotAdminCheck(userId) &&!isOwnerCheck(userId)) {
      return { blocked: true, silent: true, msg: null };
    }
    return { blocked: false };
  },

  checkMaintenance(userId) {
    const st = global.config?.settings || {};
    const enabled = st.maintenanceEnabled === true || st.maintenance?.enabled === true;
    if (!enabled) return { blocked: false };
    if (!isBotAdminCheck(userId) &&!isOwnerCheck(userId)) {
      return { blocked: true, silent: true, msg: null };
    }
    return { blocked: false };
  },

  checkGroupApproval(chatId, commandName, chatTitle) {
    const enabled = getGroupApprovalEnabled();
    if (!enabled) return { blocked: false };
    const isGroup = String(chatId).startsWith("-");
    if (!isGroup) return { blocked: false };
    const approvedList = getApprovedGroups();
    const isApproved = approvedList.includes(String(chatId));
    const allowCmds = ["approve", "setting", "group", "gclist", "gcapprove", "gapprove"];
    if (!isApproved &&!allowCmds.includes(commandName)) {
      const displayName = safeName(chatTitle || "This Group", 28);
      const cfg = getConfig();
      const box = `╭─❖─〔 EREN-AI 〕─❖─╮\n`+
                  `│ ❌ 𝐍𝐎𝐓 𝐀𝐏𝐏𝐑𝐎𝐕𝐄𝐃 ❌ │\n`+
                  `├──────────────────────┤\n`+
                  `│ 📛 Group: ${displayName}\n`+
                  `│ 🆔 ID: ${chatId}\n`+
                  `├──────────────────────┤\n`+
                  `│ ⚠️ এই গ্রুপটি এখনো\n`+
                  `│ Approval করা হয়নি!\n`+
                  `│ 📩 Owner কে নক দাও!\n`+
                  `├──────────────────────┤\n`+
                  `│ 👑 𝐃𝐄𝐕: ${cfg.ownerName}\n`+
                  `╰─❖─〔 EREN-AI 〕─❖─╯`;
      return {
        blocked: true,
        silent: false,
        msg: box,
        keyboard: {
          inline_keyboard: [
            [{text:"👑 Contact Owner", url:"https://t.me/B4D9L_007"}],
            [{text:"📢 Support Group", url:"https://t.me/BADOLBOTGC"}]
          ]
        }
      };
    }
    return { blocked: false };
  },

  checkDMApproval(userId, chatType, commandName) {
    const enabled = getDMApprovalEnabled();
    if (!enabled) return { blocked: false };
    if (chatType!== 'private') return { blocked: false };
    const allowCmds = ["request", "req", "appeal", "start"];
    if (!isBotAdminCheck(userId) &&!isOwnerCheck(userId) &&!allowCmds.includes(commandName)) {
      return { blocked: true, silent: true, msg: null };
    }
    return { blocked: false };
  },

  getNotFoundNotice(commandName, prefix) {
    const cfg = getConfig();
    return `┏━━━━━━━━━━━━━━━━━━━┓\n┃ ❌ CMD NOT FOUND ❌ ┃\n┣━━━━━━━━━━━━━━━━━━━┫\n┃ 🔍 "${commandName.slice(0,12).padEnd(12)}" ┃\n┃ 💡 ${prefix}help for list ┃\n┣━━━━━━━━━━━━━━━━━━━┫\n┃ 🤖 ${cfg.botName.padEnd(13)}┃\n┃ 👑 ${cfg.ownerName.padEnd(13)}┃\n┗━━━━━━━━━━━━━━━━━━━┛`;
  },

  isBanSystemEnabled() {
    const st = global.config?.settings || {};
    return st.banSystemEnabled!== false && st.banSystem?.enabled!== false;
  },

  getAdminOnlyState,
  getGroupApprovalEnabled,
  getDMApprovalEnabled
};