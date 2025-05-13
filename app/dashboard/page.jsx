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
    const timestamps = data.map(item => {
    const raw = item['timestamp']; 
    return raw.replace("T", " ");
    });

    const ctx = document.getElementById('dataChart').getContext('2d');
    const temperatures = data.map(item => item.temperature);
    const humidities = data.map(item => item.humidity);
    const CO2 = data.map(item => item.CO2);
    const RO3 = data.map(item => item.RO3);

    console.log(timestamps);

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
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: false,
            tension: 0.1,
          },
          {
            label: 'RO3 (%)',
            data: RO3,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: false,
            tension: 0.1,
          },
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
            text: 'Temperature and Humidity Over Time',
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
  };

  const columnsOrder = ['house_device', 'timestamp', 'status', 'temperature', 'humidity', 'CO2', 'RO3', 'RO4'];

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

      <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ccc' }}>
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
              {columnsOrder.map((col) => (
                <td key={col}>
                  {col === 'timestamp' && item[col]
                  ? item[col].replace("T", " ")
                  : item[col] !== undefined ? item[col] : '-'}
                </td>
              ))}
            </tr>
          ))}
          </tbody>

      </table>
      </div>

      <canvas id="dataChart" width="1000" height="400"></canvas>
    </div>
  );
}
