import { useState } from "react";
import { Event, EventCustomField, OrganizerEventStatus } from "@/lib/types";
import { EventFormPayload } from "@/stores/events-store";

type FormErrors = Partial<
  Record<
    | "title"
    | "type"
    | "level"
    | "start"
    | "end"
    | "registrationDeadline"
    | "format"
    | "location"
    | "description"
    | "website"
    | "contactEmail"
    | "customFields",
    string
  >
>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\//i;

function createEmptyCustomField(): EventCustomField {
  return {
    id: `cf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    label: "",
    type: "text",
    required: false,
    options: [],
  };
}

export function useEventForm(
  initialEvent?: Event,
  defaultContactEmail?: string,
) {
  const [title, setTitle] = useState(initialEvent?.title ?? "");
  const [type, setType] = useState(initialEvent?.type ?? "olympiad");
  const [level, setLevel] = useState(initialEvent?.level ?? "regional");
  const [start, setStart] = useState(initialEvent?.dates.start ?? "");
  const [end, setEnd] = useState(initialEvent?.dates.end ?? "");
  const [registrationDeadline, setRegistrationDeadline] = useState(
    initialEvent?.dates.registrationDeadline ?? "",
  );
  const [format, setFormat] = useState(initialEvent?.format ?? "offline");
  const [location, setLocation] = useState(initialEvent?.location ?? "");
  const [description, setDescription] = useState(
    initialEvent?.description ?? "",
  );
  const [website, setWebsite] = useState(initialEvent?.website ?? "");
  const [contactEmail, setContactEmail] = useState(
    initialEvent?.contactEmail ?? defaultContactEmail ?? "",
  );
  const [logoUrl, setLogoUrl] = useState(initialEvent?.logoUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(initialEvent?.bannerUrl ?? "");
  const [status, setStatus] = useState<OrganizerEventStatus>(
    initialEvent?.status ?? "draft",
  );
  const [customFields, setCustomFields] = useState<EventCustomField[]>(
    initialEvent?.customFields ?? [],
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const e: FormErrors = {};

    if (!title.trim()) e.title = "Введите название мероприятия.";
    if (!start) e.start = "Укажите дату начала.";
    if (!end) e.end = "Укажите дату окончания.";
    if (!registrationDeadline)
      e.registrationDeadline = "Укажите дедлайн регистрации.";
    if (format === "offline" && !location.trim()) {
      e.location = "Для очного формата укажите местоположение.";
    }
    if (!description.trim()) {
      e.description = "Добавьте описание мероприятия.";
    }
    if (website.trim() && !URL_REGEX.test(website.trim())) {
      e.website = "Сайт должен начинаться с http:// или https://.";
    }
    if (!EMAIL_REGEX.test(contactEmail.trim().toLowerCase())) {
      e.contactEmail = "Введите корректный контактный email.";
    }

    if (start && end && new Date(end).getTime() < new Date(start).getTime()) {
      e.end = "Дата окончания не может быть раньше даты начала.";
    }
    if (
      registrationDeadline &&
      start &&
      new Date(registrationDeadline).getTime() > new Date(start).getTime()
    ) {
      e.registrationDeadline =
        "Дедлайн регистрации не может быть позже даты начала.";
    }

    const hasInvalidCustomField = customFields.some((field) => {
      if (!field.label.trim()) return true;
      if (field.type === "select") {
        const options = (field.options ?? [])
          .map((item) => item.trim())
          .filter(Boolean);
        return options.length < 2;
      }
      return false;
    });
    if (hasInvalidCustomField) {
      e.customFields =
        "Проверьте кастомные поля: название обязательно, для типа select нужно минимум 2 опции.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const getPayload = (): EventFormPayload => ({
    title: title.trim(),
    type,
    level,
    dates: {
      start,
      end,
      registrationDeadline,
    },
    format,
    location: location.trim(),
    description: description.trim(),
    website: website.trim(),
    contactEmail: contactEmail.trim().toLowerCase(),
    logoUrl: logoUrl.trim(),
    bannerUrl: bannerUrl.trim(),
    status,
    customFields: customFields.map((field) => ({
      ...field,
      label: field.label.trim(),
      options:
        field.type === "select"
          ? (field.options ?? []).map((item) => item.trim()).filter(Boolean)
          : [],
    })),
  });

  const addCustomField = () => {
    setCustomFields((prev) => [...prev, createEmptyCustomField()]);
  };

  const removeCustomField = (fieldId: string) => {
    setCustomFields((prev) => prev.filter((item) => item.id !== fieldId));
  };

  const updateCustomField = (
    fieldId: string,
    updater: (field: EventCustomField) => EventCustomField,
  ) => {
    setCustomFields((prev) =>
      prev.map((item) => (item.id === fieldId ? updater(item) : item)),
    );
  };

  return {
    values: {
      title,
      type,
      level,
      start,
      end,
      registrationDeadline,
      format,
      location,
      description,
      website,
      contactEmail,
      logoUrl,
      bannerUrl,
      status,
      customFields,
    },
    set: {
      title: setTitle,
      type: setType,
      level: setLevel,
      start: setStart,
      end: setEnd,
      registrationDeadline: setRegistrationDeadline,
      format: setFormat,
      location: setLocation,
      description: setDescription,
      website: setWebsite,
      contactEmail: setContactEmail,
      logoUrl: setLogoUrl,
      bannerUrl: setBannerUrl,
      status: setStatus,
    },
    errors,
    validate,
    getPayload,
    addCustomField,
    removeCustomField,
    updateCustomField,
  };
}
