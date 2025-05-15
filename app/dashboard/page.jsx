'use client';

import { useState } from 'react';
import './dashboard.css';
import { Chart } from 'chart.js/auto';
import { useEffect } from 'react';

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
        setData(result);
        renderChart(result);
      } else {
        alert('No data found.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error fetching data.');
    }
  };

  const renderChart = (data) => {
  setTimeout(() => {
    const canvas = document.getElementById('dataChart');
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');

    const timestamps = data.map(item => {
      const raw = item['timestamp'];
      return raw.replace("T", " ").replace(/#\w+$/, '');
    });

    const temperatures = data.map(item => {
      if ('samples' in item && item.samples) {
        return item.total_temperature / item.samples;
      }
      return item.temperature || null;
    });

    const humidities = data.map(item => {
      if ('samples' in item && item.samples) {
        return item.total_humidity / item.samples;
      }
      return item.humidity || null;
    });

    const CO2 = data.map(item => {
      if ('samples' in item && item.samples) {
        return item.total_CO2 / item.samples;
      }
      return item.CO2 || null;
    });

    const RO3 = data.map(item => {
      if ('samples' in item && item.samples) {
        return item.total_RO3 / item.samples;
      }
      return item.RO3 || null;
    });

    const RO4 = data.map(item => {
      if ('samples' in item && item.samples) {
        return item.total_RO4 / item.samples;
      }
      return item.RO4 || null;
    });

    if (window.myChart) window.myChart.destroy();

    window.myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [
          {
            label: 'Temperature (°C)',
            data: temperatures,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: false,
            tension: 0.1,
          },
          {
            label: 'Humidity (%)',
            data: humidities,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: false,
            tension: 0.1,
          },
          {
            label: 'CO2 (ppm)',
            data: CO2,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: false,
            tension: 0.1,
          },
          {
            label: 'RO3 (%)',
            data: RO3,
            borderColor: 'rgba(153, 102, 255, 1)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            fill: false,
            tension: 0.1,
          },
          {
            label: 'RO4 (%)',
            data: RO4,
            borderColor: 'rgba(255, 159, 64, 1)',
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            fill: false,
            tension: 0.1,
          }
        ],
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        stacked: false,
        plugins: {
          title: {
            display: true,
            text: 'Sensor Data Over Time',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Timestamp',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Values',
            },
          },
        },
      },
    });
  }, 0);
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


const isAggregated = data.length > 0 && 'samples' in data[0];

return (
  <div className="fetch-data">
    <h1>🌱 IoT Greenhouse Monitoring Dashboard 🌱</h1>
    <form onSubmit={fetchData} id="filterForm">
      <input type="text" value={houseId} onChange={(e) => setHouseId(e.target.value)} placeholder="House ID (optional)" />
      <input type="text" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="Device ID (required)" required />
      <input type="datetime-local" value={startTimestamp} onChange={(e) => setStartTimestamp(e.target.value)} required />
      <input type="datetime-local" value={endTimestamp} onChange={(e) => setEndTimestamp(e.target.value)} required />
      <button type="submit">Fetch Data</button>
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

    <canvas id="dataChart" width="1000" height="400"></canvas>
  </div>
);
}

