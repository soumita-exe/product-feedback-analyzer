"use client";

/**
 * Review input panel: textarea + action buttons.
 * - "Load Demo Reviews" fills the box with sample data (great for demos).
 * - "Analyze Feedback" sends the text to the backend.
 * - "Reset" clears everything.
 */
export default function ReviewInput({
  value,
  onChange,
  onAnalyze,
  onLoadDemo,
  onReset,
  disabled = false,
  hasAnythingToClear = false,
}) {
  const reviewCount = countReviews(value);

  return (
    <div className="review-input">
      <div className="review-input-toolbar">
        <h2 className="panel-title">Your reviews</h2>
        <span className="review-count" aria-live="polite">
          {reviewCount} {reviewCount === 1 ? "review" : "reviews"} detected
        </span>
        <span className="review-count-hint">One review per line works best</span>
      </div>

      <label className="visually-hidden" htmlFor="reviews">
        Paste customer reviews, one per line
      </label>
      <textarea
        id="reviews"
        className="review-textarea"
        placeholder={
          "Paste reviews here, one per line…\n\nExample:\nGreat sound quality, but the battery dies too fast.\nApp keeps crashing since the last update."
        }
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={10}
        spellCheck={false}
      />

      <div className="button-row">
        <button
          type="button"
          className="button button-primary"
          onClick={onAnalyze}
          disabled={disabled || reviewCount === 0}
        >
          Analyze Feedback
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={onLoadDemo}
          disabled={disabled}
        >
          Load Demo Reviews
        </button>
        <button
          type="button"
          className="button button-ghost"
          onClick={onReset}
          disabled={disabled || !hasAnythingToClear}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/** Rough count: how many non-empty lines the user has typed. */
function countReviews(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;
}
