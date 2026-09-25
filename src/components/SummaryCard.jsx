/**
 * Short overall summary of the feedback, from the analysis.
 */
export default function SummaryCard({ summary }) {
  return (
    <div className="panel insight-card">
      <h3>📝 Overall summary</h3>
      <p className="summary-text">{summary}</p>
    </div>
  );
}
