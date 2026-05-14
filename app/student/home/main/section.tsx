"use client";

import { HomePage } from "@/components/student/home-page";
import type { Achievement, AuthUser, Event } from "@/lib/types";
import type { SubscriberPreviewItem } from "@/components/shared/subscribers-preview-card";

interface StudentHomeSectionProps {
  achievements: Achievement[];
  recommendedEvents: Event[];
  user: AuthUser;
  subscribers: SubscriberPreviewItem[];
  onOpenSubscribers: () => void;
  onOpenEvent: (eventId: string) => void;
  onOpenAchievement: (achievementId: string) => void;
  onOpenRecommendedEvents: () => void;
}

export function StudentHomeSection({
  achievements,
  recommendedEvents,
  user,
  subscribers,
  onOpenSubscribers,
  onOpenEvent,
  onOpenAchievement,
  onOpenRecommendedEvents,
}: StudentHomeSectionProps) {
  return (
    <HomePage
      achievements={achievements}
      recommendedEvents={recommendedEvents}
      user={user}
      subscribers={subscribers}
      onOpenSubscribers={onOpenSubscribers}
      onOpenEvent={onOpenEvent}
      onOpenAchievement={onOpenAchievement}
      onOpenRecommendedEvents={onOpenRecommendedEvents}
    />
  );
}
