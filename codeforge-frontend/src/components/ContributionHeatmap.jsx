import "./ContributionHeatmap.css";

function levelFor(count) {
  if (count === 0) return "heat-0";
  if (count <= 2) return "heat-1";
  if (count <= 5) return "heat-2";
  return "heat-3";
}

// Builds a "yyyy-MM-dd" key from the date's own LOCAL year/month/day.
// toISOString() converts to UTC first, which shifts the date backward for
// any timezone ahead of UTC (e.g. IST) — that was the original bug.
function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ContributionHeatmap({ heatmap }) {
  const countByDate = new Map(heatmap.map((h) => [h.date, h.count]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = localDateKey(today);

  const totalDays = 371; // 53 weeks
  const start = new Date(today);
  start.setDate(start.getDate() - (totalDays - 1));
  start.setDate(start.getDate() - start.getDay()); // align to a Sunday

  const days = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const key = localDateKey(cursor);
    days.push({ date: key, count: countByDate.get(key) || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // A column gets a month label only on the week where that month's 1st day
  // actually falls — checked against EVERY day in the week, not just the
  // week's Sunday, so a month that starts mid-week is never missed or
  // attributed to the wrong column.
  let lastLabeledMonth = null;
  const columnLabels = weeks.map((week) => {
    const firstOfMonthDay = week.find((day) => day.date.endsWith("-01"));
    if (!firstOfMonthDay) return null;

    const monthKey = firstOfMonthDay.date.slice(0, 7); // "yyyy-MM"
    if (monthKey === lastLabeledMonth) return null;
    lastLabeledMonth = monthKey;

    const [y, m] = firstOfMonthDay.date.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleString("default", {
      month: "short",
    });
  });

  return (
    <div className="heatmap-wrapper">
      <div className="heatmap-inner">
        <div className="heatmap-row">
          {weeks.map((week, colIdx) => (
            <div key={colIdx} className="heatmap-column heatmap-label-column">
              {columnLabels[colIdx] && (
                <span className="heatmap-month-text">{columnLabels[colIdx]}</span>
              )}
            </div>
          ))}
        </div>
        <div className="heatmap-row">
          {weeks.map((week, colIdx) => (
            <div key={colIdx} className="heatmap-column">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`heatmap-cell ${levelFor(day.count)} ${
                    day.date === todayKey ? "heatmap-cell-today" : ""
                  }`}
                  title={`${day.date}: ${day.count} submission${day.count === 1 ? "" : "s"}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}