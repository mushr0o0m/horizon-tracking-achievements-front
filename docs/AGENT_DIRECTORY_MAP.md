# AGENT DIRECTORY MAP

Краткая карта проекта для быстрого ориентирования агентом.

## Точка входа

- `app/page.tsx` — основной оркестратор экранов и роутинга по ролям (`student`, `organizer`, `hr`).

## Компоненты по разделам

- `components/student` — экраны и UI-логика студента:
  - главная, достижения, дашборды, мероприятия, приглашения, профиль, модалки достижений.

- `components/organizer` — экраны и формы организатора:
  - мероприятия, форма мероприятия, загрузка результатов, запросы верификации, профиль.

- `components/hr` — экраны HR:
  - главная HR, поиск кандидатов, дашборды, профиль кандидата, публичный профиль HR.

- `components/hr/dashboards` — внутренние части HR-дашбордов:
  - канбан/сводка/быстрый поиск/архив/последние действия, типы, константы, utils.

- `components/shared` — общие для ролей компоненты:
  - `sidebar`, `topbar`, `register-form`, `event-details-page`,
  - `subscribers-page`, `subscribers-preview-card`, `theme-provider`.

- `components/events` — переиспользуемые куски событий:
  - `custom-fields-editor`, `event-status-badge`.

- `components/ui` — базовые UI-примитивы (shadcn-style).

## Бизнес-логика и данные

- `lib/backend-api.ts` — вся интеграция с backend API (auth, student, organizer, hr).
- `lib/types.ts` — основные доменные типы приложения.
- `lib/*` — вспомогательная бизнес-логика (бейджи, метрики, и т.д.).

- `hooks/*` — UI/data hooks:
  - HR: `use-hr-dashboard-data`, `use-hr-quick-search`, `use-hr-recent-actions-filter`.
  - Organizer: `use-organizer-events`.

- `stores/*` — контекстные сторы фронта:
  - `achievements-store.tsx`
  - `events-store.tsx`
  - `notifications-store.tsx`

## Документация

- `docs/ENDPOINTS.md` — актуальные API endpoint'ы.
- `docs/FRONTEND_CHANGES.md` — журнал ключевых фронтенд-изменений.
- `docs/JIRA_TASKS_CURRENT_BRANCH.md` — задачи ветки.

## Быстрый маршрут по ролям

- Student flow: `app/page.tsx` -> `components/student/*` + `lib/backend-api.ts`.
- Organizer flow: `app/page.tsx` -> `components/organizer/*` + `lib/backend-api.ts`.
- HR flow: `app/page.tsx` -> `components/hr/*` и `components/hr/dashboards/*` + `lib/backend-api.ts`.
