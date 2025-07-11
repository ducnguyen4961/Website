'use client';

import { useState } from 'react';
import './history.css';
import { exportCSV } from '@/components/exportCSVHistorical';
import dynamic from 'next/dynamic';

const SensorChart = dynamic(() => import('@/components/SensorChartHistorical'), { ssr: false });

const SENSOR_FIELDS = [
  "PPFD average value (10 to 14 o'clock) (L)",
  "Sensor 1Avg.NIR (f)",
//  "Sensor 2Avg.NIR (f)",
//  "Sensor 3Avg.NIR (f)",
  "Sensor 1Avg.VR (f)",
//  "Sensor 2Avg.VR (f)",
//  "Sensor 3Avg.VR (f)",
  "Avg. Temperature",
  "Avg. Humidity",
  "Avg.CO2",
  "Sensor 1 LAI",
//  "Sensor 2 LAI",
//  "Sensor 3 LAI",
  "Sensor 1 area_per_plant",
//  "Sensor 2 area_per_plant",
//  "Sensor 3 area_per_plant",
];

const SENSOR_LABELS = {
  "PPFD average value (10 to 14 o'clock) (L)": "PPFD",
  "Sensor 1Avg.NIR (f)": "Sens1 NIR",
//  "Sensor 2Avg.NIR (f)": "Sens2 NIR",
//  "Sensor 3Avg.NIR (f)": "Sens3 NIR",
  "Sensor 1Avg.VR (f)": "Sens1 VR",
//  "Sensor 2Avg.VR (f)": "Sens2 VR",
//  "Sensor 3Avg.VR (f)": "Sens3 VR",
  "Avg. Temperature": "温度",
  "Avg. Humidity": "湿度",
  "Avg.CO2": "CO2",
  "Sensor 1 LAI": "Sens1 LAI",
//  "Sensor 2 LAI": "Sens2 LAI",
//  "Sensor 3 LAI": "Sens3 LAI",
  "Sensor 1 area_per_plant": "Sens1 葉面積",
//  "Sensor 2 area_per_plant": "Sens2 葉面積",
//  "Sensor 3 area_per_plant": "Sens3 葉面積",
};

// ✅ 初期ONフィールド制御マップ
const SENSOR_INITIAL_MAP = {
  "PPFD average value (10 to 14 o'clock) (L)": true,
  "Sensor 1Avg.NIR (f)": true,
  "Sensor 2Avg.NIR (f)": false,
  "Sensor 3Avg.NIR (f)": false,
  "Sensor 1Avg.VR (f)": true,
  "Sensor 2Avg.VR (f)": false,
  "Sensor 3Avg.VR (f)": false,
  "Avg. Temperature": false,
  "Avg. Humidity": false,
  "Avg.CO2": false,
  "Sensor 1 LAI": true,
  "Sensor 2 LAI": false,
  "Sensor 3 LAI": false,
  "Sensor 1 area_per_plant": true,
  "Sensor 2 area_per_plant": false,
  "Sensor 3 area_per_plant": false,
};

export default function DashboardPage() {
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [sensorData, setSensorData] = useState([]);
  const [showChart, setShowChart] = useState(false);

  // ✅ 初期選択状態を反映
  const [selectedFields, setSelectedFields] = useState(
    SENSOR_FIELDS.filter(f => SENSOR_INITIAL_MAP[f])
  );

  const fetchData = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert('日付を入力してください');
      return;
    }

    setLoading(true);
    setShowChart(false);

    try {
      const token = localStorage.getItem('token');
      const adjustedStart = `${startDate}T00:00:00`;
      const adjustedEnd = `${endDate}T23:59:59`;
      const url = `https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/hystorical_query2?start_timestamp=${adjustedStart}&end_timestamp=${adjustedEnd}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const result = await res.json();
      setSensorData(Array.isArray(result.daily) ? result.daily : []);
      setShowChart(true);
    } catch (error) {
      alert('データ取得エラー: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fetch-data">
      <form onSubmit={fetchData} id="filterForm">
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
          <div className="take-data">
            <button type="submit" disabled={loading}>
              {loading ? (
                 <span className="material-symbols-outlined spin">app_badging</span>
              ) : (
                <>
                  <span className="material-symbols-outlined">ssid_chart</span>
                </>
              )}
            </button>
          </div>
        <div className="block-wrapper">
          <button
            className="exp-csv-btn"
            onClick={() => exportCSV(sensorData, false, selectedFields)}
          >
            <span className="material-symbols-outlined">cloud_download</span>
            CSV
          </button>
        </div>
      </form>

<div className="field-selector">
  {/* 🔽 全選択・全解除ボタン */}
  <div className="select-buttons" style={{ marginBottom: '10px' }}>
    <button onClick={() => setSelectedFields(SENSOR_FIELDS)}>
      <span className="material-symbols-outlined">select_all</span>
    </button>

    <button onClick={() => setSelectedFields([])}>
      <span className="material-symbols-outlined">deselect</span>
    </button>
  </div>

  {/* ✅ 選択肢表示 */}
  <div className="chart-multiselect">
    {SENSOR_FIELDS.map(f => {
      let type = '';
      if (f.includes('温度') || f.includes('Temperature')) type = 'temperature';
      else if (f.includes('湿度') || f.includes('Humidity')) type = 'humidity';
      else if (f.includes('CO2')) type = 'CO2';
      else if (f.includes('NIR')) type = 'NIR';
      else if (f.includes('VR')) type = 'VR';
      else if (f.includes('PPFD')) type = 'PPFD';
      else if (f.toLowerCase().includes('lai')) type = 'lai';
      else if (f.includes('area_per_plant')) type = 'area_per_plant';

      const selected = selectedFields.includes(f);
      return (
        <div
          key={f}
          className={`chart-multiselect-option${selected ? ` selected-${type}` : ''}`}
          onClick={() =>
            setSelectedFields(prev =>
              prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
            )
          }
        >
          <input type="checkbox" checked={selected} readOnly tabIndex={-1} />
          {SENSOR_LABELS[f] || f}
        </div>
      );
    })}
  </div>
</div>

      {showChart && sensorData.length > 0 && (
        <div className="table-grid-block">
          {/* Chart 表示 */}
          <div className= "graph">
            <SensorChart data={sensorData} selectedFields={selectedFields} />
          </div>
        </div>
      )}
    </div>
  );
}
