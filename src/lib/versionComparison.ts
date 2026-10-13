export function changedFields(previous: Record<string, unknown>, current: Record<string, unknown>) {
  return [...new Set([...Object.keys(previous), ...Object.keys(current)])].filter(key => JSON.stringify(previous[key]) !== JSON.stringify(current[key]));
}
