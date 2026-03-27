const StatCell = ({ icon, value, label }) => (
  <div className="stat-cell">
    <span className="stat-cell__icon">{icon}</span>
    <div>
      <div className="stat-cell__value">{value}</div>
      <div className="stat-cell__label">{label}</div>
    </div>
  </div>
);

export default StatCell;
