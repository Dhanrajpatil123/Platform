import "./Donut3D.css";

// data: [{ label, value, color }]. Renders a tilted pseudo-3D donut built
// from a conic-gradient, with a darker offset layer behind it to fake depth
// — no charting library, just layered CSS.
export default function Donut3D({ data, centerLabel, centerValue }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  let cursor = 0;
  const stops = data.map((d) => {
    const share = total > 0 ? (d.value / total) * 360 : 0;
    const stop = `${d.color} ${cursor}deg ${cursor + share}deg`;
    cursor += share;
    return stop;
  });

  const gradient = total > 0 ? `conic-gradient(${stops.join(", ")})` : "#2a2a3d";

  return (
    <div className="donut3d-wrapper">
      <div className="donut3d-stage">
        <div className="donut3d-base" style={{ background: gradient }} />
        <div className="donut3d-top" style={{ background: gradient }}>
          <div className="donut3d-hole">
            <span className="donut3d-center-value">{centerValue}</span>
            <span className="donut3d-center-label">{centerLabel}</span>
          </div>
        </div>
      </div>

      <div className="donut3d-legend">
        {data.map((d) => (
          <div key={d.label} className="donut3d-legend-row">
            <span className="donut3d-legend-dot" style={{ backgroundColor: d.color }} />
            <span className="donut3d-legend-label">{d.label}</span>
            <span className="donut3d-legend-value">
              {d.value} ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}