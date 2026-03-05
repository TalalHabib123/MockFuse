export function formatMeaningfulTime(input?: string | number | null): string {
  if (input === null || input === undefined || input === "") return "—";

  const date = parseTimestamp(input);
  if (!date) return String(input);

  const now = Date.now();
  const diffMs = now - date.getTime();

  // future / invalid weirdness fallback
  if (diffMs < 0) {
    return formatAbsolute(date);
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < 30 * 1000) return "Just now";
  if (diffMs < minute) return `${Math.floor(diffMs / 1000)} sec ago`;
  if (diffMs < hour) {
    const m = Math.floor(diffMs / minute);
    return `${m} min${m === 1 ? "" : "s"} ago`;
  }
  if (diffMs < day) {
    const h = Math.floor(diffMs / hour);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  if (diffMs < 2 * day) return "Yesterday";
  if (diffMs < 7 * day) {
    const d = Math.floor(diffMs / day);
    return `${d} day${d === 1 ? "" : "s"} ago`;
  }

  return formatAbsolute(date);
}

function parseTimestamp(input: string | number): Date | null {
  // number input
  if (typeof input === "number") {
    return new Date(input > 1e12 ? input : input * 1000);
  }

  const value = input.trim();
  if (!value) return null;

  // unix timestamp as string
  if (/^\d+$/.test(value)) {
    const num = Number(value);
    return new Date(num > 1e12 ? num : num * 1000);
  }

  // ISO / date string
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

function formatAbsolute(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}