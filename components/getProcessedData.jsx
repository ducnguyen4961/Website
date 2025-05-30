export function getProcessedData(items, durationDays) {
  let detailedData = []; // Dành cho BẢNG 1
  let summaryData = [];  // Dành cho BẢNG 2

  // Lọc các loại dữ liệu từ timestamp
  const rawItems = items.filter(item => item.timestamp.startsWith("raw#"));
  const hourlyItems = items.filter(item => item.timestamp.endsWith("#hourly"));
  const dailyItems = items.filter(item => item.timestamp.endsWith("#daily"));

  // === Xử lý dữ liệu BẢNG 1 ===
  if (durationDays === 1) {
    // Chỉ lấy raw data
    detailedData = rawItems;
  } else if (durationDays <= 40) {
    // Lấy các trường total_... từ dòng hourly
    detailedData = hourlyItems.map(item => ({
      timestamp: item.timestamp,
      total_CO2: item.total_CO2,
      total_humidity: item.total_humidity,
      total_temperature: item.total_temperature,
      total_soil_mois: item.total_soil_mois,
      total_soil_EC: item.total_soil_EC,
      total_soil_temp: item.total_soil_temp,
      total_NIR: item.total_NIR,
      total_VR: item.total_VR,
      total_PPFD: item.total_PPFD,
      total_satur: item.total_satur,
      samples: item.samples,
    }));
  } else {
    // Lấy các trường total_... từ dòng daily
    detailedData = dailyItems.map(item => ({
      timestamp: item.timestamp,
      total_CO2: item.total_CO2,
      total_humidity: item.total_humidity,
      total_temperature: item.total_temperature,
      total_soil_mois: item.total_soil_mois,
      total_soil_EC: item.total_soil_EC,
      total_soil_temp: item.total_soil_temp,
      total_NIR: item.total_NIR,
      total_VR: item.total_VR,
      total_PPFD: item.total_PPFD,
      total_satur: item.total_satur,
      samples: item.samples,
    }));
  }

  // === Xử lý dữ liệu BẢNG 2 ===
  summaryData = dailyItems.map(item => ({
    timestamp: item.timestamp,
    avg_NIR: item.avg_NIR,
    avg_VR: item.avg_VR,
    avg_PPFD: item.avg_PPFD,
    lai: item.lai,
    hybrid: item.hybrid,
    samples: item.samples,
    total_samples_10_14: item.total_samples_10_14,
  }));

  return { detailedData, summaryData };
}
