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

    const MAX_SESSION_DURATION = 10 * 60 * 60 * 1000;
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
        const emailToNameMap = {};
        const emailToUsernameMap = {};
        const uniqueEmails = [];
        const devices = [];
        users.forEach((user) => {
          if (user.email && !emailToNameMap[user.email]) {
            uniqueEmails.push(user.email);
            emailToNameMap[user.email] = user.name || "";
            emailToUsernameMap[user.email] = user.username || "";
          }
          if (user.slave_ids && user.house_device) {
            user.slave_ids.forEach(id => {
              devices.push({
                user_name: user.name || "Unknown",
                email: user.email,
                device: user.house_device,
                role: user.role || "user",
                username: user.username || "Unknown",
                slaveID: id
              });
            });
          }
        });
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
        setRegisteredDevices(devices);
      } catch (err) {
        console.error("Cannot get list of users", err);
        const savedData = localStorage.getItem("userData");
        if (savedData) {
          const { emails, emailToNameMap, emailToUsernameMap } = JSON.parse(savedData);
          setEmailList(emails);
          setEmailToNameMap(emailToNameMap);
          setEmailToUsernameMap(emailToUsernameMap);
          setSelectedEmail(emails[0] || "");
          (emailToNameMap[emails[0]] || "");
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
    <h2>Device Management</h2>

    <div className="form-grid">
      <div className="form-section">
        <h3>Register devices</h3>
        <form onSubmit={handleSubmit} className="register-form">
          <div className="input_house">
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

      <div className="form-section">
        <h3>Delete a registered device</h3>
        <DeleteDeviceForm initialDevices={registeredDevices} />
      </div>
    </div>
  </div>
);

}
