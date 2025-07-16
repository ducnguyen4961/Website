export const handleSubmitRow = async (rows, setMessage) => {
  setMessage('送信中（距離情報）...');
  try {
    const validConfigs = rows
      .filter((r) => r.house_device)
      .map((r) => ({
        house_device: r.house_device,
        kuboma: r.kuboma,
        jouma: r.jouma,
      }));
    const response = await fetch('https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/query_data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'put',
        configs: validConfigs,
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    setMessage('距離情報の更新が完了しました!');
  } catch (err) {
    console.error(err);
    setMessage('距離情報の更新に失敗しました!');
  }
};
export const handleSubmitKabumaJoukan = async (currentDevice, setCurrentDevice, setMessage) => {
  setMessage('現在値を取得中...');

  try {
    const deviceIds = currentDevice.map((d) => d.house_device).join(',');
    const url = `https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/kabu_jou?device_ids=${encodeURIComponent(deviceIds)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const updated = currentDevice.map((device) => {
      const found = data.find(d => d.device_id === device.house_device);
      return {
        ...device,
        kuboma: found?.kuboma || '',
        jouma: found?.jouma || ''
      };
    });
    if (typeof setCurrentDevice === 'function') {
      setCurrentDevice(updated);
    }
    setMessage('現在値を取得しました');
    return data;
  } catch (error) {
    console.error('Error:', error);
    setMessage('現在値の取得に失敗しました');
    return [];
  }
};
import React, { useEffect, useState } from "react";

const HouseConfigForm = () => {
  const [role, setRole] = useState("");
  const [house, setHouse] = useState("");
  const [listOfHouses, setListOfHouses] = useState([]);
  const [rows, setRows] = useState([]);
  const [currentData, setCurrentData] = useState([]);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    const storedHouseDevicesMap = JSON.parse(localStorage.getItem("houseDevicesMap") || "{}");
    const allHouses = Object.keys(storedHouseDevicesMap);
    const storedHouse = localStorage.getItem("house") || allHouses[0];
    setRole(storedRole);
    setHouse(storedHouse);
    setListOfHouses(allHouses);
    if (!localStorage.getItem("house") && storedHouse) {
      localStorage.setItem("house", storedHouse);
    }
    if (storedRole === "admin") {
      setRows([{ slaveId: "", kuboma: "", jouma: "" }]);
    } else {
      const slaveIdsForHouse = storedHouseDevicesMap[storedHouse] || []
      const defaultRows = slaveIdsForHouse.map((sid) => ({
        slaveId: sid,
        kuboma: "",
        jouma: "",
      }));
      setRows(defaultRows);
      const initialCurrent = defaultRows.map(row => ({
        house_device: `${storedHouse}#${row.slaveId}`,
        kuboma: '',
        jouma: ''
      }));
      setCurrentData(initialCurrent);
    }
  }, []);

  const handleRowChange = (index, key, value) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [key]: value };
    setRows(updated);
  };

  const handleAddRow = () => {
    setRows([...rows, { slaveId: "", kuboma: "", jouma: "" }]);
  };

  const handleRemoveRow = (index) => {
    const updated = [...rows];
    updated.splice(index, 1);
    setRows(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSubmitRow(
      rows.map(r => ({
        house_device: `${house}#${r.slaveId}`,
        kuboma: r.kuboma,
        jouma: r.jouma
      })),
      setMessage
    );
  };

  const handleFetchCurrent = async (e) => {
    e.preventDefault();
    const fetchableDevices = rows
    .filter(row => row.slaveId)
    .map(row => `${house}#${row.slaveId}`);
    const deviceList = fetchableDevices.map(id => ({ house_device: id }));
    const fetchedData = await handleSubmitKabumaJoukan(deviceList, null, setMessage);
    const merged = rows.map(row => {
      const device_id = `${house}#${row.slaveId}`;
      const matched = fetchedData?.find(d => d.device_id === device_id);
      return {
        house_device: device_id,
        kuboma: matched?.kuboma || '',
        jouma: matched?.jouma || ''
      };
    });
    setCurrentData(merged);
  };

  return (
    <div className="config-container">
      <h2 className="config-title">株間・条間の設定フォーム</h2>
      <div className="form-wrapper">
      <form onSubmit={handleSubmit} className="config-form">
        {/* --- HOUSE --- */}
        <div className="config-row">
          {role === "admin" ? (
            <select value={house} onChange={(e) => { const newHouse = e.target.value; 
            setHouse(newHouse);
            const houseDevicesMap = JSON.parse(localStorage.getItem("houseDevicesMap") || "{}");
            const slaveIds = houseDevicesMap[newHouse] || [];
            const updatedRows = slaveIds.map((sid) => ({
              slaveId: sid,
              kuboma: "",
              jouma: ""
            }));
            setRows(updatedRows);
            const updatedCurrent = updatedRows.map((row) => ({
              house_device: `${newHouse}#${row.slaveId}`,
              kuboma: '',
              jouma: ''
            }));
            setCurrentData(updatedCurrent);
          }}
          required>
            <option value="">選択してください</option>
            {listOfHouses.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        ) : (
          <select value={house} onChange={(e) => {
            const newHouse = e.target.value;
            setHouse(newHouse);
            localStorage.setItem("house", newHouse);
            const houseDevicesMap = JSON.parse(localStorage.getItem("houseDevicesMap") || "{}");
            const slaveIds = houseDevicesMap[newHouse] || [];
            const updatedRows = slaveIds.map((sid) => ({
              slaveId: sid,
              kuboma: "",
              jouma: ""
            }));
            setRows(updatedRows);
            const updatedCurrent = updatedRows.map((row) => ({
              house_device: `${newHouse}#${row.slaveId}`,
              kuboma: '',
              jouma: ''
            }));
            setCurrentData(updatedCurrent);
          }}
          required>
            <option value="">選択してください</option>
            {listOfHouses.map((h) => (
              <option key={h} value={h}>{h}</option>
              ))}
              </select>
            )}
            </div>
        {/* --- INPUT TABLE --- */}
        <div className="positioned-label">設定値</div>
        {rows.map((row, index) => (
          <div key={index} className="config-row">
            <input
              type="text"
              placeholder="slaveId"
              value={row.slaveId}
              onChange={(e) => handleRowChange(index, "slaveId", e.target.value)}
              readOnly={role !== "admin"}
              style={role !== "admin" ? { backgroundColor: "#eee", cursor: "not-allowed" } : {}}
            />
            <input
              type="number"
              placeholder="株間"
              value={row.kuboma}
              onChange={(e) => handleRowChange(index, "kuboma", e.target.value)}
              className="config-input"
            />
            <input
              type="number"
              placeholder="条間"
              value={row.jouma}
              onChange={(e) => handleRowChange(index, "jouma", e.target.value)}
              className="config-input"
            />
            {role === "admin" && (
              <button type="button" onClick={() => handleRemoveRow(index)}>－</button>
            )}
          </div>
        ))}

        {/* --- ADD BUTTON --- */}
        {role === "admin" && (
          <button type="button" onClick={handleAddRow}>＋デバイスを追加</button>
        )}

        <button type="submit" className="config-button">送信（距離）</button>
        {message && <p style={{ marginTop: '10px', color: message.startsWith('✅') ? 'green' : 'red' }}>{message}</p>}
      </form>

      {/* --- FORM 2: Lấy dữ liệu hiện tại --- */}
      <form onSubmit={handleFetchCurrent} className="config-form">
        <h3 className="config-subtitle">現在の設定を取得</h3>
        {currentData.map((device, index) => (
          <div key={index} className="config-row">
            <input
            type="text"
            value={device.house_device.split("#")[1] || device.house_device}
            readOnly
            className="config-input"
            style={{ backgroundColor: "#eee" }}
            />
            <input
            type="text"
            value={device.kuboma}
            readOnly
            placeholder="株間"
            className="config-input"
            />
            <input
            type="text"
            value={device.jouma}
            readOnly
            placeholder="条間"
            className="config-input"
            />
          </div>
        ))}
      <button type="submit" className="config-button">現在値を取得</button>
    </form>
    </div>
    </div>
  );
};

export default HouseConfigForm;
