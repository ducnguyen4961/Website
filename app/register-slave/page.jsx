'use client';

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import "./register-slave.css";
import { AuthContext } from "@/context/Authcontext";
import DeleteDeviceForm from "@/components/DeleteDeviceForm";

export default function RegisterDevicePage() {
  const [houseDevice, setHouseDevice] = useState('');
  const [slaveID, setSlaveID] = useState('');
  const { logout } = useContext(AuthContext);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [emailList, setEmailList] = useState([]);
  const [emailToNameMap, setEmailToNameMap] = useState({});
  const [status, setStatus] = useState('');
  const [emailToUsernameMap, setEmailToUsernameMap] = useState({});
  const router = useRouter();
  const [registeredDevices, setRegisteredDevices] = useState([]);

  useEffect(() => {
    const idToken = localStorage.getItem("idToken");
    const loginTime = localStorage.getItem("loginTime");

    const MAX_SESSION_DURATION = 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (!idToken || !loginTime ||isNaN(parseInt(loginTime)) || now - parseInt(loginTime) > MAX_SESSION_DURATION) {
      localStorage.clear();
      logout();
      router.push("/login");
    }
    const fetchUserList = async () => {
      const idToken = localStorage.getItem("idToken");
      if (!idToken) return;
      try {
        const res = await fetch("https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/at", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        });
        const users = await res.json();
        console.log("✅ Fetched users from API:", users);
        const emailToNameMap = {};
        const emailToUsernameMap = {};
        const uniqueEmails = [];
        users.forEach((user) => {
          if (user.email && !emailToNameMap[user.email]) {
            uniqueEmails.push(user.email);
            emailToNameMap[user.email] = user.name || "";
            emailToUsernameMap[user.email] = user.username || "";
          }
        });
        console.log("✅ uniqueEmails:", uniqueEmails);
        console.log("✅ emailToNameMap:", emailToNameMap);
        console.log("✅ emailToUsernameMap:", emailToUsernameMap);

        setEmailList(uniqueEmails);
        setEmailToNameMap(emailToNameMap);
        setEmailToUsernameMap(emailToUsernameMap);
        setSelectedEmail(uniqueEmails[0] || "");
        setSelectedName(emailToNameMap[uniqueEmails[0]] || "");
        localStorage.setItem("userData", JSON.stringify({
          emails: uniqueEmails,
          emailToNameMap,
          emailToUsernameMap
        }));
      } catch (err) {
        console.error("Cannot get list of users", err);
        const savedData = localStorage.getItem("userData");
        if (savedData) {
          const { emails, emailToNameMap, emailToUsernameMap } = JSON.parse(savedData);
          setEmailList(emails);
          setEmailToNameMap(emailToNameMap);
          setEmailToUsernameMap(emailToUsernameMap);
          setSelectedEmail(emails[0] || "");
          setSelectedName(emailToNameMap[emails[0]] || "");
          if (users.slave_ids && users.house_device) {
            const fakeDevices = users.slave_ids.map(id => ({
              user_name: emailToNameMap[uniqueEmails[0]] || "Unknown",
              device: users.house_device,
              role: users.role,
              slaveID: id
            }));
            setRegisteredDevices(fakeDevices);
          }
        }
      }
    };
    fetchUserList();
  }, []);
  const handleEmailChange = (e) => {
    const email = e.target.value;
    setSelectedEmail(email);
    setSelectedName(emailToNameMap[email] || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const slaveIDs = slaveID
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
    if (!houseDevice || !slaveID || !selectedEmail || !selectedName) {
      setStatus('❌ please enter all field');
      return;
    }
    try {
      const res = await fetch('https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/setup_env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          house_device: houseDevice,
          slaveIDs,
          email: selectedEmail,
          username: emailToUsernameMap[selectedEmail],
          name: selectedName
        })
      });
      const result = await res.json();
      if (res.ok) {
        setStatus('✅ Send Success!');
        setHouseDevice('');
        setSlaveID('');
      } else {
        setStatus('❌ Error: ' + result.message || 'Unknow');
      }
    } catch (err) {
      console.error(err);
      setStatus('❌ Send Fail');
    }
  };
  return (
  <div className="register-page-wrapper">
    <h2>Quản lý thiết bị</h2>

    <div className="form-grid">
      {/* 🔧 Phần đăng ký thiết bị */}
      <div className="form-section">
        <h3>📥 Đăng ký thiết bị</h3>
        <form onSubmit={handleSubmit} className="register-form">
          <div>
            <label>House Device</label>
            <input
              type="text"
              value={houseDevice}
              onChange={(e) => setHouseDevice(e.target.value)}
              placeholder="Example: H0001"
            />
          </div>
          <div>
            <label>
              Slave ID (If there are many devices which necessary into table,
              please fill [ , ] between those devices and notice no "space")
            </label>
            <input
              type="text"
              value={slaveID}
              onChange={(e) => setSlaveID(e.target.value)}
              placeholder="Example: 0000,0001,0002"
            />
          </div>
          <div>
            <label>Email</label>
            <select value={selectedEmail} onChange={handleEmailChange}>
              {emailList.map((email, idx) => (
                <option key={idx} value={email}>
                  {email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Full Name</label>
            <input type="text" value={selectedName} readOnly />
          </div>
          <button type="submit">Send</button>
        </form>
        {status && <p className="status-message">{status}</p>}
      </div>

      {/* 🗑️ Phần xóa thiết bị */}
      <div className="form-section">
        <h3>🗑️ Xóa thiết bị đã đăng ký</h3>
        console.log("registeredDevices:", registeredDevices);
        <DeleteDeviceForm initialDevices={registeredDevices} />
      </div>
    </div>
  </div>
);

}
