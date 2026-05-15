# API endpoints

Ниже собран список основных endpoint'ов backend-приложения.

## Общие правила

- Базовый URL локально: `http://localhost:8080`
- Защищённые endpoint'ы требуют заголовок:

```http
Authorization: Bearer <accessToken>
```

- Токен получается через `/api/auth/login` или `/api/auth/register`
- Полный контракт также доступен через Swagger UI: `/swagger-ui.html`

---

## 1. Auth

### POST `/api/auth/register`
Регистрация пользователя.

Пример body:

```json
{
  "firstName": "Anna",
  "lastName": "Ivanova",
  "middleName": null,
  "email": "anna@example.com",
  "password": "Password123!",
  "role": "STUDENT",
  "university": "ITMO",
  "faculty": "AI",
  "course": "4",
  "companyName": null,
  "organizationName": null,
  "shortName": null
}
```

Замечания:
- для `STUDENT` полезны `university`, `faculty`, `course`;
- для `HR` используется `companyName`;
- для `ORGANIZER` используются `organizationName`, `shortName`.

### POST `/api/auth/login`
Вход по email и паролю.

```json
{
  "email": "hr@talenthub.local",
  "password": "Password123!"
}
```

Ответ: `AuthResponse`
- `accessToken`
- `tokenType`
- `userId`
- `role`
- `firstName`
- `lastName`

---

## 2. Users

### GET `/api/users/me`
Возвращает агрегированный профиль текущего пользователя.

### PUT `/api/users/me/password`
Смена пароля.

```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

---

## 3. Notifications

### GET `/api/notifications`
Список уведомлений текущего пользователя.

### GET `/api/notifications/count`
Количество непрочитанных уведомлений.

### POST `/api/notifications/read`
Пометить все уведомления как прочитанные.

### POST `/api/notifications/{notificationId}/read`
Пометить одно уведомление как прочитанное.

Типы уведомлений, используемые в проекте:
- `system`
- `achievement`
- `message`
- `event`

---

## 4. Student (`/api/students/me`)

Доступно только пользователю с ролью `STUDENT`.

### GET `/api/students/me`
Собственный профиль студента.

### PATCH `/api/students/me`
Обновление профиля студента.

```json
{
  "firstName": "Anna",
  "lastName": "Ivanova",
  "middleName": null,
  "phone": "+7 999 000 00 00",
  "university": "ITMO",
  "faculty": "AI",
  "course": "4",
  "city": "Saint Petersburg",
  "bio": "NLP and CV student",
  "avatarUrl": "https://...",
  "socialLinks": {
    "github": "https://github.com/anna"
  },
  "visibleAchievementIds": [],
  "visibleBadgeIds": ["first-olympiad"]
}
```

Ограничения:
- максимум 10 `visibleAchievementIds`;
- максимум 3 `visibleBadgeIds`.

### GET `/api/students/me/achievements`
Список достижений студента.

Query params:
- `type`
- `year`
- `status`
- `query`

### POST `/api/students/me/achievements`
Создание достижения.

`Content-Type: multipart/form-data`

Поля формы:
- `type`
- `title`
- `level`
- `date`
- `result`
- `eventId` или `organizerName`
- `description`
- `files[]`

### PATCH `/api/students/me/achievements/{achievementId}`
Редактирование ручного достижения.

```json
{
  "type": "HACKATHON",
  "title": "Global Vision Hackathon",
  "level": "INTERNATIONAL",
  "date": "2026-03-20",
  "result": "PRIZE",
  "organizerName": "Open Science League",
  "description": "Updated description"
}
```

### DELETE `/api/students/me/achievements/{achievementId}`
Удаление ручного достижения.

### POST `/api/students/me/events/{eventId}/register`
Регистрация на опубликованное мероприятие.

### DELETE `/api/students/me/events/{eventId}/register`
Отмена регистрации на мероприятие.

### GET `/api/students/me/invitations`
Список HR‑приглашений текущего студента.

### POST `/api/students/me/invitations/{invitationId}/respond`
Ответ на HR‑приглашение.

```json
{
  "response": "accepted"
}
```

Допустимые значения:
- `accepted`
- `rejected`

### GET `/api/students/me/subscribers`
Список HR, подписанных на студента.

---

## 5. Organizer (`/api/organizers/me`)

Доступно только пользователю с ролью `ORGANIZER`.

### GET `/api/organizers/me`
Профиль организатора.

### PATCH `/api/organizers/me`
Обновление профиля организатора.

```json
{
  "firstName": "Elena",
  "lastName": "Organizer",
  "phone": "+7 900 100 20 30",
  "organizationName": "Open Science League",
  "shortName": "OSL",
  "organizationType": "scientific",
  "website": "https://osl.example",
  "description": "Events and educational programs",
  "contactEmail": "organizer@talenthub.local",
  "contactPhone": "+7 900 100 20 30",
  "logoUrl": "https://placehold.co/120x120?text=OSL",
  "foundedYear": 2020,
  "socialLinks": {
    "telegram": "https://t.me/osl"
  }
}
```

### GET `/api/organizers/me/events`
Список мероприятий организатора.

Query params:
- `status`

### POST `/api/organizers/me/events`
Создание мероприятия.

```json
{
  "title": "Data Science Spring School",
  "type": "CONFERENCE",
  "level": "REGIONAL",
  "startDate": "2026-04-15",
  "endDate": "2026-04-16",
  "registrationDeadline": "2026-04-12",
  "format": "ONLINE",
  "location": "Online",
  "description": "Open school with talks and workshops",
  "website": "https://osl.example/school",
  "contactEmail": "organizer@talenthub.local",
  "logoUrl": "https://placehold.co/300x180?text=School",
  "bannerUrl": "https://placehold.co/1200x400?text=School",
  "status": "PUBLISHED",
  "customFields": [
    {
      "id": "track",
      "label": "Preferred track",
      "type": "select",
      "required": true,
      "options": ["Backend", "Data", "Product"]
    }
  ]
}
```

### PATCH `/api/organizers/me/events/{eventId}`
Частичное обновление мероприятия.

### DELETE `/api/organizers/me/events/{eventId}`
Удаление мероприятия.

### GET `/api/organizers/me/events/{eventId}/participants`
Список участников мероприятия.

### GET `/api/organizers/me/events/{eventId}/results/template`
Скачать CSV-шаблон для результатов.

### POST `/api/organizers/me/events/{eventId}/results/import-csv`
Импорт результатов из CSV.

`Content-Type: multipart/form-data`

Файл передаётся в поле `file`.

Ожидаемый формат CSV:

```text
fullName;email;university;result;achievementType;title;level;date
```

### POST `/api/organizers/me/events/{eventId}/results/publish`
Ручная публикация результатов без CSV.

```json
{
  "participants": [
    {
      "studentId": "00000000-0000-0000-0000-000000000000",
      "studentName": "Anna Ivanova",
      "result": "Winner"
    }
  ]
}
```

Ответ: `ImportReport` (`imported`, `updatedExisting`, `skipped`, `messages`).

### GET `/api/organizers/me/verification-requests`
Список запросов на верификацию достижений.

Query params:
- `eventId`
- `status`

### POST `/api/organizers/me/verification-requests/{achievementId}/verify`
Подтвердить достижение.

```json
{
  "comment": "Looks good"
}
```

### POST `/api/organizers/me/verification-requests/{achievementId}/reject`
Отклонить достижение.

```json
{
  "comment": "Document does not match the result"
}
```

---

## 6. HR (`/api/hr`)

Доступно только пользователю с ролью `HR`.

### GET `/api/hr/me`
Профиль HR.

### PATCH `/api/hr/me`
Обновление профиля HR.

```json
{
  "firstName": "Maria",
  "lastName": "Recruiter",
  "phone": "+7 900 111 22 33",
  "companyName": "Tech Future",
  "website": "https://techfuture.example",
  "description": "Junior hiring and internship programs",
  "contactEmail": "hr@talenthub.local",
  "contactPhone": "+7 900 111 22 33"
}
```

### GET `/api/hr/me/settings`
Получить HR-настройки.

### PATCH `/api/hr/me/settings`
Обновить HR-настройки.

```json
{
  "defaultInviteComment": "We would like to invite you...",
  "confirmRejectAction": true,
  "confirmArchiveAction": true
}
```

### GET `/api/hr/home`
Главная сводка:
- топ по достижениям;
- топ по подписчикам;
- количество непрочитанных уведомлений.

### GET `/api/hr/dashboard`
Полный dashboard по HR‑воронке.

Query params:
- `days` — окно аналитики, по умолчанию 30.

### GET `/api/hr/archive`
Архив кандидатов.

Query params:
- `days`

### GET `/api/hr/recent-actions`
Последние HR‑действия.

Query params:
- `days`
- `type`

Примеры `type`:
- `status`
- `note`
- `invite`
- `archive`
- `restore`
- `achievement`

### GET `/api/hr/candidates/search`
Поиск кандидатов.

Query params:
- `query`
- `university`
- `course`
- `level`
- `type`
- `minActivityIndex`
- `status`
- `archived`
- `onlyInFunnel`

`status` принимает как enum-значения, так и русские labels:
- `NOT_TRACKED` / `Не отслеживается`
- `UNDER_REVIEW` / `На рассмотрении`
- `INTERESTED` / `Интересует`
- `INVITED` / `Приглашён`
- `RESPONDED` / `Ответили на приглашение`
- `REJECTED` / `Отклонён`

### GET `/api/hr/candidates/{studentId}`
Детальная карточка кандидата.

Внутри ответа:
- профиль студента;
- все достижения;
- видимые достижения;
- разбивки по типам и уровням;
- activity index;
- текущий статус;
- архивность;
- заметка;
- видимые и unlocked значки;
- история статусов;
- приглашения;
- подписчики;
- recent actions по кандидату.

### PATCH `/api/hr/candidates/{studentId}/status`
Изменить статус кандидата.

```json
{
  "status": "Интересует",
  "note": "Strong backend profile"
}
```

### PATCH `/api/hr/candidates/{studentId}/note`
Обновить заметку.

```json
{
  "note": "Need to check github and pending results"
}
```

### POST `/api/hr/candidates/{studentId}/subscription/toggle`
Подписка / отписка на кандидата.

### GET `/api/hr/candidates/{studentId}/subscribers`
Список HR‑подписчиков кандидата.

### GET `/api/hr/candidates/{studentId}/invitations`
Список приглашений кандидата.

### POST `/api/hr/candidates/{studentId}/invitations`
Создать HR‑приглашение.

```json
{
  "position": "Java Backend Intern",
  "message": "Would you like to discuss a backend internship?",
  "sendNow": true,
  "scheduledAt": null
}
```

Если `sendNow = false`, нужно передать `scheduledAt`.

### POST `/api/hr/candidates/{studentId}/archive`
Архивировать кандидата.

```json
{
  "reason": "Archived after manual screening"
}
```

### POST `/api/hr/candidates/{studentId}/restore`
Восстановить кандидата из архива.

```json
{
  "targetStatus": "UNDER_REVIEW",
  "note": "Return candidate to active review"
}
```

---

## 7. Public (`/api/public`)

### GET `/api/public/events`
Публичный каталог мероприятий.

Query params:
- `query`
- `type`
- `level`

### GET `/api/public/events/{eventId}`
Публичная карточка мероприятия.

### GET `/api/public/organizers/{organizerId}`
Публичный профиль организатора + список опубликованных/завершённых мероприятий.

### GET `/api/public/hr/{hrId}`
Публичный профиль HR.

### GET `/api/public/students/{studentId}`
Публичный профиль студента.

Возвращает только видимые достижения и видимые значки.

---

## 8. Files

### GET `/api/files/{fileId}`
Выдача файла достижения.

Endpoint защищён JWT, возвращает бинарный ресурс.

---

## 9. Основные enum'ы

### UserRole
- `STUDENT`
- `ORGANIZER`
- `HR`
- `ADMIN`

### AchievementType
- `OLYMPIAD`
- `CONFERENCE`
- `HACKATHON`
- `CHAMPIONSHIP`
- `CONTEST`
- `PUBLICATION`
- `COURSE`
- `VOLUNTEERING`
- `GRANT`
- `OTHER`

### AchievementResult
- `WINNER`
- `PRIZE`
- `PARTICIPANT`
- `PUBLISHED`
- `OTHER`

### Level
- `INTERNATIONAL`
- `NATIONAL`
- `REGIONAL`
- `UNIVERSITY`
- `SCHOOL`

### EventType
- `OLYMPIAD`
- `CONFERENCE`
- `HACKATHON`
- `COURSE`
- `VOLUNTEERING`
- `OTHER`

### EventStatus
- `DRAFT`
- `PUBLISHED`
- `COMPLETED`
- `CANCELLED`

### EventFormat
- `OFFLINE`
- `ONLINE`
- `HYBRID`

### VerificationStatus
- `PENDING`
- `VERIFIED`
- `REJECTED`

---

## Дополнение для серверного запуска frontend

### `GET /api/public/bootstrap`

Публичный endpoint для первичной синхронизации текущего backend demo-state с уже существующим frontend, который исторически использовал `localStorage`.

Ответ содержит:

- `accounts` — пользователи в формате frontend `AuthUser` + demo password;
- `achievements` — достижения в формате frontend store;
- `eventsState` — мероприятия и заявки в формате frontend events store;
- `notifications` — уведомления frontend store;
- `hr` — состояния HR-воронки: статусы, история, заметки, архив, подписки, приглашения, recent actions, настройки.

Frontend вызывает этот endpoint при первом открытии приложения, сохраняет данные в `localStorage`, после чего существующие экраны HR/student/organizer получают актуальные demo-данные из backend.

Важно: это MVP-адаптер для быстрого запуска текущего frontend на сервере. Следующий production-этап — заменить localStorage-хранилища frontend на прямые API-запросы к backend по каждому действию.
