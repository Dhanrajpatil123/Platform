export function parseLocalDate(value) {
  const [y, m, d] = String(value).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(value) {
  return parseLocalDate(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function todayLocal() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

function daysBetween(a, b) {
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

export function timelineText(status, startDate, endDate) {
  const today = todayLocal();
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  if (status === "UPCOMING") {
    const d = daysBetween(today, start);
    return d === 1 ? "Starts tomorrow" : `Starts in ${d} days`;
  }
  if (status === "ONGOING") {
    const total = daysBetween(start, end) + 1;
    const day = daysBetween(start, today) + 1;
    return `Day ${day} of ${total}`;
  }
  return "Completed";
}