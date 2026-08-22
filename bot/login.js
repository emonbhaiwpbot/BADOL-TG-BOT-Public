const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const fs = require('fs');
const path = require('path');
const handleEvents = require('./handlerEvents'); // আগে ../handler/handlerEvents ছিল, এখন ./handlerEvents
const { showCopyright } = require('../logger/banner'); // আগে ../../logger/banner ছিল

// নতুন config + পুরানো config দুটোই সাপোর্ট
function getConf() {
  const cfg = global.config;
  return {
    token: cfg.credentials?.token || cfg.token || '',
    prefix: cfg.botInfo?.prefix || cfg.prefix || '/',
    timezone: cfg.botInfo?.timezone || cfg.settings?.timezone || cfg.timezone || 'Asia/Dhaka',
    database: cfg.database,
    showCommandSuggestions: cfg.settings?.showCommandSuggestions || cfg.showCommandSuggestions || { enabled: true }
  };
}

async function login() {
  try {
    showCopyright();

    const conf = getConf();
    const token = conf.token;
    if (!token) {
      global.log.error('❌ Bot token missing in config.json -> credentials.token');
      throw new Error('Token missing');
    }
    const bot = new Telegraf(token);

    global.bot = bot;
    global.botStartTime = Math.floor(Date.now() / 1000);

    bot.use(async (ctx, next) => {
      ctx.react = async (emoji, isBig = false) => {
        try {
          const messageId = ctx.message?.message_id || ctx.callbackQuery?.message?.message_id;
          const chatId = ctx.chat?.id;
          if (!chatId || !messageId) return false;
          const reaction = [{ type: 'emoji', emoji: emoji.trim() }];
          await ctx.telegram.setMessageReaction(chatId, messageId, reaction, isBig);
          return true;
        } catch {
          return false;
        }
      };
      await next();
    });

    bot.catch((err, ctx) => {
      global.log.error('Bot error:', err.message);
    });

    bot.telegram.webhookReply = false;

    // ★★★ MAIN FIX - এখানেই join ঠিক হবে ★★★
    bot.on('message', async (ctx) => {
      if (ctx.message?.new_chat_members) {
        await handleEvents.handleNewMember(ctx);
        return;
      }
      if (ctx.message?.left_chat_member) {
        await handleEvents.handleLeftMember(ctx);
        return;
      }
      await handleEvents.handleMessage(ctx);
    });

    bot.on('callback_query', async (ctx) => {
      await handleEvents.handleCallback(ctx);
    });

    bot.on(message('new_chat_members'), async (ctx) => {
      await handleEvents.handleNewMember(ctx);
    });

    bot.on(message('left_chat_member'), async (ctx) => {
      await handleEvents.handleLeftMember(ctx);
    });

    bot.on('chat_member', async (ctx) => {
      await handleEvents.handleLeftMember(ctx);
    });

    bot.on('message_reaction', async (ctx) => {
      await handleEvents.handleReaction(ctx);
    });

    const botInfo = await bot.telegram.getMe();

    try {
      if (conf.showCommandSuggestions?.enabled) {
        const commands = Array.from(global.badol.commands.values());
        const uniqueCommands = [...new Map(commands.map(cmd => [cmd.config.name, cmd])).values()];

        const botCommands = uniqueCommands
          .filter(cmd => cmd.config.usePrefix !== false)
          .slice(0, 100)
          .map(cmd => ({
            command: cmd.config.name,
            description: cmd.config.description || 'No description'
          }));

        await bot.telegram.setMyCommands(botCommands, { scope: { type: 'all_private_chats' } });

        try {
          await bot.telegram.deleteMyCommands({ scope: { type: 'all_group_chats' } });
        } catch (err) {}

        global.log.success(`✓ Command suggestions enabled for private chats only`);
      } else {
        try {
          await bot.telegram.setMyCommands([]);
        } catch (err) {}
        global.log.success(`✓ Command suggestions disabled`);
      }
    } catch (cmdError) {}

    global.log.success(`✓ Bot connected successfully!`);
    global.log.success(`✓ Bot Name: ${botInfo.first_name}`);
    global.log.success(`✓ Bot Username: @${botInfo.username}`);
    global.log.success(`✓ Prefix: ${conf.prefix}`);
    global.log.success(`✓ Timezone: ${conf.timezone}`);

    const dbType = conf.database?.type || 'json';
    const allUsers = await global.db.getAllUsers();
    const allThreads = await global.db.getAllThreads();
    const totalGCs = allThreads.filter(t => t.type === 'group' || t.type === 'supergroup').length;

    global.log.separator('─', 'cyan');
    global.log.success(`✓ Database Type: ${dbType.toUpperCase()}`);
    if (dbType === 'mongodb') {
      global.log.success(`✓ MongoDB: Connected`);
    }
    global.log.success(`✓ Total Users: ${allUsers.length}`);
    global.log.success(`✓ Total Groups: ${totalGCs}`);
    global.log.separator('─', 'cyan');

    // ── নতুন পাথ: BADOL থেকে tmp ফোল্ডার ──
    const restartFile = path.join(__dirname, '..', 'tmp', 'restart.txt');
    if (fs.existsSync(restartFile)) {
      try {
        const [chatId, startTime] = fs.readFileSync(restartFile, 'utf-8').split(' ');
        const timeTaken = ((Date.now() - parseInt(startTime)) / 1000).toFixed(2);
        await bot.telegram.sendMessage(chatId, `✅ Bot restarted successfully!\n⏰ Time taken: ${timeTaken}s`);
        fs.unlinkSync(restartFile);
        global.log.success(`Restart notification sent to chat ${chatId}`);
      } catch (error) {
        if (fs.existsSync(restartFile)) fs.unlinkSync(restartFile);
      }
    }

    const { sendBotStartNotification } = require('./handlerEvents');
    await sendBotStartNotification(bot.telegram);

    await bot.launch({
      allowedUpdates: ['message', 'callback_query', 'message_reaction', 'chat_member', 'my_chat_member']
    });

    global.log.success(`✓ Reaction + Chat Member updates enabled`);

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

    return bot;

  } catch (error) {
    global.log.error('Login failed:', error.message);
    throw error;
  }
}

module.exports = login;