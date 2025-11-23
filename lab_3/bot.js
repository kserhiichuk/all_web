import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Ініціалізація бота в режимі webhook
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN);
bot.setWebHook(
  `${process.env.RENDER_EXTERNAL_URL}/bot${process.env.TELEGRAM_TOKEN}`
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Маршрут для Telegram webhook
app.post(`/bot${process.env.TELEGRAM_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Додатковий маршрут (для перевірки, що сервер живий)
app.get('/', (req, res) => {
  res.send('Telegram Gemini bot is running!');
});

// Твої хендлери команд
bot.onText(/\/student/, (msg) => {
  bot.sendMessage(msg.chat.id, "Ім'я: Катерина Сергійчук \nГрупа: ІП-21");
});

bot.onText(/\/tech/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    'JavaScript, Typescript, Node.js, Express, React'
  );
});

bot.onText(/\/contacts/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    'Тел: +380971613467\nEmail: serhiichuk.kateryna@lll.kpi.ua'
  );
});

// Приклад чату з Gemini
bot.onText(/\/chat/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Введи свій запит для Gemini:');
});

bot.on('message', async (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    try {
      const result = await model.generateContent(msg.text);
      bot.sendMessage(msg.chat.id, result.response.text());
    } catch (err) {
      bot.sendMessage(msg.chat.id, 'Помилка при зверненні до Gemini');
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});