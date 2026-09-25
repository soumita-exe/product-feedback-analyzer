/**
 * Shown when analysis fails. Explains what happened and offers a retry.
 */
export default function ErrorState({ message, onRetry }) {
  return (
    <div className="state-card state-error" role="alert">
      <div className="state-emoji" aria-hidden="true">
        ⚠️
      </div>
      <h3>Analysis failed</h3>
      <p>{message}</p>
      <button type="button" className="button button-primary" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
