"use client";

import { StudentEventsSection } from "@/app/student/events/table/section";
import type {
  StudentEventsFiltersState,
  StudentEventsTab,
} from "@/components/student/student-events-page";
import type { Event } from "@/lib/types";
import { useStudentPageRuntime } from "@/app/_components/student/use-student-page-runtime";

interface StudentEventsPageContentProps {
  events: Event[];
  recommendedEvents: Event[];
  activeTab: StudentEventsTab;
  onTabChange: (tab: StudentEventsTab) => void;
  filtersState: StudentEventsFiltersState;
  onFiltersStateChange: (next: StudentEventsFiltersState) => void;
  onOpenEvent: (eventId: string) => void;
}

export function StudentEventsPageContent({
  events,
  recommendedEvents,
  activeTab,
  onTabChange,
  filtersState,
  onFiltersStateChange,
  onOpenEvent,
}: StudentEventsPageContentProps) {
  return (
    <StudentEventsSection
      events={events}
      recommendedEvents={recommendedEvents}
      activeTab={activeTab}
      onTabChange={onTabChange}
      filtersState={filtersState}
      onFiltersStateChange={onFiltersStateChange}
      onOpenEvent={onOpenEvent}
    />
  );
}

export default function Page() {
  const runtime = useStudentPageRuntime();

  return (
    <StudentEventsPageContent
      events={runtime.availableStudentEvents}
      recommendedEvents={runtime.recommendedStudentEvents}
      activeTab={runtime.studentEventsTab}
      onTabChange={runtime.onEventsTabChange}
      filtersState={runtime.studentEventsFilters}
      onFiltersStateChange={runtime.onEventsFiltersChange}
      onOpenEvent={runtime.openEventFromEvents}
    />
  );
}
