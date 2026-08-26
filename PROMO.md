# EngDept SaaS — описание для публикации

## Полная версия (для сайтов с подробным описанием)

---

**EngDept SaaS — облачная система управления инженерно-конструкторским отделом**

Платформа для конструкторских бюро и отделов проектирования, которая объединяет
проекты, задачи, нормоконтроль, расчёт стоимости и документы на оплату в одном
рабочем пространстве.

Забудьте о таблицах Excel, переписках в мессенджерах и ручном подсчёте
стоимости работ. EngDept SaaS выстраивает полный цикл: от постановки задачи
до готового платёжного документа.

**Ключевые возможности:**

- **Проекты и задачи.** Kanban-доска с этапами конструкторской работы: ТЗ →
  концепт → 3D-модель → 2D-чертежи → расчёты → нормоконтроль → готово.
  Контроль сроков, назначение исполнителей и проверяющих, ссылки на
  Яндекс.Диск.
- **Команды проектов.** Назначайте сотрудников на конкретные проекты с
  ролями: руководитель проекта, инженер, нормоконтролёр, наблюдатель.
- **Гибкие роли доступа.** Владелец, менеджер, инженер, нормоконтролёр,
  фрилансер — можно назначать несколько ролей одному сотруднику.
- **Нормоконтроль по СТП.** Настраиваемые чек-листы для каждой стадии —
  единый стандарт качества на все проекты.
- **Финансы.** Каталог цен на операции с множителями сложности,
  автоматический расчёт стоимости задач, аналитика загрузки и выручки.
- **Документ на оплату.** Один клик — и по завершённому проекту готов
  печатный документ (A4 / PDF): таблица работ, разбивка по исполнителям,
  реквизиты организации, подписи.
- **Портал фрилансеров.** Внешние исполнители видят только свои задачи и
  свой кошелёк — данные компании защищены.
- **Multi-tenancy.** Каждая организация работает в изолированном
  пространстве, безопасность на уровне базы данных (RLS).
- **Брендинг.** Логотип и название вашей компании во интерфейсе и документах.
- **Журнал аудита.** Все действия сотрудников фиксируются.
- **Telegram-бот** для уведомлений (опционально).

**Кому подходит:** конструкторские бюро, отделы главного конструктора,
инжиниринговые компании, машиностроительные предприятия, студии
промышленного дизайна, команды, работающие с внешними фрилансерами.

**Технологии:** Next.js 14, TypeScript, Supabase (PostgreSQL), Tailwind CSS,
shadcn/ui, Recharts. Разворачивается на любом сервере с Node.js.

**Установка под Windows:** распакуйте дистрибутив и запустите `install.bat`
(настроит окружение и файл `.env`, нужно только Node.js и бесплатный аккаунт
Supabase), затем `start.bat` — сервер запустится и откроется в браузере.
Для Linux/macOS — тот же дистрибутив: примените SQL-миграции из папки
`migrations` и запустите `node server.js`.

**Лицензия:** проприетарное ПО. Контакты для лицензирования и демонстрации:
djonros@gmail.com

---

## Короткая версия (для каталогов и форумов)

---

**EngDept SaaS** — облачная платформа для управления конструкторским
отделом: kanban-доска задач по этапам (ТЗ, 3D, 2D, расчёты, нормоконтроль),
команды проектов с ролями, чек-листы СТП, каталог цен и автоматический расчёт
стоимости, готовые документы на оплату, портал фрилансеров, аналитика и аудит.
Multi-tenant, разворачивается на своём сервере. Next.js + Supabase.

Контакты: djonros@gmail.com

---

## Версия на английском (для международных площадок)

---

**EngDept SaaS — engineering design department management platform**

A cloud platform for design bureaus and engineering teams that unites
projects, tasks, quality control, cost calculation and payment documents
in one workspace.

**Key features:**
- Kanban board with engineering stages: brief → concept → 3D → 2D drawings →
  calculations → QA review → done
- Per-project teams with roles (lead, engineer, reviewer, observer)
- Flexible user roles, multiple roles per user
- Custom QA checklists (STP) per stage
- Price catalog with complexity multipliers, automatic task cost calculation
- One-click printable payment document (A4 / PDF) with company requisites
- Freelancer portal: external contractors see only their tasks and wallet
- Multi-tenant with database-level row security (RLS)
- Workspace branding, audit log, analytics dashboard
- Optional Telegram bot notifications

**Tech stack:** Next.js 14, TypeScript, Supabase (PostgreSQL), Tailwind CSS.

**Installation (Windows):** unpack the distribution and run `install.bat`
(it sets up the environment and `.env`; only Node.js and a free Supabase
account required), then run `start.bat`. On Linux/macOS apply the SQL
migrations from the `migrations` folder and run `node server.js`.

**License:** proprietary. Licensing & demo inquiries: djonros@gmail.com

---
