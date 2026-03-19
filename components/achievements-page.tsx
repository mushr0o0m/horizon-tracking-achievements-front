'use client';

import { Achievement, EventType } from '@/lib/types';
import { useMemo, useState } from 'react';
import { Search, ChevronUp, ChevronDown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AchievementsPageProps {
  achievements: Achievement[];
}

type SortField = 'title' | 'date' | 'level';
type SortOrder = 'asc' | 'desc';
type Tab = 'table' | 'badges';

const EVENT_TYPES: EventType[] = ['Олимпиада', 'Конкурс', 'Хакатон', 'Конференция', 'Чемпионат', 'Другое'];

// Badge definitions — each badge has an unlock condition based on achievements
const BADGE_DEFINITIONS = [
  {
    id: 'first-hackathon',
    title: 'Первый хакатон',
    description: 'Участвовать в хакатоне',
    condition: (a: Achievement[]) => a.some(x => x.eventType === 'Хакатон'),
  },
  {
    id: 'first-olympiad',
    title: 'Первая олимпиада',
    description: 'Участвовать в олимпиаде',
    condition: (a: Achievement[]) => a.some(x => x.eventType === 'Олимпиада'),
  },
  {
    id: 'first-conference',
    title: 'Первое выступление',
    description: 'Участвовать в конференции',
    condition: (a: Achievement[]) => a.some(x => x.eventType === 'Конференция'),
  },
  {
    id: 'international',
    title: 'Международный уровень',
    description: 'Получить международное достижение',
    condition: (a: Achievement[]) => a.some(x => x.level === 'Международный' && x.status === 'Подтверждено'),
  },
  {
    id: 'all-russia',
    title: 'Всероссийский масштаб',
    description: 'Получить всероссийское достижение',
    condition: (a: Achievement[]) => a.some(x => x.level === 'Всероссийский' && x.status === 'Подтверждено'),
  },
  {
    id: 'top-result',
    title: 'Призовое место',
    description: 'Занять 1, 2 или 3 место',
    condition: (a: Achievement[]) => a.some(x => /[123] место/.test(x.result)),
  },
  {
    id: 'five-achievements',
    title: 'Коллекционер',
    description: 'Накопить 5 подтверждённых достижений',
    condition: (a: Achievement[]) => a.filter(x => x.status === 'Подтверждено').length >= 5,
  },
  {
    id: 'champion',
    title: 'Чемпион',
    description: 'Участвовать в чемпионате',
    condition: (a: Achievement[]) => a.some(x => x.eventType === 'Чемпионат'),
  },
];

const BADGE_ICONS: Record<string, string> = {
  'first-hackathon': '⌨',
  'first-olympiad': '★',
  'first-conference': '◉',
  'international': '◆',
  'all-russia': '▲',
  'top-result': '✦',
  'five-achievements': '●',
  'champion': '◈',
};

export function AchievementsPage({ achievements }: AchievementsPageProps) {
  const [tab, setTab] = useState<Tab>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedEventType, setSelectedEventType] = useState<EventType | ''>('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const filteredData = useMemo(() => {
    let data = achievements.filter(a => {
      const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
      const year = new Date(a.date).getFullYear().toString();
      const matchesYear = !selectedYear || year === selectedYear;
      const matchesEventType = !selectedEventType || a.eventType === selectedEventType;
      return matchesSearch && matchesYear && matchesEventType;
    });

    data.sort((a, b) => {
      let aVal: string | number, bVal: string | number;
      if (sortField === 'date') {
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
      } else if (sortField === 'title') {
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
      } else {
        aVal = a.level;
        bVal = b.level;
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [searchQuery, selectedYear, selectedEventType, sortField, sortOrder, achievements]);

  const years = Array.from(
    new Set(achievements.map(a => new Date(a.date).getFullYear().toString()))
  ).sort().reverse();

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />;
  };

  const badges = BADGE_DEFINITIONS.map(b => ({
    ...b,
    unlocked: b.condition(achievements),
  }));

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-3xl font-bold text-foreground mb-1">Достижения</h2>
        <p className="text-muted-foreground">Все ваши достижения и заработанные значки</p>
      </section>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit">
        {(['table', 'badges'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-2 rounded-md text-sm font-medium transition-colors',
              tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t === 'table' ? 'Таблица' : 'Значки'}
          </button>
        ))}
      </div>

      {tab === 'table' && (
        <>
          {/* Filters */}
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Поиск по названию"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer text-sm"
              >
                <option value="">Все годы</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select
                value={selectedEventType}
                onChange={e => setSelectedEventType(e.target.value as EventType | '')}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer text-sm"
              >
                <option value="">Все типы</option>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="px-5 py-3 text-left text-sm font-semibold text-foreground cursor-pointer" onClick={() => handleSort('title')}>
                      Название <SortIcon field="title" />
                    </th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">Тип мероприятия</th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">Уровень</th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-foreground cursor-pointer" onClick={() => handleSort('date')}>
                      Год <SortIcon field="date" />
                    </th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">Результат</th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">Статус</th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">Источник</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? filteredData.map(a => (
                    <tr key={a.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-foreground">{a.title}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{a.eventType ?? '—'}</td>
                      <td className="px-5 py-4 text-sm text-foreground">{a.level}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{new Date(a.date).getFullYear()}</td>
                      <td className="px-5 py-4 text-sm text-foreground">{a.result}</td>
                      <td className="px-5 py-4 text-sm">
                        {a.status === 'Подтверждено' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--verified-bg)] text-[var(--verified)]">Подтверждено</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--pending-bg)] text-[var(--pending)]">На проверке</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">Добавлено организатором</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                        Нет достижений, соответствующих фильтрам
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'badges' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {badges.map(badge => (
            <div
              key={badge.id}
              className={cn(
                'bg-card border rounded-xl p-5 flex flex-col items-center text-center gap-3 transition-all',
                badge.unlocked
                  ? 'border-primary/30 shadow-sm'
                  : 'border-border opacity-50 grayscale'
              )}
            >
              <div
                className={cn(
                  'w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold',
                  badge.unlocked ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'
                )}
              >
                {badge.unlocked ? BADGE_ICONS[badge.id] : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{badge.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
              </div>
              {badge.unlocked && (
                <span className="text-xs font-medium text-[var(--verified)] bg-[var(--verified-bg)] px-2.5 py-0.5 rounded-full">
                  Получено
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
