'use client';
import './config-form.css';
import { useRouter} from 'next/navigation';
import { useState, useContext, useEffect } from 'react';
import { AuthContext } from "@/context/Authcontext";
import {handleSubmitRow,handleSubmitKabumaJoukan} from '@/components/kabu_jou';
import {handleSubmitCO2,handleSubmitSelftest} from '@/components/calib_self';
import {handleSubmitTemp} from '@/components/sekisan';
import HouseConfigForm from "@/components/kabu_jou";
import {CalibSelfForm} from "@/components/calib_self";
import { SekisanTempForm } from "@/components/sekisan";


export default function ConfigForm() {
  const router = useRouter();
  const { logout } = useContext(AuthContext);
  const [deviceSuffix, setDeviceSuffix] = useState([]);
  const [role, setRole] = useState('');
  const [houseId, setHouseId] = useState('');
  const [slaveid, setSlaveid] = useState([]); 
  const [hasAutoFetched, setHasAutoFetched] = useState(false);
  const [listOfHouses, setListOfHouses] = useState([]);
  const deviceIdList = deviceSuffix.map(suffix => `${houseId}#${suffix}`);
  
  const [rows, setRows] = useState(
    Array.from({ length: 3 }, () => ({
      house_device: '',
      kuboma: '',
      jouma: '',
      set_date: '',     // ← 追加
      base_temp: ''     // ← 追加
    }))
  );

  const [targetCO2s, setTargetCO2s] = useState(
    Array.from({ length: 3 }, () => ({ house_device: '', target_co2: '' }))
  );
  const [message, setMessage] = useState('');
  const [savedInputs, setSavedInputs] = useState({
    house_device: [],
    kuboma: [],
    jouma: [],
    base_temp: [],
    set_date: [],
  });

  const [currentDevice, setCurrentDevice] = useState(
    Array.from({ length: 3 }, () => ({ house_device: '', kuboma: '', jouma: '' }))
  );
  // コマンド番号の enum を追加
  const Command = {
    CALB: 0,
    SELFTEST: 1,
    RESTART: 2
  };
  useEffect(() => {
    if (role === "admin") {
      const houseDevicesMap = JSON.parse(localStorage.getItem("houseDevicesMap") || "{}");
      setSlaveid(houseDevicesMap[houseId] || []);
      setDeviceSuffix([]);
    }
  }, [houseId]);


  // ① 日付と deviceSuffix が揃ったら日付をセット
  useEffect(() => {
    if (!hasAutoFetched && houseId && deviceSuffix.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      setHasAutoFetched(true);
      setReadyToFetch(true);  // ← 次段階へ
    }
  }, [houseId, deviceSuffix]);
  useEffect(() => {
    const savedRows = localStorage.getItem('rows');
    const savedCO2s = localStorage.getItem('targetCO2s');

    if (savedRows) {
      setRows(JSON.parse(savedRows));
    }
    if (savedCO2s) {
      setTargetCO2s(JSON.parse(savedCO2s));
    }
  }, []);
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

  useEffect(() => {
    localStorage.setItem('rows', JSON.stringify(rows));
  }, [rows]);

  useEffect(() => {
    localStorage.setItem('targetCO2s', JSON.stringify(targetCO2s));
  }, [targetCO2s]);

  // 既存のuseEffectの後に追加
  useEffect(() => {
    const savedInputs = localStorage.getItem('savedInputs');
    if (savedInputs) {
      setSavedInputs(JSON.parse(savedInputs));
    }
  }, []);

  const handleRowChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);

    // 入力値を保存
    if (value) {
      setSavedInputs(prev => {
        const updated = {
          ...prev,
          [field]: Array.from(new Set([...prev[field], value])),
        };
        localStorage.setItem('savedInputs', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleCO2Change = (index, field, value) => {
    const newCO2s = [...targetCO2s];
    newCO2s[index][field] = value;
    setTargetCO2s(newCO2s);
};
  return (
  <div className="config-container">
    {/* 株間と条間 設定 */}
    <HouseConfigForm
      rows={rows}
      setRows={setRows}
      role={role}
      listOfHouses={listOfHouses}
      slaveid={slaveid}
      deviceSuffix={deviceSuffix}
      setDeviceSuffix={setDeviceSuffix}
      savedInputs={savedInputs}
      setMessage={setMessage}
    />

    {/* CO₂ キャリブレーション & セルフテスト */}
    <CalibSelfForm
      targetCO2s={targetCO2s}
      setTargetCO2s={setTargetCO2s}
      setMessage={setMessage}
      Command={Command}
      handleSubmitCO2={handleSubmitCO2}
      handleSubmitSelftest={handleSubmitSelftest}
      
    />

    {/* 積算温度 設定 */}
    <SekisanTempForm
      rows={rows}
      setRows={setRows}
      setMessage={setMessage}
      savedInputs={savedInputs}
    />

    {/* メッセージ表示 */}
    {message && <p className="config-message">{message}</p>}

    {/* datalist elements */}
    <datalist id="house-device-list">
      {savedInputs.house_device.map((value) => (
        <option key={value} value={value} />
      ))}
    </datalist>

    <datalist id="kuboma-list">
      {savedInputs.kuboma.map((value) => (
        <option key={value} value={value} />
      ))}
    </datalist>

    <datalist id="jouma-list">
      {savedInputs.jouma.map((value) => (
        <option key={value} value={value} />
      ))}
    </datalist>
  </div>
);
}