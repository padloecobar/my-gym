export const KG_TO_LB = 2.2046226218;
export const LB_TO_KG = 1 / KG_TO_LB;

export const kgToLb = (kg: number) => kg * KG_TO_LB;
export const lbToKg = (lb: number) => lb * LB_TO_KG;

export const formatKg = (value: number) => value.toFixed(2);

export const formatLb = (value: number) => kgToLb(value).toFixed(2);

export const formatWeight = (valueKg: number) => `${formatKg(valueKg)} kg / ${formatLb(valueKg)} lb`;

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
