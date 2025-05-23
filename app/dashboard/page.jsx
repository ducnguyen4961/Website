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

  const fetchData = async (e) => {
    e.preventDefault();

    if (!deviceId || !startTimestamp || !endTimestamp) {
      alert('Vui lòng nhập đầy đủ Device ID, Start và End Timestamp.');
      return;
    }
    
    const apiUrl = `https://prt5eqb726.execute-api.ap-northeast-1.amazonaws.com/version2/sensor-data?device_id=${deviceId}&start_timestamp=${startTimestamp}&end_timestamp=${endTimestamp}`;
    
    try {
      const response = await fetch(apiUrl);
      const result = await response.json();
      if (Array.isArray(result) && result.length > 0) {
        setData(result);
      } else {
        alert('データが探せません');
      }
    } catch (error) {
      alert('エラー');
    }
  };

  const thresholds = {
    temperature: { min: 20, max: 30 },
    humidity: { min: 40, max: 70 },
    CO2: { min: 50, max: 70 },
    NIR: { min: 30, max: 50 },
    PPFD: { min: 20, max: 30 },
    soil_EC: { min: 40, max: 70 },
    soil_mois: { min: 50, max: 70 },
    soil_temp: { min: 30, max: 50 },
    VR: { min: 35, max: 50 }
  };

  const columnsOrder = ['house_device','timestamp','temperature','humidity','CO2','NIR','VR','PPFD','soil_mois','soil_EC','soil_temp','status'];
  const fieldLabels = {
    house_device: 'House_Device',
    timestamp: 'Timestamp',
    temperature: '温度',
    humidity: '湿度',
    CO2: 'CO2',
    NIR: 'NIR',
    PPFD: 'PPFD',
    VR: 'VR',
    soil_mois: '土壌水分',
    soil_EC: '土壌EC',
    soil_temp: '土壌温度',
    status: 'Status'
  };

function evaluateStatus(item) {
  const avg = (field) => {
    if ('total_' + field in item) {
      const total = item[`total_${field}`];
      return (item.samples && total != null) ? total / item.samples : null;
    } else {
      // Raw data fallback
      return item[field] ?? null;
    }
  };

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
    'NIR',
    'PPFD',
    'VR',
    'soil_mois',
    'soil_EC',
    'soil_temp',
    'status'
  ];

  const fieldLabels = {
    house_device: 'House_Device',
    timestamp: 'Timestamp',
    temperature: '温度',
    humidity: '湿度',
    CO2: 'CO2',
    NIR: 'NIR',
    PPFD: 'PPFD',
    VR: 'VR',
    soil_mois: '土壌水分',
    soil_EC: '土壌EC',
    soil_temp: '土壌温度',
    status: 'Status'
  };

  const thresholds = {
    temperature: { min: 20, max: 30 },
    humidity: { min: 40, max: 70 },
    CO2: { min: 50, max: 70 },
    NIR: { min: 30, max: 50 },
    PPFD: { min: 20, max: 30 },
    soil_EC: { min: 40, max: 70 },
    soil_mois: { min: 50, max: 70 },
    soil_temp: { min: 30, max: 50 },
    VR: { min: 35, max: 50 }
  };

  function evaluateStatus(item) {
    const isAggregated = 'samples' in item && item.samples > 0;

    const avg = (field) => {
      if (isAggregated && item[`total_${field}`] != null && item.samples) {
        return item[`total_${field}`] / item.samples;
      } else {
        return item[field] ?? null;
      }
    };

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

  const escapeCSV = (val) => {
    if (val == null) return '';
    const str = val.toString().replace(/"/g, '""');
    return `"${str}"`;
  };

  const header = fields.map(f => escapeCSV(fieldLabels[f] || f)).join(',');

  const rows = data.map(item => {
    return fields.map(col => {
      let value;

      if (col === 'timestamp') {
        value = item[col]?.replace("T", " ").replace(/#\w+$/, '');
      } else if (col === 'status') {
        value = evaluateStatus(item);
      } else {
        if ('samples' in item && item[`total_${col}`] != null) {
          const total = item[`total_${col}`];
          value = item.samples ? (total / item.samples).toFixed(2) : '';
        } else {
          value = item[col] ?? '';
        }
      }

      return escapeCSV(value);
    }).join(',');
  });

  const csvContent = '\uFEFF' + [header, ...rows].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
        <th key={col}>{fieldLabels[col] || col}</th>
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
                    value = evaluateStatus(item);
                  } else {
                    if ('samples' in item && item[`total_${col}`] !== undefined) {
                      const total = item[`total_${col}`];
                      const avg = total != null && item.samples ? total / item.samples : null;
                      value = avg != null ? avg.toFixed(2) : '-';
                    } else {
                      value = item[col] != null ? item[col] : '-';
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

