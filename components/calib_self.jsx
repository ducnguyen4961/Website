export const handleSubmitCO2 = async (targetCO2s, setMessage, Command) => {
  setMessage('送信中（CO₂制御）...');

  const messages = [];
  const validRows = targetCO2s.filter((r) => {
    const value = parseFloat(r.target_co2);
    return r.house_device && !isNaN(value);
  });

  for (const row of validRows) {
    try {
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

      let ackReceived = false;
      let ackReturnVal = null;

      for (let i = 0; i < 7; i++) {
        await new Promise((r) => setTimeout(r, 700));
        const ackRes = await fetch(`https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/send_value?device=${row.house_device}`);
        if (!ackRes.ok) continue;

        const ackData = await ackRes.json();

        if (ackData.ack === true) {
          ackReceived = true;
          ackReturnVal = ackData.return_val ?? null;
          break;
        }
      }

      if (ackReceived) {
        if (ackReturnVal !== null) {
          messages.push(`✅ ${row.house_device}: キャリブレーションが完了しました。CO₂補正量 ${ackReturnVal} ppm`);
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

export const handleSubmitSelftest = async (targetCO2s, setMessage, Command) => {
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

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

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
          ackReturnVal = ackData.return_val ?? null;
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

import React, { useState, useEffect } from 'react';

export const CalibSelfForm = ({
  targetCO2s,
  setTargetCO2s,
  Command,
  handleSubmitCO2,
  handleSubmitSelftest
}) => {
  const [role, setRole] = useState('');
  const [house, setHouse] = useState('');
  const [listOfHouses, setListOfHouses] = useState([]);
  const [selfTestTargets, setSelfTestTargets] = useState([]);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    const storedHouseDevicesMap = JSON.parse(localStorage.getItem("houseDevicesMap") || "{}");
    const allHouses = Object.keys(storedHouseDevicesMap);
    const storedHouse = localStorage.getItem("house") || allHouses[0];
    setRole(storedRole);
    setHouse(storedHouse);
    setListOfHouses(allHouses);
    if (!localStorage.getItem("house") && storedHouse) {
      localStorage.setItem("house", storedHouse);
    }
    if (storedRole === 'admin') {
      const initial = allHouses.map(h => ({ house_device: h, target_co2: '' }));
      setTargetCO2s(initial);
      setSelfTestTargets(initial.map(h => ({ house_device: h.house_device })));
    } else {
      const one = [{ house_device: storedHouse, target_co2: '' }];
      setTargetCO2s(one);
      setSelfTestTargets([{ house_device: storedHouse }]);
    }
  }, []);
  const handleCO2Change = (index, key, value) => {
    const updated = [...targetCO2s];
    updated[index] = { ...updated[index], [key]: value };
    setTargetCO2s(updated);
  };
  const handleAddRowCO2 = () => {
    const usedHouses = targetCO2s.map(row => row.house_device);
    const unused = listOfHouses.find(h => !usedHouses.includes(h));
    if (unused) {
      setTargetCO2s([...targetCO2s, { house_device: unused, target_co2: '' }]);
    }
  };
  const handleRemoveRowCO2 = (index) => {
    const updated = [...targetCO2s];
    updated.splice(index, 1);
    setTargetCO2s(updated);
  };
  const handleAddRowSelfTest = () => {
    const usedHouses = selfTestTargets.map(row => row.house_device);
    const unused = listOfHouses.find(h => !usedHouses.includes(h));
    if (unused) {
      setSelfTestTargets([...selfTestTargets, { house_device: unused }]);
    }
  };
  const handleRemoveRowSelfTest = (index) => {
    const updated = [...selfTestTargets];
    updated.splice(index, 1);
    setSelfTestTargets(updated);
  };
  const canAddMore = listOfHouses.length > targetCO2s.length;
  const canAddMoreSelfTest = listOfHouses.length > selfTestTargets.length;
  return (
  <div className="config-container">
    <h2 className="config-title">CO₂ キャリブレーション(校正)</h2>
    <div className="form-wrapper">
      
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmitCO2(targetCO2s, setMessage, Command);
      }}
      className="config-form"
    >
      <h3 className="config-subtitle">設定値</h3>
      {targetCO2s.map((row, index) => (
        <div key={index} className="config-row">
          {role === 'admin' ? (
            <select
              value={row.house_device}
              onChange={(e) => handleCO2Change(index, 'house_device', e.target.value)}
              required
            >
              <option value="">選択してください</option>
              {listOfHouses.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={row.house_device}
              readOnly
              className="config-input"
              style={{ backgroundColor: '#eee', cursor: 'not-allowed' }}
            />
          )}
          <input
            type="number"
            placeholder="目標CO₂(ppm)"
            value={row.target_co2}
            onChange={(e) => handleCO2Change(index, 'target_co2', e.target.value)}
            className="config-input"
          />
          {targetCO2s.length > 1 && (
            <button type="button" onClick={() => handleRemoveRowCO2(index)}>－</button>
          )}
        </div>
      ))}
      <button type="submit" className="config-button">送信（CO₂）</button>
      {(role === 'admin' || role === 'user') && (
        <button type="button" className="extra-button" onClick={handleAddRowCO2} disabled={!canAddMore}>
          ＋デバイスを追加
        </button>
      )}
    </form>

    {/* --- セルフテストフォーム --- */}
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmitSelftest(selfTestTargets, setMessage, Command);
      }}
      className="config-form"
    >
      <h3 className="config-subtitle">セルフテストフォーム</h3>
      {selfTestTargets.map((row, index) => (
        <div key={index} className="config-row">
          <input
            type="text"
            value={row.house_device}
            readOnly
            className="config-input"
          />
          {selfTestTargets.length > 1 && (
            <button type="button" onClick={() => handleRemoveRowSelfTest(index)}>－</button>
          )}
        </div>
      ))}
      <button type="submit" className="config-button">セルフテスト実行</button>
      {(role === 'admin' || role === 'user') && (
        <button type="button" className="extra-button" onClick={handleAddRowSelfTest} disabled={!canAddMoreSelfTest}>
          ＋デバイスを追加
        </button>
      )}
    </form>
    {message && (
      <div className="config-message">
        {message.split('\n').map((line, idx) => (
          <p key={idx}>{line}</p>
        ))}
      </div>
    )}
    </div>
  </div>
);
};