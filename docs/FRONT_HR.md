# HR Feed: лента новостей и рекомендации

## 1. Лента новостей

### Что показывает

Новые подтверждённые достижения студентов, на которых HR уже подписан.

Источник данных:

- подписки HR;
- VERIFIED-достижения подписанных студентов;
- данные студента;
- данные достижения;
- динамика активности студента за 30 дней.

### Endpoint

```http
GET /api/hr/feed/news?limit=20&pageToken=TOKEN
```

### Query params

| Параметр | Обязательный | Описание |
|---|---:|---|
| `limit` | нет | Количество карточек. По умолчанию `20`. Максимум `100`. |
| `pageToken` | нет | Токен следующей страницы из `nextPage`. На первом запросе не передавать. |

### Пример ответа

```json
{
  "items": [
    {
      "newsId": "achievement:uuid",
      "student": {
        "id": "uuid",
        "fullName": "Иван Иванов",
        "firstName": "Иван",
        "lastName": "Иванов",
        "middleName": "Иванович",
        "email": "student@example.com",
        "university": "МГУ",
        "faculty": "ВМК",
        "course": "3",
        "city": "Москва",
        "avatarUrl": null
      },
      "achievement": {
        "id": "uuid",
        "title": "Победитель хакатона",
        "level": "NATIONAL",
        "levelLabel": "Всероссийский",
        "result": "WINNER",
        "resultLabel": "Победитель",
        "date": "2026-05-15",
        "organizerName": "Минцифры РФ",
        "eventId": "uuid",
        "eventTitle": "Название мероприятия",
        "verificationStatus": "VERIFIED"
      },
      "activityDynamics": {
        "percent": 45,
        "label": "📈 Активность +45% за месяц",
        "color": "green",
        "currentPeriodCount": 6,
        "previousPeriodCount": 4
      },
      "actions": {
        "canAddNote": true,
        "canAddToFunnel": true,
        "canInvite": true
      },
      "createdAt": "2026-05-15T12:00:00Z"
    }
  ],
  "prevPage": null,
  "nextPage": "b2Zmc2V0OjIw",
  "totalCount": 23,
  "emptyMessage": null
}
```

### Empty state

```json
{
  "items": [],
  "prevPage": null,
  "nextPage": null,
  "totalCount": 0,
  "emptyMessage": "Нет новых достижений у отслеживаемых студентов. Загляните позже"
}
```

---

## 2. Лента рекомендаций

### Что показывает

Студентов, на которых HR ещё не подписан, отсортированных по ценности.

Источник данных:

- студенты;
- достижения студентов;
- количество HR-подписок на студента;
- динамика активности за 30 дней;
- топ-1 достижение;
- viewed-рекомендации;
- фильтр по участникам мероприятий.

### Endpoint

```http
GET /api/hr/feed/recommendations?filter=all&limit=20&pageToken=TOKEN
```

### Query params

| Параметр | Обязательный | Описание |
|---|---:|---|
| `filter` | нет | `all` или `my-events`. По умолчанию `all`. |
| `limit` | нет | Количество карточек. По умолчанию `20`. Максимум `100`. |
| `pageToken` | нет | Токен следующей страницы из `nextPage`. На первом запросе не передавать. |

### Фильтры

```text
filter=all        — все рекомендации
filter=my-events  — только участники мероприятий компании/организации HR
```

### Пример ответа

```json
{
  "items": [
    {
      "recommendationId": "candidate:uuid",
      "student": {
        "id": "uuid",
        "fullName": "Анна Иванова",
        "firstName": "Анна",
        "lastName": "Иванова",
        "middleName": null,
        "email": "student@example.com",
        "university": "ИТМО",
        "faculty": "AI",
        "course": "4",
        "city": "Санкт-Петербург",
        "avatarUrl": null
      },
      "topAchievement": {
        "id": "uuid",
        "title": "National AI Olympiad",
        "level": "NATIONAL",
        "levelLabel": "Всероссийский",
        "result": "WINNER",
        "resultLabel": "Победитель",
        "date": "2026-03-20",
        "organizerName": "ИТМО",
        "eventId": null,
        "eventTitle": null,
        "verificationStatus": "VERIFIED"
      },
      "subscriptionsCount": 8,
      "activityDynamics": {
        "percent": 60,
        "label": "🔥 Активность +60% за месяц",
        "color": "green",
        "currentPeriodCount": 6,
        "previousPeriodCount": 3
      },
      "value": 84,
      "valueDetails": {
        "popularityCoefficient": 0.8,
        "dynamicsCoefficient": 0.9,
        "topAchievementCoefficient": 0.8,
        "formula": "(0.35 * 0.8) + (0.35 * 0.9) + (0.30 * 0.8)"
      },
      "currentHrStatus": "Интересует",
      "isSubscribed": false,
      "isInFunnel": true,
      "actions": {
        "canSubscribe": true,
        "canAddToFunnel": true,
        "canInvite": true
      }
    }
  ],
  "prevPage": null,
  "nextPage": "b2Zmc2V0OjIw",
  "totalCount": 50,
  "emptyMessage": null
}
```

### Empty state

```json
{
  "items": [],
  "prevPage": null,
  "nextPage": null,
  "totalCount": 0,
  "emptyMessage": "Нет новых рекомендаций. Проверьте позже или измените фильтр"
}
```

---

## 3. Пагинация

Формат одинаковый для обеих лент:

```json
{
  "items": [],
  "prevPage": null,
  "nextPage": "TOKEN",
  "totalCount": 50,
  "emptyMessage": null
}
```



### Новости

```http
POST /api/hr/feed/news/viewed
```

Body:

```json
{
  "ids": ["achievement:uuid-1", "achievement:uuid-2"]
}
```

### Рекомендации

```http
POST /api/hr/feed/recommendations/viewed
```

Body:

```json
{
  "candidateIds": ["uuid-1", "uuid-2"]
}
```
