import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getContestReport } from "../../api/adminContestApi";
import "./ContestReport.css";
import Donut3D from "../../components/Donut3D";


const YEAR_LABELS = {
  FIRST_YEAR: "1st Year",
  SECOND_YEAR: "2nd Year",
  THIRD_YEAR: "3rd Year",
  FOURTH_YEAR: "4th Year",
  UNSPECIFIED: "Year not set",
};

export default function ContestReport() {
  const { contestId } = useParams();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await getContestReport(contestId);
        setReport(response.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load report.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [contestId]);

  if (isLoading) return <p className="placeholder-text">Loading report...</p>;
  if (error) return <p className="manage-form-error">{error}</p>;
  if (!report) return null;

  const maxAvgPercent = Math.max(...report.yearBreakdown.map((y) => y.avgSolvedPercent), 1);


const handleExportCsv = () => {
  const header = ["Year", "Registered", "Started", "Finished", "Avg Solved", "Avg Solved %", "Avg Time Taken (min)"];
  const rows = report.yearBreakdown.map((y) => [
    YEAR_LABELS[y.year] || y.year,
    y.registered,
    y.started,
    y.ended,
    y.avgSolved,
    y.avgSolvedPercent,
    y.avgTimeTakenMinutes ?? "",
  ]);

  const csvLines = [header, ...rows].map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
  );
  const csvContent = csvLines.join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${report.contestTitle.replace(/[^a-z0-9]/gi, "_")}_report.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};



  return (
    <div className="contest-report-page">
      <div className="manage-header">
        <h1>{report.contestTitle} — Report</h1>

        <div className="manage-header-actions no-print">
          <button type="button" className="btn btn-secondary" onClick={handleExportCsv}>
            ⬇ Export CSV
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
            🖨 Print / Save as PDF
          </button>
          <Link to="/admin/contests" className="btn btn-secondary">
            Back to Manage Contests
          </Link>

          <Link to={`/contests/${contestId}/leaderboard`} className="btn btn-secondary report-leaderboard-link no-print">
            View Full Leaderboard
          </Link>

        </div>


      </div>

      <div className="report-summary-row">
        <div className="report-summary-card">
          <span className="report-summary-number">{report.totalRegistered}</span>
          <span className="report-summary-label">Registered</span>
        </div>
        <div className="report-summary-card">
          <span className="report-summary-number">{report.totalStarted}</span>
          <span className="report-summary-label">Started</span>
        </div>
        <div className="report-summary-card">
          <span className="report-summary-number">{report.totalEnded}</span>
          <span className="report-summary-label">Finished</span>
        </div>
        <div className="report-summary-card">
          <span className="report-summary-number">{report.totalProblems}</span>
          <span className="report-summary-label">Problems</span>
        </div>
      </div>


      <h2 className="report-section-title">Registrations by Year</h2>
        <Donut3D
          data={report.yearBreakdown.map((y, idx) => ({
            label: YEAR_LABELS[y.year] || y.year,
            value: y.registered,
            color: ["#00e5ff", "#ffbd2e", "#ff5f56", "#27c93f", "#9ca3af"][idx % 5],
          }))}
          centerLabel="Registered"
          centerValue={report.totalRegistered}
        />


      <h2 className="report-section-title">Average Score by Year</h2>

      {report.yearBreakdown.length === 0 && (
        <p className="placeholder-text">No one has registered for this contest yet.</p>
      )}

      <div className="report-bar-chart">
        {report.yearBreakdown.map((y) => (
          <div key={y.year} className="report-bar-row">
            <span className="report-bar-label">{YEAR_LABELS[y.year] || y.year}</span>
            <div className="report-bar-track">
              <div
                className="report-bar-fill"
                style={{ width: `${(y.avgSolvedPercent / maxAvgPercent) * 100}%` }}
              />
            </div>
            <span className="report-bar-value">{y.avgSolvedPercent}%</span>
          </div>
        ))}
      </div>

      {report.yearBreakdown.length > 0 && (
        <table className="manage-table report-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Registered</th>
              <th>Started</th>
              <th>Finished</th>
              <th>Avg Solved</th>
              <th>Avg Time Taken</th>
            </tr>
          </thead>
          <tbody>
            {report.yearBreakdown.map((y) => (
              <tr key={y.year}>
                <td>{YEAR_LABELS[y.year] || y.year}</td>
                <td>{y.registered}</td>
                <td>{y.started}</td>
                <td>{y.ended}</td>
                <td>
                  {y.avgSolved} / {report.totalProblems} ({y.avgSolvedPercent}%)
                </td>
                <td>{y.avgTimeTakenMinutes != null ? `${y.avgTimeTakenMinutes} min` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Link to={`/contests/${contestId}/leaderboard`} className="btn btn-secondary report-leaderboard-link">
        View Full Leaderboard
      </Link>
    </div>
  );
}