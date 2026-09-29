const TYPES = ['ENTRY', 'LUNCH_START', 'LUNCH_END', 'EXIT'];
export const LABELS = { ENTRY: 'Entrada', LUNCH_START: 'Saída para almoço', LUNCH_END: 'Volta do almoço', EXIT: 'Saída' };

export function nextType(punches) {
  return TYPES.find(type => !punches.some(p => p.punch_type === type)) || null;
}

export function toMinutes(date) { return date.getHours() * 60 + date.getMinutes(); }
export function formatMinutes(minutes) {
  const signal = minutes < 0 ? '-' : '';
  const value = Math.abs(minutes);
  return `${signal}${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

export function summarize(employee, punches) {
  const byType = Object.fromEntries(punches.map(p => [p.punch_type, new Date(p.punched_at)]));
  let worked = 0;
  if (byType.ENTRY && byType.LUNCH_START) worked += Math.round((byType.LUNCH_START - byType.ENTRY) / 60000);
  if (byType.LUNCH_END && byType.EXIT) worked += Math.round((byType.EXIT - byType.LUNCH_END) / 60000);
  const complete = TYPES.every(type => byType[type]);
  return { byType, worked, complete, balance: complete ? worked - employee.daily_workload_minutes : null };
}
