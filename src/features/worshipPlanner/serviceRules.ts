export type WorshipRuleFrequency = 'monthly_nth_weekday' | 'weekly';

export interface WorshipRule {
  id: string;
  name: string;
  frequency: WorshipRuleFrequency;
  weekday: number;
  weekOfMonth: number | null;
  monthOfYear: number | null;
  title: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  priority: number;
  active: boolean;
}

export interface WorshipServiceDraft {
  serviceDate: string;
  title: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  ruleId: string;
  ruleName: string;
  priority: number;
}

export const DEFAULT_WORSHIP_RULES: WorshipRule[] = [
  {
    id: 'default-first-sunday-communion',
    name: 'Santa Cena · primer domingo',
    frequency: 'monthly_nth_weekday',
    weekday: 0,
    weekOfMonth: 1,
    monthOfYear: null,
    title: 'Culto dominical · Santa Cena',
    serviceType: 'santa_cena',
    startTime: '10:00',
    endTime: '12:00',
    priority: 20,
    active: true,
  },
  {
    id: 'default-third-sunday-missions',
    name: 'Culto misionero · tercer domingo',
    frequency: 'monthly_nth_weekday',
    weekday: 0,
    weekOfMonth: 3,
    monthOfYear: null,
    title: 'Culto dominical · Misiones',
    serviceType: 'misionero',
    startTime: '10:00',
    endTime: '12:00',
    priority: 20,
    active: true,
  },
];

const toUtcDate = (date: string): Date => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);

export const getNthWeekdayOfMonth = (
  year: number,
  monthIndex: number,
  weekday: number,
  ordinal: number,
): string | null => {
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) return null;
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return null;
  if (!Number.isInteger(ordinal) || ordinal < 1 || ordinal > 5) return null;

  const first = new Date(Date.UTC(year, monthIndex, 1));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  const day = 1 + offset + ((ordinal - 1) * 7);
  const candidate = new Date(Date.UTC(year, monthIndex, day));
  return candidate.getUTCMonth() === monthIndex ? toDateKey(candidate) : null;
};

export const matchesWorshipRule = (date: string, rule: WorshipRule): boolean => {
  if (!rule.active) return false;
  const parsed = toUtcDate(date);
  if (Number.isNaN(parsed.getTime())) return false;
  if (parsed.getUTCDay() !== rule.weekday) return false;
  if (rule.monthOfYear !== null && parsed.getUTCMonth() + 1 !== rule.monthOfYear) return false;

  if (rule.frequency === 'weekly') return true;
  if (rule.weekOfMonth === null) return false;
  return getNthWeekdayOfMonth(parsed.getUTCFullYear(), parsed.getUTCMonth(), rule.weekday, rule.weekOfMonth) === date;
};

export const generateWorshipServiceDrafts = (
  startDate: string,
  endDate: string,
  rules: WorshipRule[],
): WorshipServiceDraft[] => {
  const start = toUtcDate(startDate);
  const end = toUtcDate(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];

  const drafts: WorshipServiceDraft[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const date = toDateKey(cursor);
    rules
      .filter((rule) => matchesWorshipRule(date, rule))
      .sort((left, right) => right.priority - left.priority || left.startTime.localeCompare(right.startTime))
      .forEach((rule) => drafts.push({
        serviceDate: date,
        title: rule.title,
        serviceType: rule.serviceType,
        startTime: rule.startTime,
        endTime: rule.endTime,
        ruleId: rule.id,
        ruleName: rule.name,
        priority: rule.priority,
      }));
  }
  return drafts;
};
