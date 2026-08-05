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
//  Telegram Bot Webhook + Internal notify endpoint
//
//  GET  → health check
//  POST → two modes:
//    A) Telegram Update (from Telegram servers) → routed to grammy bot
//    B) Internal notify ({ type: "notify", telegram_id, message })
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { Bot } from "grammy";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!TOKEN) {
  console.warn("[telegram-bot] TELEGRAM_BOT_TOKEN not set — bot disabled");
}

const bot = new Bot(TOKEN || "dummy:token");

// ---- Bot command handlers ----
bot.command("start", async (ctx) => {
  await ctx.reply(
    "🏗 EngDept Bot\n\n" +
    "Я помогу отслеживать задачи инженерного отдела.\n\n" +
    "Команды:\n" +
    "/tasks — мои активные задачи\n" +
    "/task <id> — детали задачи\n" +
    "/balance — мой баланс\n" +
    "/link <email> — привязать аккаунт"
  );
});

bot.command("tasks", async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) return;

  await ctx.reply("📋 Ваши активные задачи будут здесь после привязки аккаунта.");
});

bot.command("balance", async (ctx) => {
  await ctx.reply("💰 Ваш баланс будет здесь после привязки аккаунта.");
});

bot.command("link", async (ctx) => {
  const email = ctx.match;
  if (!email) {
    await ctx.reply("Использование: /link your@email.com");
    return;
  }
  // TODO: verify & bind telegram_id to user record
  await ctx.reply(`Запрос на привязку ${email} получен. Обработка...`);
});

// ---- Route handler ----
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Mode B: internal notification
  if (body.type === "notify" && body.telegram_id && body.message) {
    if (!TOKEN) {
      return NextResponse.json({ error: "Bot not configured" }, { status: 503 });
    }
    try {
      await bot.api.sendMessage(body.telegram_id, body.message);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
  }

  // Mode A: Telegram webhook update
  if (WEBHOOK_SECRET) {
    const secret = request.headers.get("x-telegram-bot-api-secret-token");
    if (secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    await bot.handleUpdate(body);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Update handling failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    bot_configured: !!TOKEN,
    commands: ["/start", "/tasks", "/balance", "/link"],
  });
}
