import type { HrView, OrganizerView, UserRole } from "@/lib/types";
import type { StudentEventsTab } from "@/components/student/student-events-page";
import type { StudentAchievementsTab } from "@/components/student/achievements-page";
import type { StudentProfileTab } from "@/components/student/profile-page";

export type HrProfileTab = "personal" | "organization" | "settings";
export type HrDashboardTab =
  | "kanban"
  | "summary"
  | "quick-search"
  | "recent-actions"
  | "archive";

export const STUDENT_ROUTES = {
  home: "/student/home/main",
  dashboards: "/student/dashboards/main",
  achievements: "/student/achievements/list",
  invitations: "/student/invitations/list",
  profile: "/student/profile/main",
  createAchievement: "/student/create-achievement/form",
  eventDetails: "/student/event-details/view",
  subscribers: "/student/subscribers/list",
  hrProfile: "/student/hr-profile/view",
} as const;

export type StudentRouteSection =
  | "home"
  | "events"
  | "dashboards"
  | "achievements"
  | "invitations"
  | "profile"
  | "create-achievement"
  | "event-details"
  | "subscribers"
  | "hr-profile";

export type StudentRouteOverride =
  | {
      section: "events";
      eventsTab: StudentEventsTab;
      achievementsTab?: never;
      profileTab?: never;
    }
  | {
      section: "achievements";
      achievementsTab: StudentAchievementsTab;
      eventsTab?: never;
      profileTab?: never;
    }
  | {
      section: "profile";
      profileTab: StudentProfileTab;
      eventsTab?: never;
      achievementsTab?: never;
    }
  | {
      section: Exclude<StudentRouteSection, "events" | "achievements" | "profile">;
      eventsTab?: never;
      achievementsTab?: never;
      profileTab?: never;
    };

export function buildStudentEventsPath(tab: StudentEventsTab): string {
  return `/student/events/${tab}`;
}

export function buildStudentAchievementsPath(
  tab: StudentAchievementsTab,
): string {
  return `${STUDENT_ROUTES.achievements}/${tab}`;
}

export function buildStudentProfilePath(tab: StudentProfileTab): string {
  return `${STUDENT_ROUTES.profile}/${tab}`;
}

export function buildStudentEventDetailsPath(
  eventId: string,
  returnTo?: string,
): string {
  const params = new URLSearchParams({ eventId });
  if (returnTo) params.set("returnTo", returnTo);
  return `${STUDENT_ROUTES.eventDetails}?${params.toString()}`;
}

export function buildStudentCreateAchievementPath(returnTo?: string): string {
  if (!returnTo) return STUDENT_ROUTES.createAchievement;
  const params = new URLSearchParams({ returnTo });
  return `${STUDENT_ROUTES.createAchievement}?${params.toString()}`;
}

export function buildStudentSubscribersPath(returnTo?: string): string {
  if (!returnTo) return STUDENT_ROUTES.subscribers;
  const params = new URLSearchParams({ returnTo });
  return `${STUDENT_ROUTES.subscribers}?${params.toString()}`;
}

export function buildStudentHrProfilePath(
  hrId: string,
  returnTo?: string,
): string {
  const params = new URLSearchParams({ hrId });
  if (returnTo) params.set("returnTo", returnTo);
  return `${STUDENT_ROUTES.hrProfile}?${params.toString()}`;
}

export function resolveStudentEventsTab(pathname: string): StudentEventsTab {
  return pathname.includes("/student/events/recommended")
    ? "recommended"
    : "table";
}

export function resolveStudentAchievementsTab(
  pathname: string,
): StudentAchievementsTab {
  if (pathname.includes("/student/achievements/list/table")) return "table";
  return "badges";
}

export function resolveStudentProfileTab(pathname: string): StudentProfileTab {
  if (pathname.includes("/student/profile/main/public")) return "public";
  if (pathname.includes("/student/profile/main/settings")) return "settings";
  return "personal";
}

export function resolveStudentRoute(pathname: string): {
  section: StudentRouteSection;
  eventsTab?: StudentEventsTab;
  achievementsTab?: StudentAchievementsTab;
  profileTab?: StudentProfileTab;
} {
  if (pathname.startsWith("/student/events/")) {
    return { section: "events", eventsTab: resolveStudentEventsTab(pathname) };
  }
  if (pathname.startsWith(STUDENT_ROUTES.dashboards))
    return { section: "dashboards" };
  if (pathname.startsWith(STUDENT_ROUTES.achievements))
    return {
      section: "achievements",
      achievementsTab: resolveStudentAchievementsTab(pathname),
    };
  if (pathname.startsWith(STUDENT_ROUTES.invitations))
    return { section: "invitations" };
  if (pathname.startsWith(STUDENT_ROUTES.profile)) {
    return {
      section: "profile",
      profileTab: resolveStudentProfileTab(pathname),
    };
  }
  if (pathname.startsWith(STUDENT_ROUTES.createAchievement))
    return { section: "create-achievement" };
  if (pathname.startsWith(STUDENT_ROUTES.eventDetails))
    return { section: "event-details" };
  if (pathname.startsWith(STUDENT_ROUTES.subscribers))
    return { section: "subscribers" };
  if (pathname.startsWith(STUDENT_ROUTES.hrProfile))
    return { section: "hr-profile" };
  return { section: "home" };
}

export function buildOrganizerPath(view: OrganizerView): string {
  switch (view) {
    case "verification-requests":
      return "/organizer/verification-requests/main";
    case "profile":
      return "/organizer/profile/main";
    case "create-event":
      return "/organizer/create-event/form";
    case "edit-event":
      return "/organizer/edit-event/[eventId]/form";
    case "upload-results":
      return "/organizer/upload-results/[eventId]/form";
    case "event-details":
      return "/organizer/event-details/[eventId]/view";
    case "events":
    default:
      return "/organizer/events/main";
  }
}

export function buildHrPath(view: HrView): string {
  switch (view) {
    case "dashboards":
      return "/hr/dashboards/kanban";
    case "candidates-search":
      return "/hr/candidates-search/list";
    case "candidate-profile":
      return "/hr/candidate-profile/main";
    case "candidate-subscribers":
      return "/hr/candidate-subscribers/list";
    case "subscriber-profile":
      return "/hr/subscriber-profile/view";
    case "profile":
      return "/hr/profile/main/personal";
    case "event-details":
      return "/hr/event-details/view";
    case "home":
    default:
      return "/hr/home/main";
  }
}

export function buildHrCandidateProfilePath(candidateId: string): string {
  return `/hr/candidate-profile/${candidateId}/main`;
}

export function buildHrDashboardsPath(tab: HrDashboardTab): string {
  return `/hr/dashboards/${tab}`;
}

export function resolveHrDashboardsTab(pathname: string): HrDashboardTab {
  if (pathname.includes("/hr/dashboards/summary")) return "summary";
  if (pathname.includes("/hr/dashboards/quick-search")) return "quick-search";
  if (pathname.includes("/hr/dashboards/recent-actions")) return "recent-actions";
  if (pathname.includes("/hr/dashboards/archive")) return "archive";
  return "kanban";
}

export function buildHrProfilePath(tab: HrProfileTab): string {
  return `/hr/profile/main/${tab}`;
}

export function resolveHrProfileTab(pathname: string): HrProfileTab {
  if (pathname.includes("/hr/profile/main/organization")) return "organization";
  if (pathname.includes("/hr/profile/main/settings")) return "settings";
  return "personal";
}

export function buildPathForCurrentView(args: {
  role: UserRole;
  studentView: string;
  organizerView: OrganizerView;
  hrView: HrView;
  studentEventsTab: StudentEventsTab;
}): string {
  if (args.role === "student") {
    if (args.studentView === "events") {
      return buildStudentEventsPath(args.studentEventsTab);
    }
    return STUDENT_ROUTES.home;
  }
  if (args.role === "organizer") {
    return buildOrganizerPath(args.organizerView);
  }
  return buildHrPath(args.hrView);
}
