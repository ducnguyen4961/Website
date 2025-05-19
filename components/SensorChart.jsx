'use client';

import React, { useMemo } from 'react';
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
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

ChartJS.register(LineElement, PointElement, Tooltip, Legend, CategoryScale, LinearScale, TimeScale, zoomPlugin);

export default function SensorChart({ data }) {
  if (!data || data.length === 0) return <p>No data to show chart</p>;

  // Lấy start và end timestamp từ dữ liệu đã fetch
  const rawStart = data[0]?.timestamp?.replace(/#\w+$/, '');
  const rawEnd = data[data.length - 1]?.timestamp?.replace(/#\w+$/, '');
  const startTime = new Date(rawStart);
  const endTimeFromData = new Date(rawEnd);

  // Nhưng nếu thời gian query có rộng hơn thì nên lấy từ props nếu có sẵn
  const startTimestamp = data.startTimestamp
    ? new Date(data.startTimestamp)
    : startTime;
  const endTimestamp = data.endTimestamp
    ? new Date(data.endTimestamp)
    : new Date(startTimestamp.getTime() + 6 * 60 * 60 * 1000); // default 6h window nếu không có

  const extractAvgValue = (item, field) => {
    if ('samples' in item && item.samples) {
      return item[`total_${field}`] / item.samples;
    }
    return item[field] ?? null;
  };

  const chartData = useMemo(() => {
    const extractSeries = (field) =>
      data.map(item => ({
        x: new Date(item.timestamp.replace(/#\w+$/, '')),
        y: extractAvgValue(item, field)
      }));

    return {
      datasets: [
        {
          label: 'Temperature (°C)',
          data: extractSeries('temperature'),
          borderColor: 'rgb(255, 0, 55)',
          yAxisID: 'y1',
          tension: 0.3,
          fill: false,
        },
        {
          label: 'Humidity (%)',
          data: extractSeries('humidity'),
          borderColor: 'rgb(45, 156, 231)',
          yAxisID: 'y2',
          tension: 0.3,
          fill: false,
        },
        {
          label: 'CO2 (ppm)',
          data: extractSeries('CO2'),
          borderColor: 'rgb(113, 250, 0)',
          yAxisID: 'y3',
          tension: 0.3,
          fill: false,
        },
        {
          label: 'RO3 (%)',
          data: extractSeries('RO3'),
          borderColor: 'rgb(45, 31, 71)',
          yAxisID: 'y4',
          tension: 0.3,
          fill: false,
        },
        {
          label: 'RO4 (%)',
          data: extractSeries('RO4'),
          borderColor: 'rgb(93, 174, 181)',
          yAxisID: 'y5',
          tension: 0.3,
          fill: false,
        },
      ]
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          title: (items) => {
            const ts = items[0].parsed.x;
            return format(new Date(ts), 'yyyy-MM-dd HH:mm:ss ', { locale: ja });
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
          tooltipFormat: 'yyyy-MM-dd HH:mm:ss ',
          displayFormats: {
            minute: 'yyyy-MM-dd HH:mm:ss ',
            hour: 'yyyy-MM-dd HH:mm:ss ',
          }
        },
        min: startTimestamp,
        max: endTimestamp,
        title: {
          display: true,
          text: 'Timestamp',
        },
        ticks: {
          autoSkip: true,
          maxRotation: 90,
        },
      },
      y1: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'Temperature (°C)' },
        min: 0,
        max: 70
      },
      y2: {
        type: 'linear',
        position: 'right',
        title: { display: true, text: 'Humidity (%)' },
        grid: { drawOnChartArea: false },
        min: 0,
        max: 100
      },
      y3: {
        type: 'linear',
        position: 'left',
        offset: true,
        title: { display: true, text: 'CO2 (ppm)' },
        grid: { drawOnChartArea: false },
        min: 400,
        max: 4000
      },
      y4: {
        type: 'linear',
        position: 'right',
        offset: true,
        title: { display: true, text: 'RO3 (%)' },
        grid: { drawOnChartArea: false },
        min: 0,
        max: 1000
      },
      y5: {
        type: 'linear',
        position: 'left',
        offset: true,
        title: { display: true, text: 'RO4 (%)' },
        grid: { drawOnChartArea: false },
        min: 30,
        max: 100
      },
    }
  };

  return (
    <div style={{ height: '500px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
