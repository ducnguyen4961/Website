'use client';

import { useState, useEffect } from "react";
import axios from "axios";

export default function DeleteDeviceForm({ initialDevices = [] }) {
  const [registeredDevices, setRegisteredDevices] = useState(initialDevices);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
    if (selectedItems.length === 0) return alert("No device selected to delete.");
    try {
      await axios.post("https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/take", { items: selectedItems });
      alert("Deleted successfully.");
      const remaining = registeredDevices.filter(item =>
        !selectedItems.find(i => i.device === item.device && i.slaveID === item.slaveID)
      );
      setRegisteredDevices(remaining);
      setSelectedItems([]);
    } catch (err) {
      alert("Error while delete: " + err.message);
    }
  };

  const handleReload = async () => {
    setIsLoading(true);
    try {
      const idToken = localStorage.getItem("idToken");
      const res = await fetch("https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/at", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
      const users = await res.json();
      const devices = [];
      users.forEach(user => {
        if (user.slave_ids && user.house_device) {
          user.slave_ids.forEach(id => {
            devices.push({
              user_name: user.name || "Unknown",
              username: user.username,
              email: user.email || "Unknown",
              device: user.house_device,
              role: user.role || "user",
              slaveID: id,
              timestamp: new Date().toISOString()
            });
          });
        }
      });
      setRegisteredDevices(devices);
    } catch (err) {
      alert("Error while reloading: " + err.message);
    }
    setIsLoading(false);
  };

  return (
    <div style={{ marginTop: "2rem" }}>

      <div style={{
        maxHeight: "300px",
        overflowY: "auto",
        overflowX: "auto",
        border: "1px solid #ccc",
        borderRadius: "8px",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "auto",
        }}>

          <thead style={{ backgroundColor: "#f5f5f5" }}>
            <tr>
              <th style={thStyle}>choice</th>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>email</th>
              <th style={thStyle}>user name</th>
              <th style={thStyle}>house</th>
              <th style={thStyle}>role</th>
              <th style={thStyle}>device</th>
            </tr>
          </thead>
          <tbody>
            {registeredDevices.map((item, idx) => (
              <tr key={`${item.device}-${item.slaveID}`} style={idx % 2 === 0 ? rowStyleEven : rowStyleOdd}>
                <td style={tdStyle}>
                  <input
                    type="checkbox"
                    checked={selectedItems.some(i => i.device === item.device && i.slaveID === item.slaveID)}
                    onChange={() => handleCheckbox(idx)}
                  />
                </td>
                <td style={tdStyle}>{item.username}</td>
                <td style={tdStyle}>{item.email}</td>
                <td style={tdStyle}>{item.user_name}</td>
                <td style={tdStyle}>{item.device}</td>
                <td style={tdStyle}>{item.role}</td>
                <td style={tdStyle}>{item.slaveID}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleDelete}
        style={{
          marginTop: "1rem",
          width: "100%",
          padding: "0.5rem 1rem",
          backgroundColor: "red",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        Delete the selected device
      </button>
      <button
        onClick={handleReload}
        disabled={isLoading}
        style={{
          marginBottom: "1rem",
          width: "100%",
          padding: "0.5rem 1rem",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isLoading ? "not-allowed" : "pointer"
        }}
      >
        {isLoading ? "Loading..." : "Reload list"}
      </button>
    </div>
  );
}
const thStyle = {
  padding: "10px",
  borderBottom: "1px solid #ccc",
  textAlign: "left",
  fontWeight: "bold",
  position: "sticky",
  top: 0,
  backgroundColor: "#f5f5f5",
  zIndex: 1
};

const tdStyle = {
  padding: "10px",
  borderBottom: "1px solid #eee",
};

const rowStyleEven = {
  backgroundColor: "#ffffff"
};

const rowStyleOdd = {
  backgroundColor: "#f9f9f9"
};