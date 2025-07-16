export const handleSubmitTemp = async (rows, setMessage) => {
  setMessage('送信中（積算温度設定）...');

  try {
    const validRows = rows.filter((r) => r.house_device && r.set_date && r.base_temp);

    await Promise.all(
      validRows.map((row) =>
        fetch('https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/Accumulated_Temperature_query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'put',
            configs: [
              {
                house_device: row.house_device,
                set_date: row.set_date,
                base_temp: parseFloat(row.base_temp)
              }
            ]
          }),
        })
      )
    );

    setMessage('積算温度の更新が完了しました!');
  } catch (err) {
    console.error(err);
    setMessage('積算温度の更新に失敗しました!');
  }
};
import React, { useEffect, useState } from 'react';

export const SekisanTempForm = ({ rows, setRows, savedInputs }) => {
  const [role, setRole] = useState('');
  const [house, setHouse] = useState('');
  const [listOfHouses, setListOfHouses] = useState([]);  
  const [message, setMessage] = useState('');

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    const storedHouse = localStorage.getItem('house');
    const houseDevicesMap = JSON.parse(localStorage.getItem('houseDevicesMap') || '{}');
    const allHouses = Object.keys(houseDevicesMap);

    setRole(storedRole);
    setHouse(storedHouse);
    setListOfHouses(allHouses);

    if (storedRole === 'admin') {
      const defaultRows = allHouses.flatMap((h) =>
        (houseDevicesMap[h] || []).map((sid) => ({
          house_device: `${h}#${sid}`,
          set_date: '',
          base_temp: ''
        }))
      );
      setRows(defaultRows);
    } else {
      const slaveIds = houseDevicesMap[storedHouse] || [];
      const defaultRows = slaveIds.map((sid) => ({
        house_device: `${storedHouse}#${sid}`,
        set_date: '',
        base_temp: ''
      }));
      setRows(defaultRows);
    }
  }, []);


  return (
    <div className="config-container">
      <h2 className="config-title">積算温度 設定</h2>
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSubmitTemp(rows, setMessage);
        }} className="config-form">
          <div className="config-row">
            <select
            value={house}
            onChange={(e) => {
              const selected = e.target.value;
              setHouse(selected);
              const map = JSON.parse(localStorage.getItem('houseDevicesMap') || '{}');
              const slaves = map[selected] || [];
              const updated = slaves.map((sid) => ({
                house_device: `${selected}#${sid}`,
                set_date: '',
                base_temp: ''
              }));
              setRows(updated);
            }}
            className="config-input"
            required>
              <option value="">選択してください</option>
              {listOfHouses.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          {rows.map((row, index) => (
            <div key={row.house_device || index} className="config-row">
              <input
              type="text"
              value={row.house_device.split('#')[1] || ''}
              readOnly
              className="config-input"
              style={{ backgroundColor: '#eee' }}
              />
              <input
              type="date"
              value={row.set_date || ''}
              onChange={(e) => handleRowChange(index, 'set_date', e.target.value)}
              className="config-input"
              />
              <input
              type="number"
              value={row.base_temp || ''}
              onChange={(e) => handleRowChange(index, 'base_temp', e.target.value)}
              className="config-input"
              placeholder="基準温度 (℃)"
              />
            </div>
          ))}
        <button type="submit" className="config-button">送信</button>
      </form>
    </div>
  );
};
