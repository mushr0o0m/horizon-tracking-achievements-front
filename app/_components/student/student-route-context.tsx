"use client";

import {
  createContext,
  useContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { AuthUser } from "@/lib/types";

export interface StudentRouteContextValue {
  currentUser: AuthUser;
  setCurrentUser: Dispatch<SetStateAction<AuthUser | null>>;
  handleChangePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<string | null>;
  handleDeleteAccount: (confirmationText: string) => string | null;
}

const StudentRouteContext = createContext<StudentRouteContextValue | null>(null);

export function StudentRouteProvider({
  value,
  children,
}: {
  value: StudentRouteContextValue;
  children: ReactNode;
}) {
  return (
    <StudentRouteContext.Provider value={value}>
      {children}
    </StudentRouteContext.Provider>
  );
}

export function useStudentRouteContext() {
  const context = useContext(StudentRouteContext);
  if (!context) {
    throw new Error("useStudentRouteContext must be used within StudentRouteProvider");
  }
  return context;
}
