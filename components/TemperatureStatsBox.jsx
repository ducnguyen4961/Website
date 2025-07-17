import './Temperature.css';
const TemperatureStatsBox = ({ deviceId, stats, houseId }) => {
  const safeStats = {
    day: stats?.day ?? {},
    night: stats?.night ?? {},
    ranges: {
      '00_06': stats?.['00_06'] ?? {},
      '06_12': stats?.['06_12'] ?? {},
      '12_18': stats?.['12_18'] ?? {},
      '18_24': stats?.['18_24'] ?? {}
    }
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
        <div className="stat-box day-box">
          <div className="stat-label">Avg</div>
          <div>{safeStats.day.avg ?? '-'}°C</div>
        </div>
      </div>
      <div className="section-title night-title">
        <span className="material-symbols-outlined">dark_mode</span>
      </div>
      <div className="stats-grid night">
        <div className="stat-box night-box">
          <div className="stat-label">Avg</div>
          <div>{safeStats.night.avg ?? '-'}°C</div>
        </div>
      </div>


      <h4 className="section-title"> 6時間ごとの統計</h4>
      <div className="stats-grid time-ranges">
        {Object.entries(safeStats.ranges).map(([label, rangeStats]) => (
          <div key={label} className="stat-box range-box">
            <div className="stat-label text-blue-700">{label.replace('_', '〜')} 時間</div>
            <div><strong>Avg:</strong> {rangeStats.avg ?? '-'}</div>
            <div><strong>Min:</strong> {rangeStats.min ?? '-'}</div>
            <div><strong>Max:</strong> {rangeStats.max ?? '-'}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemperatureStatsBox;
