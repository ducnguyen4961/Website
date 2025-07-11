'use client';

import { useState, useEffect } from "react";
import axios from "axios";

export default function DeleteDeviceForm({ initialDevices = [] }) {
  const [registeredDevices, setRegisteredDevices] = useState(initialDevices);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    setRegisteredDevices(initialDevices);
  }, [initialDevices]);

  const handleCheckbox = (index) => {
    const item = registeredDevices[index];
    const exists = selectedItems.find(i => i.device === item.device && i.slaveID === item.slaveID);
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.device !== item.device || i.slaveID !== item.slaveID));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleDelete = async () => {
    if (selectedItems.length === 0) return alert("Chưa chọn thiết bị nào để xóa.");
    try {
      const res = await axios.post("/api/delete-user-items", {
        items: selectedItems
      });
      alert("Đã xóa thành công.");
      const remaining = registeredDevices.filter(item =>
        !selectedItems.find(i => i.device === item.device && i.slaveID === item.slaveID)
      );
      setRegisteredDevices(remaining);
      setSelectedItems([]);
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  return (
    <div>
      <h3 style={{ marginTop: "2rem" }}>🗑️ Danh sách thiết bị đã đăng ký</h3>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Chọn</th>
            <th>Người dùng</th>
            <th>Thiết bị</th>
            <th>Role</th>
            <th>Slave ID</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {registeredDevices.map((item, idx) => (
            <tr key={`${item.device}-${item.slaveID}`}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedItems.some(i => i.device === item.device && i.slaveID === item.slaveID)}
                  onChange={() => handleCheckbox(idx)}
                />
              </td>
              <td>{item.user_name}</td>
              <td>{item.device}</td>
              <td>{item.role}</td>
              <td>{item.slaveID}</td>
              <td>{item.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={handleDelete}
        style={{ marginTop: "1rem", padding: "0.5rem 1rem", backgroundColor: "red", color: "white" }}
      >
        Xóa các thiết bị đã chọn
      </button>
    </div>
  );
}

