

## Enum значения

- `UserRole`: `STUDENT`, `ORGANIZER`, `HR`, `ADMIN`
- `EventStatus`: `DRAFT`, `PUBLISHED`, `COMPLETED`, `CANCELLED`
- `EventType`: `OLYMPIAD`, `CONFERENCE`, `HACKATHON`, `COURSE`, `VOLUNTEERING`, `OTHER`
- `AchievementType`: `OLYMPIAD`, `CONFERENCE`, `HACKATHON`, `CHAMPIONSHIP`, `CONTEST`, `PUBLICATION`, `COURSE`, `VOLUNTEERING`, `GRANT`, `OTHER`
- `Level`: `NONE`, `INTERNATIONAL`, `NATIONAL`, `REGIONAL`, `UNIVERSITY`, `SCHOOL`
- `EventFormat`: `OFFLINE`, `ONLINE`, `HYBRID`
- `EventApplicationStatus`: `PENDING`, `APPROVED`, `REJECTED`, `WITHDRAWN`
- `VerificationStatus`: `PENDING`, `VERIFIED`, `REJECTED`
- `AchievementResult`: `WINNER`, `PRIZE`, `PARTICIPANT`, `PUBLISHED`, `OTHER`
- `HrFunnelStatus`: `NOT_TRACKED`, `UNDER_REVIEW`, `INTERESTED`, `INVITED`, `RESPONDED`, `REJECTED`
- `HrInvitationStatus`: `PENDING`, `ACCEPTED`, `REJECTED`

## 1. Auth

| Method | Endpoint | Auth | Request | Response | Назначение |
|---|---|---:|---|---|---|
| `POST` | `/api/auth/register` | Public | `RegisterRequest` JSON | `AuthResponse` | Регистрация пользователя и выдача JWT |
| `POST` | `/api/auth/login` | Public | `LoginRequest` JSON | `AuthResponse` | Вход по email/password |

`RegisterRequest`: `firstName`, `lastName`, `middleName`, `email`, `password`, `role`, `university`, `faculty`, `course`, `companyName`, `organizationName`, `shortName`.

`LoginRequest`: `email`, `password`.

## 2. Users

| Method | Endpoint | Auth | Request | Response | Назначение |
|---|---|---:|---|---|---|
| `GET` | `/api/users/me` | JWT | - | `MyProfileResponse` | Агрегированный профиль текущего пользователя |
| `PUT` | `/api/users/me/password` | JWT | `ChangePasswordRequest` JSON | `204/void` | Смена пароля |

`ChangePasswordRequest`: `currentPassword`, `newPassword`, `confirmPassword`.

## 3. Public

| Method | Endpoint | Auth | Query | Response | Назначение |
|---|---|---:|---|---|---|
| `GET` | `/api/public/bootstrap` | Public | - | `Map<String,Object>` | Bootstrap demo-state для frontend |
| `GET` | `/api/public/events` | Public | `query`, `type`, `level` | `EventView[]` | Публичный каталог мероприятий |
| `GET` | `/api/public/events/{eventId}` | Public | - | `EventView` | Публичная карточка мероприятия |
| `GET` | `/api/public/events/{eventId}/qr.png` | Public | `baseUrl` optional | `image/png` | QR-код публичной ссылки мероприятия |
| `GET` | `/api/public/organizers/{organizerId}` | Public | - | `PublicOrganizerView` | Публичный профиль организатора |
| `GET` | `/api/public/hr/{hrId}` | Public | - | `PublicHrView` | Публичный профиль HR |
| `GET` | `/api/public/students/{studentId}` | Public | - | `PublicStudentView` | Публичный профиль студента |

## 4. Student

Базовый путь: `/api/students/me`. Требуется роль `STUDENT`.

| Method | Endpoint | Request/Query | Response | Назначение |
|---|---|---|---|---|
| `GET` | `/api/students/me` | - | `StudentProfileView` | Собственный профиль студента |
| `PATCH` | `/api/students/me` | `StudentProfileUpdateRequest` JSON | `StudentProfileView` | Обновление профиля |
| `GET` | `/api/students/me/achievements` | `type`, `year`, `status`, `query` | `AchievementView[]` | Список достижений студента |
| `POST` | `/api/students/me/achievements` | `multipart/form-data`, `CreateAchievementRequest` | `AchievementView` | Создание достижения с файлами |
| `PATCH` | `/api/students/me/achievements/{achievementId}` | `UpdateAchievementRequest` JSON | `AchievementView` | Редактирование достижения |
| `DELETE` | `/api/students/me/achievements/{achievementId}` | - | `204/void` | Удаление достижения |
| `POST` | `/api/students/me/events/{eventId}/register` | `RegisterEventRequest` JSON optional | `EventApplicationView` | Регистрация на мероприятие |
| `DELETE` | `/api/students/me/events/{eventId}/register` | - | `EventApplicationView` | Отмена регистрации |
| `GET` | `/api/students/me/invitations` | - | `HrInvitationView[]` | HR-приглашения студента |
| `POST` | `/api/students/me/invitations/{invitationId}/respond` | `RespondHrInvitationRequest` JSON | `HrInvitationView` | Ответ на HR-приглашение |
| `GET` | `/api/students/me/subscribers` | - | `HrSubscriberView[]` | HR, подписанные на студента |

`StudentProfileUpdateRequest`: `firstName`, `lastName`, `middleName`, `phone`, `university`, `faculty`, `course`, `city`, `bio`, `avatarUrl`, `socialLinks`, `visibleAchievementIds`, `visibleBadgeIds`.

`CreateAchievementRequest` / `UpdateAchievementRequest`: `type`, `title`, `level`, `date`, `result`, `eventId`, `organizerName`, `description`; при создании также `files`.

`RegisterEventRequest`: `answers: Map<String,String>`. Используется для текстовых/select custom fields мероприятия.

`RespondHrInvitationRequest`: `response` (`ACCEPTED` или `REJECTED`).

## 5. Organizer

Базовый путь: `/api/organizers/me`. Требуется роль `ORGANIZER`.

| Method | Endpoint | Request/Query | Response | Назначение |
|---|---|---|---|---|
| `GET` | `/api/organizers/me` | - | `OrganizerProfileView` | Профиль организатора |
| `PATCH` | `/api/organizers/me` | `OrganizerProfileUpdateRequest` JSON | `OrganizerProfileView` | Обновление профиля |
| `GET` | `/api/organizers/me/events` | `status` | `EventView[]` | Мероприятия организатора |
| `POST` | `/api/organizers/me/events` | `CreateEventRequest` JSON | `EventView` | Создание мероприятия |
| `PATCH` | `/api/organizers/me/events/{eventId}` | `UpdateEventRequest` JSON | `EventView` | Обновление мероприятия |
| `DELETE` | `/api/organizers/me/events/{eventId}` | - | `204/void` | Удаление мероприятия |
| `GET` | `/api/organizers/me/events/{eventId}/applications` | - | `EventApplicationView[]` | Заявки на мероприятие |
| `POST` | `/api/organizers/me/events/{eventId}/applications/{applicationId}/approve` | `ApplicationDecisionRequest` JSON optional | `EventApplicationView` | Принять заявку |
| `POST` | `/api/organizers/me/events/{eventId}/applications/{applicationId}/reject` | `ApplicationDecisionRequest` JSON optional | `EventApplicationView` | Отклонить заявку |
| `GET` | `/api/organizers/me/events/{eventId}/participants` | - | `EventParticipantView[]` | Участники мероприятия |
| `GET` | `/api/organizers/me/events/{eventId}/results/template` | - | `text/csv` | Скачать CSV-шаблон результатов |
| `POST` | `/api/organizers/me/events/{eventId}/results/import-csv` | `multipart/form-data`, part `file` | `ImportReport` | Импорт результатов из CSV |
| `POST` | `/api/organizers/me/events/{eventId}/results/publish` | `PublishResultsRequest` JSON | `ImportReport` | Публикация результатов |
| `GET` | `/api/organizers/me/verification-requests` | `eventId`, `status` | `VerificationRequestView[]` | Запросы на верификацию достижений |
| `POST` | `/api/organizers/me/verification-requests/{achievementId}/verify` | `VerificationDecisionRequest` JSON optional | `AchievementView` | Подтвердить достижение |
| `POST` | `/api/organizers/me/verification-requests/{achievementId}/reject` | `VerificationDecisionRequest` JSON optional | `AchievementView` | Отклонить достижение |

`OrganizerProfileUpdateRequest`: `firstName`, `lastName`, `middleName`, `phone`, `organizationName`, `shortName`, `organizationType`, `website`, `description`, `contactEmail`, `contactPhone`, `logoUrl`, `foundedYear`, `socialLinks`.

`CreateEventRequest` / `UpdateEventRequest`: `title`, `type`, `level`, `startDate`, `endDate`, `registrationDeadline`, `format`, `location`, `description`, `website`, `contactEmail`, `logoUrl`, `bannerUrl`, `status`, `customFields`.

`EventCustomFieldRequest`: `id`, `label`, `type`, `required`, `options`.

`PublishResultsRequest`: `participants: ParticipantResultRequest[]`.

`ParticipantResultRequest`: `studentId`, `studentName`, `result`.

## 6. HR

Базовый путь: `/api/hr`. Требуется роль `HR`.

| Method | Endpoint | Request/Query | Response | Назначение |
|---|---|---|---|---|
| `GET` | `/api/hr/me` | - | `HrProfileView` | HR-профиль |
| `PATCH` | `/api/hr/me` | `HrProfileUpdateRequest` JSON | `HrProfileView` | Обновление HR-профиля |
| `GET` | `/api/hr/me/settings` | - | `HrSettingsView` | Настройки HR |
| `PATCH` | `/api/hr/me/settings` | `UpdateHrSettingsRequest` JSON | `HrSettingsView` | Обновление настроек HR |
| `GET` | `/api/hr/home` | - | `HrHomeView` | Главный экран HR |
| `GET` | `/api/hr/dashboard` | `days` | `HrDashboardSnapshotView` | Снимок HR-dashboard |
| `GET` | `/api/hr/archive` | `days` | `HrArchiveCandidateView[]` | Архив кандидатов |
| `GET` | `/api/hr/recent-actions` | `days`, `type` | `HrRecentActionView[]` | Последние HR-действия |
| `GET` | `/api/hr/candidates/search` | `query`, `university`, `course`, `level`, `type`, `minActivityIndex`, `status`, `archived`, `onlyInFunnel` | `CandidateCardView[]` | Поиск кандидатов |
| `GET` | `/api/hr/candidates/{studentId}` | - | `CandidateDetailsView` | Детальная карточка кандидата |
| `PATCH` | `/api/hr/candidates/{studentId}/status` | `UpdateCandidateStatusRequest` JSON | `CandidateStatusView` | Изменить статус кандидата |
| `PATCH` | `/api/hr/candidates/{studentId}/note` | `UpdateCandidateNoteRequest` JSON | `CandidateNoteView` | Обновить HR-заметку |
| `POST` | `/api/hr/candidates/{studentId}/subscription/toggle` | - | `HrSubscriptionToggleView` | Подписаться/отписаться от кандидата |
| `GET` | `/api/hr/candidates/{studentId}/subscribers` | - | `HrSubscriberView[]` | Список HR-подписчиков кандидата |
| `GET` | `/api/hr/candidates/{studentId}/invitations` | - | `HrInvitationView[]` | Приглашения кандидата |
| `POST` | `/api/hr/candidates/{studentId}/invitations` | `CreateHrInvitationRequest` JSON | `HrInvitationView` | Создать приглашение кандидату |
| `POST` | `/api/hr/candidates/{studentId}/archive` | `ArchiveCandidateRequest` JSON optional | `HrArchiveCandidateView` | Архивировать кандидата |
| `POST` | `/api/hr/candidates/{studentId}/restore` | `RestoreCandidateRequest` JSON optional | `CandidateStatusView` | Восстановить кандидата из архива |

`HrProfileUpdateRequest`: `firstName`, `lastName`, `middleName`, `phone`, `companyName`, `website`, `description`, `contactEmail`, `contactPhone`.

`UpdateHrSettingsRequest`: `defaultInviteComment`, `confirmRejectAction`, `confirmArchiveAction`.

`UpdateCandidateStatusRequest`: `status`, `note`.

`UpdateCandidateNoteRequest`: `note`.

`CreateHrInvitationRequest`: `position`, `message`, `sendNow`, `scheduledAt`.

`ArchiveCandidateRequest`: `reason`.

`RestoreCandidateRequest`: `targetStatus`, `note`.

## 7. Notifications

Базовый путь: `/api/notifications`. Требуется JWT.

| Method | Endpoint | Request | Response | Назначение |
|---|---|---|---|---|
| `GET` | `/api/notifications` | - | `NotificationView[]` | Уведомления текущего пользователя |
| `GET` | `/api/notifications/count` | - | `long` | Количество непрочитанных |
| `POST` | `/api/notifications/read` | - | `204/void` | Пометить все уведомления прочитанными |
| `POST` | `/api/notifications/{notificationId}/read` | - | `204/void` | Пометить одно уведомление прочитанным |

## 8. Files

Базовый путь: `/api/files`. Требуется JWT.

| Method | Endpoint | Request | Response | Назначение |
|---|---|---|---|---|
| `GET` | `/api/files/{fileId}` | - | `Resource`, original content type | Открыть файл достижения inline |

## Основные response DTO

- `AuthResponse`: `accessToken`, `tokenType`, `userId`, `role`, `firstName`, `lastName`.
- `EventView`: данные мероприятия, счетчики, `qrCodeUrl`, `customFields`, `createdAt`.
- `EventApplicationView`: данные заявки, статус, комментарий решения, `registrationAnswers`.
- `AchievementView`: данные достижения, статус верификации, файлы, дата создания.
- `HrDashboardSnapshotView`: `funnel`, `archiveCandidates`, `recentActions`, `metrics`.
- `CandidateDetailsView`: профиль студента, достижения, активность, HR-статус, заметки, подписки, приглашения, история.
- `NotificationView`: уведомление, ссылка, статус прочтения, тип, связанный кандидат.

