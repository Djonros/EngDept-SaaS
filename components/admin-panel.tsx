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
import Link from "next/link";
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
  Building2,
  Loader2,
  Lock,
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
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  ROLE_LABELS,
  type CompanyDetails,
  type User,
  type UserRole,
  type Workspace,
  type AuditLogEntry,
} from "@/lib/types";
import { hasRole } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  PLAN_LABELS,
  FEATURE_LABELS,
  formatRub,
  getPlanConfig,
  hasFeature,
} from "@/lib/plans";

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

const ALL_PLAN_FEATURES = ["analytics", "catalog", "payment-doc", "branding"] as const;

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

  async function handleToggleRole(user: User, role: UserRole, checked: boolean) {
    const current = user.roles ?? [user.role];
    let next: UserRole[];
    if (checked) {
      next = current.includes(role) ? current : [...current, role];
    } else {
      next = current.filter((r) => r !== role);
    }
    if (next.length === 0) {
      toast.error("У пользователя должна остаться хотя бы одна роль");
      return;
    }
    const res = await fetch("/api/admin/update-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, roles: next }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Ошибка");
    } else {
      toast.success("Роли обновлены");
      router.refresh();
    }
  }

  async function handleResetPassword(user: User) {
    const password = prompt(`Новый пароль для ${user.name} (мин. 6 символов):`);
    if (!password) return;
    if (password.length < 6) {
      toast.error("Пароль должен быть не короче 6 символов");
      return;
    }
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Ошибка: " + (data.error || "неизвестная"));
      } else {
        toast.success("Пароль обновлён — сообщите его сотруднику");
      }
    } catch {
      toast.error("Ошибка сети");
    }
  }

  async function handleToggleActive(user: User) {
    try {
      const res = await fetch("/api/admin/toggle-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, isActive: !user.is_active }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Ошибка: " + (data.error || "неизвестная"));
      } else {
        toast.success(user.is_active ? "Пользователь деактивирован" : "Пользователь активирован");
        router.refresh();
      }
    } catch {
      toast.error("Ошибка сети");
    }
  }

  async function handleActivateLicense() {
    if (!licenseKey.trim()) {
      toast.error("Введите лицензионный ключ");
      return;
    }
    setActivating(true);
    try {
      const res = await fetch("/api/admin/activate-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: licenseKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Ошибка активации");
      } else {
        toast.success("Лицензия активирована");
        setLicenseKey("");
        router.refresh();
      }
    } catch {
      toast.error("Ошибка сети");
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
          <TabsTrigger value="company" className="gap-1.5">
            <Building2 className="h-4 w-4" />
            Реквизиты
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

        {/* Company details tab */}
        <TabsContent value="company">
          <CompanyDetailsSettings workspace={workspace} />
        </TabsContent>

        {/* Users tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                Пользователи ({users.length} / {workspace.max_users})
              </CardTitle>
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                <UserPlus className="mr-1 h-4 w-4" />
                Добавить
              </Button>
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
                        <div className="flex flex-col gap-1">
                          {ROLES.map((r) => (
                            <label
                              key={r}
                              className="flex cursor-pointer items-center gap-1.5 text-xs"
                            >
                              <Checkbox
                                checked={hasRole(user.roles, r) || user.role === r}
                                onCheckedChange={(checked) =>
                                  handleToggleRole(user, r, checked === true)
                                }
                              />
                              {ROLE_LABELS[r]}
                            </label>
                          ))}
                        </div>
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
                        {!hasRole(user.roles, "owner") && user.role !== "owner" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetPassword(user)}
                            >
                              <Key className="h-4 w-4" />
                              Пароль
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(user)}
                            >
                              <Power className="h-4 w-4" />
                              {user.is_active ? "Отключить" : "Включить"}
                            </Button>
                          </>
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
                  <span className="text-sm text-muted-foreground">
                    · {formatRub(getPlanConfig(workspace.plan).priceRub)}
                    {getPlanConfig(workspace.plan).priceRub > 0 ? " / мес" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Максимум пользователей:
                  </span>
                  <span className="font-medium">{workspace.max_users}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Максимум проектов:
                  </span>
                  <span className="font-medium">
                    {getPlanConfig(workspace.plan).maxProjects == null
                      ? "без ограничений"
                      : getPlanConfig(workspace.plan).maxProjects}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <span className="text-sm text-muted-foreground">
                    Возможности плана:
                  </span>
                  <ul className="space-y-1 text-sm">
                    {ALL_PLAN_FEATURES.map((feature) => {
                      const included = hasFeature(workspace.plan, feature);
                      return (
                        <li
                          key={feature}
                          className={
                            included ? "" : "text-muted-foreground"
                          }
                        >
                          {included ? (
                        <CheckCircle2 className="mr-1.5 inline h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="mr-1.5 inline h-4 w-4" />
                      )}
                          {FEATURE_LABELS[feature]}
                        </li>
                      );
                    })}
                  </ul>
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
                    placeholder="XXXXX-XXXXX-XXXXX-…"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
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
                <p className="text-xs text-muted-foreground">
                  Ключ можно получить у поставщика:{" "}
                  <a
                    className="underline underline-offset-4 hover:text-foreground"
                    href="mailto:djonros@gmail.com?subject=%D0%9B%D0%B8%D1%86%D0%B5%D0%BD%D0%B7%D0%B8%D1%8F%20EngDept%20SaaS"
                  >
                    djonros@gmail.com
                  </a>
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
            <DialogTitle>Добавить сотрудника</DialogTitle>
          </DialogHeader>
          <AddUserForm
            onClose={() => setInviteOpen(false)}
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
  const brandingLocked = !hasFeature(workspace.plan, "branding");

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingName(true);
    try {
      const res = await fetch("/api/admin/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Ошибка: " + (data.error || "неизвестная"));
      } else {
        toast.success("Название обновлено");
        router.refresh();
      }
    } catch {
      toast.error("Ошибка сети");
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
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/logo", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Ошибка загрузки: " + (data.error || "неизвестная"));
      } else {
        toast.success("Логотип обновлён");
        router.refresh();
      }
    } catch {
      toast.error("Ошибка сети");
    }
    setUploading(false);
  }

  async function handleRemoveLogo() {
    try {
      const res = await fetch("/api/admin/logo", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Ошибка: " + (data.error || "неизвестная"));
      } else {
        toast.success("Логотип удалён");
        router.refresh();
      }
    } catch {
      toast.error("Ошибка сети");
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
              {brandingLocked ? (
                <div className="rounded-md border border-dashed p-3 text-center">
                  <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    Логотип доступен на тарифе Enterprise
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-2">
                    <Link href="/pricing">Смотреть тарифы</Link>
                  </Button>
                </div>
              ) : (
                <>
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
                </>
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

function AddUserForm({
  onClose,
}: {
  onClose: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<UserRole[]>(["engineer"]);
  const [saving, setSaving] = useState(false);

  function toggleRole(role: UserRole, checked: boolean) {
    setRoles((prev) =>
      checked
        ? prev.includes(role)
          ? prev
          : [...prev, role]
        : prev.filter((r) => r !== role)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    if (roles.length === 0) {
      toast.error("Выберите хотя бы одну роль");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), roles }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Ошибка");
      } else {
        toast.success(`Сотрудник «${data.name}» добавлен`);
        onClose();
        router.refresh();
      }
    } catch {
      toast.error("Ошибка сети");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
        Введите email уже зарегистрированного на платформе пользователя.
        Если сотрудник ещё не зарегистрирован — попросите его сначала создать
        аккаунт.
      </div>
      <div className="space-y-2">
        <Label htmlFor="add-email">Email сотрудника</Label>
        <Input
          id="add-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ivan@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label>Роли</Label>
        <div className="space-y-1.5">
          {ROLES.map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={roles.includes(r)}
                onCheckedChange={(checked) => toggleRole(r, checked === true)}
              />
              {ROLE_LABELS[r]}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Можно выбрать несколько ролей одновременно.
        </p>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Отмена
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              Добавление...
            </>
          ) : (
            "Добавить"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

const COMPANY_FIELDS: { key: keyof CompanyDetails; label: string; placeholder?: string }[] = [
  { key: "name", label: "Полное наименование", placeholder: "ООО «Конструкторское бюро»" },
  { key: "inn", label: "ИНН", placeholder: "7707083893" },
  { key: "kpp", label: "КПП", placeholder: "771001001" },
  { key: "ogrn", label: "ОГРН", placeholder: "1027700132195" },
  { key: "address", label: "Юридический адрес", placeholder: "г. Москва, ул. ..." },
  { key: "phone", label: "Телефон", placeholder: "+7 (495) 123-45-67" },
  { key: "email", label: "Email", placeholder: "info@example.com" },
  { key: "account", label: "Расчётный счёт", placeholder: "40702810400000001234" },
  { key: "bank", label: "Банк", placeholder: "ПАО «Сбербанк»" },
  { key: "bik", label: "БИК", placeholder: "044525225" },
  { key: "corr_account", label: "Корр. счёт", placeholder: "30101810400000000225" },
  { key: "ceo_name", label: "Руководитель (ФИО)", placeholder: "Иванов И. И." },
];

function CompanyDetailsSettings({ workspace }: { workspace: Workspace }) {
  const router = useRouter();
  const initial: CompanyDetails =
    (workspace.company_details as CompanyDetails) ?? {};
  const [details, setDetails] = useState<CompanyDetails>(initial);
  const [saving, setSaving] = useState(false);

  function update(key: keyof CompanyDetails, value: string) {
    setDetails((prev) => ({ ...prev, [key]: value || undefined }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyDetails: details }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Ошибка: " + (data.error || "неизвестная"));
      } else {
        toast.success("Реквизиты сохранены");
        router.refresh();
      }
    } catch {
      toast.error("Ошибка сети");
    }
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4" />
          Реквизиты организации
          {!hasFeature(workspace.plan, "branding") && (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasFeature(workspace.plan, "branding") ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {COMPANY_FIELDS.map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`cd-${key}`}>{label}</Label>
                  <Input
                    id={`cd-${key}`}
                    value={(details[key] as string) ?? ""}
                    onChange={(e) => update(key, e.target.value)}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Эти реквизиты подставляются в документы на оплату по завершённым
              проектам.
            </p>
            <Button type="submit" disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить реквизиты"}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Реквизиты организации доступны на тарифе Enterprise.
            </p>
            <Button asChild size="sm">
              <Link href="/pricing">Смотреть тарифы</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
