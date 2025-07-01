'use client';
import './config-form.css';
import { useState, useEffect } from 'react';

export default function ConfigForm() {
  const [rows, setRows] = useState(
    Array.from({ length: 3 }, () => ({ house_device: '', kuboma: '', jouma: '' }))
  );
  const [targetCO2s, setTargetCO2s] = useState(
    Array.from({ length: 3 }, () => ({ house_device: '', target_co2: '' }))
  );
  const [message, setMessage] = useState('');
  const [savedInputs, setSavedInputs] = useState({
    house_device: [],
    kuboma: [],
    jouma: [],
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
  const handleSubmitRow = async (e) => {
    e.preventDefault();
    setMessage('送信中（距離情報）...');
    try {
      const validRows = rows.filter((r) => r.house_device);
      await Promise.all(
        validRows.map((row) =>
          fetch('https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/query_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'put',
              house_device: row.house_device,
              kuboma: row.kuboma,
              jouma: row.jouma,
            }),
          })
        )
      );
      setMessage('距離情報の更新が完了しました!');
    } catch (err) {
      console.error(err);
      setMessage('距離情報の更新に失敗しました!');
    }
  };
  const handlesubmitkabumajoukan = async (e) => {
    e.preventDefault();
    setMessage('現在値を取得中...');
    
    try {
      const promises = currentDevice.map(async (device) => {
        if (!device.house_device) return device;

        const response = await fetch(
          `https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/kabu_jou?device_id=${device.house_device}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return {
          ...device,
          kuboma: data.kuboma || '',
          jouma: data.jouma || ''
        };
      });

      const results = await Promise.all(promises);
      setCurrentDevice(results);
      setMessage('現在値を取得しました');
    } catch (error) {
      console.error('Error:', error);
      setMessage('現在値の取得に失敗しました');
    }
  };
const handleSubmitCO2 = async (e) => {
  e.preventDefault();
  setMessage('送信中（CO₂制御）...');

  const messages = [];
  const validRows = targetCO2s.filter((r) => {
    const value = parseFloat(r.target_co2);
    return r.house_device && !isNaN(value);
  });

  for (const row of validRows) {
    try {
      // POST送信
      const res = await fetch('https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/send_value', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device: row.house_device,
          target_co2: parseFloat(row.target_co2),
          cmd: Command.CALB
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      // ACK確認
      let ackReceived = false;
      let ackReturnVal = null;

      for (let i = 0; i < 7; i++) {
        await new Promise((r) => setTimeout(r, 700));
        const ackRes = await fetch(`https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/send_value?device=${row.house_device}`);
        if (!ackRes.ok) continue;

        const ackData = await ackRes.json();
        console.log("ACK Data:", ackData); // 確認ログ追加

        if (ackData.ack === true) {
          ackReceived = true;
          if (ackData.return_val !== undefined && ackData.return_val !== null) {
            ackReturnVal = ackData.return_val;
          }
          break;
        }
      }

      if (ackReceived) {
        if (ackReturnVal !== null) {
          messages.push(`✅ ${row.house_device}: キャリブレーションが完了しました。CO₂補正量　 ${ackReturnVal} 　ppm`);
        } else {
          messages.push(`✅ ${row.house_device}: キャリブレーションが完了しましたが、補正量データは取得できませんでした。`);
        }
      } else {
        messages.push(`⚠️ ${row.house_device}: コマンドは送信されましたが、機器からの応答がありません。`);
      }
    } catch (err) {
      messages.push(`❌ ${row.house_device}: エラー発生 (${err.message})`);
      console.error("CO2送信エラー:", err);
    }
  }

  setMessage(messages.join('\n'));
};
const handleSubmitSelftest = async (e) => {
  e.preventDefault();
  setMessage('送信中（セルフテスト）...');

  const messages = [];
  const validRows = targetCO2s.filter(r => r.house_device);

  for (const row of validRows) {
    try {


      const res = await fetch('https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/send_value', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device: row.house_device,
          cmd: Command.SELFTEST
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      // ACK確認（Lambda経由でack保存済み想定）
      let ackReceived = false;
      let ackReturnVal = null;

      for (let i = 0; i < 7; i++) {
        await new Promise((r) => setTimeout(r, 700));
        const ackRes = await fetch(`https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/send_value?device=${row.house_device}`);
        if (!ackRes.ok) continue;

        const ackData = await ackRes.json();
        console.log("ACK Data:", ackData);

        if (ackData.ack === true) {
          ackReceived = true;
          if (ackData.return_val !== undefined && ackData.return_val !== null) {
            ackReturnVal = ackData.return_val;
          }
          break;
        }
      }

      if (ackReceived) {
        if (ackReturnVal !== null) {
          messages.push(`✅ ${row.house_device}: セルフテスト完了`);
        } else {
          messages.push(`✅ ${row.house_device}: セルフテスト完了、戻り値なし`);
        }
      } else {
        messages.push(`⚠️ ${row.house_device}: 機器からの応答なし`);
      }
    } catch (err) {
      messages.push(`❌ ${row.house_device}: エラー (${err.message})`);
      console.error("SELFTEST送信エラー:", err);
    }
  }

  setMessage(messages.join('\n'));
};
  return (
    <div className="config-container">
      <h1 className="config-title">株間と条間を変更（ｃｍ）</h1>
      <div className="form-container">
        <form onSubmit={handleSubmitRow} className="config-form">
          <div className="positioned-label">株間 　　　　　　　　　　　　条間</div>      
          {rows.map((row, index) => (
            <div key={index} className="config-row">
              <input
                type="text"
                list="house-device-list"
                placeholder="デバイスID"
                value={row.house_device}
                onChange={(e) => handleRowChange(index, 'house_device', e.target.value)}
                className="config-input"
              />
              <input
                type="number"
                list="kuboma-list"
                placeholder="株間 (cm)"
                value={row.kuboma}
                onChange={(e) => handleRowChange(index, 'kuboma', e.target.value)}
                className="config-input"
              />
              <input
                type="number"
                list="jouma-list"
                placeholder="条間 (cm)"
                value={row.jouma}
                onChange={(e) => handleRowChange(index, 'jouma', e.target.value)}
                className="config-input"
              />
            </div>
          ))}
          <button type="submit" className="config-button">送信（距離）</button>
        </form>

<form onSubmit={handlesubmitkabumajoukan} className="config-form">
  <div className="positioned-label">株間 　　　　　　　　　　　　条間</div>  
  {currentDevice.map((device, index) => (
    <div key={index} className="config-row">
      <input
        type="text"
        list="house-device-list"
        placeholder="デバイスID"
        value={device.house_device}
        onChange={(e) => {
          const newDevices = [...currentDevice];
          newDevices[index] = { ...device, house_device: e.target.value };
          setCurrentDevice(newDevices);
        }}
        className="config-input"
      />
      <input
        type="text"
        value={device.kuboma}
        readOnly
        placeholder="株間 (cm)"
        className="config-input"
      />
      <input
        type="text"
        value={device.jouma}
        readOnly
        placeholder="条間 (cm)"
        className="config-input"
      />
    </div>
  ))}
  <button type="submit" className="config-button">現在値を取得</button>
</form>
      </div>


      <h2 className="config-title">CO₂ キャリブレーション(校正)</h2>
      <form onSubmit={handleSubmitCO2} className="config-form1">
        {targetCO2s.map((row, index) => (
          <div key={index} className="config1-row">
            <input
              type="text"
              list="house-device-list"
              placeholder="デバイスID"
              value={row.house_device}
              onChange={(e) => handleCO2Change(index, 'house_device', e.target.value)}
              className="config1-input"
              autoComplete="on"
            />
            <input
              type="number"
              placeholder="目標 CO₂ (ppm)"
              value={row.target_co2}
              onChange={(e) => handleCO2Change(index, 'target_co2', e.target.value)}
              className="config2-input"
              autoComplete="on"
            />
          </div>
        ))}
        <button type="submit" className="config-button">送信（CO₂）</button>
      </form>

      <h2 className="config-title">セルフテスト実行</h2>
      <form onSubmit={handleSubmitSelftest} className="config-form1">
        {targetCO2s.map((row, index) => (
          <div key={index} className="config1-row">
            <input
              type="text"
              list="house-device-list"
              placeholder="デバイスID"
              value={row.house_device}
              onChange={(e) => handleCO2Change(index, 'house_device', e.target.value)}
              className="config1-input"
              autoComplete="on"
            />
          </div>
        ))}
        <button type="submit" className="config-button">
          セルフテスト実行
        </button>
      </form>

      {message && <p className="config-message">{message}</p>}

      {/* datalist要素を追加 */}
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
