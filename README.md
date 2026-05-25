# Horizon Tracking Achievements Front

Frontend-приложение для учета достижений студентов и работы организаторов мероприятий.

Проект реализован на Next.js (App Router) и демонстрирует два режима работы:
- `student`: просмотр достижений, дашбордов и карточек активности
- `organizer`: управление мероприятиями, публикация результатов, редактирование событий

Все данные в текущей версии хранятся в памяти приложения (mock/in-memory), без подключения к backend.

## Функциональность

### Роль студента
- Главная страница с обзором активности
- Дашборды с агрегированной статистикой
- Страница достижений
- Кнопка симуляции публикации новых результатов

### Роль организатора
- Просмотр списка мероприятий
- Создание мероприятия
- Редактирование мероприятия
- Удаление мероприятия
- Загрузка/публикация результатов участников

## Технологии

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI + shadcn/ui компоненты
- React Hook Form + Zod
- Recharts
- Lucide React

## Быстрый старт

### Требования
- Node.js 20+
- pnpm 9+ (рекомендуется)

### Установка

```bash
pnpm install
```

### Запуск в режиме разработки

```bash
pnpm dev
```

Откройте `http://localhost:3001`.

## Скрипты

```bash
pnpm dev      # локальная разработка
pnpm build    # production-сборка
pnpm start    # запуск production-сборки
pnpm lint     # проверка линтером
```

## Структура проекта

```text
app/                 # App Router: layout и основная страница
components/          # бизнес-компоненты и UI
components/ui/       # переиспользуемые базовые UI-компоненты
hooks/               # пользовательские хуки
lib/                 # типы, утилиты и mock-данные
public/              # статические ресурсы
styles/              # глобальные стили
```

## Данные и состояние

- Начальные данные находятся в `lib/data.ts`
- Типы доменной модели находятся в `lib/types.ts`
- Глобальное состояние (в рамках страницы) хранится в `app/page.tsx` через `useState`
- Источник достижений:
	- `organizer`: опубликовано организатором
	- `simulated`: добавлено через кнопку симуляции

## Планы на развитие

- Подключение backend и постоянного хранилища
- Авторизация и разграничение доступа по ролям
- Фильтры, поиск и пагинация списков
- Тесты (unit/integration/e2e)

## Лицензия

Лицензия не указана.
---

## Docker/server notes

This frontend now includes:

- `Dockerfile` for server build;
- backend API helper `lib/backend-api.ts`;
- initial backend bootstrap from `GET /api/public/bootstrap`;
- auth integration with backend `/api/auth/login`, `/api/auth/register`, `/api/users/me` with local fallback.

For the no-domain Yandex Cloud setup the recommended value is:

```env
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_BACKEND_BOOTSTRAP=true
```

The `/api` path is proxied by Nginx to the backend container, so the server IP does not need to be compiled into the frontend image.

Important MVP note: most existing screens still keep their local frontend stores for UI speed and compatibility. The first backend bootstrap fills those stores from backend demo data. The next hardening step is to replace all local mutations with direct backend API calls.
