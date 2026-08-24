import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { DashboardServiceNeed, TalentDirectoryEntry } from '../types';

interface ServiceShiftRow {
  id: string;
  title: string;
  category: string | null;
  location: string | null;
  start_time: string;
  required_volunteers: number | null;
  skills_needed: string[] | null;
}

interface AssignmentRow {
  shift_id: string;
  status: string | null;
}

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('es')
  .trim();

const skillMatches = (directory: TalentDirectoryEntry[], skill: string) => {
  const normalizedSkill = normalize(skill);
  return directory.some((entry) => {
    const talent = normalize(entry.talentName);
    return talent === normalizedSkill || talent.includes(normalizedSkill) || normalizedSkill.includes(talent);
  });
};

export const buildDashboardServiceNeeds = (
  shifts: ServiceShiftRow[],
  assignments: AssignmentRow[],
  directory: TalentDirectoryEntry[],
): DashboardServiceNeed[] => {
  const confirmedByShift = new Map<string, number>();
  assignments.forEach((assignment) => {
    if (['confirmed', 'accepted', 'attended'].includes(normalize(assignment.status ?? ''))) {
      confirmedByShift.set(assignment.shift_id, (confirmedByShift.get(assignment.shift_id) ?? 0) + 1);
    }
  });

  return shifts.map((shift) => {
    const skillsNeeded = (shift.skills_needed ?? []).map((skill) => skill.trim()).filter(Boolean);
    const matchedSkills = skillsNeeded.filter((skill) => skillMatches(directory, skill));
    const matchedPeople = new Set(
      directory
        .filter((entry) => skillsNeeded.some((skill) => {
          const talent = normalize(entry.talentName);
          const needed = normalize(skill);
          return talent === needed || talent.includes(needed) || needed.includes(talent);
        }))
        .map((entry) => entry.memberId),
    ).size;

    return {
      id: shift.id,
      title: shift.title,
      category: shift.category || 'general',
      location: shift.location,
      startTime: shift.start_time,
      requiredVolunteers: Math.max(1, shift.required_volunteers ?? 1),
      confirmedVolunteers: confirmedByShift.get(shift.id) ?? 0,
      skillsNeeded,
      matchedPeople,
      matchedSkills,
    };
  });
};

export const useDashboardServiceNeeds = (enabled: boolean, directory: TalentDirectoryEntry[]) => useQuery({
  queryKey: ['dashboard-service-needs', enabled, directory],
  enabled,
  queryFn: async () => {
    const now = new Date().toISOString();
    const shiftsRes = await supabase
      .from('volunteer_shifts')
      .select('id, title, category, location, start_time, required_volunteers, skills_needed')
      .gte('start_time', now)
      .order('start_time', { ascending: true })
      .limit(8);

    if (shiftsRes.error) throw shiftsRes.error;

    const shifts = (shiftsRes.data ?? []) as ServiceShiftRow[];
    if (!shifts.length) return [];

    const assignmentsRes = await supabase
      .from('volunteer_assignments')
      .select('shift_id, status')
      .in('shift_id', shifts.map((shift) => shift.id));

    if (assignmentsRes.error) throw assignmentsRes.error;

    return buildDashboardServiceNeeds(shifts, (assignmentsRes.data ?? []) as AssignmentRow[], directory);
  },
  staleTime: 60 * 1000,
});
