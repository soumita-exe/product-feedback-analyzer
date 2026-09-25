/**
 * Sentiment bars: positive / neutral / negative with percentages.
 * Bars animate in via a CSS transition on width.
 */
export default function SentimentBars({ sentiment }) {
  const rows = [
    { key: "positive", label: "Positive" },
    { key: "neutral", label: "Neutral" },
    { key: "negative", label: "Negative" },
  ];

  return (
    <div className="sentiment-rows">
      {rows.map(({ key, label }) => {
        const percent = sentiment?.[key] ?? 0;

        return (
          <div className="sentiment-row" key={key}>
            <span className="sentiment-label">{label}</span>
            <div className="sentiment-track">
              <div
                className={`sentiment-fill ${key}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="sentiment-percent">{percent}%</span>
          </div>
        );
      })}
    </div>
  );
}
