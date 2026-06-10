import type { ReactNode } from "react";
import AppShellCommon from "@/app/_components/app-shell-common";

export default function OrganizerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AppShellCommon>{children}</AppShellCommon>;
}
