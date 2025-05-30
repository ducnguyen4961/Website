'use client';

import { useState } from 'react';
import './dashboard.css';
import { exportCSV } from '@/components/exportCSV'; 
import dynamic from 'next/dynamic';
import { fieldLabels, evaluateStatus } from '@/components/constants';
import { formatTimestamp } from '@/components/utils';

const SensorChart = dynamic(() => import('@/components/SensorChart'), { ssr: false });

export default function DashboardPage() {
  const [data, setData] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [startTimestamp, setStartTimestamp] = useState('');
  const [endTimestamp, setEndTimestamp] = useState('');
  const [isAggregated, setIsAggregated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sensorData, setSensorData] = useState([]);
  const [aggData, setAggData] = useState([]);
  const [rawItems, setRawItems] = useState([]);
  const [aggItems, setAggItems] = useState([]);



  const oldFields = [
    'house_device', 'timestamp', 'temperature', 'humidity', 'CO2',
    'soil_mois', 'soil_EC', 'soil_temp','satur', 'VR', 'PPFD', 'NIR', 'status'
  ];

  const newFields = [
    'house_device', 'timestamp','avg_NIR', 'avg_PPFD', 'avg_VR', 'lai', 'nir_vr_ratio'
  ];

  const isWithinOneDay = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1;
  };

  const fetchData = async (e) => {
    e.preventDefault();

    if (!deviceId || !startTimestamp || !endTimestamp) {
      alert('please fill Device ID, Start and End Timestamp.');
      return;
    }

    setLoading(true);

    try {
      const withinOneDay = isWithinOneDay(startTimestamp, endTimestamp);
      const token = localStorage.getItem('token');


      if (withinOneDay) {
        const [detailRes, aggRes] = await Promise.all([
          fetch(`https://prt5eqb726.execute-api.ap-northeast-1.amazonaws.com/version2/sensor-data?device_id=${deviceId}&start_timestamp=${startTimestamp}&end_timestamp=${endTimestamp}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`https://prt5eqb726.execute-api.ap-northeast-1.amazonaws.com/version2/query_data?device_id=${deviceId}&start_timestamp=${startTimestamp}&end_timestamp=${endTimestamp}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
        ]);
        const [detailData, aggData] = await Promise.all([
          detailRes.json(),
          aggRes.json()
        ]);
        console.log('Raw detail data from API:', detailData);
        console.log('Raw aggregate data from API:', aggData);
        setRawItems(detailData || []);
        setAggItems(aggData.Items || []);
        

        if (!Array.isArray(detailData) || !Array.isArray(aggData)) {
          console.error('Unexpected API result:', detailData, aggData);
          alert('API returned unexpected data.');
          setData([]);
          return;
        }
        const filteredAggData = aggData.filter(
          (item) => item.timestamp?.endsWith('T00:00:00#daily')
        );
        console.log('Filtered aggregate data (daily only):', filteredAggData);
        
        setAggItems(filteredAggData);

        const combined = detailData.map((item) => {
          const matchedAgg = filteredAggData.find((a) =>
            a.timestamp?.startsWith(item.timestamp?.substring(0, 10))
          );
          if (matchedAgg) {
            const { timestamp: aggTs, ...aggRest } = matchedAgg;
            return { ...item, ...aggRest, agg_timestamp: aggTs };
          }
          return item;
        });
        console.log('Combined data:', combined);
        setData(combined);
        setIsAggregated(false);

        if (combined.length === 0) alert('データが探せません');
      } else {
        const res = await fetch(`https://prt5eqb726.execute-api.ap-northeast-1.amazonaws.com/version2/query_data?device_id=${deviceId}&start_timestamp=${startTimestamp}&end_timestamp=${endTimestamp}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const result = await res.json();
        console.log('Aggregate data (multi-day):', result);
        setData(result);

        if (!Array.isArray(result)) {
          console.error('Unexpected API result:', result);
          alert('API returned unexpected data.');
          setData([]);
          return;
        }

        setData(result);
        setIsAggregated(true);

        if (result.length === 0) alert('データが探せません');
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('エラー');
    } finally {
      setLoading(false);
    }
  };

  function Table({ data, fields }) {
    console.log('Table data:', data);
    console.log('Table fields:', fields);
    return (
      <table border="1" cellPadding={5} style={{ marginBottom: 40, width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#eee' }}>
            {fields.map(f => (
              <th key={f} style={{ textAlign: 'left' }}>{fieldLabels[f] || f}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={fields.length} style={{ textAlign: 'center' }}>No data</td></tr>
          ) : (
            data.map((row, i) => (
              <tr key={i}>
                {fields.map(f => (
                  <td key={f}>{row[f] != null ? row[f] : '-'}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    );
  }

  // Tách dữ liệu ra 2 nhóm theo các trường tương ứng
  const oldData = data.map(item => {
    const obj = {};
    oldFields.forEach(f => {
      obj[f] = item[f];
    });
    return obj;
  });

  const newData = data.map(item => {
    const obj = {};
    newFields.forEach(f => {
      obj[f] = item[f];
    });
    return obj;
  });

console.log('Raw items for old data table:', rawItems);
console.log('Aggregate items for new data table:', aggItems);
return (
  <div className="fetch-data">
    <h1>🌱 IoT Greenhouse Monitoring Dashboard 🌱</h1>
    <form onSubmit={fetchData} id="filterForm">
      <input
        type="text"
        value={deviceId}
        onChange={(e) => setDeviceId(e.target.value)}
        placeholder="Device ID (required)"
        required
      />
      <input
        type="datetime-local"
        value={startTimestamp}
        onChange={(e) => setStartTimestamp(e.target.value)}
        required
      />
      <input
        type="datetime-local"
        value={endTimestamp}
        onChange={(e) => setEndTimestamp(e.target.value)}
        required
      />
      <div className="take-data">
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Data'}
        </button>
      </div>
      <div className="export">
        {/* Export CSV cho dữ liệu hiện tại (cả 2 bảng) */}
        <button
          type="button"
          onClick={() => exportCSV(data, isAggregated)}
          disabled={data.length === 0}
        >
          Export CSV
        </button>
      </div>
    </form>

    {/* Bảng 1: Dữ liệu cảm biến truyền thống */}
    {data.length > 0 && (
      <>
        <h2>Dữ liệu cảm biến truyền thống</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {oldFields.map((col) => (
                  <th key={col}>{fieldLabels[col] || col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rawItems.map((item, index) => (
                <tr key={index}>
                  {oldFields.map((col) => {
                    let value;
                    if (col.startsWith('total_') && 'samples' in item) {
                      const total = item[col];
                      const samples = item.samples;
                      value = samples ? (total / samples).toFixed(2) : '-';
                    } else if (col === 'status') {
                      value = evaluateStatus(item);
                    } else {
                      value = item[col] != null ? item[col] : '-';
                    }
                    return <td key={col}>{value}</td>;
                  })}

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bảng 2: Dữ liệu tính toán */}
        <h2>Dữ liệu tính toán</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {newFields.map((col) => (
                  <th key={col}>{fieldLabels[col] || col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aggItems.map((item, index) => (
                <tr key={index}>
                  {newFields.map((col) => {
                    let value;
                    if ('samples' in item && item[`total_${col}`] !== undefined) {
                      const total = item[`total_${col}`];
                      const avg = total != null && item.samples ? total / item.samples : null;
                      value = avg != null ? avg.toFixed(2) : '-';
                    } else {
                      value = item[col] != null ? item[col] : '-';
                    }
                    return <td key={col}>{value}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )}

    <SensorChart data={data} />
  </div>
);

}
