"use client";

import { FormEvent, useMemo, useState } from "react";
import { Mail, Lock, UserRound, User, Building2 } from "lucide-react";
import { UserRole } from "@/lib/types";

export interface RegistrationPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterFormProps {
  onRegister: (payload: RegistrationPayload) => string | null;
  onLogin: (payload: LoginPayload) => string | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm({ onRegister, onLogin }: RegisterFormProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordHint = useMemo(() => {
    if (!password) return "Минимум 8 символов";
    return password.length >= 8 ? "Надежный пароль" : "Слишком короткий пароль";
  }, [password]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError("Введите корректный email.");
      return;
    }

    if (mode === "login") {
      if (!password) {
        setError("Введите пароль.");
        return;
      }

      setError(null);
      const loginError = onLogin({
        email: normalizedEmail,
        password,
      });

      if (loginError) {
        setError(loginError);
      }
      return;
    }

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

    setError(null);
    const registerError = onRegister({
      name: normalizedName,
      email: normalizedEmail,
      password,
      role,
    });

    if (registerError) {
      setError(registerError);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-secondary/20 to-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            {mode === "login" ? "Вход в аккаунт" : "Регистрация аккаунта"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login"
              ? "Войдите в уже существующий аккаунт по email и паролю."
              : "Создайте аккаунт по email и паролю и выберите тип пользователя."}
          </p>
        </div>

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
                <UserRound className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder="Иванов Иван Иванович"
                  className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </label>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm text-foreground font-medium">Email</span>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="example@mail.ru"
                className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </label>

          {mode === "register" && (
            <div className="space-y-1.5">
              <span className="text-sm text-foreground font-medium">
                Тип пользователя
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    role === "student"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:bg-secondary"
                  }`}>
                  <span className="inline-flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Ученик
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("organizer")}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    role === "organizer"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:bg-secondary"
                  }`}>
                  <span className="inline-flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Организатор
                  </span>
                </button>
              </div>
            </div>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm text-foreground font-medium">Пароль</span>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Минимум 8 символов"
                className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Повторите пароль"
                  className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium">
            {mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>
      </div>
    </div>
  );
}
