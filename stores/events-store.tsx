"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import { Event, EventApplication } from "@/lib/types";
import { buildEventQrCode } from "@/lib/event-meta";

export type EventFormPayload = Omit<
  Event,
  | "id"
  | "organizerId"
  | "participantsCount"
  | "applicationsCount"
  | "qrCodeUrl"
  | "createdAt"
>;

interface EventsState {
  events: Event[];
  applications: EventApplication[];
}

type EventsAction =
  | { type: "SET_EVENTS"; payload: Event[] }
  | { type: "SET_APPLICATIONS"; payload: EventApplication[] }
  | { type: "CREATE"; payload: Event }
  | { type: "UPDATE"; payload: { eventId: string; data: EventFormPayload } }
  | { type: "DELETE"; payload: { eventId: string } }
  | {
      type: "ASSIGN_ORGANIZER";
      payload: {
        eventId: string;
        organizerId: string;
        organizerEmail: string;
      };
    }
  | {
      type: "APPLY_RESULTS";
      payload: {
        eventId: string;
      };
    }
  | {
      type: "TOGGLE_APPLICATION";
      payload: {
        eventId: string;
        studentId: string;
        studentName: string;
      };
    }
  | {
      type: "ENSURE_APPLICATION";
      payload: {
        eventId: string;
        studentId: string;
        studentName: string;
      };
    }
  | { type: "RESET"; payload: Event[] };

function eventsReducer(state: EventsState, action: EventsAction): EventsState {
  switch (action.type) {
    case "SET_EVENTS":
      return {
        ...state,
        events: action.payload,
      };
    case "SET_APPLICATIONS":
      return {
        ...state,
        applications: action.payload,
      };
    case "CREATE":
      return { ...state, events: [action.payload, ...state.events] };
    case "UPDATE":
      return {
        ...state,
        events: state.events.map((event) =>
          event.id === action.payload.eventId
            ? {
                ...event,
                ...action.payload.data,
                qrCodeUrl: event.qrCodeUrl || buildEventQrCode(event.id),
              }
            : event,
        ),
      };
    case "DELETE":
      const eventsAfterDelete = state.events.filter(
        (event) => event.id !== action.payload.eventId,
      );
      const applicationsAfterDelete = state.applications.filter(
        (item) => item.eventId !== action.payload.eventId,
      );
      return {
        ...state,
        events: eventsAfterDelete,
        applications: applicationsAfterDelete,
      };
    case "ASSIGN_ORGANIZER":
      return {
        ...state,
        events: state.events.map((event) =>
          event.id === action.payload.eventId
            ? {
                ...event,
                organizerId: action.payload.organizerId,
                contactEmail:
                  action.payload.organizerEmail || event.contactEmail,
              }
            : event,
        ),
      };
    case "APPLY_RESULTS":
      return {
        ...state,
        events: state.events.map((event) =>
          event.id === action.payload.eventId
            ? {
                ...event,
                status: "completed",
              }
            : event,
        ),
      };
    case "TOGGLE_APPLICATION":
      const existing = state.applications.find(
        (item) =>
          item.eventId === action.payload.eventId &&
          item.studentId === action.payload.studentId,
      );

      const nextApplications = existing
        ? state.applications.filter(
            (item) =>
              !(
                item.eventId === action.payload.eventId &&
                item.studentId === action.payload.studentId
              ),
          )
        : [
            ...state.applications,
            {
              id: `app-${Date.now()}-${action.payload.studentId}`,
              eventId: action.payload.eventId,
              studentId: action.payload.studentId,
              studentName: action.payload.studentName,
              appliedAt: new Date().toISOString(),
            },
          ];

      return {
        ...state,
        applications: nextApplications,
      };
    case "ENSURE_APPLICATION": {
      const exists = state.applications.some(
        (item) =>
          item.eventId === action.payload.eventId &&
          item.studentId === action.payload.studentId,
      );

      if (exists) {
        return state;
      }

      const nextApplications = [
        ...state.applications,
        {
          id: `app-${Date.now()}-${action.payload.studentId}`,
          eventId: action.payload.eventId,
          studentId: action.payload.studentId,
          studentName: action.payload.studentName,
          appliedAt: new Date().toISOString(),
        },
      ];

      return {
        ...state,
        applications: nextApplications,
      };
    }
    default:
      return state;
  }
}

function getDefaultEventsState(): EventsState {
  return {
    events: [],
    applications: [],
  };
}

function getInitialEventsState(): EventsState {
  return getDefaultEventsState();
}

interface EventsStoreContextValue {
  events: Event[];
  applications: EventApplication[];
  setEvents: (items: Event[]) => void;
  setApplications: (items: EventApplication[]) => void;
  createEvent: (data: EventFormPayload, organizerId: string) => Event;
  updateEvent: (eventId: string, data: EventFormPayload) => void;
  deleteEvent: (eventId: string) => void;
  assignEventOrganizer: (
    eventId: string,
    organizerId: string,
    organizerEmail: string,
  ) => void;
  applyResults: (eventId: string) => void;
  toggleApplication: (
    eventId: string,
    studentId: string,
    studentName: string,
  ) => void;
  ensureApplication: (
    eventId: string,
    studentId: string,
    studentName: string,
  ) => void;
}

const EventsStoreContext = createContext<EventsStoreContextValue | null>(null);

export function EventsStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    eventsReducer,
    undefined,
    getInitialEventsState,
  );

  const setEvents = useCallback((items: Event[]) => {
    dispatch({ type: "SET_EVENTS", payload: items });
  }, []);

  const setApplications = useCallback((items: EventApplication[]) => {
    dispatch({ type: "SET_APPLICATIONS", payload: items });
  }, []);

  const createEvent = useCallback(
    (data: EventFormPayload, organizerId: string) => {
      const id = `evt-${Date.now()}`;
      const event: Event = {
        ...data,
        id,
        organizerId,
        participantsCount: 0,
        applicationsCount: 0,
        qrCodeUrl: buildEventQrCode(id),
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "CREATE", payload: event });
      return event;
    },
    [],
  );

  const updateEvent = useCallback((eventId: string, data: EventFormPayload) => {
    dispatch({ type: "UPDATE", payload: { eventId, data } });
  }, []);

  const deleteEvent = useCallback((eventId: string) => {
    dispatch({ type: "DELETE", payload: { eventId } });
  }, []);

  const assignEventOrganizer = useCallback(
    (eventId: string, organizerId: string, organizerEmail: string) => {
      dispatch({
        type: "ASSIGN_ORGANIZER",
        payload: { eventId, organizerId, organizerEmail },
      });
    },
    [],
  );

  const applyResults = useCallback((eventId: string) => {
    dispatch({
      type: "APPLY_RESULTS",
      payload: {
        eventId,
      },
    });
  }, []);

  const toggleApplication = useCallback(
    (eventId: string, studentId: string, studentName: string) => {
      dispatch({
        type: "TOGGLE_APPLICATION",
        payload: { eventId, studentId, studentName },
      });
    },
    [],
  );

  const ensureApplication = useCallback(
    (eventId: string, studentId: string, studentName: string) => {
      dispatch({
        type: "ENSURE_APPLICATION",
        payload: { eventId, studentId, studentName },
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      events: state.events,
      applications: state.applications,
      setEvents,
      setApplications,
      createEvent,
      updateEvent,
      deleteEvent,
      assignEventOrganizer,
      applyResults,
      toggleApplication,
      ensureApplication,
    }),
    [
      state.events,
      state.applications,
      setEvents,
      setApplications,
      createEvent,
      updateEvent,
      deleteEvent,
      assignEventOrganizer,
      applyResults,
      toggleApplication,
      ensureApplication,
    ],
  );

  return (
    <EventsStoreContext.Provider value={value}>
      {children}
    </EventsStoreContext.Provider>
  );
}

export function useEventsStore() {
  const context = useContext(EventsStoreContext);
  if (!context) {
    throw new Error("useEventsStore must be used within EventsStoreProvider");
  }
  return context;
}
