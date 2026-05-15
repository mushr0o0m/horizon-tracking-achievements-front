import type { HrView, OrganizerView, StudentView } from "@/lib/types";
import type { StudentEventsTab } from "@/components/student/student-events-page";

export function parsePathParts(pathname: string): {
  role?: string;
  section?: string;
  tab?: string;
} {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 3) return {};

  return {
    role: parts[0],
    section: parts[1],
    tab: parts[2],
  };
}

export function normalizeStudentViewFromPath(
  section?: string,
  tab?: string,
): { view: StudentView; eventsTab?: StudentEventsTab } {
  if (section === "events") {
    const eventsTab: StudentEventsTab =
      tab === "recommended" ? "recommended" : "table";
    return { view: "events", eventsTab };
  }

  if (section === "dashboards") return { view: "dashboards" };
  if (section === "achievements") return { view: "achievements" };
  if (section === "invitations") return { view: "invitations" };
  if (section === "subscribers") return { view: "subscribers" };
  if (section === "hr-profile") return { view: "hr-profile" };
  if (section === "create-achievement") return { view: "create-achievement" };
  if (section === "profile") return { view: "profile" };
  if (section === "event-details") return { view: "event-details" };

  return { view: "home" };
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

export function normalizeHrViewFromPath(section?: string, tab?: string): HrView {
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
