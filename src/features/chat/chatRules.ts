export const MAX_CHAT_MESSAGE_LENGTH = 1000;
export const MAX_BROADCAST_RECIPIENTS = 100;

export function normalizeChatContent(content: string) {
  return content.trim();
}

export function isValidChatContent(content: string) {
  const normalized = normalizeChatContent(content);
  return normalized.length >= 1 && normalized.length <= MAX_CHAT_MESSAGE_LENGTH;
}

export function uniqueRecipientIds(ids: string[]) {
  return [...new Set(ids.filter(Boolean))];
}

export function calculateAge(birthDateValue: string | null, today = new Date()): number | null {
  if (!birthDateValue) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDateValue);
  const birthDate = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(birthDateValue);
  if (Number.isNaN(birthDate.getTime()) || birthDate > today) return null;
  if (dateOnly && (
    birthDate.getFullYear() !== Number(dateOnly[1])
    || birthDate.getMonth() !== Number(dateOnly[2]) - 1
    || birthDate.getDate() !== Number(dateOnly[3])
  )) return null;

  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayPending =
    today.getMonth() < birthDate.getMonth()
    || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  if (birthdayPending) age -= 1;
  return age;
}
