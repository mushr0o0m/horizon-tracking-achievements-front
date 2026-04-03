"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AuthUser,
  OrganizerNotificationChannel,
  OrganizerNotificationSettings,
  OrganizerOrganizationProfile,
  OrganizationType,
} from "@/lib/types";
import {
  Bell,
  Building2,
  CalendarDays,
  KeyRound,
  Link2,
  Mail,
  Phone,
  ShieldAlert,
  Trash2,
  Users,
} from "lucide-react";

interface OrganizerProfilePageProps {
  user: AuthUser;
  organizationStats: {
    eventsCount: number;
    totalParticipants: number;
  };
  onUpdateEmail: (newEmail: string, currentPassword: string) => string | null;
  onUpdatePhone: (phone: string) => string | null;
  onChangePassword: (
    currentPassword: string,
    newPassword: string,
  ) => string | null;
  onUpdateNotifications: (settings: OrganizerNotificationSettings) => void;
  onUpdateOrganizationProfile: (profile: OrganizerOrganizationProfile) => void;
  onDeleteAccount: (confirmationText: string) => string | null;
}

type ProfileTab = "personal" | "organization";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{10,15}$/;
const URL_REGEX = /^https?:\/\//i;

const ORG_TYPE_OPTIONS: Array<{ value: OrganizationType; label: string }> = [
  { value: "university", label: "Вуз" },
  { value: "scientific", label: "Научная организация" },
  { value: "olympiad", label: "Олимпиадный комитет" },
  { value: "conference", label: "Конференц-организатор" },
  { value: "foundation", label: "Фонд" },
  { value: "educational", label: "Образовательная платформа" },
  { value: "other", label: "Другое" },
];

const DELIVERY_CHANNEL_OPTIONS: Array<{
  value: OrganizerNotificationChannel;
  label: string;
}> = [
  { value: "interface", label: "В интерфейсе" },
  { value: "email", label: "Email" },
  { value: "push", label: "Push" },
  { value: "telegram", label: "Telegram" },
];

const DEFAULT_ORGANIZER_NOTIFICATIONS: OrganizerNotificationSettings = {
  verificationRequests: true,
  newRegistrations: true,
  reports: true,
  deliveryChannels: ["interface", "email"],
};

function buildFallbackOrganizationProfile(
  email: string,
  stats: { eventsCount: number; totalParticipants: number },
): OrganizerOrganizationProfile {
  return {
    logoUrl: undefined,
    organizationName: "",
    shortName: "",
    organizationType: "other",
    website: "",
    description: "",
    contactEmail: email,
    contactPhone: "",
    socialLinks: {
      telegram: "",
      vk: "",
      youtube: "",
      other: [],
    },
    foundedYear: undefined,
    eventsCount: stats.eventsCount,
    totalParticipants: stats.totalParticipants,
  };
}

export function OrganizerProfilePage({
  user,
  organizationStats,
  onUpdateEmail,
  onUpdatePhone,
  onChangePassword,
  onUpdateNotifications,
  onUpdateOrganizationProfile,
  onDeleteAccount,
}: OrganizerProfilePageProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");

  const safeNotifications =
    user.organizerNotifications ?? DEFAULT_ORGANIZER_NOTIFICATIONS;
  const safeOrgProfile =
    user.organizerProfile ??
    buildFallbackOrganizationProfile(user.email, organizationStats);

  const [nextEmail, setNextEmail] = useState(user.email);
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [notifications, setNotifications] =
    useState<OrganizerNotificationSettings>(safeNotifications);
  const [organizationProfile, setOrganizationProfile] =
    useState<OrganizerOrganizationProfile>({
      ...safeOrgProfile,
      eventsCount: organizationStats.eventsCount,
      totalParticipants: organizationStats.totalParticipants,
    });

  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [phoneMessage, setPhoneMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(
    null,
  );
  const [organizationMessage, setOrganizationMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setNextEmail(user.email);
    setPhone(user.phone ?? "");
    setNotifications(
      user.organizerNotifications ?? DEFAULT_ORGANIZER_NOTIFICATIONS,
    );
    setOrganizationProfile({
      ...(user.organizerProfile ??
        buildFallbackOrganizationProfile(user.email, organizationStats)),
      eventsCount: organizationStats.eventsCount,
      totalParticipants: organizationStats.totalParticipants,
    });
  }, [
    user,
    organizationStats.eventsCount,
    organizationStats.totalParticipants,
  ]);

  const organizationInitials = useMemo(() => {
    const source =
      organizationProfile.shortName || organizationProfile.organizationName;
    if (!source.trim()) {
      return "ORG";
    }
    const words = source.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      return words[0].slice(0, 3).toUpperCase();
    }
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }, [organizationProfile.organizationName, organizationProfile.shortName]);

  const currentYear = new Date().getFullYear();

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

  const handleNotificationToggle = (channel: OrganizerNotificationChannel) => {
    setNotifications((prev) => {
      const exists = prev.deliveryChannels.includes(channel);
      if (exists) {
        return {
          ...prev,
          deliveryChannels: prev.deliveryChannels.filter(
            (item) => item !== channel,
          ),
        };
      }
      return {
        ...prev,
        deliveryChannels: [...prev.deliveryChannels, channel],
      };
    });
  };

  const handleNotificationsSave = () => {
    if (notifications.deliveryChannels.length === 0) {
      setNotificationMessage(
        "Выберите хотя бы один канал доставки уведомлений.",
      );
      return;
    }

    onUpdateNotifications(notifications);
    setNotificationMessage("Настройки уведомлений сохранены.");
  };

  const handleDelete = () => {
    const result = onDeleteAccount(deleteConfirmText.trim());
    setDeleteMessage(result ?? "Аккаунт удален.");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setOrganizationMessage("Поддерживаются только JPG и PNG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setOrganizationMessage("Размер файла не должен превышать 5 МБ.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setOrganizationProfile((prev) => ({ ...prev, logoUrl: result }));
      setOrganizationMessage("Логотип загружен. Нажмите Сохранить профиль.");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveOrganization = () => {
    if (!organizationProfile.organizationName.trim()) {
      setOrganizationMessage("Укажите полное название организации.");
      return;
    }
    if (!organizationProfile.shortName.trim()) {
      setOrganizationMessage("Укажите краткое название организации.");
      return;
    }
    if (!organizationProfile.website.trim()) {
      setOrganizationMessage("Укажите сайт организации.");
      return;
    }
    if (!URL_REGEX.test(organizationProfile.website.trim())) {
      setOrganizationMessage("Сайт должен начинаться с http:// или https://.");
      return;
    }
    if (!organizationProfile.description.trim()) {
      setOrganizationMessage("Добавьте описание организации.");
      return;
    }
    if (organizationProfile.description.length > 2000) {
      setOrganizationMessage(
        "Описание организации не должно превышать 2000 символов.",
      );
      return;
    }
    if (
      !EMAIL_REGEX.test(organizationProfile.contactEmail.trim().toLowerCase())
    ) {
      setOrganizationMessage("Введите корректный контактный email.");
      return;
    }
    if (
      organizationProfile.contactPhone?.trim() &&
      !PHONE_REGEX.test(organizationProfile.contactPhone.trim())
    ) {
      setOrganizationMessage(
        "Контактный телефон должен быть в формате +79991234567.",
      );
      return;
    }
    if (
      typeof organizationProfile.foundedYear === "number" &&
      (organizationProfile.foundedYear < 1800 ||
        organizationProfile.foundedYear > currentYear)
    ) {
      setOrganizationMessage(
        `Год основания должен быть в диапазоне 1800-${currentYear}.`,
      );
      return;
    }
    if (organizationProfile.socialLinks.other.length > 5) {
      setOrganizationMessage(
        "Можно добавить не более 5 дополнительных ссылок.",
      );
      return;
    }

    onUpdateOrganizationProfile({
      ...organizationProfile,
      website: organizationProfile.website.trim(),
      contactEmail: organizationProfile.contactEmail.trim().toLowerCase(),
      contactPhone: organizationProfile.contactPhone?.trim() ?? "",
      eventsCount: organizationStats.eventsCount,
      totalParticipants: organizationStats.totalParticipants,
    });
    setOrganizationMessage("Профиль организации сохранен.");
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <section>
        <div>
          <h2 className="text-3xl font-bold text-foreground">Личный кабинет</h2>
          <p className="text-muted-foreground mt-1">
            Управляйте личными данными и публичной информацией об организации.
          </p>
        </div>
      </section>

      <div className="inline-flex rounded-lg bg-secondary p-1 gap-1 w-fit">
        <button
          onClick={() => setActiveTab("personal")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "personal"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}>
          Личные данные
        </button>
        <button
          onClick={() => setActiveTab("organization")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "organization"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}>
          Информация об организации
        </button>
      </div>

      {activeTab === "personal" && (
        <>
          <section className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Mail className="w-4 h-4" />
              Email
            </div>
            <p className="text-sm text-muted-foreground">
              Текущий email: {user.email}
            </p>
            <p className="text-xs text-muted-foreground">
              В демо-версии подтверждение смены email выполняется через текущий
              пароль.
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
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
              Обновить email
            </button>
            {emailMessage && (
              <p className="text-sm text-muted-foreground">{emailMessage}</p>
            )}
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
              className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm font-medium">
              Сохранить телефон
            </button>
            {phoneMessage && (
              <p className="text-sm text-muted-foreground">{phoneMessage}</p>
            )}
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
              className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm font-medium">
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
                  checked={notifications.verificationRequests}
                  onChange={(e) =>
                    setNotifications((prev) => ({
                      ...prev,
                      verificationRequests: e.target.checked,
                    }))
                  }
                />
                Запросы на подтверждение достижений
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notifications.newRegistrations}
                  onChange={(e) =>
                    setNotifications((prev) => ({
                      ...prev,
                      newRegistrations: e.target.checked,
                    }))
                  }
                />
                Новые регистрации на мероприятия
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notifications.reports}
                  onChange={(e) =>
                    setNotifications((prev) => ({
                      ...prev,
                      reports: e.target.checked,
                    }))
                  }
                />
                Отчеты и аналитика
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Каналы доставки
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {DELIVERY_CHANNEL_OPTIONS.map((channel) => (
                  <label
                    key={channel.value}
                    className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={notifications.deliveryChannels.includes(
                        channel.value,
                      )}
                      onChange={() => handleNotificationToggle(channel.value)}
                    />
                    {channel.label}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleNotificationsSave}
              className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm font-medium">
              Сохранить настройки уведомлений
            </button>
            {notificationMessage && (
              <p className="text-sm text-muted-foreground">
                {notificationMessage}
              </p>
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
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium">
                <Trash2 className="w-4 h-4" />
                Удалить аккаунт
              </button>
            </div>
            {deleteMessage && (
              <p className="text-sm text-red-700">{deleteMessage}</p>
            )}
          </section>
        </>
      )}

      {activeTab === "organization" && (
        <section className="bg-card border border-border rounded-xl p-5 space-y-5">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Building2 className="w-4 h-4" />
            Публичный профиль организации
          </div>

          <div className="flex items-center gap-4">
            {organizationProfile.logoUrl ? (
              <img
                src={organizationProfile.logoUrl}
                alt="Логотип"
                className="w-20 h-20 rounded-xl object-cover border border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-base font-semibold border border-border">
                {organizationInitials}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="px-3 py-2 border border-border rounded-lg text-sm cursor-pointer hover:bg-secondary">
                Загрузить логотип
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </label>
              <button
                onClick={() =>
                  setOrganizationProfile((prev) => ({
                    ...prev,
                    logoUrl: undefined,
                  }))
                }
                className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-secondary">
                Удалить логотип
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={organizationProfile.organizationName}
              onChange={(e) =>
                setOrganizationProfile((prev) => ({
                  ...prev,
                  organizationName: e.target.value,
                }))
              }
              placeholder="Полное название организации"
              className="px-3 py-2.5 border border-border rounded-lg bg-background"
            />
            <input
              value={organizationProfile.shortName}
              onChange={(e) =>
                setOrganizationProfile((prev) => ({
                  ...prev,
                  shortName: e.target.value,
                }))
              }
              placeholder="Краткое название"
              className="px-3 py-2.5 border border-border rounded-lg bg-background"
            />
            <select
              value={organizationProfile.organizationType}
              onChange={(e) =>
                setOrganizationProfile((prev) => ({
                  ...prev,
                  organizationType: e.target.value as OrganizationType,
                }))
              }
              className="px-3 py-2.5 border border-border rounded-lg bg-background">
              {ORG_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              value={organizationProfile.website}
              onChange={(e) =>
                setOrganizationProfile((prev) => ({
                  ...prev,
                  website: e.target.value,
                }))
              }
              placeholder="https://organization.ru"
              className="px-3 py-2.5 border border-border rounded-lg bg-background"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Описание организации (до 2000 символов)
            </label>
            <textarea
              value={organizationProfile.description}
              onChange={(e) =>
                setOrganizationProfile((prev) => ({
                  ...prev,
                  description: e.target.value.slice(0, 2000),
                }))
              }
              rows={6}
              className="w-full px-3 py-2.5 border border-border rounded-lg bg-background"
              placeholder="Миссия, направления деятельности, ключевые проекты"
            />
            <p className="text-xs text-muted-foreground">
              {organizationProfile.description.length}/2000
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={organizationProfile.contactEmail}
              onChange={(e) =>
                setOrganizationProfile((prev) => ({
                  ...prev,
                  contactEmail: e.target.value,
                }))
              }
              type="email"
              placeholder="Публичный контактный email"
              className="px-3 py-2.5 border border-border rounded-lg bg-background"
            />
            <input
              value={organizationProfile.contactPhone ?? ""}
              onChange={(e) =>
                setOrganizationProfile((prev) => ({
                  ...prev,
                  contactPhone: e.target.value,
                }))
              }
              type="tel"
              placeholder="Публичный телефон (опционально)"
              className="px-3 py-2.5 border border-border rounded-lg bg-background"
            />
            <input
              value={organizationProfile.foundedYear ?? ""}
              onChange={(e) => {
                const raw = e.target.value.trim();
                const parsed = Number(raw);
                setOrganizationProfile((prev) => ({
                  ...prev,
                  foundedYear: raw
                    ? Number.isFinite(parsed)
                      ? parsed
                      : prev.foundedYear
                    : undefined,
                }));
              }}
              type="number"
              placeholder="Год основания"
              className="px-3 py-2.5 border border-border rounded-lg bg-background"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Link2 className="w-4 h-4" />
              Социальные сети
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={organizationProfile.socialLinks.telegram}
                onChange={(e) =>
                  setOrganizationProfile((prev) => ({
                    ...prev,
                    socialLinks: {
                      ...prev.socialLinks,
                      telegram: e.target.value,
                    },
                  }))
                }
                placeholder="Telegram"
                className="px-3 py-2.5 border border-border rounded-lg bg-background"
              />
              <input
                value={organizationProfile.socialLinks.vk}
                onChange={(e) =>
                  setOrganizationProfile((prev) => ({
                    ...prev,
                    socialLinks: {
                      ...prev.socialLinks,
                      vk: e.target.value,
                    },
                  }))
                }
                placeholder="VK"
                className="px-3 py-2.5 border border-border rounded-lg bg-background"
              />
              <input
                value={organizationProfile.socialLinks.youtube}
                onChange={(e) =>
                  setOrganizationProfile((prev) => ({
                    ...prev,
                    socialLinks: {
                      ...prev.socialLinks,
                      youtube: e.target.value,
                    },
                  }))
                }
                placeholder="YouTube"
                className="px-3 py-2.5 border border-border rounded-lg bg-background"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Другие ссылки (до 5)
              </label>
              {organizationProfile.socialLinks.other.map((link, index) => (
                <div key={`org-link-${index}`} className="flex gap-2">
                  <input
                    value={link}
                    onChange={(e) =>
                      setOrganizationProfile((prev) => ({
                        ...prev,
                        socialLinks: {
                          ...prev.socialLinks,
                          other: prev.socialLinks.other.map((item, i) =>
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
                      setOrganizationProfile((prev) => ({
                        ...prev,
                        socialLinks: {
                          ...prev.socialLinks,
                          other: prev.socialLinks.other.filter(
                            (_, i) => i !== index,
                          ),
                        },
                      }))
                    }
                    className="px-3 py-2 border border-border rounded-lg hover:bg-secondary">
                    Удалить
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setOrganizationProfile((prev) => {
                    if (prev.socialLinks.other.length >= 5) return prev;
                    return {
                      ...prev,
                      socialLinks: {
                        ...prev.socialLinks,
                        other: [...prev.socialLinks.other, ""],
                      },
                    };
                  })
                }
                className="px-3 py-2 border border-border rounded-lg hover:bg-secondary text-sm">
                Добавить ссылку
              </button>
            </div>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="bg-secondary/40 border border-border rounded-lg p-4">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                Проведено мероприятий
              </div>
              <div className="text-2xl font-semibold text-foreground mt-1">
                {organizationStats.eventsCount}
              </div>
            </div>
            <div className="bg-secondary/40 border border-border rounded-lg p-4">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                Участников за все время
              </div>
              <div className="text-2xl font-semibold text-foreground mt-1">
                {organizationStats.totalParticipants}
              </div>
            </div>
          </section>

          <button
            onClick={handleSaveOrganization}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
            Сохранить профиль
          </button>
          {organizationMessage && (
            <p className="text-sm text-muted-foreground">
              {organizationMessage}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
