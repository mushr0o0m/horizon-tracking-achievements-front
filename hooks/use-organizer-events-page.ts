"use client";

import { useCallback } from "react";
import { deleteOrganizerEvent, fetchOrganizerEvents } from "@/lib/backend-api";
import { useEventsStore } from "@/stores/events-store";

export function useOrganizerEventsPage() {
  const { setEvents } = useEventsStore();

  const handleDeleteEvent = useCallback(async (id: string) => {
    try {
      await deleteOrganizerEvent(id);
      const refreshed = await fetchOrganizerEvents();
      setEvents(refreshed);
    } catch (error) {
      console.warn("Failed to delete event.", error);
    }
  }, [setEvents]);

  return { handleDeleteEvent };
}
