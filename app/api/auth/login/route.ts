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
//  POST /api/auth/login — email + password → session cookie
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createSession, SESSION_COOKIE, sessionCookieOptions, verifyPassword } from "@/lib/auth";
import { getUserByEmail } from "@/lib/repo";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: "Введите email и пароль" }, { status: 400 });
    }

    const user = getUserByEmail(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: "Учётная запись отключена администратором" },
        { status: 403 }
      );
    }

    const token = createSession(user.id);
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
