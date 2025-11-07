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
    '🎓 Welcome to the Conference Booking Bot!\n\n' +
    'To register for the conference, I need your contact information.\n\n' +
    'Please share your contact using the button below:',
    Markup.keyboard([
      Markup.button.contactRequest('📱 Share Contact')
    ]).resize()
  );
});

// Handle contact sharing
bot.on('contact', async (ctx) => {
  const userId = ctx.from.id;
  const contact = ctx.message.contact;

  // Check if user shared their own contact
  if (contact.user_id !== userId) {
    return ctx.reply('❌ Please share your own contact information.');
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
    '✅ Contact received!\n\n' +
    `📋 Your Information:\n` +
    `Name: ${firstName} ${lastName}\n` +
    `Phone: ${phoneNumber}\n\n` +
    'Is this information correct?',
    Markup.keyboard([
      ['✅ Yes, Correct'],
      ['✏️ Edit Name', '✏️ Edit Phone']
    ]).resize()
  );
});

// Handle confirmation and editing
bot.hears('✅ Yes, Correct', async (ctx) => {
  const userId = ctx.from.id;
  const state = userStates[userId];

  if (!state || state.step !== 'confirm_info') {
    return ctx.reply('❌ Please start with /start command first.');
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
    '✅ Registration successful!\n\n' +
    `🎫 Your Conference ID: ${conferenceId}\n\n` +
    '💳 Payment Instructions:\n\n' +
    '1️⃣ Open the Payme app\n' +
    '2️⃣ Search for "Oxbridge international school"\n' +
    '3️⃣ Fill in the payment form:\n' +
    `   • Field 1: ${state.firstName} ${state.lastName}\n` +
    `   • Field 2: ${conferenceId}\n` +
    `   • Field 3: 200,000 sum\n\n` +
    '4️⃣ Complete the payment\n' +
    '5️⃣ Take a screenshot of the payment confirmation\n' +
    '6️⃣ Send the screenshot back to this bot\n\n' +
    '📸 Please send your payment screenshot now:',
    Markup.removeKeyboard()
  );
});

bot.hears('✏️ Edit Name', (ctx) => {
  const userId = ctx.from.id;
  userStates[userId].step = 'edit_name';
  ctx.reply('Please enter your full name (First Name Last Name):', Markup.removeKeyboard());
});

bot.hears('✏️ Edit Phone', (ctx) => {
  const userId = ctx.from.id;
  userStates[userId].step = 'edit_phone';
  ctx.reply('Please enter your phone number:', Markup.removeKeyboard());
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
      '✅ Name updated!\n\n' +
      `📋 Your Information:\n` +
      `Name: ${state.firstName} ${state.lastName}\n` +
      `Phone: ${state.phoneNumber}\n\n` +
      'Is this information correct?',
      Markup.keyboard([
        ['✅ Yes, Correct'],
        ['✏️ Edit Name', '✏️ Edit Phone']
      ]).resize()
    );
  } else if (state.step === 'edit_phone') {
    state.phoneNumber = ctx.message.text.trim();
    state.step = 'confirm_info';

    await ctx.reply(
      '✅ Phone updated!\n\n' +
      `📋 Your Information:\n` +
      `Name: ${state.firstName} ${state.lastName}\n` +
      `Phone: ${state.phoneNumber}\n\n` +
      'Is this information correct?',
      Markup.keyboard([
        ['✅ Yes, Correct'],
        ['✏️ Edit Name', '✏️ Edit Phone']
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
    return ctx.reply('❌ Please register first using /start command.');
  }

  if (user.status !== 'pending_payment') {
    return ctx.reply('❌ You have already submitted a payment screenshot.');
  }

  // Get the largest photo
  const photo = ctx.message.photo[ctx.message.photo.length - 1];

  // Update user status
  user.status = 'pending_confirmation';
  user.screenshotFileId = photo.file_id;
  user.submittedAt = new Date().toISOString();
  writeDatabase(db);

  await ctx.reply('✅ Screenshot received! Please wait while an admin reviews your payment...');

  // Forward to admin
  try {
    await ctx.telegram.sendPhoto(ADMIN_ID, photo.file_id, {
      caption:
        '🔔 New Payment Confirmation Request\n\n' +
        `👤 User: ${user.firstName} ${user.lastName}\n` +
        `📞 Phone: ${user.phoneNumber}\n` +
        `🎫 Conference ID: ${user.conferenceId}\n` +
        `💰 Amount: 200,000 sum\n` +
        `📅 Submitted: ${new Date(user.submittedAt).toLocaleString()}\n\n` +
        `User ID: ${userId}`,
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Approve', `approve_${userId}`),
          Markup.button.callback('❌ Reject', `reject_${userId}`)
        ]
      ])
    });
  } catch (error) {
    console.error('Error sending to admin:', error);
    ctx.reply('⚠️ Error notifying admin. Please contact support.');
  }
});

// Admin approval handler
bot.action(/approve_(\d+)/, async (ctx) => {
  const userId = ctx.match[1];
  const db = readDatabase();
  const user = db.users[userId];

  if (!user) {
    return ctx.answerCbQuery('❌ User not found');
  }

  // Update user status
  user.status = 'confirmed';
  user.confirmedAt = new Date().toISOString();
  writeDatabase(db);

  await ctx.answerCbQuery('✅ Payment approved!');
  await ctx.editMessageCaption(
    ctx.callbackQuery.message.caption + '\n\n✅ APPROVED',
    { reply_markup: undefined }
  );

  // Send confirmation ticket to user
  try {
    await ctx.telegram.sendMessage(
      userId,
      '🎉 Congratulations!\n\n' +
      '✅ Your payment has been confirmed!\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '🎫 CONFERENCE TICKET\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      `👤 Name: ${user.firstName} ${user.lastName}\n` +
      `📞 Phone: ${user.phoneNumber}\n` +
      `🎫 ID: ${user.conferenceId}\n` +
      `💰 Amount Paid: 200,000 sum\n` +
      `📅 Confirmed: ${new Date(user.confirmedAt).toLocaleString()}\n\n` +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      '✨ Thank you for registering!\n' +
      'Please save this message as your ticket.\n\n' +
      'See you at the conference! 🎓'
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
    return ctx.answerCbQuery('❌ User not found');
  }

  // Reset user status
  user.status = 'pending_payment';
  delete user.screenshotFileId;
  writeDatabase(db);

  await ctx.answerCbQuery('❌ Payment rejected');
  await ctx.editMessageCaption(
    ctx.callbackQuery.message.caption + '\n\n❌ REJECTED',
    { reply_markup: undefined }
  );

  // Notify user
  try {
    await ctx.telegram.sendMessage(
      userId,
      '❌ Your payment could not be verified.\n\n' +
      'Please check your payment details and submit a new screenshot.\n' +
      'Make sure the screenshot clearly shows:\n' +
      '• Payment to "Oxbridge international school"\n' +
      `• Your name: ${user.firstName} ${user.lastName}\n` +
      `• Conference ID: ${user.conferenceId}\n` +
      '• Amount: 200,000 sum\n\n' +
      '📸 Please send a new screenshot.'
    );
  } catch (error) {
    console.error('Error sending rejection to user:', error);
  }
});

// Help command
bot.help((ctx) => {
  ctx.reply(
    '📖 Conference Booking Bot Help\n\n' +
    'Commands:\n' +
    '/start - Start registration\n' +
    '/help - Show this help message\n\n' +
    'Steps:\n' +
    '1️⃣ Share your contact information\n' +
    '2️⃣ Confirm your details\n' +
    '3️⃣ Get your conference ID\n' +
    '4️⃣ Make payment via Payme\n' +
    '5️⃣ Send payment screenshot\n' +
    '6️⃣ Wait for admin confirmation\n' +
    '7️⃣ Receive your ticket\n\n' +
    'Need help? Contact the admin.'
  );
});

// Error handler
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ An error occurred. Please try again or contact support.');
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
