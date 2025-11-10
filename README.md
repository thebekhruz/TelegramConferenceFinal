# Telegram Conference Booking Bot

A Telegram bot for managing conference registrations with payment verification through Payme.

## Features

- ✅ User registration via Telegram contact sharing
- ✅ Editable user information
- ✅ Automatic conference ID generation
- ✅ Payment instructions for Payme app
- ✅ Screenshot upload for payment proof
- ✅ Admin approval/rejection workflow
- ✅ Automated ticket generation

## 🌐 Deployment Options

**Want to deploy this bot online 24/7?**

👉 See **[DEPLOYMENT.md](DEPLOYMENT.md)** for detailed guides on:
- Railway.app (Easiest - $5/month free credit)
- Render.com (Free tier)
- Fly.io (Good free tier)
- Oracle Cloud (Free forever)

## Prerequisites (For Local Development)

- Node.js (v14 or higher)
- A Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- Admin Telegram ID

## Setup Instructions

### 1. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the Bot Token (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Get Your Admin Telegram ID

1. Search for [@userinfobot](https://t.me/userinfobot) on Telegram
2. Start the bot and it will show your Telegram ID
3. Copy your numeric ID (e.g., `123456789`)

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` file and add your credentials:
```env
BOT_TOKEN=your_bot_token_here
ADMIN_ID=your_telegram_id_here
```

### 5. Run the Bot

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Usage Flow

### For Users

1. **Start Registration**: Send `/start` to the bot
2. **Share Contact**: Click "📱 Share Contact" button to share your phone number and name
3. **Confirm Information**: Review your details and confirm or edit if needed
4. **Get Conference ID**: Receive your unique Conference ID (format: `123Conference25`)
5. **Make Payment**:
   - Open Payme app
   - Search for "Oxbridge international school"
   - Fill in:
     - Field 1: Your Name and Surname
     - Field 2: Your Conference ID
     - Field 3: 200,000 sum
   - Complete the payment
6. **Submit Screenshot**: Send a screenshot of the payment confirmation to the bot
7. **Wait for Confirmation**: Admin will review and approve your payment
8. **Receive Ticket**: Get your conference ticket via Telegram message

### For Admins

1. Bot will forward payment screenshots with user information
2. Review the payment details
3. Click "✅ Approve" to confirm or "❌ Reject" to deny
4. User will automatically receive confirmation or rejection message

## Bot Commands

- `/start` - Begin registration process
- `/help` - Display help information

## File Structure

```
.
├── bot.js              # Main bot application
├── package.json        # Dependencies and scripts
├── .env               # Environment variables (not in git)
├── .env.example       # Example environment file
├── .gitignore         # Git ignore rules
├── users.json         # User database (auto-generated)
└── README.md          # This file
```

## Data Storage

User data is stored in `users.json` file with the following structure:

```json
{
  "users": {
    "123456789": {
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "+998901234567",
      "conferenceId": "1Conference25",
      "registeredAt": "2025-11-07T10:30:00.000Z",
      "status": "confirmed",
      "screenshotFileId": "AgACAgIAAxkBAAI...",
      "submittedAt": "2025-11-07T10:35:00.000Z",
      "confirmedAt": "2025-11-07T10:40:00.000Z"
    }
  },
  "nextId": 2
}
```

## User Status Flow

- `pending_payment` - User registered, waiting for payment screenshot
- `pending_confirmation` - Screenshot submitted, waiting for admin approval
- `confirmed` - Payment approved, ticket sent

## Security Notes

- Never commit `.env` file to version control
- Keep your bot token secure
- Only share admin credentials with authorized personnel
- Regularly backup `users.json` file

## Troubleshooting

### Bot doesn't respond
- Check if the bot is running (`npm start`)
- Verify BOT_TOKEN in `.env` file
- Check internet connection

### Admin doesn't receive notifications
- Verify ADMIN_ID in `.env` file
- Make sure admin has started the bot at least once

### Screenshot not uploading
- Ensure the image is not too large (Telegram limit: 10MB)
- Try sending as a photo, not as a file

## Support

For issues or questions, contact the system administrator.

## License

ISC
