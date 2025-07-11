import React, { useEffect, useState } from "react";
import TemperatureStatsBox from "./TemperatureStatsBox";
const MultiTemperatureStats = ({ deviceIds, houseId }) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceIds || deviceIds.length === 0) return;

    const fetchData = async () => {
      try {
        const idsParam = deviceIds.join(",");
        const endpoint = `https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/setup_env?device_id=${encodeURIComponent(idsParam)}`;
        const res = await fetch(endpoint);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu nhiều thiết bị:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deviceIds]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="devices-grid">
      {deviceIds.map((deviceId) => (
        <TemperatureStatsBox
          key={deviceId}
          deviceId={deviceId}
          houseId={houseId}
          stats={data[deviceId]}
        />
      ))}
    </div>
  );
};

export default MultiTemperatureStats;
