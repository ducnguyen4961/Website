import React, { useEffect, useState } from "react";
import TemperatureStatsBox from "./TemperatureStatsBox";

const MultiTemperatureStats = ({ deviceIds }) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceIds || deviceIds.length === 0) return;

    const fetchData = async () => {
      try {
        const idsParam = deviceIds.join(",");
        const [envRes, fourPartRes] = await Promise.all([
          fetch(`https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/setup_env?device_id=${encodeURIComponent(idsParam)}`),
          fetch(`https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/fourpart?device_id=${encodeURIComponent(idsParam)}`)
        ]);

        const envData = await envRes.json();       // chứa stats.day / stats.night
        const fourPartData = await fourPartRes.json(); // chứa stats["00_06"] ...

        // Kết hợp dữ liệu từ 2 API
        const merged = {};
        deviceIds.forEach((id) => {
          merged[id] = {
            ...(envData?.[id] ?? {}),
            ...(fourPartData?.[id] ?? {})
          };
        });

        setData(merged);
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu nhiệt độ:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deviceIds]);

  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <div className="devices-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {deviceIds.map((deviceId) => (
        <TemperatureStatsBox
          key={deviceId}
          deviceId={deviceId}
          stats={data?.[deviceId]}
        />
      ))}
    </div>
  );
};

export default MultiTemperatureStats;
