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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase-client";
import { activateLicense, getHardwareFingerprint } from "@/lib/license-validator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Result = { success: boolean; message: string } | null;

export default function LicenseActivatePage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const supabase = createBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setResult({ success: false, message: "Необходима авторизация" });
      setLoading(false);
      return;
    }

    // Fetch user's workspace
    const { data: profile } = await supabase
      .from("users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) {
      setResult({ success: false, message: "Workspace не найден" });
      setLoading(false);
      return;
    }

    const hardwareId = await getHardwareFingerprint();
    const { success, error, license } = await activateLicense(
      key,
      profile.workspace_id,
      hardwareId
    );

    if (success && license) {
      setResult({ success: true, message: `Лицензия ${license.plan} активирована до ${license.expires_at ? new Date(license.expires_at).toLocaleDateString("ru-RU") : "бессрочно"}` });
      setTimeout(() => router.push("/dashboard"), 2000);
    } else {
      setResult({ success: false, message: error || "Ошибка активации" });
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Активация лицензии</CardTitle>
          <CardDescription>
            Введите лицензионный ключ для разблокировки возможностей
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key">Лицензионный ключ</Label>
              <Input
                id="key"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                required
                className="font-mono tracking-wider"
              />
            </div>

            {result && (
              <div
                className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                  result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0" />
                )}
                {result.message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Активировать
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">Текущий план</span>
            <Badge variant="secondary">Free</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
