import "./ContestWarningModal.css";

export default function ContestWarningModal({ warningState, onResume }) {
  if (!warningState) return null;

  return (
    <div className="contest-warning-overlay">
      <div className="contest-warning-card">
        <div className="contest-warning-icon">⚠️</div>
        <h2>
          Warning {warningState.count} of {warningState.limit}
        </h2>
        <p>
          Leaving fullscreen or switching tabs during a contest is recorded.
          Reaching {warningState.limit} warnings ends your attempt automatically.
        </p>
        <button type="button" className="btn btn-primary" onClick={onResume}>
          Return to Fullscreen & Continue
        </button>
      </div>
    </div>
  );
}