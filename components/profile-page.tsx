"use client";

import { useEffect, useState } from "react";
import { AuthUser, CourseOption, NotificationSettings, PublicProfile } from "@/lib/types";
import { Bell, Mail, Phone, KeyRound, ShieldAlert, Trash2, UserCircle2, Link2, Eye, X } from "lucide-react";

interface ProfilePageProps {
  user: AuthUser;
  publicStats: {
    achievementsCount: number;
    activityIndex: number;
    percentile: number;
  };
  onUpdateEmail: (newEmail: string, currentPassword: string) => string | null;
  onUpdatePhone: (phone: string) => string | null;
  onChangePassword: (currentPassword: string, newPassword: string) => string | null;
  onUpdateNotifications: (settings: NotificationSettings) => void;
  onUpdatePublicProfile: (profile: PublicProfile) => void;
  onDeleteAccount: (confirmationText: string) => string | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{10,15}$/;
const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  invitations: true,
  verification: true,
  recommendations: true,
};

const COURSE_OPTIONS: Array<{ value: CourseOption; label: string }> = [
  { value: "1", label: "1 курс" },
  { value: "2", label: "2 курс" },
  { value: "3", label: "3 курс" },
  { value: "4", label: "4 курс" },
  { value: "5", label: "5 курс" },
  { value: "6", label: "6 курс" },
  { value: "graduate", label: "Выпускник" },
  { value: "magister", label: "Магистр" },
  { value: "postgraduate", label: "Аспирант" },
];

type ProfileTab = "personal" | "public";

function buildFallbackPublicProfile(fullName: string): PublicProfile {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    avatarUrl: undefined,
    firstName: parts[1] ?? parts[0] ?? "",
    lastName: parts[0] ?? "",
    middleName: parts[2] ?? "",
    university: "",
    faculty: "",
    course: "1",
    city: "",
    bio: "",
    socialLinks: {
      telegram: "",
      github: "",
      linkedin: "",
      website: "",
      customLinks: [],
    },
    profileViews30d: 0,
  };
}

export function ProfilePage({
  user,
  publicStats,
  onUpdateEmail,
  onUpdatePhone,
  onChangePassword,
  onUpdateNotifications,
  onUpdatePublicProfile,
  onDeleteAccount,
}: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const safeNotifications = user.notifications ?? DEFAULT_NOTIFICATIONS;
  const safePublicProfile = user.publicProfile ?? buildFallbackPublicProfile(user.name);
  const [publicProfile, setPublicProfile] = useState<PublicProfile>(safePublicProfile);
  const [nextEmail, setNextEmail] = useState(user.email);
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [notifications, setNotifications] =
    useState<NotificationSettings>(safeNotifications);

  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [phoneMessage, setPhoneMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(
    null,
  );
  const [publicMessage, setPublicMessage] = useState<string | null>(null);

  useEffect(() => {
    setNextEmail(user.email);
    setPhone(user.phone ?? "");
    setNotifications(user.notifications ?? DEFAULT_NOTIFICATIONS);
    setPublicProfile(user.publicProfile ?? buildFallbackPublicProfile(user.name));
  }, [user]);

  const initials = `${publicProfile.lastName[0] ?? ""}${publicProfile.firstName[0] ?? ""}`.toUpperCase() || user.name.slice(0, 2).toUpperCase();

  const handleEmailSave = () => {
    const normalized = nextEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalized)) {
      setEmailMessage("Введите корректный email.");
      return;
    }

    const result = onUpdateEmail(normalized, currentPasswordForEmail);
    setEmailMessage(result ?? "Email успешно обновлен.");
    if (!result) {
      setCurrentPasswordForEmail("");
    }
  };

  const handlePhoneSave = () => {
    const normalized = phone.trim();
    if (normalized && !PHONE_REGEX.test(normalized)) {
      setPhoneMessage("Введите корректный телефон в формате +79991234567.");
      return;
    }

    const result = onUpdatePhone(normalized);
    setPhoneMessage(result ?? "Телефон успешно обновлен.");
  };

  const handlePasswordSave = () => {
    if (newPassword.length < 8) {
      setPasswordMessage("Новый пароль должен содержать минимум 8 символов.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Подтверждение пароля не совпадает.");
      return;
    }

    const result = onChangePassword(currentPassword, newPassword);
    setPasswordMessage(result ?? "Пароль успешно обновлен.");
    if (!result) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleNotificationsSave = () => {
    onUpdateNotifications(notifications);
    setNotificationMessage("Настройки уведомлений сохранены.");
  };

  const handleDelete = () => {
    const result = onDeleteAccount(deleteConfirmText.trim());
    setDeleteMessage(result ?? "Аккаунт удален.");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setPublicMessage("Поддерживаются только JPG и PNG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPublicMessage("Размер файла не должен превышать 5 МБ.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setPublicProfile((prev) => ({ ...prev, avatarUrl: result }));
      setPublicMessage("Аватар загружен. Нажмите Сохранить визитку.");
    };
    reader.readAsDataURL(file);
  };

  const handleSavePublicProfile = () => {
    if (!publicProfile.firstName.trim() || !publicProfile.lastName.trim()) {
      setPublicMessage("Имя и фамилия обязательны.");
      return;
    }
    if (!publicProfile.university.trim()) {
      setPublicMessage("Укажите вуз.");
      return;
    }
    if (!publicProfile.faculty.trim()) {
      setPublicMessage("Укажите факультет или направление.");
      return;
    }
    if (publicProfile.bio.length > 1000) {
      setPublicMessage("Поле О себе не должно превышать 1000 символов.");
      return;
    }
    if (publicProfile.socialLinks.customLinks.length > 5) {
      setPublicMessage("Можно добавить не более 5 дополнительных ссылок.");
      return;
    }

    onUpdatePublicProfile(publicProfile);
    setPublicMessage("Публичная визитка сохранена.");
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Личный кабинет</h2>
            <p className="text-muted-foreground mt-1">
              Управляйте личными данными и публичной визиткой.
            </p>
          </div>
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-secondary transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            Просмотреть профиль
          </button>
        </div>
      </section>

      <div className="inline-flex rounded-lg bg-secondary p-1 gap-1 w-fit">
        <button
          onClick={() => setActiveTab("personal")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "personal"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Личная информация
        </button>
        <button
          onClick={() => setActiveTab("public")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "public"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Публичная визитка
        </button>
      </div>

      {activeTab === "personal" && (
        <>
          <section className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Mail className="w-4 h-4" />
              Email
            </div>
            <p className="text-sm text-muted-foreground">Текущий email: {user.email}</p>
            <p className="text-xs text-muted-foreground">
              В демо-версии подтверждение смены email выполняется через текущий пароль.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={nextEmail}
                onChange={(e) => setNextEmail(e.target.value)}
                type="email"
                placeholder="Новый email"
                className="px-3 py-2.5 border border-border rounded-lg bg-background"
              />
              <input
                value={currentPasswordForEmail}
                onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                type="password"
                placeholder="Текущий пароль"
                className="px-3 py-2.5 border border-border rounded-lg bg-background"
              />
            </div>
            <button
              onClick={handleEmailSave}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Обновить email
            </button>
            {emailMessage && <p className="text-sm text-muted-foreground">{emailMessage}</p>}
          </section>

          <section className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Phone className="w-4 h-4" />
              Телефон
            </div>
            <p className="text-sm text-muted-foreground">
              Текущий номер: {user.phone ? user.phone : "не указан"}
            </p>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              placeholder="+79991234567"
              className="w-full max-w-sm px-3 py-2.5 border border-border rounded-lg bg-background"
            />
            <button
              onClick={handlePhoneSave}
              className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm font-medium"
            >
              Сохранить телефон
            </button>
            {phoneMessage && <p className="text-sm text-muted-foreground">{phoneMessage}</p>}
          </section>

          <section className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <KeyRound className="w-4 h-4" />
              Смена пароля
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                type="password"
                placeholder="Текущий пароль"
                className="px-3 py-2.5 border border-border rounded-lg bg-background"
              />
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                placeholder="Новый пароль"
                className="px-3 py-2.5 border border-border rounded-lg bg-background"
              />
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                placeholder="Подтверждение пароля"
                className="px-3 py-2.5 border border-border rounded-lg bg-background"
              />
            </div>
            <button
              onClick={handlePasswordSave}
              className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm font-medium"
            >
              Сменить пароль
            </button>
            {passwordMessage && (
              <p className="text-sm text-muted-foreground">{passwordMessage}</p>
            )}
          </section>

          <section className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Bell className="w-4 h-4" />
              Уведомления
            </div>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notifications.invitations}
                  onChange={(e) =>
                    setNotifications((prev) => ({
                      ...prev,
                      invitations: e.target.checked,
                    }))
                  }
                />
                Новые приглашения от HR
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notifications.verification}
                  onChange={(e) =>
                    setNotifications((prev) => ({
                      ...prev,
                      verification: e.target.checked,
                    }))
                  }
                />
                Изменение статуса верификации достижений
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notifications.recommendations}
                  onChange={(e) =>
                    setNotifications((prev) => ({
                      ...prev,
                      recommendations: e.target.checked,
                    }))
                  }
                />
                Рекомендации по мероприятиям
              </label>
            </div>
            <button
              onClick={handleNotificationsSave}
              className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm font-medium"
            >
              Сохранить настройки уведомлений
            </button>
            {notificationMessage && (
              <p className="text-sm text-muted-foreground">{notificationMessage}</p>
            )}
          </section>

          <section className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-red-700 font-semibold">
              <ShieldAlert className="w-4 h-4" />
              Опасная зона
            </div>
            <p className="text-sm text-red-700">
              Для удаления аккаунта введите слово УДАЛИТЬ и нажмите кнопку ниже.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="УДАЛИТЬ"
                className="px-3 py-2.5 border border-red-300 rounded-lg bg-white"
              />
              <button
                onClick={handleDelete}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Удалить аккаунт
              </button>
            </div>
            {deleteMessage && <p className="text-sm text-red-700">{deleteMessage}</p>}
          </section>
        </>
      )}

      {activeTab === "public" && (
        <section className="bg-card border border-border rounded-xl p-5 space-y-5">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <UserCircle2 className="w-4 h-4" />
            Публичная визитка
          </div>

          <div className="flex items-center gap-4">
            {publicProfile.avatarUrl ? (
              <img
                src={publicProfile.avatarUrl}
                alt="Аватар"
                className="w-20 h-20 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold border border-border">
                {initials}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="px-3 py-2 border border-border rounded-lg text-sm cursor-pointer hover:bg-secondary">
                Загрузить аватар
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
              <button
                onClick={() => setPublicProfile((prev) => ({ ...prev, avatarUrl: undefined }))}
                className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-secondary"
              >
                Удалить аватар
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={publicProfile.lastName}
              onChange={(e) => setPublicProfile((prev) => ({ ...prev, lastName: e.target.value }))}
              placeholder="Фамилия"
              className="px-3 py-2.5 border border-border rounded-lg bg-background"
            />
            <input
              value={publicProfile.firstName}
              onChange={(e) => setPublicProfile((prev) => ({ ...prev, firstName: e.target.value }))}
              placeholder="Имя"
              className="px-3 py-2.5 border border-border rounded-lg bg-background"
            />
            <input
              value={publicProfile.middleName ?? ""}
              onChange={(e) => setPublicProfile((prev) => ({ ...prev, middleName: e.target.value }))}
              placeholder="Отчество (опционально)"
              className="px-3 py-2.5 border border-border rounded-lg bg-background"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={publicProfile.university}
              onChange={(e) => setPublicProfile((prev) => ({ ...prev, university: e.target.value }))}
              placeholder="Вуз"
              className="px-3 py-2.5 border border-border rounded-lg bg-background"
            />
            <input
              value={publicProfile.faculty}
              onChange={(e) => setPublicProfile((prev) => ({ ...prev, faculty: e.target.value }))}
              placeholder="Факультет / направление"
              className="px-3 py-2.5 border border-border rounded-lg bg-background"
            />
            <select
              value={publicProfile.course}
              onChange={(e) => setPublicProfile((prev) => ({ ...prev, course: e.target.value as CourseOption }))}
              className="px-3 py-2.5 border border-border rounded-lg bg-background"
            >
              {COURSE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              value={publicProfile.city}
              onChange={(e) => setPublicProfile((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="Город"
              className="px-3 py-2.5 border border-border rounded-lg bg-background"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">О себе (до 1000 символов, markdown поддерживается)</label>
            <textarea
              value={publicProfile.bio}
              onChange={(e) => setPublicProfile((prev) => ({ ...prev, bio: e.target.value.slice(0, 1000) }))}
              rows={5}
              className="w-full px-3 py-2.5 border border-border rounded-lg bg-background"
              placeholder="Кратко расскажите о себе"
            />
            <p className="text-xs text-muted-foreground">{publicProfile.bio.length}/1000</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Link2 className="w-4 h-4" />
              Ссылки
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={publicProfile.socialLinks.telegram}
                onChange={(e) =>
                  setPublicProfile((prev) => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, telegram: e.target.value },
                  }))
                }
                placeholder="Telegram"
                className="px-3 py-2.5 border border-border rounded-lg bg-background"
              />
              <input
                value={publicProfile.socialLinks.github}
                onChange={(e) =>
                  setPublicProfile((prev) => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, github: e.target.value },
                  }))
                }
                placeholder="GitHub"
                className="px-3 py-2.5 border border-border rounded-lg bg-background"
              />
              <input
                value={publicProfile.socialLinks.linkedin}
                onChange={(e) =>
                  setPublicProfile((prev) => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, linkedin: e.target.value },
                  }))
                }
                placeholder="LinkedIn"
                className="px-3 py-2.5 border border-border rounded-lg bg-background"
              />
              <input
                value={publicProfile.socialLinks.website}
                onChange={(e) =>
                  setPublicProfile((prev) => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, website: e.target.value },
                  }))
                }
                placeholder="Личный сайт"
                className="px-3 py-2.5 border border-border rounded-lg bg-background"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Дополнительные ссылки (до 5)</label>
              {publicProfile.socialLinks.customLinks.map((link, index) => (
                <div key={`custom-${index}`} className="flex gap-2">
                  <input
                    value={link}
                    onChange={(e) =>
                      setPublicProfile((prev) => ({
                        ...prev,
                        socialLinks: {
                          ...prev.socialLinks,
                          customLinks: prev.socialLinks.customLinks.map((item, i) =>
                            i === index ? e.target.value : item,
                          ),
                        },
                      }))
                    }
                    className="flex-1 px-3 py-2.5 border border-border rounded-lg bg-background"
                    placeholder="https://..."
                  />
                  <button
                    onClick={() =>
                      setPublicProfile((prev) => ({
                        ...prev,
                        socialLinks: {
                          ...prev.socialLinks,
                          customLinks: prev.socialLinks.customLinks.filter((_, i) => i !== index),
                        },
                      }))
                    }
                    className="px-3 py-2 border border-border rounded-lg hover:bg-secondary"
                  >
                    Удалить
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setPublicProfile((prev) => {
                    if (prev.socialLinks.customLinks.length >= 5) return prev;
                    return {
                      ...prev,
                      socialLinks: {
                        ...prev.socialLinks,
                        customLinks: [...prev.socialLinks.customLinks, ""],
                      },
                    };
                  })
                }
                className="px-3 py-2 border border-border rounded-lg hover:bg-secondary text-sm"
              >
                Добавить ссылку
              </button>
            </div>
          </div>

          <div className="bg-secondary/50 border border-border rounded-lg p-3 text-sm text-muted-foreground">
            Ваш профиль посмотрели {publicProfile.profileViews30d} HR за последние 30 дней
          </div>

          <button
            onClick={handleSavePublicProfile}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Сохранить визитку
          </button>
          {publicMessage && <p className="text-sm text-muted-foreground">{publicMessage}</p>}
        </section>
      )}

      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-auto bg-background border border-border rounded-2xl shadow-xl">
            <div className="sticky top-0 z-10 bg-background border-b border-border px-5 py-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Публичный профиль</h3>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <section className="flex items-center gap-4">
                {publicProfile.avatarUrl ? (
                  <img
                    src={publicProfile.avatarUrl}
                    alt="Аватар"
                    className="w-20 h-20 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold border border-border">
                    {initials}
                  </div>
                )}
                <div>
                  <h4 className="text-2xl font-bold text-foreground">
                    {[publicProfile.lastName, publicProfile.firstName, publicProfile.middleName]
                      .filter(Boolean)
                      .join(" ") || "Пользователь"}
                  </h4>
                  <p className="text-sm text-muted-foreground">{publicProfile.city || "Город не указан"}</p>
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-card border border-border rounded-lg p-3">
                  <div className="text-muted-foreground">Вуз</div>
                  <div className="font-medium text-foreground">{publicProfile.university || "Не указан"}</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-3">
                  <div className="text-muted-foreground">Факультет / направление</div>
                  <div className="font-medium text-foreground">{publicProfile.faculty || "Не указан"}</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-3">
                  <div className="text-muted-foreground">Курс</div>
                  <div className="font-medium text-foreground">{COURSE_OPTIONS.find((c) => c.value === publicProfile.course)?.label ?? publicProfile.course}</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-3">
                  <div className="text-muted-foreground">О себе</div>
                  <div className="font-medium text-foreground whitespace-pre-wrap">{publicProfile.bio || "Описание отсутствует"}</div>
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-card border border-border rounded-lg p-3">
                  <div className="text-muted-foreground">Индекс активности</div>
                  <div className="text-xl font-semibold text-foreground">{publicStats.activityIndex}</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-3">
                  <div className="text-muted-foreground">Процентиль</div>
                  <div className="text-xl font-semibold text-foreground">{publicStats.percentile}%</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-3">
                  <div className="text-muted-foreground">Достижений</div>
                  <div className="text-xl font-semibold text-foreground">{publicStats.achievementsCount}</div>
                </div>
              </section>

              <section className="space-y-2 text-sm">
                <h5 className="font-semibold text-foreground">Ссылки</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[publicProfile.socialLinks.telegram, publicProfile.socialLinks.github, publicProfile.socialLinks.linkedin, publicProfile.socialLinks.website, ...publicProfile.socialLinks.customLinks]
                    .filter((link) => Boolean(link?.trim()))
                    .map((link, idx) => (
                      <a
                        key={`preview-link-${idx}`}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-lg border border-border text-primary hover:bg-secondary transition-colors break-all"
                      >
                        {link}
                      </a>
                    ))}
                </div>
                {[publicProfile.socialLinks.telegram, publicProfile.socialLinks.github, publicProfile.socialLinks.linkedin, publicProfile.socialLinks.website, ...publicProfile.socialLinks.customLinks]
                  .filter((link) => Boolean(link?.trim())).length === 0 && (
                  <p className="text-muted-foreground">Ссылки не добавлены.</p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
