'use client';

import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  TimeScale
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

ChartJS.register(LineElement, PointElement, Tooltip, Legend, CategoryScale, LinearScale, TimeScale, zoomPlugin);

export default function SensorChart({ data, selectedFields = [] }) {
  const hasData = Array.isArray(data) && data.length > 0;

  const colorMap = {
    "PPFD average value (10 to 14 o'clock) (L)": 'rgb(8, 109, 176)',
    "Sensor 1Avg.NIR (f)": 'rgb(115, 0, 255)',
    "Sensor 2Avg.NIR (f)": 'rgb(135, 0, 200)',
    "Sensor 3Avg.NIR (f)": 'rgb(155, 0, 155)',
    "Sensor 1Avg.VR (f)": 'rgb(55, 116, 73)',
    "Sensor 2Avg.VR (f)": 'rgb(0, 150, 100)',
    "Sensor 3Avg.VR (f)": 'rgb(0, 180, 130)',
    "Avg. Temperature": 'rgb(255, 0, 55)',
    "Avg. Humidity": 'rgb(45, 156, 231)',
    "Avg.CO2": 'rgb(113, 250, 0)',
    "Sensor 1 LAI": 'rgb(255, 205, 86)',
    "Sensor 2 LAI": 'rgb(255, 165, 0)',
    "Sensor 3 LAI": 'rgb(255, 120, 0)',
    "Sensor 1 area_per_plant": 'rgb(75, 192, 192)',
    "Sensor 2 area_per_plant": 'rgb(60, 160, 160)',
    "Sensor 3 area_per_plant": 'rgb(40, 130, 130)',
  };

  const labelMap = {
    "PPFD average value (10 to 14 o'clock) (L)": 'PPFD',
    "Sensor 1Avg.NIR (f)": 'Sens1 NIR',
    "Sensor 2Avg.NIR (f)": 'Sens2 NIR',
    "Sensor 3Avg.NIR (f)": 'Sens3 NIR',
    "Sensor 1Avg.VR (f)": 'Sens1 VR',
    "Sensor 2Avg.VR (f)": 'Sens2 VR',
    "Sensor 3Avg.VR (f)": 'Sens3 VR',
    "Avg. Temperature": '温度 (°C)',
    "Avg. Humidity": '湿度 (%)',
    "Avg.CO2": 'CO2 (ppm)',
    "Sensor 1 LAI": 'Sens1 LAI',
    "Sensor 2 LAI": 'Sens2 LAI',
    "Sensor 3 LAI": 'Sens3 LAI',
    "Sensor 1 area_per_plant": 'Sens1 葉面積',
    "Sensor 2 area_per_plant": 'Sens2 葉面積',
    "Sensor 3 area_per_plant": 'Sens3 葉面積',
  };

  const chartData = useMemo(() => {
    if (!hasData) return { datasets: [] };

    return {
      datasets: selectedFields.map(field => {
        const points = data
          .filter(d => typeof d.DATE === 'string' && d[field] !== undefined)
          .map((d, idx) => {
            const dateStr = d.DATE.replace(/\//g, '-'); // 例: 2024/6/4 → 2024-6-4
            const value = Number(d[field]);
            return {
              x: new Date(dateStr),
              y: isNaN(value) ? null : value,
              rawIndex: idx
            };
          });

        return {
          label: labelMap[field] || field,
          data: points,
          borderColor: colorMap[field] || 'gray',
          backgroundColor: colorMap[field] || 'gray',
          yAxisID: 'y',
          spanGaps: true,
          tension: 0.3,
        };
      })
    };
  }, [data, selectedFields]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      zoom: {
        pan: { enabled: true, mode: 'x' },
        zoom: { wheel: { enabled: true }, mode: 'x' },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          title: items => {
            const ts = items[0].parsed.x;
            return format(new Date(ts), 'yyyy-MM-dd', { locale: ja });
          }
        }
      },
      legend: {
        display: true,
        labels: {
          usePointStyle: true
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'yyyy-MM-dd',
          displayFormats: {
            day: 'yyyy-MM-dd'
          }
        },
        title: {
          display: true,
          text: '日付'
        }
      },
      y: {
        type: 'linear',
        beginAtZero: true,
        title: {
          display: true,
          text: '値'
        }
      }
    }
  };

  if (!hasData) return <p>No data to show chart</p>;

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
