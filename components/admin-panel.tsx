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
import Image from "next/image";
import { toast } from "sonner";
import {
  Shield,
  Key,
  ScrollText,
  UserPlus,
  Power,
  CheckCircle2,
  XCircle,
  Settings,
  Upload,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createBrowserClient } from "@/lib/supabase-client";
import {
  ROLE_LABELS,
  type User,
  type UserRole,
  type Workspace,
  type AuditLogEntry,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface AdminPanelProps {
  workspace: Workspace;
  users: User[];
  auditLog: AuditLogEntry[];
  currentUserId: string;
}

const ROLES: UserRole[] = [
  "owner",
  "manager",
  "engineer",
  "reviewer",
  "freelancer",
];

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

export function AdminPanel({
  workspace,
  users,
  auditLog,
  currentUserId,
}: AdminPanelProps) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");
  const [activating, setActivating] = useState(false);

  async function handleRoleChange(userId: string, role: UserRole) {
    const supabase = createBrowserClient();
    const { error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", userId);

    if (error) {
      toast.error("Ошибка: " + error.message);
    } else {
      toast.success("Роль обновлена");
      router.refresh();
    }
  }

  async function handleToggleActive(user: User) {
    const supabase = createBrowserClient();
    const { error } = await supabase
      .from("users")
      .update({ is_active: !user.is_active })
      .eq("id", user.id);

    if (error) {
      toast.error("Ошибка: " + error.message);
    } else {
      toast.success(user.is_active ? "Пользователь деактивирован" : "Пользователь активирован");
      router.refresh();
    }
  }

  async function handleActivateLicense() {
    if (!licenseKey.trim()) {
      toast.error("Введите лицензионный ключ");
      return;
    }
    setActivating(true);
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("key", licenseKey.toUpperCase().trim())
      .single();

    if (error || !data) {
      toast.error("Лицензионный ключ не найден");
      setActivating(false);
      return;
    }

    if (data.status === "revoked") {
      toast.error("Лицензия отозвана");
      setActivating(false);
      return;
    }

    if (data.workspace_id && data.workspace_id !== workspace.id) {
      toast.error("Ключ уже привязан к другому workspace");
      setActivating(false);
      return;
    }

    const expiresAt = data.expires_at;
    const { error: updateErr } = await supabase
      .from("workspaces")
      .update({
        plan: data.plan,
        license_key: data.key,
        expires_at: expiresAt,
      })
      .eq("id", workspace.id);

    if (updateErr) {
      toast.error("Ошибка активации");
    } else {
      await supabase
        .from("licenses")
        .update({
          workspace_id: workspace.id,
          status: "active",
          activated_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      toast.success("Лицензия активирована");
      setLicenseKey("");
      router.refresh();
    }
    setActivating(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Администрирование</h1>
          <p className="text-muted-foreground">
            Пользователи, лицензия и аудит
          </p>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="h-4 w-4" />
            Настройки
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            Пользователи
          </TabsTrigger>
          <TabsTrigger value="license" className="gap-1.5">
            <Key className="h-4 w-4" />
            Лицензия
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5">
            <ScrollText className="h-4 w-4" />
            Журнал аудита
          </TabsTrigger>
        </TabsList>

        {/* Settings tab */}
        <TabsContent value="settings">
          <WorkspaceSettings workspace={workspace} />
        </TabsContent>

        {/* Users tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                Пользователи ({users.length} / {workspace.max_users})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Telegram</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name}
                        {user.id === currentUserId && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (вы)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        {user.role === "owner" ? (
                          <Badge variant="default">
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        ) : (
                          <Select
                            value={user.role}
                            onValueChange={(v) =>
                              handleRoleChange(user.id, v as UserRole)
                            }
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {ROLE_LABELS[r]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.telegram_id ?? "—"}
                      </TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Badge
                            variant="success"
                            className="gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Активен
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Отключён
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.role !== "owner" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(user)}
                          >
                            <Power className="h-4 w-4" />
                            {user.is_active ? "Отключить" : "Включить"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* License tab */}
        <TabsContent value="license">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4" />
                  Текущий план
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">План:</span>
                  <Badge variant="default">
                    {PLAN_LABELS[workspace.plan] ?? workspace.plan}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Максимум пользователей:
                  </span>
                  <span className="font-medium">{workspace.max_users}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Лицензионный ключ:
                  </span>
                  <code className="rounded bg-muted px-2 py-1 text-xs">
                    {workspace.license_key ?? "—"}
                  </code>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Действует до:
                  </span>
                  <span className="font-medium">
                    {formatDate(workspace.expires_at)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Key className="h-4 w-4" />
                  Активация лицензии
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="license-key">Новый лицензионный ключ</Label>
                  <Input
                    id="license-key"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <Button
                  onClick={handleActivateLicense}
                  disabled={activating}
                  className="w-full"
                >
                  {activating ? "Активация..." : "Активировать"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Введите ключ для смены тарифного плана. Ключ привязывается к
                  вашему workspace.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Журнал действий ({auditLog.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditLog.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Записей пока нет
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Время</TableHead>
                      <TableHead>Действие</TableHead>
                      <TableHead>Сущность</TableHead>
                      <TableHead>Пользователь</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLog.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(entry.created_at)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {entry.action}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.entity_type ?? "—"}
                          {entry.entity_id && (
                            <span className="ml-1 text-xs">
                              ({entry.entity_id.slice(0, 8)})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.user_id?.slice(0, 8) ?? "система"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пригласить пользователя</DialogTitle>
          </DialogHeader>
          <InviteForm
            onClose={() => setInviteOpen(false)}
            workspaceId={workspace.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WorkspaceSettings({ workspace }: { workspace: Workspace }) {
  const router = useRouter();
  const [name, setName] = useState(workspace.name);
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingName(true);
    const supabase = createBrowserClient();
    const { error } = await supabase
      .from("workspaces")
      .update({ name: name.trim() })
      .eq("id", workspace.id);

    if (error) {
      toast.error("Ошибка: " + error.message);
    } else {
      toast.success("Название обновлено");
      router.refresh();
    }
    setSavingName(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Файл слишком большой (макс. 2 МБ)");
      return;
    }

    setUploading(true);
    const supabase = createBrowserClient();
    const ext = file.name.split(".").pop() || "png";
    const path = `${workspace.id}/logo.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("workspace-files")
      .upload(path, file, { upsert: true });

    if (upErr) {
      toast.error("Ошибка загрузки: " + upErr.message);
      setUploading(false);
      return;
    }

    const { data: pub } = supabase.storage
      .from("workspace-files")
      .getPublicUrl(path);

    const { error: dbErr } = await supabase
      .from("workspaces")
      .update({ logo_url: pub.publicUrl })
      .eq("id", workspace.id);

    if (dbErr) {
      toast.error("Ошибка сохранения: " + dbErr.message);
    } else {
      toast.success("Логотип обновлён");
      router.refresh();
    }
    setUploading(false);
  }

  async function handleRemoveLogo() {
    const supabase = createBrowserClient();
    const { error } = await supabase
      .from("workspaces")
      .update({ logo_url: null })
      .eq("id", workspace.id);

    if (error) {
      toast.error("Ошибка: " + error.message);
    } else {
      toast.success("Логотип удалён");
      router.refresh();
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Workspace name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            Название организации
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveName} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ws-name">Название</Label>
              <Input
                id="ws-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ООО «Конструкторское бюро»"
              />
            </div>
            <Button type="submit" disabled={savingName || name.trim() === workspace.name}>
              {savingName ? "Сохранение..." : "Сохранить"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Logo upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" />
            Логотип
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {workspace.logo_url ? (
              <Image
                src={workspace.logo_url}
                alt="Логотип"
                width={64}
                height={64}
                className="h-16 w-16 rounded-lg border object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-muted">
                <Settings className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <label htmlFor="logo-upload">
                <Button variant="outline" size="sm" asChild disabled={uploading}>
                  <span className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Загрузка..." : "Загрузить"}
                  </span>
                </Button>
              </label>
              <input
                id="logo-upload"
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
              {workspace.logo_url && (
                <Button variant="ghost" size="sm" onClick={handleRemoveLogo}>
                  Удалить логотип
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                PNG, JPG, SVG или WebP. Макс. 2 МБ.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InviteForm({
  onClose,
  workspaceId,
}: {
  onClose: () => void;
  workspaceId: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("engineer");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.from("users").insert({
      workspace_id: workspaceId,
      name: name.trim(),
      email: email.trim(),
      role,
      is_active: true,
    });

    if (error) {
      toast.error("Ошибка: " + error.message);
    } else {
      toast.success("Пользователь добавлен");
      onClose();
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invite-name">Имя</Label>
        <Input
          id="invite-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Иван Иванов"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ivan@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label>Роль</Label>
        <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.filter((r) => r !== "owner").map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Отмена
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Сохранение..." : "Добавить"}
        </Button>
      </DialogFooter>
    </form>
  );
}
