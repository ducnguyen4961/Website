'use client';
import { useState } from 'react';
import './config-form.css';

export default function ConfigForm() {
  const [rows, setRows] = useState(
    Array.from({ length: 3 }, () => ({ house_device: '', kuboma: '', jouma: '' }))
  );
  const [targetCO2s, setTargetCO2s] = useState(
    Array.from({ length: 3 }, () => ({ house_device: '', target_co2: '' }))
  );
  const [message, setMessage] = useState('');

  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const handleCO2Change = (index, field, value) => {
    const updated = [...targetCO2s];
    updated[index][field] = value;
    setTargetCO2s(updated);
  };

  const handleSubmitRow = async (e) => {
    e.preventDefault();
    setMessage('送信中（距離情報）...');
    try {
      const validRows = rows.filter((r) => r.house_device);
      await Promise.all(
        validRows.map((row) =>
          fetch('https://prt5eqb726.execute-api.ap-northeast-1.amazonaws.com/version1/query_data', {
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

  const handleSubmitCO2 = async (e) => {
    console.log("Gửi CO2 với data:", targetCO2s);
  e.preventDefault();
  setMessage('送信中（CO₂制御）...');

  const messages = [];
  const validRows = targetCO2s.filter((r) => {
    const value = parseFloat(r.target_co2);
    return r.house_device && !isNaN(value);
  });

  for (const row of validRows) {
    try {
      // Gửi POST
      const res = await fetch('https://prt5eqb726.execute-api.ap-northeast-1.amazonaws.com/version2/send_value', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device: row.house_device,
          target_co2: parseFloat(row.target_co2),
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      if (res.ok) {
  // Bắt đầu polling luôn
  let ackReceived = false;
  for (let i = 0; i < 7; i++) {
    await new Promise((r) => setTimeout(r, 700));
    const ackRes = await fetch(`https://prt5eqb726.execute-api.ap-northeast-1.amazonaws.com/version2/send_value?device=${row.house_device}`);
    if (!ackRes.ok) continue;

    const ackData = await ackRes.json();
    if (ackData.ack === true) {
      ackReceived = true;
      break;
    }
  }

  if (ackReceived) {
    messages.push(`✅ ${row.house_device}: コマンドを送信し、機器が受信しました。`);
  } else {
    messages.push(`⚠️ ${row.house_device}: コマンドは送信されましたが、機器からの応答がありません。`);
  }
} else {
  messages.push(`❌ ${row.house_device}: コマンド送信に失敗しました (HTTP ${res.status})`);
}

    } catch (err) {
      messages.push(`❌ ${row.house_device}: エラー発生 (${err.message})`);
      console.error("Lỗi gửi CO2:", err);

    }
  }

  setMessage(messages.join('\n'));
};
  return (
    <div className="config-container">
      <h1 className="config-title">株間と条間を変更（ｃｍ）</h1>
      <form onSubmit={handleSubmitRow} className="config-form">
        {rows.map((row, index) => (
          <div key={index} className="config-row">
            <input
              type="text"
              placeholder="デバイスID"
              value={row.house_device}
              onChange={(e) => handleRowChange(index, 'house_device', e.target.value)}
              className="config-input"
            />
            <input
              type="number"
              placeholder="株間 (cm)"
              value={row.kuboma}
              onChange={(e) => handleRowChange(index, 'kuboma', e.target.value)}
              className="config-input"
            />
            <input
              type="number"
              placeholder="条間 (cm)"
              value={row.jouma}
              onChange={(e) => handleRowChange(index, 'jouma', e.target.value)}
              className="config-input"
            />
          </div>
        ))}
        <button type="submit" className="config-button">送信（距離）</button>
      </form>

      <h2 className="config-title">CO₂制御コマンドを送信</h2>
      <form onSubmit={handleSubmitCO2} className="config-form1">
        {targetCO2s.map((row, index) => (
          <div key={index} className="config1-row">
            <input
              type="text"
              placeholder="デバイスID"
              value={row.house_device}
              onChange={(e) => handleCO2Change(index, 'house_device', e.target.value)}
              className="config1-input"
            />
            <input
              type="number"
              placeholder="目標 CO₂ (ppm)"
              value={row.target_co2}
              onChange={(e) => handleCO2Change(index, 'target_co2', e.target.value)}
              className="config2-input"
            />
          </div>
        ))}
        <button type="submit" className="config-button">送信（CO₂）</button>
      </form>

      {message && <p className="config-message">{message}</p>}
    </div>
  );
}
