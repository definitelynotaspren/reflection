
import type { AnalyzedEntry, CheckIn } from '../types';

const ANALYZED_ENTRIES_KEY = 'mindfulReflections_analyzedEntries';
const SCHEDULED_CHECKINS_KEY = 'mindfulReflections_scheduledCheckIns';

// Helper to get items from localStorage
const getItem = <T,>(key: string): T[] => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) as T[] : [];
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return [];
  }
};

// Helper to set items to localStorage
const setItem = <T,>(key: string, value: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
  }
};

// Analyzed Entries
export const getAnalyzedEntries = (): AnalyzedEntry[] => {
  const entries = getItem<AnalyzedEntry>(ANALYZED_ENTRIES_KEY);
  // Ensure dates are Date objects
  return entries.map(entry => ({
    ...entry,
    timestamp: new Date(entry.timestamp),
    journalEntry: {
        ...entry.journalEntry,
        timestamp: new Date(entry.journalEntry.timestamp)
    }
  })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort by most recent analysis
};

export const saveAnalyzedEntry = (entry: AnalyzedEntry): void => {
  const entries = getAnalyzedEntries();
  // Avoid duplicates if re-processing somehow, though App.tsx logic should prevent this
  if (!entries.find(e => e.id === entry.id)) {
    setItem<AnalyzedEntry>(ANALYZED_ENTRIES_KEY, [entry, ...entries]);
  }
};

// Scheduled Check-Ins
export const getScheduledCheckIns = (): CheckIn[] => {
  const checkIns = getItem<CheckIn>(SCHEDULED_CHECKINS_KEY);
  // Ensure dates are Date objects
  return checkIns.map(ci => ({
    ...ci,
    createdAt: new Date(ci.createdAt),
    responses: (ci.responses || []).map(r => ({...r, respondedAt: new Date(r.respondedAt)}))
  })).sort((a,b) => { // Sort by status (pending first), then by creation date (most recent pending first)
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

export const saveScheduledCheckIn = (checkIn: CheckIn): void => {
  const checkIns = getScheduledCheckIns();
   // Avoid duplicates
  if (!checkIns.find(c => c.id === checkIn.id)) {
    setItem<CheckIn>(SCHEDULED_CHECKINS_KEY, [checkIn, ...checkIns]);
  }
};

export const updateScheduledCheckIn = (updatedCheckIn: CheckIn): void => {
  let checkIns = getScheduledCheckIns();
  checkIns = checkIns.map(ci => ci.id === updatedCheckIn.id ? updatedCheckIn : ci);
  setItem<CheckIn>(SCHEDULED_CHECKINS_KEY, checkIns);
};

export const deleteScheduledCheckIn = (checkInId: string): void => {
  let checkIns = getScheduledCheckIns();
  checkIns = checkIns.filter(ci => ci.id !== checkInId);
  setItem<CheckIn>(SCHEDULED_CHECKINS_KEY, checkIns);
};
