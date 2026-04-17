import { Achievement } from "@/lib/types";

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  imagePath?: string;
  condition: (achievements: Achievement[]) => boolean;
}

export interface BadgeViewModel extends BadgeDefinition {
  unlocked: boolean;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first-hackathon",
    title: "Первый хакатон",
    description: "Участвовать в хакатоне",
    icon: "⌨",
    imagePath: "/images/collectables/first-hackathon-wreath.png",
    condition: (items) => items.some((x) => x.eventType === "Хакатон"),
  },
  {
    id: "first-olympiad",
    title: "Первая олимпиада",
    description: "Участвовать в олимпиаде",
    icon: "★",
    imagePath: "/images/collectables/first-olympiad-star.png",
    condition: (items) => items.some((x) => x.eventType === "Олимпиада"),
  },
  {
    id: "first-conference",
    title: "Первое выступление",
    description: "Участвовать в конференции",
    icon: "◉",
    imagePath: "/images/collectables/first-conference-book.png",
    condition: (items) => items.some((x) => x.eventType === "Конференция"),
  },
  {
    id: "international",
    title: "Международный уровень",
    description: "Получить международное достижение",
    icon: "◆",
    imagePath: "/images/collectables/international-globe.png",
    condition: (items) =>
      items.some(
        (x) => x.level === "Международный" && x.status === "Подтверждено",
      ),
  },
  {
    id: "all-russia",
    title: "Всероссийский масштаб",
    description: "Получить всероссийское достижение",
    icon: "▲",
    imagePath: "/images/collectables/all-russia-shield.png",
    condition: (items) =>
      items.some(
        (x) => x.level === "Всероссийский" && x.status === "Подтверждено",
      ),
  },
  {
    id: "top-result",
    title: "Призовое место",
    description: "Занять 1, 2 или 3 место",
    icon: "✦",
    imagePath: "/images/collectables/top-result-cup.png",
    condition: (items) => items.some((x) => /[123] место/.test(x.result)),
  },
  {
    id: "five-achievements",
    title: "Коллекционер",
    description: "Накопить 5 подтверждённых достижений",
    icon: "●",
    imagePath: "/images/collectables/collector-chest.png",
    condition: (items) =>
      items.filter((x) => x.status === "Подтверждено").length >= 5,
  },
  {
    id: "champion",
    title: "Чемпион",
    description: "Участвовать в чемпионате",
    icon: "◈",
    imagePath: "/images/collectables/champion-rocket.png",
    condition: (items) => items.some((x) => x.eventType === "Чемпионат"),
  },
];

export function buildBadgeViewModels(
  achievements: Achievement[],
): BadgeViewModel[] {
  return BADGE_DEFINITIONS.map((definition) => ({
    ...definition,
    unlocked: definition.condition(achievements),
  }));
}
