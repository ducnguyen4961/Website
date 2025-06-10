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
  e.preventDefault();
  setMessage('送信中（CO₂制御）...');

  const messages = [];

  try {
    const validRows = targetCO2s.filter((r) => {
      const value = parseFloat(r.target_co2);
      return r.house_device && !isNaN(value);
    });

    for (const row of validRows) {
      try {
        const res = await fetch('https://prt5eqb726.execute-api.ap-northeast-1.amazonaws.com/version2/send_value', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            device: row.house_device,
            target_co2: parseFloat(row.target_co2),
          }),
        });

        const data = await res.json();

        if (data.message === "OK") {

          messages.push(`✅ ${row.house_device}: コマンドを送信しました。`);

        } else {

          messages.push(`⚠️ ${row.house_device}: 予期しない応答です (${JSON.stringify(data)})`);

        }

      } catch (err) {
        messages.push(`❌ ${row.house_device}: エラー発生 (${err.message})`);
      }
    }

    setMessage(messages.join('\n'));
  } catch (err) {
    console.error(err);
    setMessage('CO₂制御の送信に失敗しました!');
  }
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
