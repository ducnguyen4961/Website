import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  TimeScale,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Line } from 'react-chartjs-2';
import { useMemo, useState } from 'react';
ChartJS.register(
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  TimeScale,
  zoomPlugin
);
const charts = [
  { field: 'area_per_plant', label: '株当たり葉面積', color: 'rgb(75, 192, 192)' },
  { field: 'lai', label: '株間LAI', color: 'rgb(255, 205, 86)' }
];
const SensorChartGroup = ({ data }) => {

  const numericFields = ['avg_NIR', 'avg_PPFD', 'avg_VR', 'lai', 'nir_vr_ratio', 'area_per_plant'];
  const dailyData = useMemo(() => {
    return (data || []).map(item => {
      const newItem = { ...item };
      numericFields.forEach(field => {
        const val = item[field];
        const num = Number(val);
        newItem[field] = !isNaN(num) ? num : null;
      });
      if (item.timestamp && typeof item.timestamp === 'string') {
        newItem.timestamp = item.timestamp.replace('#daily', '');
      }
      return newItem;
    });
  }, [data]);
  const [visibleCharts, setVisibleCharts] = useState(() =>
    Object.fromEntries(charts.map(({ field }) => [field, false]))
  );
  const toggleChart = (field) => {
    setVisibleCharts((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  const generateChartData = (data, label, field, color) => {
  const labels = data.map(item => new Date(item.timestamp));
  const datasetData = data.map(item => {
    const val = item[field];
    return val !== undefined && val !== null && !isNaN(Number(val)) ? Number(val) : null;
  });

  return {
    labels,
    datasets: [{
      label,
      data: datasetData,
      borderColor: color,
      fill: false,
    }]
  };
};
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      tooltip: { mode: 'index', intersect: false },
      zoom: {
        pan: { enabled: true, mode: 'xy' },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'yyyy-MM-dd',
          displayFormats: { day: 'yyyy-MM-dd' }
        },
        title: { display: true, text: '日時' },
      },
      y: { title: { display: true, text: '値' } }
    }
  };
return (
  <div className="sensor-chart-group-wrapper">
    {/* 切り替えボタン */}
    <div className="chart-buttons charts-scroll-container">
      {charts.map(({ field, label }) => (
        <button
          key={field}
          type="button"
          onClick={() => toggleChart(field)}
          className={`px-3 py-2 border text-sm rounded ${
            visibleCharts[field]
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          style={{ minWidth: '160px' }}
        >
          {label}
        </button>
      ))}
    </div>

    {/* グラフ本体：横スクロール */}
    <div className="charts-scroll-container">
      {charts.map(({ field, label, color }) =>
        visibleCharts[field] && (
          <div
            key={field}
            className="chart-item.compact"
          >
            <Line
              data={generateChartData(dailyData, label, field, color)}
              options={chartOptions}
            />
          </div>
        )
      )}
    </div>
  </div>
);

};

export default SensorChartGroup;
