'use client';
import { useState, useEffect } from 'react';
import './dashboard.css';
import { exportCSV } from '@/components/exportCSV'; 
import dynamic from 'next/dynamic';
import { FIELD_LABELS, evaluateStatus, CSV_FIELDS_DAILY, CSV_FIELDS } from '@/components/constants';
import { formatTimestamp, formatRawTimestamp,formatDateOnly} from '@/components/utils'; 
import Link from 'next/link';

const SensorChartGroup = dynamic(() => import('@/components/SensorChartGroup'), { ssr: false });
const SensorChart = dynamic(() => import('@/components/SensorChart'), { ssr: false });
export default function DashboardPage() {
  const [data, setData] = useState({ daily: [], hourly: [] });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [laiAreaData, setLaiAreaData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rawItems, setRawItems] = useState([]);
  const [aggItems, setAggItems] = useState([]);
  const [houseId, setHouseId] = useState('');
  const [deviceSuffix, setDeviceSuffix] = useState('');
  const [showChart, setShowChart] = useState(false);
  const [isSingleDay, setIsSingleDay] = useState(true);
  const [savedInputs, setSavedInputs] = useState({
    houseId: [],
    deviceSuffix: []
  });
  const deviceId = `${houseId}#${deviceSuffix}`;

  const oldFields = [
    'house_device', 'timestamp', 'temperature', 'humidity', 'CO2',
    'soil_mois', 'soil_EC', 'soil_temp','satur', 'VR', 'PPFD', 'NIR'
  ];
  const newFields = [
    'lai', 'area_per_plant'
  ];
  const baseFields = [
    'house_device', 'timestamp', 'temperature', 'humidity', 'CO2',
    'soil_mois', 'soil_EC', 'soil_temp', 'satur', 'VR', 'PPFD', 'NIR'
  ];
  function getDisplayValue(item, field) {
    if (field === 'timestamp') {
    return formatTimestamp(item[field]);
  }
  if (['house_device', 'status', 'lai', 'nir_vr_ratio'].includes(field)) {
    return item[field] ?? '-';
  }
  if (item[field] !== undefined) {
    return item[field];
  }
  const totalKey = `total_${field}`;
  if (item[totalKey] !== undefined && item.samples) {
    return (item[totalKey] / item.samples).toFixed(2);
  }
  return '-';
  }
  const isWithinOneDay = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return (
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getDate() === endDate.getDate()
    );
  };

  const fetchData = async (e) => {
    e.preventDefault();
    if (!houseId || !deviceSuffix || !startDate || !endDate) {
      alert('Please fill all required fields');
      return;
    }
    setShowChart(true);  
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const adjustedStart = `${startDate}T00:00:00`;
      const adjustedEnd = `${endDate}T23:59:59`;
      const isSingleDay = isWithinOneDay(startDate, endDate);
      setRawItems([]);
      setData({ daily: [], hourly: [] });
      const encodedDeviceId = encodeURIComponent(deviceId);
      if (isSingleDay) {
        const rawRes = await fetch(
          `https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/sensor-data?device_id=${encodedDeviceId}&start_timestamp=${adjustedStart}&end_timestamp=${adjustedEnd}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!rawRes.ok) throw new Error(`HTTP error! status: ${rawRes.status}`);
        const rawResult = await rawRes.json();
        const rawData = Array.isArray(rawResult) ? rawResult : (rawResult.items || rawResult.data || []);
        setRawItems(rawData.map(item => ({
          house_device: item.house_device || deviceId,
          timestamp: item.timestamp,
          temperature: item.temperature?.toFixed(2),
          humidity: item.humidity?.toFixed(2),
          CO2: item.CO2?.toFixed(2),
          soil_mois: item.soil_mois?.toFixed(2),
          soil_EC: item.soil_EC?.toFixed(2),
          soil_temp: item.soil_temp?.toFixed(2),
          satur: item.satur?.toFixed(2),
          VR: item.VR?.toFixed(2),
          PPFD: item.PPFD?.toFixed(2),
          NIR: item.NIR?.toFixed(2),
          status: item.status || '',
        })));
      }
      const aggRes = await fetch(
        `https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/query_data?device_id=${encodedDeviceId}&start_timestamp=${adjustedStart}&end_timestamp=${adjustedEnd}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const laiRes = await fetch(
        `https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/sensor-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            device_id: deviceId,
            start_timestamp: adjustedStart,
            end_timestamp: adjustedEnd
          })
        }
      );
      if (!laiRes.ok) throw new Error("Failed to fetch LAI data");
      const laiResult = await laiRes.json();
      setLaiAreaData(laiResult);
      if (!aggRes.ok) throw new Error(`HTTP error! status: ${aggRes.status}`);
      const aggResult = await aggRes.json();
      const processAggregate = (items) => {
        return (items || []).map(item => {
          const processedItem = {
            house_device: item.house_device,
            timestamp: item.timestamp,
            samples: item.samples || 1,
          };
          Object.keys(item).forEach(key => {
            if (key.startsWith('total_')) {
              const fieldName = key.replace('total_', '');
              processedItem[fieldName] = item.samples 
              ? (item[key] / item.samples).toFixed(2)
              : item[key];
            } else if (!['house_device', 'timestamp', 'samples'].includes(key)) {
              processedItem[key] = item[key];
            }
          });
          if (item.total_NIR) processedItem.NIR = (item.total_NIR / item.samples).toFixed(2);
          if (item.total_PPFD) processedItem.PPFD = (item.total_PPFD / item.samples).toFixed(2);
          if (item.total_VR) processedItem.VR = (item.total_VR / item.samples).toFixed(2);
          if (item.total_temperature) processedItem.temperature = (item.total_temperature / item.samples).toFixed(2);
          if (item.total_humidity) processedItem.humidity = (item.total_humidity / item.samples).toFixed(2);
          if (item.total_CO2) processedItem.CO2 = (item.total_CO2 / item.samples).toFixed(2);
          if (item.total_temperature && item.total_humidity && item.samples) {
            const tempC = item.total_temperature / item.samples;
            const RH = item.total_humidity / item.samples;
            const e_s = Math.exp(19.0177 - (5327 / (tempC + 273.15)));
            const e = RH / 100 * e_s;
            const absoluteHumidity = (216.7 * e) / (tempC + 273.15);
            processedItem.satur = absoluteHumidity.toFixed(2);
          }
          if (item.total_soil_EC) processedItem.soil_EC = (item.total_soil_EC / item.samples).toFixed(2);
          if (item.total_soil_temp) processedItem.soil_temp = (item.total_soil_temp / item.samples).toFixed(2);
          if (item.total_soil_mois) processedItem.soil_mois = (item.total_soil_mois / item.samples).toFixed(2);
          return processedItem;
        });
      };
      const processedData = {
        daily: processAggregate(aggResult.daily),
        hourly: processAggregate(aggResult.hourly)
      };
      const singleDay = isWithinOneDay(startDate, endDate);
      setIsSingleDay(singleDay);
      setData(processedData);
      setAggItems(processedData.daily);
    } catch (error) {
      alert("Error when take data " + error.message);
    } finally {
      setLoading(false);
    }
  };
  const combinedData = isSingleDay
  ? [...rawItems, ...data.hourly, ...data.daily]
  : [...data.hourly, ...data.daily];
  const oldData = combinedData.map(item => {  
    const obj = {};
    oldFields.forEach(f => {
      if (f === 'house_device' || f === 'status') {
        obj[f] = item[f];
      } else if (f === 'timestamp') {
        obj[f] = item[f]?.split('#')[0];
      } else {
        const val = item[f];
        obj[f] = val !== undefined && val !== null && val !== '-' ? Number(val) : null;
      }
    });
    return obj;  
  });
  const laiMap = new Map(
    laiAreaData.map(item => [item.timestamp.split('#')[0], item.area_per_plant])
  );
  const mergedDaily = data.daily.map(item => ({
    ...item,
    area_per_plant: laiMap.get(item.timestamp.split('#')[0]) ?? null,
  }));
  const newData = mergedDaily.map(item => {
    const obj = {};
    newFields.forEach(f => {
      let val = item[f];
      if (val !== undefined && val !== null && val !== '-') {
        const num = Number(val);
        obj[f] = isNaN(num) ? val : num;
      } else {
        obj[f] = null;
      }
    });
    return obj;
  });
  useEffect(() => {
    const savedInputs = localStorage.getItem('dashboardInputs');
    if (savedInputs) {
      setSavedInputs(JSON.parse(savedInputs));
    }
  }, []);
  const handleHouseIdChange = (e) => {
    const value = e.target.value;
    setHouseId(value);
    
    if (value) {
      setSavedInputs(prev => {
        const updated = {
          ...prev,
          houseId: Array.from(new Set([...prev.houseId, value]))
        };
        localStorage.setItem('dashboardInputs', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleDeviceSuffixChange = (e) => {
    const value = e.target.value;
    setDeviceSuffix(value);
    
    if (value) {
      setSavedInputs(prev => {
        const updated = {
          ...prev,
          deviceSuffix: Array.from(new Set([...prev.deviceSuffix, value]))
        };
        localStorage.setItem('dashboardInputs', JSON.stringify(updated));
        return updated;
      });
    }
  };
  // 表示/非表示の状態を管理
  const [visibleFields, setVisibleFields] = useState(
    Object.fromEntries(oldFields.map(f => [f, true]))
  );

  // トグル関数
  const toggleField = (field) => {
    setVisibleFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="fetch-data">
      <h1>🌱 センサモニタ 🌱</h1>
      <form onSubmit={fetchData} id="filterForm">
  <input
    type="text"
    value={houseId}
    onChange={handleHouseIdChange}
    placeholder="House ID を入力"
    list="house-id-list"
    required
  />
  <datalist id="house-id-list">
    {savedInputs.houseId?.map((value) => (
      <option key={value} value={value} />
    ))}
  </datalist>

  <input
    type="text"
    placeholder="子機番号 を入力"
    value={deviceSuffix}
    onChange={handleDeviceSuffixChange}
    list="device-suffix-list"
    required
  />
  <datalist id="device-suffix-list">
    {savedInputs.deviceSuffix?.map((value) => (
      <option key={value} value={value} />
    ))}
  </datalist>

      <input
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      required
      />
      <input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      required
      />
      <div className="take-data">
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'データ取得'}
        </button>
      </div>
      <div>
          <Link href="/RadarChart">  
          <button className="bg-green-600 text-white px-4 py-2 rounded">
            レーダーチャート
            </button>
            </Link>
        </div>
        <div>
          <Link href="/config-form">  
          <button className="bg-green-600 text-white px-4 py-2 rounded">
            ユーザ設定
            </button>
            </Link>
        </div>
        <button onClick={() => exportCSV(rawItems, false,CSV_FIELDS)}>CSV1日</button>
        <button onClick={() => exportCSV(data.hourly, true,CSV_FIELDS)}>CSV複数日</button>
        <button onClick={() => exportCSV(mergedDaily, true, CSV_FIELDS_DAILY)}>CSV葉面積LAI</button>
        
    </form>
    {isSingleDay && rawItems.length > 0 && (
      <>
      <h2>センサデータ</h2>

      <div className="table-container">
      <table>
        <thead>
          <tr>
            {oldFields.filter(f => visibleFields[f]).map((col) => (
              <th key={col}>{FIELD_LABELS[col] || col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rawItems.slice(-1).map((item, index) => (
            <tr key={`raw-${index}`}>
              {oldFields.filter(f => visibleFields[f]).map((col) => (
                <td key={`${index}-${col}`}>
                  {col === 'timestamp'
                  ? formatRawTimestamp(item[col])
                  : col === 'status'
                  ? evaluateStatus(item)
                  : item[col] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      </>
    )}
    {!isSingleDay && (data.hourly.length > 0 || data.daily.length > 0) && (
      <>
      <div className="table-container">
      <table>
        <thead>
          <tr>
            {oldFields.filter(f => visibleFields[f]).map((col) => (
              <th key={col}>{FIELD_LABELS[col] || col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
              {(data.hourly.length > 0 ? data.hourly : data.daily).slice(-1).map((item, index) => (
                <tr key={`agg-${index}`}>
              {oldFields.filter(f => visibleFields[f]).map((col) => (
                <td key={`${index}-${col}`}>
                  {col === 'timestamp'
                  ? formatTimestamp(item[col])
                  : col === 'status'
                  ? evaluateStatus(item)
                  : item[col] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      </>
    )}
    
    {data.daily.length > 0 && (
      <>
      <div className="table-container2">
        <table>
          <thead>
            <tr>
              {newFields.map((col) => (
                <th class="alt-bg" key={col}>{FIELD_LABELS[col] || col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {newData.slice(-1).map((item, index) => (
              <tr key={`fixed-${index}`}>
                {newFields.map((col) => (
                  <td key={`${index}-${col}`}>
                    {col === 'timestamp' ? formatDateOnly(item[col]) : item[col] ?? '-'}
                    </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
    )}
    {showChart && (
      <>
        <SensorChart data={oldData} />
        <SensorChartGroup data={mergedDaily} />
      </>
    )}
  </div>
);
}
