export const getLocalDateKey = (ts: number = Date.now()) => {
  const date = new Date(ts);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const getDateKeyOffset = (offsetDays: number, baseKey?: string) => {
  const date = baseKey ? parseDateKey(baseKey) : new Date();
  date.setDate(date.getDate() + offsetDays);
  return getLocalDateKey(date.getTime());
};

export const formatDateHeading = (dateKey: string) => {
  const date = parseDateKey(dateKey);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export const formatDateLong = (dateKey: string) => {
  const date = parseDateKey(dateKey);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};

export const formatSessionDateLabel = (dateKey: string, todayKey?: string) => {
  const today = todayKey ?? getLocalDateKey();
  if (dateKey === today) return "Today";
  const yesterday = getDateKeyOffset(-1, today);
  if (dateKey === yesterday) return "Yesterday";
  return formatDateHeading(dateKey);
};

export const formatShortTime = (ts: number) => {
  const date = new Date(ts);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};
