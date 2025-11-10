require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = process.env.ADMIN_ID;

// Data file paths
const USERS_FILE = path.join(__dirname, 'users.json');

// Initialize users database
function initDatabase() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: {}, nextId: 1 }, null, 2));
  }
}

// Read database
function readDatabase() {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

// Write database
function writeDatabase(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

// Generate unique conference ID
function generateConferenceId(db) {
  const id = db.nextId;
  db.nextId++;
  return `${id}Conference25`;
}

// User states
const userStates = {};

// Start command
bot.start((ctx) => {
  const userId = ctx.from.id;
  userStates[userId] = { step: 'start' };

  ctx.reply(
    '🎓 Добро пожаловать в бота регистрации на конференцию!\n\n' +
    'Чтобы зарегистрироваться, мне нужны ваши контактные данные.\n\n' +
    'Пожалуйста, поделитесь контактом с помощью кнопки ниже:',
    Markup.keyboard([
      Markup.button.contactRequest('📱 Поделиться контактом')
    ]).resize()
  );
});

// Handle contact sharing
bot.on('contact', async (ctx) => {
  const userId = ctx.from.id;
  const contact = ctx.message.contact;

  // Check if user shared their own contact
  if (contact.user_id !== userId) {
    return ctx.reply('❌ Пожалуйста, поделитесь собственными контактными данными.');
  }

  const firstName = contact.first_name || '';
  const lastName = contact.last_name || '';
  const phoneNumber = contact.phone_number || '';

  // Store temporary user data
  userStates[userId] = {
    step: 'confirm_info',
    firstName,
    lastName,
    phoneNumber
  };

  await ctx.reply(
    '✅ Контакт получен!\n\n' +
    `📋 Ваши данные:\n` +
    `Имя и Фамилия: ${firstName} ${lastName}\n` +
    `Телефон: ${phoneNumber}\n\n` +
    'Все верно?',
    Markup.keyboard([
      ['✅ Да, верно'],
      ['✏️ Изменить имя', '✏️ Изменить телефон']
    ]).resize()
  );
});

// Handle confirmation and editing
bot.hears('✅ Да, верно', async (ctx) => {
  const userId = ctx.from.id;
  const state = userStates[userId];

  if (!state || state.step !== 'confirm_info') {
    return ctx.reply('❌ Пожалуйста, сначала начните командой /start.');
  }

  // Generate conference ID
  const db = readDatabase();
  const conferenceId = generateConferenceId(db);

  // Save user to database
  db.users[userId] = {
    firstName: state.firstName,
    lastName: state.lastName,
    phoneNumber: state.phoneNumber,
    conferenceId,
    registeredAt: new Date().toISOString(),
    status: 'pending_payment'
  };
  writeDatabase(db);

  // Update user state
  userStates[userId] = {
    step: 'payment_instruction',
    conferenceId
  };

  await ctx.reply(
    '✅ Регистрация прошла успешно!\n\n' +
    `🎫 Ваш идентификатор конференции: ${conferenceId}\n\n` +
    '💳 Инструкции по оплате:\n\n' +
    '1️⃣ Откройте приложение Payme или Click\n' +
    '2️⃣ Найдите «Oxbridge international school»\n' +
    '3️⃣ Заполните форму оплаты:\n' +
    `   • ФИО: ${state.firstName} ${state.lastName}\n` +
    `   • Номер Договора: ${conferenceId}\n` +
    `   • Сумма: 200 000 сум\n\n` +
    '4️⃣ Завершите оплату\n' +
    '5️⃣ Сделайте скриншот подтверждения оплаты\n' +
    '6️⃣ Отправьте скриншот этому боту\n\n' +
    '📸 Пожалуйста, отправьте сейчас скриншот оплаты:',
    Markup.removeKeyboard()
  );
});

bot.hears('✏️ Изменить имя', (ctx) => {
  const userId = ctx.from.id;
  userStates[userId].step = 'edit_name';
  ctx.reply('Введите ваше полное имя (Имя Фамилия):', Markup.removeKeyboard());
});

bot.hears('✏️ Изменить телефон', (ctx) => {
  const userId = ctx.from.id;
  userStates[userId].step = 'edit_phone';
  ctx.reply('Введите ваш номер телефона:', Markup.removeKeyboard());
});

// Handle text input for editing
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const state = userStates[userId];

  if (!state) return;

  if (state.step === 'edit_name') {
    const nameParts = ctx.message.text.trim().split(' ');
    state.firstName = nameParts[0] || '';
    state.lastName = nameParts.slice(1).join(' ') || '';
    state.step = 'confirm_info';

    await ctx.reply(
      '✅ Имя обновлено!\n\n' +
      `📋 Ваши данные:\n` +
      `Имя: ${state.firstName} ${state.lastName}\n` +
      `Телефон: ${state.phoneNumber}\n\n` +
      'Все верно?',
      Markup.keyboard([
        ['✅ Да, верно'],
        ['✏️ Изменить имя', '✏️ Изменить телефон']
      ]).resize()
    );
  } else if (state.step === 'edit_phone') {
    state.phoneNumber = ctx.message.text.trim();
    state.step = 'confirm_info';

    await ctx.reply(
      '✅ Телефон обновлен!\n\n' +
      `📋 Ваши данные:\n` +
      `Имя: ${state.firstName} ${state.lastName}\n` +
      `Телефон: ${state.phoneNumber}\n\n` +
      'Все верно?',
      Markup.keyboard([
        ['✅ Да, верно'],
        ['✏️ Изменить имя', '✏️ Изменить телефон']
      ]).resize()
    );
  }
});

// Handle screenshot upload
bot.on('photo', async (ctx) => {
  const userId = ctx.from.id;
  const db = readDatabase();
  const user = db.users[userId];

  if (!user) {
    return ctx.reply('❌ Пожалуйста, сначала зарегистрируйтесь через команду /start.');
  }

  if (user.status !== 'pending_payment') {
    return ctx.reply('❌ Вы уже отправили скриншот оплаты.');
  }

  // Get the largest photo
  const photo = ctx.message.photo[ctx.message.photo.length - 1];

  // Update user status
  user.status = 'pending_confirmation';
  user.screenshotFileId = photo.file_id;
  user.submittedAt = new Date().toISOString();
  writeDatabase(db);

  await ctx.reply('✅ Скриншот получен! Пожалуйста, подождите, пока администратор проверит вашу оплату...');

  // Forward to admin
  try {
    await ctx.telegram.sendPhoto(ADMIN_ID, photo.file_id, {
      caption:
        '🔔 Новый запрос на подтверждение оплаты\n\n' +
        `👤 Пользователь: ${user.firstName} ${user.lastName}\n` +
        `📞 Телефон: ${user.phoneNumber}\n` +
        `🎫 ID Платежа: ${user.conferenceId}\n` +
        `💰 Сумма: 200 000 сум\n` +
        `📅 Отправлено: ${new Date(user.submittedAt).toLocaleString()}\n\n` +
        `ID пользователя: ${userId}`,
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Подтвердить', `approve_${userId}`),
          Markup.button.callback('❌ Отклонить', `reject_${userId}`)
        ]
      ])
    });
  } catch (error) {
    console.error('Error sending to admin:', error);
    ctx.reply('⚠️ Не удалось уведомить администратора. Пожалуйста, свяжитесь с поддержкой.');
  }
});

// Admin approval handler
bot.action(/approve_(\d+)/, async (ctx) => {
  const userId = ctx.match[1];
  const db = readDatabase();
  const user = db.users[userId];

  if (!user) {
    return ctx.answerCbQuery('❌ Пользователь не найден');
  }

  // Update user status
  user.status = 'confirmed';
  user.confirmedAt = new Date().toISOString();
  writeDatabase(db);

  await ctx.answerCbQuery('✅ Оплата подтверждена!');
  await ctx.editMessageCaption(
    ctx.callbackQuery.message.caption + '\n\n✅ ПОДТВЕРЖДЕНО',
    { reply_markup: undefined }
  );

  // Send confirmation ticket to user
  try {
    await ctx.telegram.sendMessage(
      userId,
      '🎉 Поздравляем!\n\n' +
      '✅ Ваша оплата подтверждена!\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '🎫 БИЛЕТ НА КОНФЕРЕНЦИЮ\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      `👤 Имя: ${user.firstName} ${user.lastName}\n` +
      `📞 Телефон: ${user.phoneNumber}\n` +
      `🎫 ID: ${user.conferenceId}\n` +
      `💰 Оплачено: 200 000 сум\n` +
      `📅 Подтверждено: ${new Date(user.confirmedAt).toLocaleString()}\n\n` +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      '✨ Спасибо за регистрацию!\n' +
      'Сохраните это сообщение как ваш билет.\n\n' +
      'До встречи на конференции! 🎓'
    );
  } catch (error) {
    console.error('Error sending confirmation to user:', error);
  }
});

// Admin rejection handler
bot.action(/reject_(\d+)/, async (ctx) => {
  const userId = ctx.match[1];
  const db = readDatabase();
  const user = db.users[userId];

  if (!user) {
    return ctx.answerCbQuery('❌ Пользователь не найден');
  }

  // Reset user status
  user.status = 'pending_payment';
  delete user.screenshotFileId;
  writeDatabase(db);

  await ctx.answerCbQuery('❌ Оплата отклонена');
  await ctx.editMessageCaption(
    ctx.callbackQuery.message.caption + '\n\n❌ ОТКЛОНЕНО',
    { reply_markup: undefined }
  );

  // Notify user
  try {
    await ctx.telegram.sendMessage(
      userId,
      '❌ Не удалось подтвердить вашу оплату.\n\n' +
      'Проверьте данные платежа и отправьте новый скриншот.\n' +
      'Убедитесь, что на скриншоте видно:\n' +
      '• Платеж на «Oxbridge international school»\n' +
      `• Ваше имя: ${user.firstName} ${user.lastName}\n` +
      `• ID конференции: ${user.conferenceId}\n` +
      '• Сумма: 200 000 сум\n\n' +
      '📸 Пожалуйста, отправьте новый скриншот.'
    );
  } catch (error) {
    console.error('Error sending rejection to user:', error);
  }
});

// Help command
bot.help((ctx) => {
  ctx.reply(
    '📖 Помощь бота регистрации на конференцию\n\n' +
    'Команды:\n' +
    '/start — начать регистрацию\n' +
    '/help — показать эту справку\n\n' +
    'Шаги:\n' +
    '1️⃣ Поделитесь контактными данными\n' +
    '2️⃣ Подтвердите свои данные\n' +
    '3️⃣ Получите свой ID конференции\n' +
    '4️⃣ Оплатите через Payme\n' +
    '5️⃣ Отправьте скриншот оплаты\n' +
    '6️⃣ Дождитесь подтверждения администратора\n' +
    '7️⃣ Получите билет\n\n' +
    'Нужна помощь? Свяжитесь с администратором.'
  );
});

// Error handler
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ Произошла ошибка. Попробуйте снова или свяжитесь с поддержкой.');
});

// Initialize and launch
initDatabase();

bot.launch().then(() => {
  console.log('✅ Bot is running...');
  console.log('Press Ctrl+C to stop the bot');
}).catch((err) => {
  console.error('❌ Failed to start bot:', err);
});

// Enable graceful stop
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  console.log('\n👋 Bot stopped');
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  console.log('\n👋 Bot stopped');
});
