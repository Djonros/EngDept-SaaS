# EngDept SaaS

Система управления инженерно-конструкторским отделом (конструкторским бюро):
проекты, kanban-задачи по этапам СТП, нормоконтроль, каталог цен, документы
на оплату, портал фрилансеров, freemium-тарифы с офлайн-лицензиями.

**© 2024–2026 Djonros ([djonros@gmail.com](mailto:djonros@gmail.com)). Все права защищены.**
Проприетарное ПО: копирование, модификация и распространение без письменного
разрешения правообладателя запрещены.

## Архитектура

- **Next.js 14** (App Router, standalone output) + TypeScript
- **SQLite** (`better-sqlite3`) — база данных в файле `data/app.db`,
  внешние сервисы не требуются
- **Собственная авторизация** — scrypt-хэши, сессии в httpOnly-cookie
- **Лицензии** — офлайн-ключи с подписью Ed25519 (проверка локально)
- Tailwind CSS + shadcn/ui, Telegram-бот на grammy (опционально)

```
lib/
  db.ts               # SQLite-синглтон + авто-миграции
  repo.ts             # слой данных с изоляцией workspace_id (замена RLS)
  auth.ts             # пароли, сессии
  api-auth.ts         # сессия для API-роутов
  license-server.ts   # офлайн-активация Ed25519-ключей
  plans.ts            # тарифы (лимиты, фичи, цены)
db/migrations/        # SQL-схема (применяются при старте)
app/api/              # REST API (auth, tasks, projects, catalog, admin...)
```

## Быстрый старт (разработка)

```bash
npm install
npm run dev            # http://localhost:3000
```

`.env.local`:

```
LICENSE_ENCRYPTION_KEY=<случайная строка>
SESSION_SECRET=<случайная строка>
# TELEGRAM_BOT_TOKEN=...   (опционально)
```

База `data/app.db` создаётся автоматически при первом запуске.
Зарегистрируйтесь — первый пользователь становится владельцем организации.

## Скрипты

| Команда | Назначение |
|---|---|
| `npm run dev` | dev-сервер |
| `npm run build` | production-сборка (standalone) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run bot` | Telegram-бот (long polling) |
| `npm run sign-license -- pro 12` | подписать лицензионный ключ (pro на 12 мес) |

Лицензионные ключи: `node tools/sign-license.mjs --init` (один раз, создаёт
`license-private.pem`), затем `generate-license.bat` или `npm run sign-license`.

## Тарифы (freemium)

| | Free | Pro (2 990 ₽/мес) | Enterprise (7 990 ₽/мес) |
|---|---|---|---|
| Пользователей | 3 | 25 | 100 |
| Проектов | 3 | ∞ | ∞ |
| Аналитика, каталог цен, платёжные документы | — | ✓ | ✓ |
| Брендинг (логотип, реквизиты) | — | — | ✓ |

Ключ действует 12 месяцев, активация офлайн: «Администрирование → Лицензия».

## Распространение

Клиентский дистрибутив собирается из standalone-сборки:
`app/` (server.js + .next + node_modules + db/migrations) + `install.bat` +
`start.bat` + `README.txt`. Установка без внешних аккаунтов и сервисов.

## Контакты

**Правообладатель:** Djonros
**Email:** [djonros@gmail.com](mailto:djonros@gmail.com)
**Дата сборки:** 2024–2026
