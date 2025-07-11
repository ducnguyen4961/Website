import './Temperature.css';
const TemperatureStatsBox = ({ deviceId, stats, houseId }) => {
  const safeStats = {
    day: stats?.day ?? {},
    night: stats?.night ?? {}
  };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  return (
    <div className="temp-stats-container">
      <div className="section-header">
        <div className="section-title">
          <span className="material-symbols-outlined">sunny</span>
        </div>
        <span className="section-date">日付: {yesterdayStr}  {deviceId.replace(`${houseId}#`, '')}</span>
      </div>
      <div className="stats-grid day">
        <div className="stat-box day-box"><div className="stat-label">Max</div><div>{safeStats.day.max ?? '-'}°C</div></div>
        <div className="stat-box day-box"><div className="stat-label">Min</div><div>{safeStats.day.min ?? '-'}°C</div></div>
        <div className="stat-box day-box"><div className="stat-label">Avg</div><div>{safeStats.day.avg ?? '-'}°C</div></div>
      </div>

      <div className="section-title night-title">
        <span className="material-symbols-outlined">dark_mode</span>
      </div>
      <div className="stats-grid night">
        <div className="stat-box night-box"><div className="stat-label">Max</div><div>{safeStats.night.max ?? '-'}°C</div></div>
        <div className="stat-box night-box"><div className="stat-label">Min</div><div>{safeStats.night.min ?? '-'}°C</div></div>
        <div className="stat-box night-box"><div className="stat-label">Avg</div><div>{safeStats.night.avg ?? '-'}°C</div></div>
      </div>
    </div>
  );
};
export default TemperatureStatsBox;
