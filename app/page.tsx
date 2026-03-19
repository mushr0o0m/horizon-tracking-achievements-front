'use client';

import { useState } from 'react';
import { CURRENT_STUDENT, INITIAL_ACHIEVEMENTS, INITIAL_EVENTS, LEVEL_SCORES } from '@/lib/data';
import { Achievement, Event, Participant, UserRole, StudentView, OrganizerView, AchievementLevel } from '@/lib/types';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/topbar';
import { HomePage } from '@/components/home-page';
import { DashboardsPage } from '@/components/dashboards-page';
import { AchievementsPage } from '@/components/achievements-page';
import { OrganizerEvents } from '@/components/organizer-events';
import { EventForm } from '@/components/event-form';
import { UploadResults } from '@/components/upload-results';
import { Sparkles } from 'lucide-react';

export default function App() {
  // Shared state — both roles read/write these
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);

  // Role & navigation state
  const [role, setRole] = useState<UserRole>('student');
  const [studentView, setStudentView] = useState<StudentView>('home');
  const [organizerView, setOrganizerView] = useState<OrganizerView>('events');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // ── Student: filter only this student's achievements ──────────────────────
  const studentAchievements = achievements.filter(a => a.studentId === CURRENT_STUDENT.id);

  // ── Demo: simulate publishing results for current student ─────────────────
  const handleSimulateResults = () => {
    const levels: AchievementLevel[] = ['Международный', 'Всероссийский', 'Региональный'];
    const eventTypes = ['Олимпиада', 'Хакатон', 'Конференция', 'Чемпионат'] as const;
    const results = ['1 место', '2 место', '3 место', 'Призёр', 'Медаль'];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const newAch: Achievement = {
      id: `sim-${Date.now()}`,
      title: `Симулированное мероприятие (${type})`,
      level,
      date: new Date().toISOString().split('T')[0],
      result: results[Math.floor(Math.random() * results.length)],
      status: 'Подтверждено',
      studentId: CURRENT_STUDENT.id,
      eventType: type,
      source: 'simulated',
    };
    setAchievements(prev => [newAch, ...prev]);
  };

  // ── Organizer: CRUD ────────────────────────────────────────────────────────
  const handleCreateEvent = (data: Omit<Event, 'id' | 'participantCount'>) => {
    setEvents(prev => [{ ...data, id: `evt-${Date.now()}`, participantCount: 0 }, ...prev]);
    setOrganizerView('events');
  };

  const handleEditEvent = (id: string) => {
    setSelectedEventId(id);
    setOrganizerView('edit-event');
  };

  const handleSaveEdit = (data: Omit<Event, 'id' | 'participantCount'>) => {
    if (!selectedEventId) return;
    setEvents(prev => prev.map(e => e.id === selectedEventId ? { ...e, ...data } : e));
    setSelectedEventId(null);
    setOrganizerView('events');
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleUploadResults = (id: string) => {
    setSelectedEventId(id);
    setOrganizerView('upload-results');
  };

  const handlePublishResults = (eventId: string, participants: Participant[]) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    const newAchievements: Achievement[] = participants.map(p => ({
      id: `ach-${Date.now()}-${p.id}`,
      title: event.title,
      level: event.level,
      date: event.date,
      result: p.result,
      status: 'Подтверждено' as const,
      studentId: p.studentId,
      eventId: event.id,
      eventType: event.type,
      source: 'organizer' as const,
    }));
    setAchievements(prev => [...newAchievements, ...prev]);
    setEvents(prev => prev.map(e =>
      e.id === eventId
        ? { ...e, participantCount: e.participantCount + participants.length, status: 'Опубликовано' as const }
        : e
    ));
    setSelectedEventId(null);
    setOrganizerView('events');
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        role={role}
        studentView={studentView}
        organizerView={organizerView}
        onStudentViewChange={setStudentView}
        onOrganizerViewChange={setOrganizerView}
      />
      <TopBar role={role} onRoleChange={role => { setRole(role); }} />

      <main className="ml-64 mt-16 flex-1 overflow-auto">
        <div className="p-8">
          {role === 'student' && (
            <>
              {/* Simulate button — always visible in student role */}
              <div className="flex justify-end mb-6">
                <button
                  onClick={handleSimulateResults}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Симулировать публикацию результатов
                </button>
              </div>

              {studentView === 'home' && (
                <HomePage achievements={studentAchievements} events={events} />
              )}
              {studentView === 'dashboards' && (
                <DashboardsPage achievements={studentAchievements} />
              )}
              {studentView === 'achievements' && (
                <AchievementsPage achievements={studentAchievements} />
              )}
            </>
          )}

          {role === 'organizer' && (
            <>
              {organizerView === 'events' && (
                <OrganizerEvents
                  events={events}
                  onCreateEvent={() => setOrganizerView('create-event')}
                  onEditEvent={handleEditEvent}
                  onDeleteEvent={handleDeleteEvent}
                  onUploadResults={handleUploadResults}
                />
              )}
              {organizerView === 'create-event' && (
                <EventForm
                  onBack={() => setOrganizerView('events')}
                  onSave={handleCreateEvent}
                />
              )}
              {organizerView === 'edit-event' && selectedEvent && (
                <EventForm
                  initialEvent={selectedEvent}
                  onBack={() => { setOrganizerView('events'); setSelectedEventId(null); }}
                  onSave={handleSaveEdit}
                />
              )}
              {organizerView === 'upload-results' && selectedEvent && (
                <UploadResults
                  event={selectedEvent}
                  onBack={() => { setOrganizerView('events'); setSelectedEventId(null); }}
                  onPublish={handlePublishResults}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
