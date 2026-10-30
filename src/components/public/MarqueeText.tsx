import { CalendarDays } from 'lucide-react';
import type { Schedule } from '../../types';

interface MarqueeTextProps {
  schedules: Schedule[];
}

export default function MarqueeText({ schedules }: MarqueeTextProps) {
  const announcements = schedules
    .map((schedule) => {
      const day = schedule.day.trim();
      const title = schedule.title.trim();
      const time = schedule.time_range.trim();
      if (!day || !title || !time) return null;
      return { id: schedule.id, label: `${day} · ${title} · ${time}` };
    })
    .filter((item): item is { id: string; label: string } => item !== null)
    .slice(0, 6);

  if (announcements.length === 0) return null;

  return (
    <section aria-label="Horarios de reuniones" className="border-y border-white/10 bg-primary py-4 text-white">
      <ul className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-8 gap-y-3 px-5 text-center text-xs font-bold uppercase tracking-[.1em] sm:text-sm">
        {announcements.map(({ id, label }) => (
          <li key={id} className="inline-flex items-center gap-2">
            <CalendarDays size={15} className="text-amber-300" aria-hidden="true" />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
