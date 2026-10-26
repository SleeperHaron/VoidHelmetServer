
require('dotenv').config();

const express = require('express');
const crypto = require('crypto');

const app = express();

app.use(express.json({ limit: '30kb' }));
app.use(express.static('public'));

app.post('/api/report', async (req, res) => {
  try {
    const {
      title, kind, mc, forge, os, when, details, log, contact
    } = req.body || {};

    if (
      typeof title !== 'string' ||
      typeof details !== 'string' ||
      !title.trim() ||
      !details.trim() ||
      title.length > 120 ||
      details.length > 5000 ||
      (typeof log === 'string' && log.length > 12000)
    ) {
      return res.status(400).json({
        error: 'Проверь название и описание ошибки.'
      });
    }

    const message = [
      '🐛 БАГ-РЕПОРТ — ШЛЕМ ПУСТОТЫ',
      '',
      `Название: ${title.trim()}`,
      `Тип: ${kind || 'Не указано'}`,
      `Minecraft: ${mc || 'Не указано'}`,
      `Forge: ${forge || 'Не указано'}`,
      `ОС: ${os || 'Не указано'}`,
      `Когда возникает: ${when || 'Не указано'}`,
      '',
      'Описание:',
      details.trim(),
      '',
      'latest.log:',
      log || 'Не приложен',
      '',
      'Контакт:',
      contact || 'Не указан'
    ].join('\n');

    const params = new URLSearchParams({
      access_token: process.env.VK_TOKEN,
      user_id: process.env.VK_USER_ID,
      random_id: String(crypto.randomInt(1, 2147483647)),
      message,
      v: '5.199'
    });

    const vkResponse = await fetch(
      'https://api.vk.com/method/messages.send',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      }
    );

    const result = await vkResponse.json();

    if (!vkResponse.ok || result.error) {
      console.error('VK API error:', result.error?.error_code);
      return res.status(502).json({
        error: 'ВКонтакте не принял сообщение.'
      });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('Report error:', error.message);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера.'
    });
  }
});

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Сервер запущен: http://localhost:${port}`);
});
