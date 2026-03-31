export default function StatsCard({ icon, label, value, color = 'blue' }) {
  return (
    <div className="stats-card">
      <div className={`stats-icon stats-icon--${color}`}>{icon}</div>
      <div className="stats-info">
        <span className="stats-label">{label}</span>
        <span className="stats-value">{value}</span>
      </div>
    </div>
  );
}

