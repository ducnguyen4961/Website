export const columnsOrder = [
  'timestamp',
  'satur',
  'CO2',
  'humidity',
  'temperature',
  'NIR',
  'VR',
  'PPFD',
  'soil_mois',
  'soil_EC',
  'soil_temp',
  'lai',
  'samples',
  'status'
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
export const CSV_FIELDS_DAILY = [
  'house_device',
  'timestamp',
  'avg_NIR',
  'avg_VR',
  'avg_PPFD',
  'lai',
  'area_per_plant',
  'nir_vr_ratio'
];


export const FIELD_LABELS = {
  house_device: 'ハウスID',
  timestamp: '時刻',
  temperature: '温度(℃)',
  humidity: '湿度(%RH)',
  CO2: 'CO2(PPM)',
  NIR: 'NIR(mV)',
  PPFD: 'PPFD(μmol/ms)',
  VR: 'VR(mV)',
  soil_mois: '土壌水分(%)',
  soil_EC: '土壌EC(mS/cm)',
  soil_temp: '土壌温度(℃)',
  status: '状態',
  lai: '株間LAI(cm2cm-2)',
  avg_NIR: 'Avg.NIR(mV)',
  avg_PPFD: 'Avg.PPFD(μmol/ms)',
  avg_VR: 'Avg.VR(mV)',
  nir_vr_ratio: 'Avg.NIR/VR(mV)',
  area_per_plant: '株当たり葉面積(cm2P-1)',
  satur: '水蒸気密度(g/m3)'
};


export const THRESHOLDS = {
  temperature: { min: 20, max: 30 },
  humidity: { min: 40, max: 70 },
  CO2: { min: 400, max: 700 },
  NIR: { min: 30, max: 50 },
  PPFD: { min: 20, max: 30 },
  VR: { min: 35, max: 50 },
  soil_mois: { min: 50, max: 70 },
  soil_EC: { min: 40, max: 70 },
  soil_temp: { min: 10, max: 25 }
};


export function evaluateStatus(item) {
  const getAvg = (raw, total, samples) => {
    if (raw != null) return raw;
    if (total != null && samples) return total / samples;
    return null;
  };

  const co2 = getAvg(item.CO2, item.total_CO2, item.samples);
  const humidity = getAvg(item.humidity, item.total_humidity, item.samples);
  const temperature = getAvg(item.temperature, item.total_temperature, item.samples);
  const soil_mois = getAvg(item.soil_mois, item.total_soil_mois, item.samples);
  const soil_EC = getAvg(item.soil_EC, item.total_soil_EC, item.samples);
  const soil_temp = getAvg(item.soil_temp, item.total_soil_temp, item.samples);
  const nir = getAvg(item.NIR, item.total_NIR, item.samples);
  const vr = getAvg(item.VR, item.total_VR, item.samples);
  const ppfd = getAvg(item.PPFD, item.total_PPFD, item.samples);

  const statusList = [];

  if (co2 != null) {
    if (co2 > 1500) statusList.push('CO2高');
    else if (co2 < THRESHOLDS.CO2.min || co2 > THRESHOLDS.CO2.max) statusList.push('CO2異常');
  }
  if (humidity != null && (humidity < THRESHOLDS.humidity.min || humidity > THRESHOLDS.humidity.max)) {
    statusList.push('湿度異常');
  }
  if (temperature != null && (temperature < THRESHOLDS.temperature.min || temperature > THRESHOLDS.temperature.max)) {
    statusList.push('温度異常');
  }
  if (soil_mois != null && (soil_mois < THRESHOLDS.soil_mois.min || soil_mois > THRESHOLDS.soil_mois.max)) {
    statusList.push('土壌水分異常');
  }
  if (soil_EC != null && (soil_EC < THRESHOLDS.soil_EC.min || soil_EC > THRESHOLDS.soil_EC.max)) {
    statusList.push('土壌EC異常');
  }
  if (soil_temp != null && (soil_temp < THRESHOLDS.soil_temp.min || soil_temp > THRESHOLDS.soil_temp.max)) {
    statusList.push('土壌温度異常');
  }
  if (nir != null && (nir < THRESHOLDS.NIR.min || nir > THRESHOLDS.NIR.max)) {
    statusList.push('NIR異常');
  }
  if (vr != null && (vr < THRESHOLDS.VR.min || vr > THRESHOLDS.VR.max)) {
    statusList.push('VR異常');
  }
  if (ppfd != null && (ppfd < THRESHOLDS.PPFD.min || ppfd > THRESHOLDS.PPFD.max)) {
    statusList.push('PPFD異常');
  }

  return statusList.length > 0 ? statusList.join(', ') : '正常';
}

