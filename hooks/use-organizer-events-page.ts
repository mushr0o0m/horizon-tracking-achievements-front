"use client";

import { useCallback } from "react";
import { deleteOrganizerEvent, fetchOrganizerEvents } from "@/lib/backend-api";
import { useEventsStore } from "@/stores/events-store";
import { showErrorToast, showSuccessToast } from "@/lib/app-toast";

export function useOrganizerEventsPage() {
  const { setEvents } = useEventsStore();

  const handleDeleteEvent = useCallback(async (id: string) => {
    try {
      await deleteOrganizerEvent(id);
      const refreshed = await fetchOrganizerEvents();
      setEvents(refreshed);
      showSuccessToast("Мероприятие удалено");
    } catch (error) {
      console.warn("Failed to delete event.", error);
      showErrorToast("Не удалось удалить мероприятие.");
    }
  }, [setEvents]);

  return { handleDeleteEvent };
}
