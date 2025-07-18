'use client';

import React, { useState, useMemo, useRef} from 'react';
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
import "./SensorChart.css";
ChartJS.register(LineElement, PointElement, Tooltip, Legend, CategoryScale, LinearScale, TimeScale, zoomPlugin);
export default function SensorChart({ data, deviceId,rawData = [], isSingleDay = false }) {
  const finalData = isSingleDay && rawData.length > 0 ? rawData : data;
  const hasData = Array.isArray(finalData) && finalData.length > 0;

  const chartRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visibleLines, setVisibleLines] = useState({
    temperature: false,
    humidity: false,
    CO2: false,
    NIR: false,
    VR: false,
    PPFD: true,
    soil_mois: false,
    soil_EC: false,
    soil_temp: false,
    satur:false,
  });
  const rawStart = data?.[0]?.timestamp?.replace(/#\w+$/, '');
  const rawEnd = data?.[data.length - 1]?.timestamp?.replace(/#\w+$/, '');
  const startTime = new Date(rawStart);
  const endTimeFromData = new Date(rawEnd);
  const startTimestamp = data.startTimestamp
    ? new Date(data.startTimestamp)
    : startTime;
  const endTimestamp = data.endTimestamp
    ? new Date(data.endTimestamp)
    : new Date(startTimestamp.getTime() + 10 * 60 * 60 * 1000)
    const extractAvgValue = (item, field, itemIndex) => {
      if ('samples' in item && `total_${field}` in item) {
        const samples = Number(item.samples);
        const total = Number(item[`total_${field}`]);
        if (!isNaN(samples) && samples > 0 && !isNaN(total)) {
          return total / samples;
        }
      }
      const raw = item[field];
      return raw !== undefined && raw !== null && raw !== '-' ? Number(raw) : null;
    };
    const colorMap = {
      temperature: 'rgb(255, 0, 55)',
      humidity: 'rgb(45, 156, 231)',
      CO2: 'rgb(113, 250, 0)',
      NIR: 'rgb(115, 0, 255)',
      VR: 'rgb(55, 116, 73)',
      PPFD: 'rgb(8, 109, 176)',
      soil_mois: 'rgb(182, 137, 14)',
      soil_EC: 'rgb(163, 176, 184)',
      soil_temp: 'rgb(28, 67, 25)',
      satur: 'rgb(52, 126, 167)',
      lai: 'rgb(255, 205, 86)',             // ← LAIの色
      area_per_plant: 'rgb(75, 192, 192)',  // ← 株当たり葉面積の色
    };
    const cssColorMap = {
      temperature: 'rgba(255, 0, 55, 0.6)',
      humidity: 'rgba(45, 156, 231, 0.6)',
      CO2: 'rgba(113, 250, 0, 0.6)',
      NIR: 'rgba(115, 0, 255, 0.6)',
      VR: 'rgba(55, 116, 73, 0.6)',
      PPFD: 'rgba(8, 109, 176, 0.6)',
      soil_mois: 'rgba(182, 137, 14, 0.6)',
      soil_EC: 'rgba(163, 176, 184, 0.6)',
      soil_temp: 'rgba(28, 67, 25, 0.6)',
      satur: 'rgba(52, 126, 167, 0.6)',
      lai: 'rgba(255, 205, 86, 0.6)',
      area_per_plant: 'rgba(75, 192, 192, 0.6)',
    };
    const axisMap = {
      temperature: 'y1',
      humidity: 'y2',
      CO2: 'y3',
      NIR: 'y4',
      VR: 'y5',
      PPFD: 'y6',
      soil_mois: 'y7',
      soil_EC: 'y8',
      soil_temp: 'y9',
      satur: 'y10',
    };
    const labelMap = {
      temperature: '温度 (°C)',
      humidity: '湿度 (%RH)',
      CO2: 'CO₂ (ppm)',
      NIR: 'NIR (mV)',
      VR: 'VR (mV)',
      PPFD: 'PPFD (μmol/ms)',
      soil_mois: '土壌水分 (%)',
      soil_EC: '土壌EC (mS/cm)',
      soil_temp: '土壌温度 (°C)',
      satur:'飽差 (g/m³)',
    };
    const isAggregated = data.length > 0 && 'samples' in data[0];
    const fields = [
      'temperature',
      'humidity',
      'CO2',
      'NIR',
      'VR',
      'PPFD',
      'soil_mois',
      'soil_EC',
      'soil_temp',
      'satur',
    ];
    const chartData = useMemo(() => {
      if (!hasData) return { datasets: [] };
      const datasets = Object.keys(visibleLines)
      .filter(field => visibleLines[field])
      .map(field => {
        const processedData = finalData.map((item, index) => {
          const y = extractAvgValue(item, field, index);
          const numY = Number(y);
          const isValid = !isNaN(numY);
          return {
            x: item.timestamp ? new Date(item.timestamp.split('#')[0]) : null,
            y: isValid ? numY : null,
            isGap: !isValid,
            rawIndex: index,
          };
        });
        const filteredData = processedData;
        return {
          label: labelMap[field],
          data: processedData,
          parsing: false,
          borderColor: colorMap[field],
          yAxisID: axisMap[field],
          tension: 0.3,
          spanGaps: true,
          hidden: !visibleLines[field],
          segment: {
            borderDash: ctx => {
              const { p0, p1 } = ctx.segment || {};
              if (!p0 || !p1) return;
              const index0 = ctx.p0DataIndex;
              const index1 = ctx.p1DataIndex;
              const rawIndex0 = processedData[index0].rawIndex;
              const rawIndex1 = processedData[index1].rawIndex;
              const hasZeroBetween = finalData
              .slice(rawIndex0 + 1, rawIndex1)
              .some(d => extractAvgValue(d, field) === 0);
              if (hasZeroBetween) return [6, 6];
              return undefined;
            }
          }
        };
      });
      return { datasets };
    }, [finalData, visibleLines]);
    const timestamps = finalData
    .map(item => item.timestamp?.split('#')[0])
    .filter(Boolean)
    .map(ts => new Date(ts));
    const STime = new Date(Math.min(...timestamps));
    const ETime = new Date(Math.max(...timestamps));
    STime.setMinutes(STime.getMinutes() - 20);
    ETime.setMinutes(ETime.getMinutes() + 20);
    if (!data || data.length === 0) return <p>No data to show chart</p>;
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        zoom: {
          pan: {
            enabled: true,
            mode: 'xy',
          },
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
              return format(new Date(ts), 'yyyy-MM-dd HH:mm:ss', { locale: ja });
            },
          },
        },
        legend: {
          labels: {
            usePointStyle: false, 
            boxWidth: 0,         
          },
          onClick: null,      
        },
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'minute',
            tooltipFormat: 'yyyy-MM-dd HH:mm:ss',
            displayFormats: {
              minute: 'yyyy-MM-dd HH:mm' // ← これを追加
            }
          },
          min: STime,
          max: ETime,
          
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
          display: visibleLines.temperature,
          position: 'left',
          offset: true,
          title: { display: true, text: labelMap.temperature },
          min: -20,
          max: 70,       
        },
        y2: {
          type: 'linear',
          display: visibleLines.humidity,
          position: 'left',
          offset: true,
          grid: { drawOnChartArea: false },
          title: { display: true, text: labelMap.humidity },
          min: 0,
          max: 100,
        },
        y3: {
          type: 'linear',
          display: visibleLines.CO2,
          position: 'left',
          offset: true,
          grid: { drawOnChartArea: false },
          title: { display: true, text: labelMap.CO2 },
          min: 0,
          max: 3000,
        },
        y4: {
          type: 'linear',
          display: visibleLines.NIR,
          position: 'right',
          offset: true,
          grid: { drawOnChartArea: false },
          title: { display: true, text: labelMap.NIR },
          min: 0,
          max: 6000,
        },
        y5: {
          type: 'linear',
          display: visibleLines.VR,
          position: 'right',
          offset: true,
          grid: { drawOnChartArea: false },
          title: { display: true, text: labelMap.VR },
          min: 0,
          max: 6000,
        },
        y6: {
          type: 'linear',
          display: visibleLines.PPFD,
          position: 'right',
          offset: true,
          grid: { drawOnChartArea: false },
          title: { display: true, text: labelMap.PPFD },
          min: 0,
          max: 6000,
        },
        y7: {
          type: 'linear',
          display: visibleLines.soil_mois,
          position: 'right',
          offset: true,
          grid: { drawOnChartArea: false },
          title: { display: true, text: labelMap.soil_mois },
          min: 0,
          max: 100,
        },
        y8: {
          type: 'linear',
          display: visibleLines.soil_EC,
          position: 'right',
          offset: true,
          grid: { drawOnChartArea: false },
          title: { display: true, text: labelMap.soil_EC },
          min: -50,
          max: 200,
        },
        y9: {
          type: 'linear',
          display: visibleLines.soil_temp,
          position: 'right',
          offset: true,
          grid: { drawOnChartArea: false },
          title: { display: true, text: labelMap.soil_temp },
          min: -10,
          max: 50,
        },
        y10: {
          type: 'linear',
          display: visibleLines.satur,
          position: 'right',
          offset: true,
          grid: { drawOnChartArea: false },
          title: { display: true, text: labelMap.satur },
          min: 0,
          max: 5,
        },
      },
    };
    const toggleLine = (field) => {
      setVisibleLines(prev => ({
        ...prev,
        [field]: !prev[field],
      }));
    }; 
    const selectStyle = {
      backgroundColor: 'white',
      padding: '8px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      maxHeight: '100px',
      overflowY: 'auto'
    };   
    const optionStyle = (isSelected, color) => ({
      padding: '4px 8px',
      backgroundColor: isSelected ? color : 'transparent',
      color: isSelected ? 'white' : '#4b5563',
      cursor: 'pointer',
      margin: '2px 0',
      borderRadius: '2px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    });

    return (
    <div className="sensor-chart-wrapper">
      <button className="fullscreen-btn" onClick={() => setIsFullscreen(true)}>
        <span className="material-symbols-outlined icon-small">search</span>
        {deviceId}
      </button>
      <div className="chart-container">
        {hasData ? (
          <Line ref={chartRef} data={chartData} options={options} />
        ) : (
          <p>No data to show</p>
        )}
      </div>
      {isFullscreen && (
        <div className="fullscreen-modal" onClick={() => setIsFullscreen(false)}>
          <div className="fullscreen-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsFullscreen(false)}>✖</button>

            <div className="flex flex-col md:flex-row gap-6 mb-4">
              <div className="w-64" style={selectStyle}>
                {Object.keys(visibleLines).map(field => (
                  <div
                    key={field}
                    onClick={() => toggleLine(field)}
                    style={optionStyle(visibleLines[field], cssColorMap[field])}
                  >
                    <input
                      type="checkbox"
                      checked={visibleLines[field]}
                      onChange={() => {}}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{labelMap[field]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-fullscreen">
              <Line ref={chartRef} data={chartData} options={options} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}