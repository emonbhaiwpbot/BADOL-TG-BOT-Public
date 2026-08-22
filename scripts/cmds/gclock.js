const { Markup } = require('telegraf');

module.exports = {
  config: {
    name: "gclock",
    aliases: ["antichange", "lockgc"],
    author: "MOHAMMAD BADOL",
    version: "1.0",
    cooldown: 5,
    role: 1,
    category: "group",
    shortDescription: {
      en: "Lock/unlock group settings to prevent unauthorized changes"
    },
    longDescription: {
      en: "Lock or unlock group name, photo, and description. When locked, the bot will automatically restore the original value if anyone changes it."
    },
    guide: {
      en: "{pn} - Show current lock status\n{pn} name - Lock/unlock group name\n{pn} photo - Lock/unlock group photo\n{pn} description - Lock/unlock group description"
    }
  },

  BADOL: async function({ message, args, api, event, db, prefix }) {
    const chatId = event.chat.id;
    const chatType = event.chat.type;

    if (chatType === 'private') {
      return message.reply('❌ This command can only be used in groups.');
    }

    const botMember = await api.getChatMember(chatId, api.botInfo.id);
    if (botMember.status !== 'administrator' && botMember.status !== 'creator') {
      return message.reply('❌ I need to be an admin to use anti-change protection.');
    }

    const requiredPermissions = ['can_change_info'];
    const hasPermissions = requiredPermissions.every(perm => botMember[perm]);
    if (!hasPermissions) {
      return message.reply('❌ I need "Change Group Info" permission to manage group settings.');
    }

    const threadData = await db.getThread(chatId);
    const lockedName = threadData.lockedName || false;
    const lockedPhoto = threadData.lockedPhoto || false;
    const lockedDescription = threadData.lockedDescription || false;

    if (args.length === 0) {
      const statusText = `🔒 **Anti-Change Protection Status**\n\n` +
        `📝 **Name:** ${lockedName ? '🔒 Locked' : '🔓 Unlocked'}\n` +
        `🖼️ **Photo:** ${lockedPhoto ? '🔒 Locked' : '🔓 Unlocked'}\n` +
        `📄 **Description:** ${lockedDescription ? '🔒 Locked' : '🔓 Unlocked'}\n\n` +
        `Use the buttons below to lock/unlock settings.`;

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            lockedName ? '🔒 Name: Locked' : '🔓 Name: Unlocked',
            `gclock_name_${lockedName ? 'unlock' : 'lock'}`
          )
        ],
        [
          Markup.button.callback(
            lockedPhoto ? '🔒 Photo: Locked' : '🔓 Photo: Unlocked',
            `gclock_photo_${lockedPhoto ? 'unlock' : 'lock'}`
          )
        ],
        [
          Markup.button.callback(
            lockedDescription ? '🔒 Description: Locked' : '🔓 Description: Unlocked',
            `gclock_description_${lockedDescription ? 'unlock' : 'lock'}`
          )
        ],
        [
          Markup.button.callback('🔄 Refresh', 'gclock_refresh')
        ]
      ]);

      return message.reply(statusText, keyboard);
    }

    const setting = args[0].toLowerCase();
    if (!['name', 'photo', 'description', 'desc'].includes(setting)) {
      return message.reply('❌ Invalid option. Use: name, photo, or description');
    }

    const targetSetting = setting === 'desc' ? 'description' : setting;
    const lockField = `locked${targetSetting.charAt(0).toUpperCase() + targetSetting.slice(1)}`;
    const saveField = `saved${targetSetting.charAt(0).toUpperCase() + targetSetting.slice(1)}`;
    const isLocked = threadData[lockField] || false;

    if (isLocked) {
      await db.updateThread(chatId, { [lockField]: false, [saveField]: '' });
      return message.reply(`🔓 Group ${targetSetting} is now unlocked. Changes are allowed.`);
    } else {
      let currentValue = '';
      const chat = await api.getChat(chatId);

      if (targetSetting === 'name') {
        currentValue = chat.title || '';
      } else if (targetSetting === 'photo') {
        if (chat.photo && chat.photo.big_file_id) {
          currentValue = chat.photo.big_file_id;
        } else {
          currentValue = 'NO_PHOTO';
        }
      } else if (targetSetting === 'description') {
        currentValue = chat.description || '';
      }

      await db.updateThread(chatId, { [lockField]: true, [saveField]: currentValue });
      return message.reply(`🔒 Group ${targetSetting} is now locked. Any changes will be auto-restored.`);
    }
  },

  onCallback: async function({ message, api, event, db, args }) {
    const callbackData = args.join('_');
    const chatId = event.message.chat.id;
    const userId = event.from.id;

    const admins = await api.getChatAdministrators(chatId);
    const isAdmin = admins.some(admin => admin.user.id === userId);

    if (!isAdmin) {
      return api.answerCbQuery(event.id, {
        text: '❌ Only admins can manage lock settings.',
        show_alert: true
      });
    }

    const threadData = await db.getThread(chatId);

    if (callbackData.startsWith('gclock_refresh')) {
      const lockedName = threadData.lockedName || false;
      const lockedPhoto = threadData.lockedPhoto || false;
      const lockedDescription = threadData.lockedDescription || false;

      const statusText = `🔒 **Anti-Change Protection Status**\n\n` +
        `📝 **Name:** ${lockedName ? '🔒 Locked' : '🔓 Unlocked'}\n` +
        `🖼️ **Photo:** ${lockedPhoto ? '🔒 Locked' : '🔓 Unlocked'}\n` +
        `📄 **Description:** ${lockedDescription ? '🔒 Locked' : '🔓 Unlocked'}\n\n` +
        `Use the buttons below to lock/unlock settings.`;

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            lockedName ? '🔒 Name: Locked' : '🔓 Name: Unlocked',
            `gclock_name_${lockedName ? 'unlock' : 'lock'}`
          )
        ],
        [
          Markup.button.callback(
            lockedPhoto ? '🔒 Photo: Locked' : '🔓 Photo: Unlocked',
            `gclock_photo_${lockedPhoto ? 'unlock' : 'lock'}`
          )
        ],
        [
          Markup.button.callback(
            lockedDescription ? '🔒 Description: Locked' : '🔓 Description: Unlocked',
            `gclock_description_${lockedDescription ? 'unlock' : 'lock'}`
          )
        ],
        [
          Markup.button.callback('🔄 Refresh', 'gclock_refresh')
        ]
      ]);

      await api.editMessageText(statusText, keyboard);
      return api.answerCbQuery(event.id, { text: '✅ Refreshed!' });
    }

    const parts = callbackData.split('_');
    const setting = parts[1];
    const action = parts[2];

    const lockField = `locked${setting.charAt(0).toUpperCase() + setting.slice(1)}`;
    const saveField = `saved${setting.charAt(0).toUpperCase() + setting.slice(1)}`;

    if (action === 'lock') {
      let currentValue = '';
      const chat = await api.getChat(chatId);

      if (setting === 'name') {
        currentValue = chat.title || '';
      } else if (setting === 'photo') {
        if (chat.photo && chat.photo.big_file_id) {
          currentValue = chat.photo.big_file_id;
        } else {
          currentValue = 'NO_PHOTO';
        }
      } else if (setting === 'description') {
        currentValue = chat.description || '';
      }

      await db.updateThread(chatId, { [lockField]: true, [saveField]: currentValue });
      await api.answerCbQuery(event.id, { text: `🔒 ${setting} locked!` });
    } else {
      await db.updateThread(chatId, { [lockField]: false, [saveField]: '' });
      await api.answerCbQuery(event.id, { text: `🔓 ${setting} unlocked!` });
    }

    const updatedData = await db.getThread(chatId);
    const lockedName = updatedData.lockedName || false;
    const lockedPhoto = updatedData.lockedPhoto || false;
    const lockedDescription = updatedData.lockedDescription || false;

    const statusText = `🔒 **Anti-Change Protection Status**\n\n` +
      `📝 **Name:** ${lockedName ? '🔒 Locked' : '🔓 Unlocked'}\n` +
      `🖼️ **Photo:** ${lockedPhoto ? '🔒 Locked' : '🔓 Unlocked'}\n` +
      `📄 **Description:** ${lockedDescription ? '🔒 Locked' : '🔓 Unlocked'}\n\n` +
      `Use the buttons below to lock/unlock settings.`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          lockedName ? '🔒 Name: Locked' : '🔓 Name: Unlocked',
          `gclock_name_${lockedName ? 'unlock' : 'lock'}`
        )
      ],
      [
        Markup.button.callback(
          lockedPhoto ? '🔒 Photo: Locked' : '🔓 Photo: Unlocked',
          `gclock_photo_${lockedPhoto ? 'unlock' : 'lock'}`
        )
      ],
      [
        Markup.button.callback(
          lockedDescription ? '🔒 Description: Locked' : '🔓 Description: Unlocked',
          `gclock_description_${lockedDescription ? 'unlock' : 'lock'}`
        )
      ],
      [
        Markup.button.callback('🔄 Refresh', 'gclock_refresh')
      ]
    ]);

    await api.editMessageText(statusText, keyboard);
  }
};
