'use client';

import { useState } from 'react';
import './dashboard.css';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';

const SensorChart = dynamic(() => import('@/components/SensorChart'), { ssr: false });


export default function DashboardPage() {
  const [data, setData] = useState([]);
  const [houseId, setHouseId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [startTimestamp, setStartTimestamp] = useState('');
  const [endTimestamp, setEndTimestamp] = useState('');

  useEffect(() => {
    return () => {
      if (window.myChart) {
        window.myChart.destroy();
      }
    };
  }, []);

  const fetchData = async (e) => {
    e.preventDefault();

    const apiUrl = `https://prt5eqb726.execute-api.ap-northeast-1.amazonaws.com/version2/sensor-data?device_id=${deviceId}&start_timestamp=${startTimestamp}&end_timestamp=${endTimestamp}`;

    try {
      const response = await fetch(apiUrl);
      const result = await response.json();
      if (Array.isArray(result)) {
        result.startTimestamp = startTimestamp;
        result.endTimestamp = endTimestamp;
        setData(result);
      } else {
        alert('No data found.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error fetching data.');
    }
  };

  const columnsOrder = [
  'house_device',
  'timestamp',
  'temperature',
  'humidity',
  'CO2',
  'RO3',
  'RO4',
  'status'
];

const thresholds = {
  temperature: { min: 20, max: 30 },
  humidity: { min: 40, max: 70 },
  CO2: { min: 50, max: 70 },
  RO3: { min: 30, max: 50 },
  RO4: { min: 35, max: 50 }
};

const fieldLabels = {
  temperature: '温度',
  humidity: '湿度',
  CO2: 'CO2',
  RO3: 'RO3',
  RO4: 'RO4'
};

function evaluateStatus(item) {
  const avg = (field) => item.samples ? item[`total_${field}`] / item.samples : null;

  const check = (val, { min, max }) => {
    if (val == null) return 'N/A';
    if (val < min) return 'L';
    if (val > max) return 'H';
    return 'Good';
  };

  const results = [];

  for (const field of Object.keys(thresholds)) {
    const value = avg(field);
    const level = check(value, thresholds[field]);
    if (level !== 'Good') {
      const label = fieldLabels[field] || field;
      results.push(`${label}:${level}`);
    }
  }

  return results.length > 0 ? results.join(', ') : 'Good';
}
function exportCSV(data, isAggregated) {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const fields = [
    'house_device',
    'timestamp',
    'temperature',
    'humidity',
    'CO2',
    'RO3',
    'RO4',
    'status'
  ];

  const fieldLabels = {
    house_device: 'House Device',
    timestamp: 'Timestamp',
    temperature: 'Temperature',
    humidity: 'Humidity',
    CO2: 'CO2',
    RO3: 'RO3',
    RO4: 'RO4',
    status: 'Status'
  };

  const thresholds = {
    temperature: { min: 20, max: 30 },
    humidity: { min: 40, max: 70 },
    CO2: { min: 50, max: 70 },
    RO3: { min: 30, max: 50 },
    RO4: { min: 35, max: 50 }
  };

  function evaluateStatus(item) {
    const avg = (field) => item.samples ? item[`total_${field}`] / item.samples : null;

    const check = (val, { min, max }) => {
      if (val == null) return 'N/A';
      if (val < min) return 'L';
      if (val > max) return 'H';
      return 'Good';
    };

    const results = [];

    for (const field of Object.keys(thresholds)) {
      const value = avg(field);
      const level = check(value, thresholds[field]);
      if (level !== 'Good') {
        const label = fieldLabels[field] || field;
        results.push(`${label}:${level}`);
      }
    }

    return results.length > 0 ? results.join(', ') : 'Good';
  }
 // o day bat dau lam viec ve export filefile
  const csvRows = [];
  csvRows.push(fields.map(field => `"${fieldLabels[field] || field}"`).join(','));

  for (const item of data) {
    const row = fields.map(col => {
      let value;

      if (col === 'timestamp') {
        value = item[col]?.replace("T", " ").replace(/#\w+$/, '');
      } else if (col === 'status') {
        value = isAggregated ? evaluateStatus(item) : item[col] || '-';
      } else if (isAggregated && ['temperature', 'humidity', 'CO2', 'RO3', 'RO4'].includes(col)) {
        const key = `total_${col}`;
        value = item.samples ? (item[key] / item.samples).toFixed(2) : '-';
      } else {
        value = item[col] ?? '-';
      }

      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    });

    csvRows.push(row.join(','));
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sensor_data_export.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const isAggregated = data.length > 0 && 'samples' in data[0];
return (
  <div className="fetch-data">
    <h1>🌱 IoT Greenhouse Monitoring Dashboard 🌱</h1>
    <form onSubmit={fetchData} id="filterForm">
      <input type="text" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="Device ID (required)" required />
      <input type="datetime-local" value={startTimestamp} onChange={(e) => setStartTimestamp(e.target.value)} required />
      <input type="datetime-local" value={endTimestamp} onChange={(e) => setEndTimestamp(e.target.value)} required />
      <div className = "take-data">
        <button type="submit">Fetch Data</button>
      </div>
      <div className= "export">
        <button type="button" onClick={() => exportCSV(data, isAggregated)}>Export CSV</button>
      </div>
    </form>

    <div className="table-container">
      <table>
        <thead>
          <tr>
            {columnsOrder.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data
            .filter((item) => !houseId || item.house_device.startsWith(houseId))
            .map((item, index) => (
              <tr key={index}>
                {columnsOrder.map((col) => {
                  let value;

                  if (col === 'timestamp') {
                    value = item[col]?.replace("T", " ").replace(/#\w+$/, '');  
                  } else if (col === 'status') {
                    value = isAggregated ? evaluateStatus(item) : item[col] || '-';
                  } else if (isAggregated && ['temperature', 'humidity', 'CO2', 'RO3', 'RO4'].includes(col)) {
                    const key = `total_${col}`;
                    value = item.samples ? (item[key] / item.samples).toFixed(2) : '-';
                  } else {
                    if (item[col] === undefined || item[col] === null) {
                      value = '-';
                    } else {
                      value = item[col];
                    }
                  }
                  return <td key={col}>{value}</td>;
                })}
              </tr>
            ))}
        </tbody>
      </table>
    </div>

    <SensorChart data={data} />
  </div>
);
}

