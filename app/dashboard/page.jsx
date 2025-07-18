'use client';
import { useState, useEffect,useContext } from 'react';
import './dashboard.css';
import { exportCSV } from '@/components/exportCSV'; 
import dynamic from 'next/dynamic';
import { FIELD_LABELS, evaluateStatus, CSV_FIELDS_DAILY, CSV_FIELDS } from '@/components/constants';
import { useRouter } from 'next/navigation';
import { formatTimestamp, formatRawTimestamp,formatDateOnly} from '@/components/utils'; 
import Link from 'next/link';
import DeviceSelector from '@/components/DeviceSelector';
import { AuthContext } from "@/context/Authcontext";
import MultiTemperatureStats from "@/components/MultiTemperatureStats";


const SensorChartGroup = dynamic(() => import('@/components/SensorChartGroup'), { ssr: false });
const SensorChart = dynamic(() => import('@/components/SensorChart'), { ssr: false });
export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState({ daily: [], hourly: [] });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [laiAreaData, setLaiAreaData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rawItems, setRawItems] = useState([]);
  const [aggItems, setAggItems] = useState([]);
  const [deviceSuffix, setDeviceSuffix] = useState([]);
  const [listOfHouses, setListOfHouses] = useState([]);
  const [slaveid, setSlaveid] = useState({});
  const [role, setRole] = useState('');
  const [houseId, setHouseId] = useState('');
  const [showChart, setShowChart] = useState(false);
  const [isSingleDay, setIsSingleDay] = useState(true);
  const deviceIdList = deviceSuffix.map(suffix => `${houseId}#${suffix}`);
  const encodedDeviceId = encodeURIComponent(deviceIdList.join(','));
  const [hasAutoFetched, setHasAutoFetched] = useState(false);
  const [readyToFetch, setReadyToFetch] = useState(false);
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    const idToken = localStorage.getItem('idToken');
    const loginTime = localStorage.getItem('loginTime');
    const now = Date.now();
    const MAX_SESSION_DURATION = 10 * 60 * 60 * 1000;
    if (!idToken || !loginTime || now - parseInt(loginTime) > MAX_SESSION_DURATION) {
      localStorage.clear();
      logout();
      router.push('/login');
    }
  }, []);
  useEffect(() => {
    const houseDevicesMap = JSON.parse(localStorage.getItem("houseDevicesMap"));
    if (houseDevicesMap) {
      const houses = Object.keys(houseDevicesMap);
      setListOfHouses(houses);
    }
  }, []);
  // 新しいデバイスの追加の場合には、ページをアクセスしてから、5分後にリロードしたら、新しいのが受けられる
  useEffect(() => {
    const token = localStorage.getItem("idToken");
    if (!token) {
      router.push("/login");
      return;
    }
    fetch("https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/at", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch user info");
      return res.json();
    })
    .then((data) => {
      const userRole = data.role || "";
      setRole(userRole);
      localStorage.setItem("userRole", userRole);

      if (["admin", "user"].includes(role)) {
        const houseMap = data.house_devices || {};
        const houseKeys = Object.keys(houseMap);
        setListOfHouses(houseKeys);
        setHouseId(houseKeys[0] || "");
        setSlaveid(houseMap);
        setDeviceSuffix(data.slave_ids || []); // ← 追加ここ！！
        localStorage.setItem("houseDevicesMap", JSON.stringify(houseMap));
      }
    })
    .catch((err) => {
      console.error("Error loading user info:", err);
      localStorage.clear();
      router.push("/login");
    });
  }, []);
  useEffect(() => {
    if (["admin", "user"].includes(role)) {
      const houseDevicesMap = JSON.parse(localStorage.getItem("houseDevicesMap") || "{}");
      setSlaveid(houseDevicesMap);
      setDeviceSuffix([]);
    }
  }, [houseId]);
  // ① 日付と deviceSuffix が揃ったら日付をセット
  useEffect(() => {
    if (!hasAutoFetched && houseId && (slaveid[houseId]?.length > 0)) {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      const limitedSuffixes = slaveid[houseId].slice(0, 3);
      setDeviceSuffix(limitedSuffixes);
      setHasAutoFetched(true);
      setReadyToFetch(true);
    }
  }, [houseId, slaveid, hasAutoFetched]);
  // ② 日付がセットされたあとに fetchData を呼ぶ
  useEffect(() => {
    if (readyToFetch && startDate && endDate) {
      const fakeEvent = { preventDefault: () => {} };
      setTimeout(() => fetchData(fakeEvent), 0);
      setReadyToFetch(false); // ← 一度だけ呼ばれるように
    }
  }, [readyToFetch, startDate, endDate]);
  useEffect(() => {
    if (role === 'user' && listOfHouses.length > 0 && !houseId) {
      const firstHouse = listOfHouses[0];
      setHouseId(firstHouse);
    }
  }, [role, listOfHouses]);

  const oldFields = [
    'timestamp', 'temperature', 'humidity', 'CO2',
    'soil_mois', 'soil_EC', 'soil_temp','satur', 'VR', 'PPFD', 'NIR', 'status'
  ];
  const newFields = [
    'lai', 'area_per_plant'
  ];
  const baseFields = [
    'timestamp', 'temperature', 'humidity', 'CO2',
    'soil_mois', 'soil_EC', 'soil_temp', 'satur', 'VR', 'PPFD', 'NIR', 'status'
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
            device_id: deviceIdList,
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
    laiAreaData.map(item => [`${item.house_device}#${item.timestamp}`, item.area_per_plant])
  );
  const mergedDaily = data.daily.map(item => {
    const key = `${item.house_device}#${item.timestamp}`;
    return {
      ...item,
      area_per_plant: laiMap.get(key) ?? null,
    };
  });
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
  const groupByDevice = (items) => {
    return items.reduce((acc, item) => {
      const key = item.house_device || 'unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  };
  const activeData = data.hourly.length > 0 ? data.hourly : data.daily;
  const groupedData = activeData.reduce((acc, item) => {
    const device = item.house_device || 'Unknown';
    if (!acc[device]) acc[device] = [];
    acc[device].push(item);
    return acc;
  }, {});

  const groupedRaw = groupByDevice(rawItems);
  const groupedHourly = groupByDevice(data.hourly);
  const groupedDaily = groupByDevice(data.daily);
  const groupedMergedDaily = groupByDevice(mergedDaily);
  // SensorChartと同じデフォルト表示（true:表示, false:非表示）
  const defaultVisibleFields = {
    temperature: false,
    humidity: false,
    CO2: false,
    NIR: true,
    VR: true,
    PPFD: true,
    soil_mois: false,
    soil_EC: false,
    soil_temp: false,
    satur: false,
    lai: false,
    area_per_plant: false,
  };

// マルチプルセレクト用state（trueのものだけ初期選択）
const [selectedFields, setSelectedFields] = useState(
  Object.entries(defaultVisibleFields)
    .filter(([_, v]) => v)
    .map(([k]) => k)
);

// マルチプルセレクトUI
function FieldMultiSelect({ fields, selected, onChange }) {
  return (
    <div style={{ margin: '8px 0' }}>
      <label>表示項目：</label>
      <select
        multiple
        value={selected}
        onChange={e => {
          const options = Array.from(e.target.options);
          onChange(options.filter(o => o.selected).map(o => o.value));
        }}
        style={{ minWidth: 200, minHeight: 80 }}
      >
        {fields.map(f => (
          <option key={f} value={f}>
            {FIELD_LABELS[f] || f}
          </option>
        ))}
      </select>
    </div>
  );
}

// SensorChartと同じフィールド・色・ラベルを利用
const chartFieldList = [
  'temperature', 'humidity', 'CO2', 'NIR', 'VR', 'PPFD',
  'soil_mois', 'soil_EC', 'soil_temp', 'satur'
];
const chartLabelMap = {
  temperature: '温度 (°C)',
  humidity: '湿度 (%RH)',
  CO2: 'CO₂ (ppm)',
  NIR: 'NIR (mV)',
  VR: 'VR (mV)',
  PPFD: 'PPFD (μmol/ms)',
  soil_mois: '土壌水分 (%)',
  soil_EC: '土壌EC (mS/cm)',
  soil_temp: '土壌温度 (°C)',
  satur: '飽差 (g/m³)',
  lai: '株間LAI',
  area_per_plant: '株当たり葉面積',
};

// チェックボックスUI
function ChartFieldMultiSelect({ fields, selected, onChange }) {
  return (
    <div className="chart-multiselect">
      {fields.map(field => (
        <label
          key={field}
          className={
            "chart-multiselect-option" +
            (selected.includes(field) ? ` selected-${field}` : "")
          }
        >
          <input
            type="checkbox"
            checked={selected.includes(field)}
            onChange={() => {
              if (selected.includes(field)) {
                onChange(selected.filter(f => f !== field));
              } else {
                onChange([...selected, field]);
              }
            }}
            style={{ cursor: 'pointer', marginRight: 8 }}
          />
          <span>{chartLabelMap[field]}</span>
        </label>
      ))}
    </div>
  );
}

return (
  <div className="fetch-data">
    {/* isSingleDay/!isSingleDayのみマルチプルセレクト対応 */}
    {(isSingleDay || (!isSingleDay && (data.hourly.length > 0 || data.daily.length > 0))) && (
      <>
        {/* 🔽 全選択・全解除ボタン */}
        <div className="select-buttons" style={{ marginBottom: '10px' }}>
          <button
            type="button"
            onClick={() => setSelectedFields(chartFieldList)}
            className="select-all-btn"
          >
            <span className="material-symbols-outlined">select_all</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFields([])}
            className="deselect-all-btn"
            style={{ marginLeft: '10px' }}
          >
            <span className="material-symbols-outlined">deselect</span>
          </button>
        </div>

        {/* チャートフィールド選択UI */}
        <ChartFieldMultiSelect
          fields={chartFieldList}
          selected={selectedFields}
          onChange={setSelectedFields}
        />
      </>
    )}


    {/* --- mergedDailyは従来通り --- */}
    {mergedDaily.length > 0 && (
      <div className="table-grid-block">
        {Object.entries(groupedMergedDaily).map(([deviceId, deviceData]) => (
          <div key={deviceId} className="block-wrapper">
            <h3>{deviceId.replace(`${houseId}#`, '')}</h3>
            <div className="block-wrapper">
              <button
                className="exp-csv-btn"
                onClick={() => exportCSV(deviceData, true, CSV_FIELDS_DAILY)}
              >
                <span className="material-symbols-outlined">cloud_download</span>
                
              </button>
            </div>
            <div className="block-container">
              {deviceData.slice(-1).map((item, index) => (
                <div key={`merged-block-${deviceId}-${index}`} className="block-item">
                  {['timestamp', 'lai', 'area_per_plant'].map((col) => (
                    <div key={col} className="block-field" data-type={col}>
                      <div><strong>{FIELD_LABELS[col] || col}</strong></div>
                      <div>{col === 'timestamp' ? formatTimestamp(item[col]) : item[col] ?? '-'}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* --- isSingleDay --- */}
    {(isSingleDay && rawItems.length > 0) && (
      <div className="table-grid-block">
        {Object.entries(groupedRaw).map(([deviceId, deviceData]) => (
          <div key={deviceId} className="block-wrapper">
            <h3>{deviceId.replace(`${houseId}#`, '')}</h3>
            <div className="block-wrapper">
              <button
                className="exp-csv-btn"
                onClick={() => exportCSV(deviceData, false, CSV_FIELDS)}
              >
                <span className="material-symbols-outlined">cloud_download</span>
                
              </button>
            </div>
            <div className="block-container">
              {deviceData.slice(-1).map((item, index) => (
                <div key={`raw-block-${deviceId}-${index}`} className="block-item">
                  {selectedFields.map((col) => (
                    <div key={col} className="block-field" data-type={col}>
                      <div><strong>{chartLabelMap[col] || col}</strong></div>
                      <div>{col === 'timestamp' ? formatTimestamp(item[col]) : item[col] ?? '-'}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* --- !isSingleDay --- */}
    {(!isSingleDay && (data.hourly.length > 0 || data.daily.length > 0)) && (
      <div className="table-grid-block">
        {Object.entries(groupedData).map(([deviceId, deviceData]) => (
          <div key={deviceId} className="block-wrapper">
            <h3>{deviceId.replace(`${houseId}#`, '')}</h3>
            <div className="block-wrapper">
              <button
                className="exp-csv-btn"
                onClick={() => exportCSV(deviceData, true, CSV_FIELDS)}
              >
                <span className="material-symbols-outlined">cloud_download</span>
                
              </button>
            </div>
            <div className="block-container">
              {deviceData.slice(-1).map((item, index) => (
                <div key={`agg-block-${deviceId}-${index}`} className="block-item">
                  {selectedFields.map((col) => (
                    <div key={col} className="block-field" data-type={col}>
                      <div><strong>{chartLabelMap[col] || col}</strong></div>
                      <div>{col === 'timestamp' ? formatTimestamp(item[col]) : item[col] ?? '-'}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
    <form onSubmit={fetchData} className="filterForm">
      {['admin', 'user'].includes(role) ? (
        <select
        value={houseId}
        onChange={e => setHouseId(e.target.value)}
        required
        >
          <option value="">please select</option>
          {listOfHouses.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        ) : (
        <input
        type="text"
        value={houseId}
        readOnly
        style={{ backgroundColor: '#eee', cursor: 'not-allowed' }}
        />
        )}
      <DeviceSelector
      slaveid={slaveid[houseId] || []}
      selectedDevices={deviceSuffix}
      setSelectedDevices={setDeviceSuffix}
      />
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
          {loading ? (
              <span className="material-symbols-outlined spin">app_badging</span>
          ) : (
            <>
              <span className="material-symbols-outlined">ssid_chart</span>
            </>
          )}
        </button>
      </div>
    </form>

    {showChart && (
      <>
        <div className="charts-scroll-container">
          {Object.entries(groupedMergedDaily).map(([deviceId, deviceData]) => (
            <div key={deviceId} className="chart-item.compact">
              <h3>{deviceId.replace(`${houseId}#`, '')}</h3>
              <SensorChartGroup data={deviceData} />
            </div>
          ))}
        </div>

        {/* --- SensorChart 縦並び表示 --- */}
        <div>
          <MultiTemperatureStats deviceIds={deviceIdList} houseId={houseId} />
          <div className="chart-grid">
            {Object.entries(groupedData).map(([deviceId, data]) => (
              <SensorChart key={deviceId} data={data} deviceId={deviceId} rawData={groupedRaw[deviceId] || []} isSingleDay={isSingleDay}/>
            ))}
          </div>
        </div>
      </>
    )}
    </div>
  );
}
