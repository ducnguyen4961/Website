'use client';
import React, { useState, useRef, useEffect,useContext } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { useRouter } from 'next/navigation';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);
import "./RadarChart.css";
import { AuthContext } from "@/context/Authcontext";


export default function RadarChart() {
  const [deviceId, setDeviceId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [resolution, setResolution] = useState('hourly');
  const [selectedHour, setSelectedHour] = useState('0');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const { logout } = useContext(AuthContext);
  const router = useRouter();
  useEffect(() => {
    const idToken = localStorage.getItem('idToken');
    const loginTime = localStorage.getItem('loginTime');
    const now = Date.now();
    const MAX_SESSION_DURATION = 10 * 60 * 60 * 1000;

    if (!idToken || !loginTime ||isNaN(parseInt(loginTime)) || now - parseInt(loginTime) > MAX_SESSION_DURATION) {
      localStorage.clear();
      logout();
      router.push('/login');
    }
  }, []);
  const maxValues = {
    Temperature: 50,
    Humidity: 100,
    CO2: 2000,
    'Soil Moisture': 100,
    'Soil EC': 5,
    'Soil Temp': 50,
    Saturation: 100,
    VR: 300,
    PPFD: 2000,
    NIR: 1000,
  };


  const fetchData = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/query_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          house_device: deviceId,
          date: selectedDate,
          resolution: resolution,
          ...(resolution === 'hourly' ? { hour: selectedHour } : {}),
        }),
      });
      const json = await res.json();

      const d = json.data || {};
      const samples = d.samples || 1;
      const avgData = [
        d.total_temperature / samples || 0,
        d.total_humidity / samples || 0,
        d.total_CO2 / samples || 0,
        d.total_soil_mois / samples || 0,
        d.total_soil_EC / samples || 0,
        d.total_soil_temp / samples || 0,
        d.total_satur / samples || 0,
        d.total_VR / samples || 0,
        d.total_PPFD / samples || 0,
        d.total_NIR / samples || 0,
      ].map((val) => (isNaN(val) ? 0 : val));

      setData(avgData);
    } catch (error) {

      setData([]);
    } finally {
      setLoading(false);
    }
  };
  const labels = Object.entries(maxValues).map(([key, max]) => `${key} (${max})`);
  const chartRef = useRef(null);
  useEffect(() => {
    if (data.length > 0 && chartRef.current) {

      chartRef.current.update();
    }
  }, [data]);

  const chartData = {
    labels: [
      'Temperature',
      'Humidity',
      'CO2',
      'Soil Moisture',
      'Soil EC',
      'Soil Temp',
      'Saturation',
      'VR',
      'PPFD',
      'NIR',
    ],
    datasets: [
      {
        label: 'Sensor Values',
        data: data,
        backgroundColor: 'rgba(34, 197, 94, 0.3)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        suggestedMin: 0,
        ticks: {
          display: false,
          backdropColor: 'transparent',
        },
        pointLabels: {
          font: {
            size: 11,
          },
          color: '#4a5568',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            size: 12,
          },
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw.toFixed(2)}`,
          },
        },
      },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
  };
  const valueLabelPlugin = {
  id: 'valueLabelPlugin',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (!meta.hidden) {
        meta.data.forEach((element, index) => {
          const dataValue = dataset.data[index];
          if (typeof dataValue !== 'number') return;

          const { x, y } = element.tooltipPosition();

          ctx.save();
          ctx.font = 'bold 12px Arial';
          ctx.fillStyle = '#2d3748';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(dataValue.toFixed(1), x, y - 10);
          ctx.restore();
        });
      }
    });
  },
};


  return (
    <div className="radar-block">
      <button onClick={() => router.push('/dashboard')} className="Back_to_dashboard">
        Back to Dashboard
      </button>
      <h1 className="radar-title">🌱 Radar Sensor Chart 🌱</h1>

      <form onSubmit={fetchData} className="radar-form">
        <div className="radar-form-group">
          <div className="radar-input-wrapper">
            <label>Device ID</label>
            <input type="text" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} required/>
          </div>
          <div className="radar-input-wrapper">
            <label>Select Date</label>
            <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            required
            />
            </div>
            <div className="radar-input-wrapper">
              <label>Select resolution</label>
              <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
            <div className="radar-input-wrapper">
              <label>&nbsp;</label> {/* Để căn nút với input */}
              <button type="submit" disabled={loading} className="radar-button" style={{ width: '100%' }}>
                {loading ? 'Loading...' : 'Fetch Data'}
              </button>
            </div>
            </div>
            {resolution === 'hourly' && (
              <div className="radar-form-group">
                <div className="radar-input-wrapper">
                  <label>Select time</label>
                  <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                  >
                    {[...Array(24).keys()].map((h) => {
                      const hourStr = h.toString().padStart(2, '0');
                      return (
                      <option key={hourStr} value={hourStr}>
                        {hourStr}:00
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            )}
      </form>

      {data.length > 0 ? (
        <div className="radar-chart-container" style={{ height: '1000px', width: '1000px' }}>
          <Radar
          ref={chartRef}
          data={chartData}
          options={options}
          plugins={[valueLabelPlugin]}
          />
        </div>
      ) : (
        <p className="radar-no-data">No data to show</p>
      )}
    </div>
  );
}