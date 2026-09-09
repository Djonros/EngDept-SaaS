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
//  POST /api/auth/register
//  Creates a workspace + owner user (own auth, no Supabase).
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createSession, hashPassword, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { createWorkspaceWithOwner, getUserByEmail } from "@/lib/repo";

export async function POST(request: NextRequest) {
  try {
    const { workspaceName, userName, email, password } = (await request.json()) as {
      workspaceName?: string;
      userName?: string;
      email?: string;
      password?: string;
    };

    if (!workspaceName?.trim() || !userName?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Пароль должен быть не короче 6 символов" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (getUserByEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 }
      );
    }

    const { userId } = createWorkspaceWithOwner(
      workspaceName.trim(),
      userName.trim(),
      normalizedEmail,
      hashPassword(password)
    );

    const token = createSession(userId);
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (err) {
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
