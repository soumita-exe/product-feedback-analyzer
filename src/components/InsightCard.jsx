/**
 * Reusable insight card: a title, an icon, and a bulleted list of items.
 */
export default function InsightCard({ title, icon = "•", items }) {
  const list = Array.isArray(items) ? items : [];

  return (
    <div className="insight-card">
      <h3>
        <span aria-hidden="true">{icon}</span> {title}
      </h3>
      {list.length === 0 ? (
        <p className="insight-empty">None detected in these reviews.</p>
      ) : (
        <ul>
          {list.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
