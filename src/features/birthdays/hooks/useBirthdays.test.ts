import { describe, expect, it } from 'vitest';
import {
  getBirthdayStatusLabel,
  isPublicBirthdayMember,
  toBirthdayInfo,
  type PublicBirthdayMember,
} from './useBirthdays';

const member = (month: number, day: number): PublicBirthdayMember => ({
  id: `${month}-${day}`,
  first_name: 'Ana',
  last_name: 'Pérez',
  photo_url: null,
  birth_month: month,
  birth_day: day,
  ministry_name: 'Damas',
  dedicated_verse: null,
});

describe('birthday calendar rules', () => {
  const today = new Date(2026, 7, 15, 12);

  it('calculates today, tomorrow and the seven-day window using calendar days', () => {
    expect(toBirthdayInfo(member(8, 15), today).status).toBe('today');
    expect(toBirthdayInfo(member(8, 16), today).status).toBe('tomorrow');
    expect(toBirthdayInfo(member(8, 21), today).isThisWeek).toBe(true);
    expect(toBirthdayInfo(member(8, 22), today).isThisWeek).toBe(false);
  });

  it('does not label a birthday that already passed this month as upcoming', () => {
    const birthday = toBirthdayInfo(member(8, 10), today);

    expect(birthday.isThisMonth).toBe(true);
    expect(birthday.hasPassedThisMonth).toBe(true);
    expect(getBirthdayStatusLabel(birthday)).toBe('Ya pasó este mes');
  });

  it('handles the end of the year without timezone drift', () => {
    const birthday = toBirthdayInfo(member(1, 1), new Date(2026, 11, 31, 23, 30));

    expect(birthday.daysRemaining).toBe(1);
    expect(birthday.status).toBe('tomorrow');
  });

  it('treats February 29 as February 28 in non-leap years', () => {
    const birthday = toBirthdayInfo(member(2, 29), new Date(2027, 1, 28, 12));

    expect(birthday.isToday).toBe(true);
    expect(birthday.daysRemaining).toBe(0);
    expect(birthday.status).toBe('today');
  });

  it('rejects malformed public birthday rows', () => {
    expect(isPublicBirthdayMember(member(2, 29))).toBe(true);
    expect(isPublicBirthdayMember({ id: 'bad', first_name: 'Ana', last_name: 'Pérez', birth_month: 13, birth_day: 1 })).toBe(false);
  });
});
