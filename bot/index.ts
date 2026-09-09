// ============================================================================
//  Copyright (c) 2024-2026 Djonros (djonros@gmail.com)
//  All rights reserved.
//
//  This software and its source code is the proprietary property of Djonros.
//  Unauthorized copying, modification, merging, publication, distribution,
//  sublicensing, and/or selling of this software, via any medium, is strictly
//  prohibited without prior written permission from the copyright holder.
//
//  Licensed under the Proprietary License.
//  You may not use this file except in compliance with the License.
//  You may obtain a copy of the License by contacting: djonros@gmail.com
//
//  Violators will be prosecuted to the maximum extent possible under the law.
// ============================================================================

// ============================================================================
//  Telegram Bot — standalone polling mode (run with: npm run bot)
//  Reads the local SQLite database directly (same data/app.db as the app).
// ============================================================================

import { Bot, InlineKeyboard } from "grammy";
import Database from "better-sqlite3";
import { join, resolve } from "path";
import { existsSync } from "fs";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not set");
  process.exit(1);
}

function dataDir(): string {
  const env = process.env.DATA_DIR;
  if (env && env.trim()) return resolve(env);
  return join(process.cwd(), "data");
}

const dbPath = join(dataDir(), "app.db");
if (!existsSync(dbPath)) {
  console.error(`Database not found: ${dbPath}. Start the app first.`);
  process.exit(1);
}

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

const bot = new Bot(TOKEN);

// ---- /start ----
bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard().url(
    "Открыть платформу",
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  );

  await ctx.reply(
    "EngDept Bot\n\n" +
    "Помощник для управления задачами инженерного отдела.\n\n" +
    "Команды:\n" +
    "/tasks — мои активные задачи\n" +
    "/balance — мой баланс\n" +
    "/link email — привязать аккаунт\n" +
    "/help — помощь",
    { reply_markup: keyboard }
  );
});

// ---- /link <email> — bind telegram account ----
bot.command("link", async (ctx) => {
  const email = ctx.match?.trim();
  const telegramId = ctx.from.id.toString();

  if (!email) {
    await ctx.reply("Использование: /link your@email.com");
    return;
  }

  const res = db
    .prepare("UPDATE users SET telegram_id = ? WHERE email = ?")
    .run(telegramId, email.toLowerCase());

  if (res.changes === 0) {
    await ctx.reply("Пользователь не найден. Проверьте email или зарегистрируйтесь.");
    return;
  }

  const user = db
    .prepare("SELECT name FROM users WHERE email = ?")
    .get(email.toLowerCase()) as { name: string };

  await ctx.reply(`Привязка успешна!\n\nПривет, ${user.name}!\nТеперь вы будете получать уведомления о задачах.`);
});

// ---- /tasks — my active tasks ----
bot.command("tasks", async (ctx) => {
  const telegramId = ctx.from.id.toString();

  const user = db
    .prepare("SELECT id FROM users WHERE telegram_id = ?")
    .get(telegramId) as { id: string } | undefined;

  if (!user) {
    await ctx.reply("Аккаунт не привязан. Используйте /link email");
    return;
  }

  const tasks = db
    .prepare(
      `SELECT title, stage, due_date FROM tasks
       WHERE assignee_id = ? AND stage != 'done'
       ORDER BY due_date IS NULL, due_date
       LIMIT 10`
    )
    .all(user.id) as { title: string; stage: string; due_date: string | null }[];

  if (tasks.length === 0) {
    await ctx.reply("Нет активных задач. Можно отдохнуть!");
    return;
  }

  const lines = tasks.map((t, i) => {
    const due = t.due_date ? ` (до ${new Date(t.due_date).toLocaleDateString("ru-RU")})` : "";
    return `${i + 1}. [${t.stage}] ${t.title}${due}`;
  });

  await ctx.reply(`Активные задачи (${tasks.length}):\n\n${lines.join("\n")}`);
});

// ---- /balance ----
bot.command("balance", async (ctx) => {
  const telegramId = ctx.from.id.toString();

  const user = db
    .prepare("SELECT id FROM users WHERE telegram_id = ?")
    .get(telegramId) as { id: string } | undefined;

  if (!user) {
    await ctx.reply("Аккаунт не привязан. Используйте /link email");
    return;
  }

  const stats = db
    .prepare(
      `SELECT COUNT(*) AS cnt, COALESCE(SUM(cost), 0) AS total
       FROM tasks WHERE assignee_id = ? AND completed_at IS NOT NULL`
    )
    .get(user.id) as { cnt: number; total: number };

  await ctx.reply(
    `Заработано всего: ${stats.total.toLocaleString("ru-RU")} руб\n` +
    `Завершено задач: ${stats.cnt}`
  );
});

// ---- /help ----
bot.command("help", async (ctx) => {
  await ctx.reply(
    "EngDept Bot — Помощь\n\n" +
    "/start — начало работы\n" +
    "/tasks — мои активные задачи\n" +
    "/balance — мой баланс\n" +
    "/link email — привязать аккаунт"
  );
});

// ---- Set up webhook on start (optional) ----
async function start() {
  console.log("Starting Telegram bot (long polling)...");

  if (process.env.TELEGRAM_WEBHOOK_URL) {
    const webhookUrl = `${process.env.TELEGRAM_WEBHOOK_URL}/api/telegram-bot`;
    await bot.api.setWebhook(webhookUrl, {
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
    });
    console.log(`Webhook set: ${webhookUrl}`);
    process.exit(0);
  } else {
    await bot.api.deleteWebhook();
    bot.start({
      onStart: (botInfo) => console.log(`Bot @${botInfo.username} is running`),
    });
  }
}

start();
