import type { HrView, OrganizerView } from "@/lib/types";

export function parsePathParts(pathname: string): {
  role?: string;
  section?: string;
  tab?: string;
  slug?: string;
} {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 3) return {};

  return {
    role: parts[0],
    section: parts[1],
    slug: parts[2],
    tab: parts[3],
  };
}

export function normalizeOrganizerViewFromPath(
  section?: string,
  tab?: string,
): OrganizerView {
  void tab;
  if (section === "verification-requests") return "verification-requests";
  if (section === "profile") return "profile";
  if (section === "create-event") return "create-event";
  if (section === "edit-event") return "edit-event";
  if (section === "upload-results") return "upload-results";
  if (section === "event-details") return "event-details";
  return "events";
}

export function normalizeHrViewFromPath(
  section?: string,
  slug?: string,
  tab?: string,
): HrView {
  void slug;
  void tab;
  if (section === "dashboards") return "dashboards";
  if (section === "candidates-search") return "candidates-search";
  if (section === "candidate-profile") return "candidate-profile";
  if (section === "candidate-subscribers") return "candidate-subscribers";
  if (section === "subscriber-profile") return "subscriber-profile";
  if (section === "profile") return "profile";
  if (section === "event-details") return "event-details";
  return "home";
}
