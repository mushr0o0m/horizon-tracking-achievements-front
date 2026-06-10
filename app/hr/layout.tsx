import type { ReactNode } from "react";
import AppShellCommon from "@/app/_components/app-shell-common";

export default function HrLayout({ children }: { children: ReactNode }) {
  return <AppShellCommon>{children}</AppShellCommon>;
}
