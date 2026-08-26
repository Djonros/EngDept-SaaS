# EngDept SaaS — Платформа управления инженерно-конструкторским отделом

**© 2024–2026 Djonros (djonros@gmail.com). Все права защищены.**

---

## Оглавление

1. [Назначение программы](#1-назначение-программы)
2. [Архитектура и стек технологий](#2-архитектура-и-стек-технологий)
3. [Системные требования](#3-системные-требования)
4. [Быстрый старт (Batch-файлы)](#4-быстрый-старт-batch-файлы)
5. [Ручная установка и настройка](#5-ручная-установка-и-настройка)
6. [Настройка Supabase (база данных)](#6-настройка-supabase-база-данных)
7. [Настройка Telegram-бота](#7-настройка-telegram-бота)
8. [Переменные окружения (.env)](#8-переменные-окружения-env)
9. [Роли пользователей](#9-роли-пользователей)
10. [Руководство по модулям системы](#10-руководство-по-модулям-системы)
11. [Лицензирование и тарифные планы](#11-лицензирование-и-тарифные-планы)
12. [Развёртывание в production](#12-развёртывание-в-production)
13. [Batch-файлы — подробное описание](#13-batch-файлы--подробное-описание)
14. [Структура проекта](#14-структура-проекта)
15. [Устранение неисправностей (FAQ)](#15-устранение-неисправностей-faq)

---

## 1. Назначение программы

**EngDept SaaS** — это многотенантная (multi-tenant) SaaS-платформа для управления
инженерно-конструкторским отделом. Программа обеспечивает полный цикл управления
проектами, задачами, нормоконтролем и расчётом зарплаты инженеров.

### Ключевые возможности

| Модуль              | Функциональность                                                    |
|---------------------|---------------------------------------------------------------------|
| **Дашборд**         | KPI-карточки, конвейер по стадиям, последние задачи, бюджеты        |
| **Проекты**         | CRUD проектов, этапы (milestones), бюджеты, статусы                 |
| **Задачи (Kanban)** | Доска с drag-and-drop, 7 стадий СТП, назначение, стоимость          |
| **Каталог цен**     | Справочник операций с базовыми ценами и множителями                 |
| **СТП**             | Чек-листы нормоконтроля по стадиям проектирования                   |
| **Аналитика**       | Графики (recharts): стадии, тренды, бюджеты, эффективность          |
| **Администрирование** | Управление пользователями, лицензии, журнал аудита                |
| **Фрилансер**       | Личные задачи, кошелёк с историей выплат                            |
| **Telegram-бот**    | Уведомления, просмотр задач и баланса через Telegram               |

---

## 2. Архитектура и стек технологий

```
┌─────────────────────────────────────────────────────────┐
│                    Клиент (браузер)                       │
│   Next.js 14 App Router · React 18 · TypeScript          │
│   Tailwind CSS · shadcn/ui · recharts · lucide-react     │
├─────────────────────────────────────────────────────────┤
│                   Сервер (Next.js)                        │
│   Server Components — чтение данных                       │
│   Client Components — мутации через browser client        │
│   Middleware — auth guard + role redirect                 │
│   API Routes — webhook, telegram-bot, license-check       │
├─────────────────────────────────────────────────────────┤
│               Supabase (PostgreSQL)                       │
│   10 таблиц · RLS (Row Level Security)                    │
│   RPC: create_workspace_with_owner()                      │
│   Функция: current_workspace_id() для RLS                 │
├─────────────────────────────────────────────────────────┤
│              Telegram Bot (grammy)                        │
│   Long polling (dev) / Webhook (prod)                    │
└─────────────────────────────────────────────────────────┘
```

### Технологии

- **Next.js 14.2** (App Router) — фреймворк
- **TypeScript 5.6** — строгая типизация
- **Supabase** — PostgreSQL + Auth + Realtime
- **Tailwind CSS 3.4** — стилизация
- **shadcn/ui** — UI-компоненты (на базе Radix UI)
- **recharts 2.12** — графики и диаграммы
- **grammy 1.29** — Telegram-бот
- **lucide-react** — иконки
- **sonner** — toast-уведомления
- **next-themes** — тёмная/светлая тема

---

## 3. Системные требования

### Для разработки

- **Node.js** v18.18+ (рекомендуется v20+ или v22+)
- **npm** v10+
- **ОС:** Windows 10/11, macOS, Linux
- **Браузер:** Chrome / Firefox / Edge (последние 2 версии)

### Для production

- **VPS / Cloud** с Node.js 20+
- **Supabase** — облачный или self-hosted инстанс
- **Домен** с HTTPS-сертификатом
- **RAM:** от 512 МБ (для Next.js standalone)
- **Диск:** от 1 ГБ

---

## 4. Быстрый старт (Batch-файлы)

В корне проекта находятся batch-файлы для Windows:

### `setup.bat` — Первоначальная настройка
```cmd
setup.bat
```
Выполняет:
1. Проверку версии Node.js
2. Установку зависимостей (`npm install`)
3. Создание файла `.env.local` из шаблона `.env.example`
4. Проверку переменных окружения

### `dev.bat` — Запуск в режиме разработки
```cmd
dev.bat
```
Запускает `npm run dev` — локальный сервер на http://localhost:3000

### `build.bat` — Сборка production-версии
```cmd
build.bat
```
Выполняет lint + typecheck + production-сборку Next.js

### `start.bat` — Запуск production-сервера
```cmd
start.bat
```
Запускает собранную версию (`npm run start`) на http://localhost:3000

### `db-setup.bat` — Применение миграций базы данных
```cmd
db-setup.bat
```
Применяет SQL-миграции из `supabase/migrations/` к вашей базе Supabase

### `bot.bat` — Запуск Telegram-бота (режим polling)
```cmd
bot.bat
```
Запускает бота в режиме long-polling (для разработки)

### `deploy.bat` — Полное развёртывание (install + build + start)
```cmd
deploy.bat
```
Полный цикл: установка зависимостей, сборка, запуск production-сервера

---

## 5. Ручная установка и настройка

### Шаг 1. Клонирование / распаковка проекта

```bash
# Если используется git:
git clone <repository-url> eng-dept-saas
cd eng-dept-saas
```

### Шаг 2. Установка зависимостей

```bash
npm install
```

> **Важно:** Если установка падает с ошибкой SWC, удалите
> `node_modules/@next/swc-win32-x64-msvc` и запустите `npm install` снова.

### Шаг 3. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Telegram Bot (опционально)
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET

# Сайт
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Лицензирование
LICENSE_ENCRYPTION_KEY=your-32-char-encryption-key-here
```

### Шаг 4. Инициализация базы данных

Выполните SQL-миграции в Supabase (через SQL Editor или `supabase db push`):

1. `supabase/migrations/0001_init.sql` — создание всех таблиц, RLS, триггеров
2. `supabase/migrations/0002_add_paid_at.sql` — колонка `paid_at` для задач

### Шаг 5. Запуск

```bash
npm run dev     # разработка (http://localhost:3000)
# или
npm run build && npm run start   # production
```

---

## 6. Настройка Supabase (база данных)

### Создание проекта Supabase

1. Перейдите на https://supabase.com и создайте новый проект
2. Запомните пароль базы данных
3. Дождитесь завершения инициализации (2–3 минуты)

### Получение ключей

В панели Supabase откройте **Project Settings → API**:

| Ключ                       | Куда вставить                       |
|----------------------------|-------------------------------------|
| **Project URL**            | `NEXT_PUBLIC_SUPABASE_URL`          |
| **anon public key**        | `NEXT_PUBLIC_SUPABASE_ANON_KEY`     |
| **service_role key**       | `SUPABASE_SERVICE_ROLE_KEY` (секрет!) |

> **Внимание:** `service_role key` обходит RLS. Никогда не публикуйте его
> на клиенте. Он используется только в server-side коде.

### Применение миграций

**Способ 1 — через SQL Editor (проще):**
1. Откройте Supabase Dashboard → SQL Editor
2. Скопируйте содержимое `supabase/migrations/0001_init.sql` и выполните
3. Скопируйте содержимое `supabase/migrations/0002_add_paid_at.sql` и выполните

**Способ 2 — через Supabase CLI:**
```bash
npm run db:push
```

### Структура базы данных (10 таблиц)

```
workspaces        — рабочие пространства (тенанты)
  ├── users       — пользователи (роли: owner, manager, engineer, ...)
  ├── projects    — проекты
  │     └── milestones — этапы проектов
  │           └── tasks — задачи (7 стадий: brief → concept → 3d → 2d → calc → review → done)
  ├── stp_checklists — чек-листы нормоконтроля по стадиям
  ├── price_catalog — справочник цен на операции
  ├── price_multipliers — множители к ценам
  ├── licenses    — лицензионные ключи
  └── audit_log   — журнал действий
```

### Безопасность (RLS)

Все таблицы защищены Row Level Security. Пользователь видит данные только
своего `workspace_id`. Контекст текущего workspace определяется через
функцию `current_workspace_id()`, которая извлекает ID из JWT-клейма
пользователя.

---

## 7. Настройка Telegram-бота

### Создание бота

1. Откройте Telegram и найдите **@BotFather**
2. Отправьте `/newbot` и следуйте инструкциям
3. Получите **Bot Token** и вставьте в `.env.local`:
   ```
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRstuVWXyz
   ```

### Режимы работы

**Long polling (для разработки):**
```bash
npm run bot
# или
bot.bat
```

**Webhook (для production):**
```bash
# В .env.local:
TELEGRAM_WEBHOOK_URL=https://your-domain.com
TELEGRAM_WEBHOOK_SECRET=your-secret-token

# Запуск (один раз для установки webhook):
npm run bot
```

### Команды бота

| Команда           | Описание                                     |
|-------------------|----------------------------------------------|
| `/start`          | Начало работы, приветствие                   |
| `/tasks`          | Список активных задач                        |
| `/balance`        | Заработок по завершённым задачам             |
| `/link email`     | Привязка аккаунта к Telegram                  |
| `/help`           | Справка по командам                          |

### Привязка аккаунта

Пользователь отправляет боту:
```
/link ivan@company.ru
```
Бот находит пользователя по email и сохраняет `telegram_id`. После этого
пользователь получает уведомления о новых задачах, смене стадий и доработках.

---

## 8. Переменные окружения (.env)

| Переменная                        | Обязательно | Описание                              |
|-----------------------------------|-------------|---------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`        | Да          | URL проекта Supabase                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Да          | Публичный ключ Supabase (anon)        |
| `SUPABASE_SERVICE_ROLE_KEY`       | Да          | Секретный ключ (service role)         |
| `TELEGRAM_BOT_TOKEN`              | Нет         | Токен Telegram-бота                   |
| `TELEGRAM_WEBHOOK_URL`            | Нет         | URL для webhook-режима бота           |
| `TELEGRAM_WEBHOOK_SECRET`         | Нет         | Секретный токен для webhook           |
| `NEXT_PUBLIC_SITE_URL`            | Нет         | Базовый URL сайта (для бота)          |
| `LICENSE_ENCRYPTION_KEY`          | Нет         | Ключ шифрования для fingerprint (32+ символа) |

---

## 9. Роли пользователей

| Роль             | Маршруты (доступ)                                          | Возможности                                |
|------------------|-----------------------------------------------------------|--------------------------------------------|
| **Владелец**     | Все страницы                                               | Полный доступ, управление юзерами, лицензии |
| **Менеджер**     | Dashboard, Проекты, Задачи, Каталог цен, Аналитика, СТП   | CRUD проектов/задач, управление каталогом   |
| **Инженер**      | Dashboard, Проекты, Задачи, СТП                            | Работа с задачами, перемещение по стадиям   |
| **Нормоконтролёр** | Dashboard, Проекты, Задачи, СТП                           | Проверка задач по чек-листам нормоконтроля  |
| **Фрилансер**    | Мои задачи, Мой кошелёк                                    | Только свои задачи, просмотр заработка      |

### Перенаправление по ролям

- Фрилансеры автоматически перенаправляются на `/my-tasks` при попытке
  зайти на `/dashboard`, `/projects`, `/catalog`, `/admin`, `/analytics`
- Незарегистрированные пользователи перенаправляются на `/login`

---

## 10. Руководство по модулям системы

### 10.1. Дашборд (`/dashboard`)

Главная страница с обзором отдела:
- **KPI-карточки:** активные проекты, всего задач, просрочено, размер команды
- **Конвейер СТП:** распределение задач по 7 стадиям (горизонтальные бары)
- **Бюджет:** суммарный бюджет активных проектов
- **Последние задачи:** сетка из 8 последних задач

### 10.2. Проекты (`/projects`)

- Сетка карточек проектов с статистикой (задачи, бюджет, статус)
- Кнопка **«Новый проект»** — создание с указанием названия, описания, бюджета, даты
- Клик по проекту — детальная страница `/projects/[id]`:
  - Информация о проекте
  - Этапы (milestones) — CRUD
  - Задачи проекта в виде kanban-доски

### 10.3. Задачи (`/tasks`)

Kanban-доска с 7 колонками по стадиям СТП:

| Стадия       | Описание                    |
|--------------|-----------------------------|
| ТЗ           | Техническое задание         |
| Концепт      | Концептуальная разработка   |
| 3D-модель    | Трёхмерное моделирование    |
| 2D-чертежи   | Двухмерные чертежи          |
| Расчёты      | Инженерные расчёты          |
| Нормоконтроль| Проверка нормоконтролёром   |
| Готово       | Задача завершена            |

**Возможности:**
- Drag-and-drop перемещение задач между стадиями
- Создание / редактирование задач (диалог)
- Назначение исполнителя и нормоконтролёра
- Указание стоимости, срока, ссылки на Яндекс.Диск
- Детали задачи в выезжающей панели (Sheet)
- Перемещение по стадиям кнопками (вперёд / назад)
- Возврат на предыдущую стадию увеличивает `rework_count`
- Фильтр по проекту

### 10.4. Каталог цен (`/catalog`)

Две вкладки:

**Справочник операций:**
- Добавление / редактирование / удаление операций
- Поля: название, категория (общее, 3D, 2D, расчёты, документация, другое)
- Базовая цена, единица измерения (шт, час, лист, сборка, чертёж)

**Множители:**
- Коэффициенты к ценам (например, срочность ×1.5)
- Применение к категориям: все, 3D, 2D, расчёты, документация

**Формула расчёта:**
```
стоимость_задачи = базовая_цена × количество × множитель_1 × множитель_2 × ...
```

### 10.5. СТП — Чек-листы нормоконтроля (`/stp`)

- Вкладки по 7 стадиям СТП
- Добавление / удаление пунктов чек-листа для каждой стадии
- Каждый пункт: текст + признак обязательности
- Автосохранение в формате JSONB

### 10.6. Аналитика (`/analytics`)

4 интерактивных графика (recharts):

1. **Загрузка по стадиям** — BarChart распределения задач
2. **Тренд за 6 месяцев** — AreaChart созданных и завершённых задач
3. **Бюджет проектов** — горизонтальный BarChart (топ-8 проектов)
4. **Эффективность сотрудников** — стекed BarChart + Line (доработки)

Сводные KPI: всего задач, бюджет, выполнено на сумму, количество доработок.

### 10.7. Администрирование (`/admin`)

Доступ только для роли **Владелец**.

Три вкладки:
- **Пользователи:** список сотрудников, смена ролей, активация / деактивация
- **Лицензия:** текущий план, активация нового ключа
- **Журнал аудита:** последние 100 действий (создание, изменение, удаление)

### 10.8. Мои задачи (`/my-tasks`) — для фрилансеров

Персональная kanban-доска с задачами, назначенными на пользователя.

### 10.9. Мой кошелёк (`/my-wallet`) — для фрилансеров

- KPI: заработано всего, ожидает выплаты, выплачено
- Таблица завершённых задач с суммами и статусом выплаты (`paid_at`)

---

## 11. Лицензирование и тарифные планы

### Тарифные планы

| План         | Max пользователей | Срок       | Цена           |
|--------------|-------------------|------------|----------------|
| **Free**     | 5                 | Бессрочно  | Бесплатно      |
| **Pro**      | 25                | 365 дней   | По договорённости |
| **Enterprise** | 100             | 365 дней   | По договорённости |

### Активация лицензии

1. Владелец workspace получает ключ (формат `XXXX-XXXX-XXXX-XXXX`)
2. Заходит на `/license-activate` или в **Администрирование → Лицензия**
3. Вводит ключ
4. Ключ привязывается к workspace и hardware_id
5. План и лимиты обновляются автоматически

### Создание лицензионных ключей

Ключи создаются вручную администратором Supabase:
```sql
INSERT INTO licenses (key, plan, status)
VALUES ('XXXX-XXXX-XXXX-XXXX', 'pro', 'active');
```

---

## 12. Развёртывание в production

### Вариант 1 — VPS (рекомендуемый)

```bash
# 1. Подключитесь к серверу
ssh user@your-server

# 2. Установите Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Скопируйте файлы проекта
git clone <repo> /opt/eng-dept-saas
cd /opt/eng-dept-saas

# 4. Настройте .env.local
nano .env.local

# 5. Установите зависимости и соберите
npm ci
npm run build

# 6. Запустите через PM2
npm install -g pm2
pm2 start npm --name eng-dept -- start
pm2 save
pm2 startup
```

### Вариант 2 — Docker (опционально)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Вариант 3 — Vercel

1. Подключите репозиторий к Vercel
2. Укажите переменные окружения в настройках проекта
3. Vercel автоматически соберёт и развернёт

### Настройка Nginx (reverse proxy)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Telegram-бот в production

Используйте webhook-режим:
```bash
# Установка webhook (выполняется один раз)
TELEGRAM_WEBHOOK_URL=https://your-domain.com npm run bot
```

---

## 13. Batch-файлы — подробное описание

### `setup.bat`
```
Проверяет Node.js → npm install → создаёт .env.local → проверяет переменные
```
Используйте при первом развёртывании проекта.

### `dev.bat`
```
npm run dev → http://localhost:3000
```
Режим разработки с hot-reload.

### `build.bat`
```
npm run lint → npm run typecheck → npm run build
```
Проверка кода и сборка production-версии в `.next/`.

### `start.bat`
```
npm run start → http://localhost:3000
```
Запуск production-сервера. Требует предварительного `build.bat`.

### `db-setup.bat`
```
Применяет миграции БД через Supabase CLI
```
Выполняйте после создания проекта Supabase.

### `bot.bat`
```
npm run bot
```
Запуск Telegram-бота в режиме long-polling (для разработки).

### `deploy.bat`
```
npm install → npm run build → npm run start
```
Полный цикл развёртывания на production-сервере.

---

## 14. Структура проекта

```
eng-dept-saas/
├── app/                           # Next.js App Router
│   ├── (dashboard)/               # Маршруты персонала
│   │   ├── dashboard/             # Дашборд
│   │   ├── projects/              # Проекты (+ [id]/)
│   │   ├── tasks/                 # Задачи (Kanban)
│   │   ├── catalog/               # Каталог цен
│   │   ├── stp/                   # СТП — чек-листы
│   │   ├── analytics/             # Аналитика
│   │   ├── admin/                 # Администрирование
│   │   └── layout.tsx             # Layout с Sidebar для персонала
│   ├── (freelancer)/              # Маршруты фрилансеров
│   │   ├── my-tasks/              # Мои задачи
│   │   ├── my-wallet/             # Мой кошелёк
│   │   └── layout.tsx             # Layout с Sidebar для фрилансеров
│   ├── api/                       # API Routes
│   │   ├── webhook/               # Webhook для Supabase
│   │   ├── telegram-bot/          # Webhook для Telegram
│   │   └── license-check/         # Проверка лицензии
│   ├── login/                     # Страница входа
│   ├── register/                  # Регистрация workspace
│   ├── license-activate/          # Активация лицензии
│   ├── layout.tsx                 # Root layout (ThemeProvider, Toaster)
│   ├── page.tsx                   # Редирект по ролям
│   └── globals.css                # Глобальные стили + CSS-переменные
│
├── components/                    # React-компоненты
│   ├── ui/                        # shadcn/ui примитивы (19 компонентов)
│   ├── dashboard-view.tsx         # Дашборд
│   ├── tasks-board.tsx            # Обёртка kanban-доски задач
│   ├── kanban-board.tsx           # DnD-доска
│   ├── task-card.tsx              # Карточка задачи
│   ├── task-form-dialog.tsx       # Создание/редактирование задачи
│   ├── task-detail-sheet.tsx      # Детали задачи (Sheet)
│   ├── project-form-dialog.tsx    # Создание/редактирование проекта
│   ├── project-detail-view.tsx    # Детали проекта + milestones
│   ├── catalog-manager.tsx        # Управление каталогом цен
│   ├── stp-manager.tsx            # Управление чек-листами СТП
│   ├── analytics-view.tsx         # Графики аналитики
│   ├── admin-panel.tsx            # Админ-панель
│   ├── my-tasks-view.tsx          # Задачи фрилансера
│   ├── checklist-modal.tsx        # Модалка чек-листа нормоконтроля
│   ├── sidebar.tsx                # Боковая навигация
│   ├── app-shell.tsx              # Оболочка приложения (Sidebar + main)
│   └── theme-provider.tsx         # Провайдер тёмной темы
│
├── lib/                           # Утилиты и бизнес-логика
│   ├── types.ts                   # TypeScript типы + label-константы
│   ├── supabase-client.ts         # Browser + Admin клиенты
│   ├── supabase-server.ts         # Server-side клиент (cookies)
│   ├── session.ts                 # requireSession / requireStaffSession
│   ├── license-validator.ts       # Генерация и валидация лицензий
│   ├── price-calculator.ts        # Калькулятор стоимости задач
│   └── utils.ts                   # cn(), formatDate, formatCurrency, logAction
│
├── bot/                           # Telegram-бот (grammy)
│   └── index.ts                   # Команды: /start /tasks /balance /link /help
│
├── supabase/                      # Миграции БД
│   └── migrations/
│       ├── 0001_init.sql          # 10 таблиц + RLS + RPC + триггеры
│       └── 0002_add_paid_at.sql   # Колонка paid_at
│
├── middleware.ts                  # Auth guard + role redirect
├── tailwind.config.ts             # Конфигурация Tailwind CSS
├── tsconfig.json                  # Конфигурация TypeScript
├── postcss.config.mjs             # Конфигурация PostCSS
├── next.config.mjs                # Конфигурация Next.js
│
├── setup.bat                      # Первоначальная настройка
├── dev.bat                        # Запуск dev-сервера
├── build.bat                      # Сборка production
├── start.bat                      # Запуск production
├── db-setup.bat                   # Миграции БД
├── bot.bat                        # Запуск Telegram-бота
├── deploy.bat                     # Полное развёртывание
│
└── README.md                      # Этот файл
```

---

## 15. Устранение неисправностей (FAQ)

### Ошибка: `SWC binary not found`

**Решение:**
```bash
rm -rf node_modules/@next/swc-win32-x64-msvc
npm install
```

### Ошибка: `next-themes ThemeProviderProps not exported`

Версия `next-themes@0.4.6` не экспортирует `ThemeProviderProps`. Используется:
```typescript
React.ComponentProps<typeof NextThemesProvider>
```

### Ошибка сборки: `no-unused-vars`

ESLint строгий. Все неиспользуемые импорты и переменные вызывают ошибку.
Проверьте:
```bash
npm run lint
```

### Supabase: `relation does not exist`

Миграции не применены. Выполните `supabase/migrations/0001_init.sql` через
SQL Editor в Supabase Dashboard.

### Supabase: `RLS policy blocks access`

Проверьте, что:
1. Пользователь авторизован
2. В таблице `users` есть запись с `id = auth.uid()`
3. `workspace_id` пользователя совпадает с данными, к которым он обращается

### Telegram-бот не отвечает

1. Проверьте `TELEGRAM_BOT_TOKEN` в `.env.local`
2. Убедитесь, что бот запущен (`npm run bot`)
3. Для webhook-режима: проверьте, что URL доступен извне
4. Команда `/link email` для привязки аккаунта

### Kanban drag-and-drop не работает

DnD использует нативный HTML5 API. Убедитесь, что:
- Браузер поддерживает HTML5 drag-and-drop (все современные браузеры)
- Не открыт режим инкогнито (иногда блокирует DnD)

### Сброс пароля / восстановление доступа

В Supabase Dashboard → Authentication → Users найдите пользователя и
отправьте reset-password email.

---

## Контакты

**Правообладатель:** Djonros
**Email:** [djonros@gmail.com](mailto:djonros@gmail.com)
**Дата сборки:** 2024–2026

---

*Данная программа является проприетарным программным обеспечением.
Использование, копирование, изменение или распространение без письменного
разрешения правообладателя строго запрещено.*
