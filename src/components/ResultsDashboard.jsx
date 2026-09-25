import SentimentBars from "./SentimentBars";
import SummaryCard from "./SummaryCard";
import InsightCard from "./InsightCard";

/**
 * The results dashboard. Receives the already-validated analysis object
 * from the backend and lays it out as cards.
 */
export default function ResultsDashboard({ result, reviewCount }) {
  const {
    summary,
    overallSentiment,
    sentiment,
    themes,
    complaints,
    featureRequests,
    improvements,
    demoMode = false,
  } = result;

  return (
    <div className="results-dashboard">
      <div className="dashboard-header">
        <h2>
          Analysis results
          {typeof reviewCount === "number" && (
            <span className="results-count">
              {" "}
              · {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </span>
          )}
        </h2>
        <span className={`overall-chip ${overallSentiment}`}>
          Overall: {overallSentiment}
        </span>
      </div>

      {demoMode ? (
        <p className="demo-notice">
          🧪 <strong>Demo Mode</strong> — these results come from the built-in
          local analyzer, no AI key needed. Add your Gemini key to{" "}
          <code>.env</code> to enable AI-powered analysis.
        </p>
      ) : (
        <p className="ai-notice">
          ✨ <strong>AI-generated analysis</strong> — produced by Google Gemini
          from your reviews. AI can make mistakes; verify important insights.
        </p>
      )}

      <div className="summary-grid">
        <SummaryCard summary={summary} />
        <div className="panel insight-card">
          <h3>📊 Sentiment breakdown</h3>
          <SentimentBars sentiment={sentiment} />
        </div>
      </div>

      <div className="insight-grid">
        <InsightCard title="Main themes" icon="🧭" items={themes} />
        <InsightCard title="Top complaints" icon="🐞" items={complaints} />
        <InsightCard title="Feature requests" icon="💡" items={featureRequests} />
        <InsightCard
          title="Suggested improvements"
          icon="🚀"
          items={improvements}
        />
      </div>
    </div>
  );
}
