import { BIRTHDAY_VERSES } from './constants';

export const getYoutubeId = (url: string | null) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const getMemberVerse = (memberId: string) => {
  if (!memberId) return BIRTHDAY_VERSES[0];
  let sum = 0;
  for (let i = 0; i < memberId.length; i++) {
    sum += memberId.charCodeAt(i);
  }
  return BIRTHDAY_VERSES[sum % BIRTHDAY_VERSES.length];
};

export const isBirthdayInNext7Days = (birthDateStr: string) => {
  if (!birthDateStr) return false;
  const [, bMonth, bDay] = birthDateStr.split('-').map(Number);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);
  next7Days.setHours(23, 59, 59, 999);

  const currentYear = today.getFullYear();
  const yearsToCheck = [currentYear - 1, currentYear, currentYear + 1];

  for (const year of yearsToCheck) {
    const bday = new Date(year, bMonth - 1, bDay);
    bday.setHours(12, 0, 0, 0);
    if (bday.getTime() >= today.getTime() && bday.getTime() <= next7Days.getTime()) {
      return true;
    }
  }

  return false;
};

export const calculateAgeTurning = (birthDateStr: string) => {
  if (!birthDateStr) return 0;
  const [bYear, bMonth, bDay] = birthDateStr.split('-').map(Number);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);
  next7Days.setHours(23, 59, 59, 999);

  const currentYear = today.getFullYear();
  const yearsToCheck = [currentYear - 1, currentYear, currentYear + 1];

  for (const year of yearsToCheck) {
    const bday = new Date(year, bMonth - 1, bDay);
    bday.setHours(12, 0, 0, 0);
    if (bday.getTime() >= today.getTime() && bday.getTime() <= next7Days.getTime()) {
      return year - bYear;
    }
  }

  return currentYear - bYear;
};

export const getBirthdayTimestampInWindow = (birthDateStr: string) => {
  if (!birthDateStr) return 0;
  const [, bMonth, bDay] = birthDateStr.split('-').map(Number);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);
  next7Days.setHours(23, 59, 59, 999);

  const currentYear = today.getFullYear();
  const yearsToCheck = [currentYear - 1, currentYear, currentYear + 1];

  for (const year of yearsToCheck) {
    const bday = new Date(year, bMonth - 1, bDay);
    bday.setHours(12, 0, 0, 0);
    if (bday.getTime() >= today.getTime() && bday.getTime() <= next7Days.getTime()) {
      return bday.getTime();
    }
  }
  return 0;
};
