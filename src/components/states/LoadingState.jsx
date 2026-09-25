/**
 * Shown while the backend is analyzing. Pure CSS spinner — no libraries.
 */
export default function LoadingState() {
  return (
    <div className="state-card state-loading" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <h3>Analyzing reviews…</h3>
      <p>
        Reading each review, scoring sentiment, and grouping feedback into themes.
        This usually takes a few seconds.
      </p>
    </div>
  );
}
