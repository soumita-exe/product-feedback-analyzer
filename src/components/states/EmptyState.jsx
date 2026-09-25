/**
 * Shown before any analysis has run: tells the user what to do next.
 */
export default function EmptyState() {
  return (
    <div className="state-card state-empty" role="status">
      <div className="state-emoji" aria-hidden="true">
        📋
      </div>
      <h3>No analysis yet</h3>
      <p>
        Paste some customer reviews on the left (or click <strong>Load Demo
        Reviews</strong>) and press <strong>Analyze Feedback</strong>.
      </p>
      <ul className="state-hint-list">
        <li>Sentiment breakdown with percentages</li>
        <li>Main themes across reviews</li>
        <li>Top complaints and feature requests</li>
        <li>Suggested product improvements</li>
      </ul>
      <p className="state-footnote">One review per line works best.</p>
    </div>
  );
}
