"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchOrganizerEventParticipants,
  fetchPublicOrganizerProfile,
} from "@/lib/backend-api";
import type {
  Event,
  EventApplication,
  OrganizerOrganizationProfile,
} from "@/lib/types";

const participantsCache = new Map<string, EventApplication[]>();
const organizerProfileCache = new Map<string, OrganizerOrganizationProfile | null>();

export function resetOrganizerEventDetailsCache() {
  participantsCache.clear();
  organizerProfileCache.clear();
}

export function useOrganizerEventDetailsPage(event?: Event | null) {
  const [applications, setApplications] = useState<EventApplication[]>([]);
  const [organizerInfo, setOrganizerInfo] =
    useState<OrganizerOrganizationProfile | null>(null);
  const [isParticipantsLoading, setIsParticipantsLoading] = useState(false);
  const [isOrganizerInfoLoading, setIsOrganizerInfoLoading] = useState(false);

  useEffect(() => {
    if (!event?.id) {
      setApplications([]);
      return;
    }

    const cached = participantsCache.get(event.id);
    if (cached) {
      setApplications(cached);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsParticipantsLoading(true);
      try {
        const data = await fetchOrganizerEventParticipants(event.id);
        if (!cancelled) {
          setApplications(data);
          participantsCache.set(event.id, data);
        }
      } catch (error) {
        if (!cancelled) {
          setApplications([]);
          participantsCache.set(event.id, []);
        }
      } finally {
        if (!cancelled) {
          setIsParticipantsLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [event?.id]);

  useEffect(() => {
    if (!event?.organizerId) {
      setOrganizerInfo(null);
      return;
    }

    if (organizerProfileCache.has(event.organizerId)) {
      setOrganizerInfo(organizerProfileCache.get(event.organizerId) ?? null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsOrganizerInfoLoading(true);
      try {
        const data = await fetchPublicOrganizerProfile(event.organizerId);
        if (!cancelled) {
          setOrganizerInfo(data);
          organizerProfileCache.set(event.organizerId, data);
        }
      } catch (error) {
        if (!cancelled) {
          setOrganizerInfo(null);
          organizerProfileCache.set(event.organizerId, null);
        }
      } finally {
        if (!cancelled) {
          setIsOrganizerInfoLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [event?.organizerId]);

  const eventOrganizerInfo = useMemo(() => {
    if (!event) return undefined;

    if (organizerInfo) {
      return {
        organizationName: organizerInfo.organizationName,
        shortName: organizerInfo.shortName || undefined,
        organizationType: organizerInfo.organizationType || undefined,
        description: organizerInfo.description || undefined,
        website: organizerInfo.website || undefined,
        contactEmail: organizerInfo.contactEmail || event.contactEmail,
        contactPhone: organizerInfo.contactPhone || undefined,
      };
    }

    return {
      organizationName: "Организатор",
      contactEmail: event.contactEmail,
    };
  }, [event, organizerInfo]);

  return {
    applications,
    organizerInfo: eventOrganizerInfo,
    isParticipantsLoading,
    isOrganizerInfoLoading,
  };
}
