"use client";

import {
  StudentEventsPage,
  type StudentEventsFiltersState,
  type StudentEventsTab,
} from "@/components/student/student-events-page";
import type { Event } from "@/lib/types";

interface StudentEventsSectionProps {
  events: Event[];
  recommendedEvents: Event[];
  activeTab: StudentEventsTab;
  onTabChange: (tab: StudentEventsTab) => void;
  filtersState: StudentEventsFiltersState;
  onFiltersStateChange: (next: StudentEventsFiltersState) => void;
  onOpenEvent: (eventId: string) => void;
}

export function StudentEventsSection({
  events,
  recommendedEvents,
  activeTab,
  onTabChange,
  filtersState,
  onFiltersStateChange,
  onOpenEvent,
}: StudentEventsSectionProps) {
  return (
    <StudentEventsPage
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
