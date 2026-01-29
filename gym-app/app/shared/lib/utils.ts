export const KG_TO_LB = 2.20462;

export const formatKg = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  return rounded % 1 === 0 ? String(rounded.toFixed(0)) : rounded.toFixed(1);
};

export const formatLb = (value: number) => {
  const lb = value * KG_TO_LB;
  const rounded = Math.round(lb * 10) / 10;
  return rounded % 1 === 0 ? String(rounded.toFixed(0)) : rounded.toFixed(1);
};

export const formatDate = (timestamp: number, opts?: Intl.DateTimeFormatOptions) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...opts,
  }).format(new Date(timestamp));
};

export const formatTime = (timestamp: number) => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
};

export const byDateDesc = <T extends { endedAt?: number; startedAt: number }>(a: T, b: T) => {
  const aTime = a.endedAt ?? a.startedAt;
  const bTime = b.endedAt ?? b.startedAt;
  return bTime - aTime;
};

export const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
};

export const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};
