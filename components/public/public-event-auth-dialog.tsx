"use client";

import { FormEvent, useMemo, useState } from "react";
import { Mail, LockKeyhole, UserRound } from "lucide-react";
import { backendLogin, backendRegister } from "@/lib/backend-api";
import type { AuthUser } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { showErrorToast, showSuccessToast } from "@/lib/app-toast";

interface PublicEventAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onStudentAuthSuccess: (user: AuthUser) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PublicEventAuthDialog({
  open,
  onOpenChange,
  eventId,
  onStudentAuthSuccess,
}: PublicEventAuthDialogProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordHint = useMemo(() => {
    if (!password) return "Минимум 8 символов";
    return password.length >= 8 ? "Надежный пароль" : "Слишком короткий пароль";
  }, [password]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError("Введите корректный email.");
      return;
    }

    if (!password) {
      setError("Введите пароль.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let user: AuthUser;
      if (mode === "login") {
        user = await backendLogin({
          email: normalizedEmail,
          password,
        });
      } else {
        const normalizedName = name.trim();
        if (!normalizedName) {
          setError("Укажите ФИО.");
          return;
        }
        if (password.length < 8) {
          setError("Пароль должен содержать минимум 8 символов.");
          return;
        }
        if (password !== confirmPassword) {
          setError("Пароли не совпадают.");
          return;
        }

        user = await backendRegister({
          name: normalizedName,
          email: normalizedEmail,
          password,
          role: "student",
        });
      }

      if (user.role !== "student") {
        setError("Регистрация на мероприятие доступна только студентам.");
        return;
      }

      void eventId;
      onOpenChange(false);
      showSuccessToast(
        mode === "login" ? "Вход выполнен" : "Регистрация выполнена",
      );
      onStudentAuthSuccess(user);
    } catch (submitError) {
      const backendMessage =
        submitError instanceof Error ? submitError.message.toLowerCase() : "";
      if (backendMessage.includes("already exists")) {
        setError("Пользователь с таким email уже существует.");
        showErrorToast("Пользователь с таким email уже существует.");
      } else if (backendMessage.includes("401")) {
        setError("Не удалось войти. Проверьте email и пароль.");
        showErrorToast("Не удалось войти. Проверьте email и пароль.");
      } else {
        setError(
          mode === "login"
            ? "Не удалось войти. Проверьте email и пароль."
            : "Не удалось зарегистрироваться. Проверьте данные и повторите попытку.",
        );
        showErrorToast(
          mode === "login"
            ? "Не удалось войти. Проверьте email и пароль."
            : "Не удалось зарегистрироваться. Проверьте данные и повторите попытку.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "login" ? "Вход в аккаунт" : "Регистрация студента"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Войдите, чтобы перейти к записи на мероприятие."
              : "Создайте аккаунт студента для записи на мероприятие."}
          </DialogDescription>
        </DialogHeader>

        <div className="inline-flex rounded-lg bg-secondary p-1 gap-1 w-full">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            Вход
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "register"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <label className="block space-y-1.5">
              <span className="text-sm text-foreground font-medium">ФИО</span>
              <div className="relative">
                <UserRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder="Иванов Иван Иванович"
                  className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </label>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm text-foreground font-medium">Email</span>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="example@mail.ru"
                className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm text-foreground font-medium">Пароль</span>
            <div className="relative">
              <LockKeyhole className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Минимум 8 символов"
                className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {mode === "register" && (
              <p className="text-xs text-muted-foreground">{passwordHint}</p>
            )}
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            Показывать пароль
          </label>

          {mode === "register" && (
            <label className="block space-y-1.5">
              <span className="text-sm text-foreground font-medium">
                Повторите пароль
              </span>
              <div className="relative">
                <LockKeyhole className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Повторите пароль"
                  className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </label>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed">
            {isSubmitting
              ? "Проверяем..."
              : mode === "login"
                ? "Войти"
                : "Создать аккаунт"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
