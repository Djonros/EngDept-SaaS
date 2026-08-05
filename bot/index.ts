// ============================================================================
//  Copyright (c) 2024-2026 Djonros (djonros@gmail.com)
//  All rights reserved.
//
//  This software and its source code are the proprietary property of Djonros.
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
//  Use this in development. In production, switch to webhook mode.
// ============================================================================

import { Bot, InlineKeyboard } from "grammy";
import { createClient } from "@supabase/supabase-js";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN is not set");
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Supabase env vars not set");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const bot = new Bot(TOKEN);

// ---- /start ----
bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard().url(
    "🔗 Открыть платформу",
    process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000"
  );

  await ctx.reply(
    "🏗 *EngDept Bot*\n\n" +
    "Помощник для управления задачами инженерного отдела.\n\n" +
    "*Команды:*\n" +
    "• /tasks — мои активные задачи\n" +
    "• /balance — мой баланс\n" +
    "• /link `email` — привязать аккаунт\n" +
    "• /help — помощь",
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
});

// ---- /link <email> — bind telegram account ----
bot.command("link", async (ctx) => {
  const email = ctx.match?.trim();
  const telegramId = ctx.from.id.toString();

  if (!email) {
    await ctx.reply("Использование: `/link your@email.com`", { parse_mode: "Markdown" });
    return;
  }

  const { data: user, error } = await supabase
    .from("users")
    .update({ telegram_id: telegramId })
    .eq("email", email.toLowerCase())
    .select("name, workspace_id")
    .single();

  if (error || !user) {
    await ctx.reply("❌ Пользователь не найден. Проверьте email или зарегистрируйтесь.");
    return;
  }

  await ctx.reply(
    `✅ Привязка успешна!\n\nПривет, *${user.name}*!\nТеперь вы будете получать уведомления о задачах.`,
    { parse_mode: "Markdown" }
  );
});

// ---- /tasks — my active tasks ----
bot.command("tasks", async (ctx) => {
  const telegramId = ctx.from.id.toString();

  const { data: user } = await supabase
    .from("users")
    .select("id, name")
    .eq("telegram_id", telegramId)
    .single();

  if (!user) {
    await ctx.reply("❌ Аккаунт не привязан. Используйте /link `email`", { parse_mode: "Markdown" });
    return;
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, stage, due_date, project_id")
    .eq("assignee_id", user.id)
    .neq("stage", "done")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(10);

  if (!tasks || tasks.length === 0) {
    await ctx.reply("✅ Нет активных задач. Можно отдохнуть!");
    return;
  }

  const lines = tasks.map((t, i) => {
    const due = t.due_date ? ` (до ${new Date(t.due_date).toLocaleDateString("ru-RU")})` : "";
    return `${i + 1}. [${t.stage}] ${t.title}${due}`;
  });

  await ctx.reply(
    `📋 *Активные задачи (${tasks.length}):*\n\n${lines.join("\n")}`,
    { parse_mode: "Markdown" }
  );
});

// ---- /balance ----
bot.command("balance", async (ctx) => {
  const telegramId = ctx.from.id.toString();

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .single();

  if (!user) {
    await ctx.reply("❌ Аккаунт не привязан. Используйте /link `email`", { parse_mode: "Markdown" });
    return;
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("cost, completed_at")
    .eq("assignee_id", user.id)
    .not("completed_at", "is", null);

  const total = (tasks || []).reduce((sum, t) => sum + Number(t.cost || 0), 0);

  await ctx.reply(
    `💰 *Заработано всего:* ${total.toLocaleString("ru-RU")} ₽\n` +
    `📦 *Завершено задач:* ${tasks?.length || 0}`,
    { parse_mode: "Markdown" }
  );
});

// ---- /help ----
bot.command("help", async (ctx) => {
  await ctx.reply(
    "🏗 *EngDept Bot — Помощь*\n\n" +
    "• /start — начало работы\n" +
    "• /tasks — мои активные задачи\n" +
    "• /balance — мой баланс\n" +
    "• /link `email` — привязать аккаунт\n\n" +
    "Уведомления приходят автоматически при:\n" +
    "— назначении новой задачи\n" +
    "— изменении стадии\n" +
    "— запросе доработки\n" +
    "— завершении задачи",
    { parse_mode: "Markdown" }
  );
});

// ---- Set up webhook on start (optional) ----
async function start() {
  console.log("🚀 Starting Telegram bot (long polling)...");

  if (process.env.TELEGRAM_WEBHOOK_URL) {
    const webhookUrl = `${process.env.TELEGRAM_WEBHOOK_URL}/api/telegram-bot`;
    await bot.api.setWebhook(webhookUrl, {
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
    });
    console.log(`✅ Webhook set: ${webhookUrl}`);
    process.exit(0);
  } else {
    // Delete any existing webhook, then start polling
    await bot.api.deleteWebhook();
    bot.start({
      onStart: (botInfo) => console.log(`✅ Bot @${botInfo.username} is running`),
    });
  }
}

start();
