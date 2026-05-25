import type { HrView, OrganizerView, StudentView, UserRole } from "@/lib/types";
import type { StudentEventsTab } from "@/components/student/student-events-page";

export type AppShellRoute =
  | {
      role: "student";
      view: StudentView;
      eventsTab?: StudentEventsTab;
    }
  | {
      role: "organizer";
      view: OrganizerView;
    }
  | {
      role: "hr";
      view: HrView;
    };

export function buildPathForCurrentView(args: {
  role: UserRole;
  studentView: StudentView;
  organizerView: OrganizerView;
  hrView: HrView;
  studentEventsTab: StudentEventsTab;
}): string {
  if (args.role === "student") {
    switch (args.studentView) {
      case "events":
        return `/student/events/${args.studentEventsTab}`;
      case "dashboards":
        return "/student/dashboards/main";
      case "achievements":
        return "/student/achievements/list";
      case "invitations":
        return "/student/invitations/list";
      case "subscribers":
        return "/student/subscribers/list";
      case "hr-profile":
        return "/student/hr-profile/view";
      case "create-achievement":
        return "/student/create-achievement/form";
      case "profile":
        return "/student/profile/main";
      case "event-details":
        return "/student/event-details/view";
      case "home":
      default:
        return "/student/home/main";
    }
  }

  if (args.role === "organizer") {
    switch (args.organizerView) {
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

  switch (args.hrView) {
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
      return "/hr/profile/main";
    case "event-details":
      return "/hr/event-details/view";
    case "home":
    default:
      return "/hr/home/main";
  }
}
