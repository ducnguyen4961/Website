export const fieldLabels = {
  house_device: 'House_Device',
  timestamp: 'Timestamp',
  temperature: '温度',
  humidity: '湿度',
  CO2: 'CO2',
  NIR: 'NIR',
  PPFD: 'PPFD',
  VR: 'VR',
  soil_mois: '土壌水分',
  soil_EC: '土壌EC',
  soil_temp: '土壌温度',
  status: 'Status'
};

export const columnsOrder = [
  'timestamp',
  'status',
  'CO2',
  'humidity',
  'temperature',
  'NIR',
  'VR',
  'PPFD',
  'soil_moisture',
  'soil_EC',
  'soil_temperature',
  'lai',
  'samples',
];
export const CSV_FIELDS = [
  'house_device',
  'timestamp',
  'temperature',
  'humidity',
  'CO2',
  'NIR',
  'PPFD',
  'VR',
  'soil_mois',
  'soil_EC',
  'soil_temp',
  'status'
];

export const FIELD_LABELS = {
  house_device: 'House_Device',
  timestamp: 'Timestamp',
  temperature: '温度',
  humidity: '湿度',
  CO2: 'CO2',
  NIR: 'NIR',
  PPFD: 'PPFD',
  VR: 'VR',
  soil_mois: '土壌水分',
  soil_EC: '土壌EC',
  soil_temp: '土壌温度',
  status: 'Status'
};

export const THRESHOLDS = {
  temperature: { min: 20, max: 30 },
  humidity: { min: 40, max: 70 },
  CO2: { min: 50, max: 70 },
  NIR: { min: 30, max: 50 },
  PPFD: { min: 20, max: 30 },
  VR: { min: 35, max: 50 },
  soil_mois: { min: 50, max: 70 },
  soil_EC: { min: 40, max: 70 },
  soil_temp: { min: 30, max: 50 }
};


export function evaluateStatus(item) {
  const co2 = item.CO2 ?? item.total_CO2 / item.samples;
  const humidity = item.humidity ?? item.total_humidity / item.samples;
  const temperature = item.temperature ?? item.total_temperature / item.samples;
  const soilMoisture = item.soil_moisture ?? item.total_soil_moisture / item.samples;

  const statusList = [];

  if (co2 > 1500) statusList.push('CO2高');
  if (humidity < 40 || humidity > 80) statusList.push('湿度異常');
  if (temperature < 10 || temperature > 35) statusList.push('温度異常');
  if (soilMoisture < 20 || soilMoisture > 80) statusList.push('土壌水分異常');

  return statusList.length > 0 ? statusList.join(', ') : '正常';
}
