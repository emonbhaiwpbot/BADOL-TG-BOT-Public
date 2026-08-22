const fs=require('fs');
const path=require('path');
const FILE=path.join(__dirname,"../../data/approvedGroups.json");
try{ if(!fs.existsSync(FILE)){ fs.mkdirSync(path.dirname(FILE),{recursive:true}); fs.writeFileSync(FILE,"[]","utf8"); } }catch{}
function getList(){ try{ const d=fs.readFileSync(FILE,'utf8'); return d.trim()? JSON.parse(d).map(String) : []; }catch{return []} }
function saveList(l){ try{ fs.writeFileSync(FILE,JSON.stringify(l,null,2),'utf8'); }catch{} }
function safeName(str, len=25){
  try{
    if(!str) return "Unknown";
    str=String(str).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
    if(!str) return "Unknown";
    const arr=Array.from(str);
    if(arr.length>len) return arr.slice(0,len).join("")+"…";
    return arr.join("");
  }catch{ return "Group"; }
}
if(!global.approveView) global.approveView={};

// ✅ BOX DESIGNS - Eren-AI Only Bot Name
const BOX = {
  line: "━━━━━━━━━━━━━━━━━━━━━━",
  line2: "──────────────────────",
  top: "╭─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╮",
  bottom: "╰─❖─〔 𝐄𝐫𝐞𝐧-𝐀𝐈 〕─❖─╯",
  bot: "🤖 Eren-AI"
};

module.exports={
  config:{
    name:"approve",
    version:"8.0 Eren-AI FIXED",
    author:"MOHAMMAD BADOL",
    countDown:5,
    role: 1,
    description:"Approve box design - Eren-AI",
    category:"admin",
    usePrefix:true,
    aliases:["gcapprove","approval","apv"]
  },
  BADOL: async function({ctx,chatId,args}){
    try{
      const sub=String(args[0]||"").toLowerCase();
      const id=String(chatId);
      const isG=id.startsWith("-")||ctx.message?.chat?.type==='group'||ctx.message?.chat?.type==='supergroup';
      let list=getList();
      if(isG){
        if(sub==="unapprove"||sub==="off"||sub==="0"){
          list=list.filter(x=>x!==id); saveList(list);
          await ctx.telegram.sendMessage(chatId,
            `${BOX.top}\n`+
            `│ ❌ 𝐆𝐑𝐎𝐔𝐏 𝐎𝐅 │\n`+
            `${BOX.line2}\n`+
            `│ 🆔 ${id}\n`+
            `│ 📦 Total ON: ${list.length}\n`+
            `${BOX.line2}\n`+
            `│ ${BOX.bot}\n`+
            `${BOX.bottom}`
          );
          try{
            await ctx.telegram.sendMessage(id,
              `${BOX.top}\n`+
              `│ ❌ 𝐆𝐑𝐎𝐔𝐏 Apv OFF ❌ │\n`+
              `${BOX.line2}\n`+
              `│ এই গ্রুপটি Apv OFF করা হয়েছে!\n`+
              `│ এখন থেকে বট কাজ করবে না!\n`+
              `${BOX.line2}\n`+
              `│ 📩 Contact Admin\n`+
              `│ ${BOX.bot}\n`+
              `${BOX.bottom}`
            );
          }catch{}
          return;
        }
        if(!list.includes(id)){ list.push(id); saveList(list); }
        await ctx.telegram.sendMessage(chatId,
          `${BOX.top}\n`+
          `│ ✅ 𝐆𝐑𝐎𝐔𝐏 𝐎𝐍 │\n`+
          `${BOX.line2}\n`+
          `│ 🆔 ${id}\n`+
          `│ 📦 Total ON: ${list.length}\n`+
          `${BOX.line2}\n`+
          `│ ${BOX.bot}\n`+
          `${BOX.bottom}`
        );
        try{
          await ctx.telegram.sendMessage(id,
            `${BOX.top}\n`+
            `│ ✅ 𝐆𝐑𝐎𝐔𝐏 𝐀𝐏𝐑𝐎𝐕𝐄𝐃 ✅ │\n`+
            `${BOX.line2}\n`+
            `│ অভিনন্দন! গ্রুপটি Apv ON হয়েছে!\n`+
            `│ এখন থেকে বট কাজ করবে!\n`+
            `${BOX.line2}\n`+
            `│ 💡 /help for commands\n`+
            `│ ${BOX.bot}\n`+
            `${BOX.bottom}`
          );
        }catch{}
        return;
      }
      return await sendMainPanel(ctx,chatId,0,sub||"all");
    }catch(e){ await ctx.telegram.sendMessage(chatId, `Error: ${e.message} - Eren-AI`).catch(()=>{}); }
  },

  onCallback: async function({event,ctx}){
    try{
      const data=event.data; const chatId=event.message.chat.id;
      try{ await ctx.answerCbQuery().catch(()=>{}); }catch{}
      let list=getList();

      if(data==="approve_back"){
        const v=global.approveView[chatId]||{page:0,filter:"all"};
        return await sendMainPanel(ctx,chatId,v.page,v.filter,event.message.message_id);
      }
      if(data.startsWith("approve_main_")){
        const p=data.replace("approve_main_","").split("_");
        return await sendMainPanel(ctx,chatId,parseInt(p[0])||0,p[1]||"all",event.message.message_id);
      }
      if(data.startsWith("approve_filter_")){
        return await sendMainPanel(ctx,chatId,0,data.replace("approve_filter_",""),event.message.message_id);
      }
      if(data.startsWith("approve_view_")){
        return await sendDetailPanel(ctx,chatId,data.replace("approve_view_",""),event.message.message_id);
      }
      if(data.startsWith("approve_toggle_")){
        const gid=data.replace("approve_toggle_","");
        const wasOn=list.includes(gid);
        if(wasOn){
          list=list.filter(x=>x!==gid); saveList(list);
          try{
            await ctx.telegram.sendMessage(gid,
              `${BOX.top}\n`+
              `│ ❌ 𝐆𝐑𝐎𝐔𝐏 Apv 𝐎𝐅 ❌ │\n`+
              `${BOX.line2}\n`+
              `│ এই গ্রুপটি এডমিন Apv OFF করেছে!\n`+
              `│ বট এখন থেকে অফ থাকবে!\n`+
              `${BOX.line2}\n`+
              `│ ${BOX.bot}\n`+
              `${BOX.bottom}`
            );
          }catch{}
        }else{
          list.push(gid); saveList(list);
          try{
            await ctx.telegram.sendMessage(gid,
              `${BOX.top}\n`+
              `│ ✅ 𝐆𝐑𝐎𝐔𝐏 Apv 𝐎𝐍 ✅ │\n`+
              `${BOX.line2}\n`+
              `│ অভিনন্দন! গ্রুপটি Apv ON হয়েছে!\n`+
              `│ বট এখন থেকে কাজ করবে!\n`+
              `${BOX.line2}\n`+
              `│ 💡 /help\n`+
              `│ ${BOX.bot}\n`+
              `${BOX.bottom}`
            );
          }catch{}
        }
        return await sendDetailPanel(ctx,chatId,gid,event.message.message_id);
      }
    }catch(e){ console.log(e); }
  }
};

async function getAllGroups(){
  try{
    let t=[]; if(global.db?.getAllThreads) t=await global.db.getAllThreads();
    return t.filter(x=>String(x.id||x.threadID).startsWith("-")).map(x=>({
      id: String(x.id||x.threadID),
      name: String(x.name||x.title||"Unknown"),
      members: x.memberCount||0
    }));
  }catch{ return []; }
}

async function sendMainPanel(ctx,chatId,page,filter,editId=null){
  const PER=6;
  let list=getList();
  let groups=await getAllGroups();
  if(groups.length===0 && list.length>0){ groups=list.map(id=>({id, name:`Group ${id.slice(-6)}`, members:0})); }
  let filtered=groups;
  if(filter==="on"||filter==="approved") filtered=groups.filter(g=>list.includes(g.id));
  if(filter==="off"||filter==="pending") filtered=groups.filter(g=>!list.includes(g.id));
  const totalPages=Math.max(1,Math.ceil(filtered.length/PER));
  const safePage=Math.max(0,Math.min(page,totalPages-1));
  global.approveView[chatId]={page:safePage, filter};
  const pageGroups=filtered.slice(safePage*PER, (safePage+1)*PER);

  let txt=`${BOX.top}\n`;
  txt+=`│ 🔐 𝐀𝐏𝐏𝐑𝐎𝐕𝐄 𝐏𝐀𝐍𝐄𝐋 │\n`;
  txt+=`${BOX.line2}\n`;
  txt+=`│ 📊 Total: ${groups.length}\n`;
  txt+=`│ ✅ ON: ${list.length} | ❌ OFF: ${groups.length-list.length}\n`;
  txt+=`│ 🔍 Filter: ${filter.toUpperCase()} | Page: ${safePage+1}/${totalPages}\n`;
  txt+=`${BOX.line}\n\n`;

  if(filtered.length===0){ txt+=`📭 No groups in ${filter.toUpperCase()}!\n\n`; }
  else{
    pageGroups.forEach((g,i)=>{
      const idx=safePage*PER+i+1;
      const on=list.includes(g.id);
      const dn=safeName(g.name,28);
      txt+=`${idx}. ${on?"✅ ON":"❌ OFF"} ─ ${dn}\n`;
      txt+=` └─ 🆔 ${g.id}\n\n`;
    });
  }
  txt+=`${BOX.line2}\n`;
  txt+=`│ ${BOX.bot}\n`;
  txt+=`${BOX.bottom}`;

  let kb=[];
  kb.push([
    {text:filter==="all"?"● ALL":"○ ALL", callback_data:"approve_filter_all"},
    {text:filter==="on"?"● ON":"○ ON", callback_data:"approve_filter_on"},
    {text:filter==="off"?"● OFF":"○ OFF", callback_data:"approve_filter_off"}
  ]);
  pageGroups.forEach(g=>{
    const on=list.includes(g.id);
    const short=safeName(g.name,14);
    kb.push([{text:`${on?"✅":"❌"} ${short}`, callback_data:`approve_view_${g.id}`}]);
  });
  let nav=[];
  if(safePage>0) nav.push({text:"⬅️ Prev", callback_data:`approve_main_${safePage-1}_${filter}`});
  if(safePage<totalPages-1) nav.push({text:"Next ➡️", callback_data:`approve_main_${safePage+1}_${filter}`});
  if(nav.length) kb.push(nav);

  const opt={ reply_markup:{ inline_keyboard: kb } };
  try{
    if(editId) await ctx.telegram.editMessageText(chatId,editId,null,txt,opt);
    else await ctx.telegram.sendMessage(chatId,txt,opt);
  }catch{ await ctx.telegram.sendMessage(chatId,txt,opt).catch(()=>{}); }
}

async function sendDetailPanel(ctx,chatId,gid,editId=null){
  let list=getList();
  let groups=await getAllGroups();
  let g=groups.find(x=>x.id===gid);
  if(!g) g={id:gid, name:`Group ${gid.slice(-6)}`, members:0};
  try{ const chat=await ctx.telegram.getChat(gid).catch(()=>null); if(chat && chat.title) g.name=chat.title; }catch{}
  const isOn=list.includes(gid);
  const displayName=safeName(g.name, 35);

  let txt=`${BOX.top}\n`;
  txt+=`│ 📋 𝐆𝐑𝐎𝐔𝐏 𝐃𝐄𝐓𝐀𝐈𝐋𝐒 │\n`;
  txt+=`${BOX.line2}\n`;
  txt+=`│ 📛 Name: ${displayName}\n`;
  txt+=`│ 🆔 ID: ${gid}\n`;
  txt+=`│ 📊 Status: ${isOn?"✅ ON":"❌ OFF"}\n`;
  txt+=`│ 👥 Members: ${g.members||"Unknown"}\n`;
  txt+=`${BOX.line2}\n`;
  txt+=`│ ${isOn?"🤖 Bot is working here - Eren-AI":"🚫 Bot is OFF here - Eren-AI"}\n`;
  txt+=`${BOX.line2}\n`;
  txt+=`│ ${BOX.bot}\n`;
  txt+=`${BOX.bottom}`;

  let kb=[
    [{text: isOn? "🔴 TURN OFF + Notice" : "🟢 TURN ON + Notice", callback_data:`approve_toggle_${gid}`}],
    [{text:"⬅️ Back to List", callback_data:"approve_back"}]
  ];
  const opt={ reply_markup:{ inline_keyboard: kb } };
  try{
    if(editId) await ctx.telegram.editMessageText(chatId,editId,null,txt,opt);
    else await ctx.telegram.sendMessage(chatId,txt,opt);
  }catch{ await ctx.telegram.sendMessage(chatId,txt,opt).catch(()=>{}); }
}