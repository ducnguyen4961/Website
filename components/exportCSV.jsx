import { CSV_FIELDS, CSV_FIELDS_DAILY, FIELD_LABELS, THRESHOLDS } from './constants';

function formatDateTimeForCSV(field, rawTimestamp, fields) {
  if (!rawTimestamp) return '';
  if (field === 'timestamp') {
    const clean = rawTimestamp.replace(/#\w+$/, '');
    if (fields === CSV_FIELDS_DAILY) {
      return clean.substring(0, 10); // YYYY-MM-DD
    } else {
      const formatted = clean.replace('T', ' ');
      return formatted.length > 10 ? formatted : formatted + ' 00:00:00';
    }
  }
  return rawTimestamp;
}

export function exportCSV(data, isAggregated, customFields) {
  if (!Array.isArray(data) || data.length === 0) {
    alert("データが存在しません");
    return;
  }

  const escapeCSV = (val) => {
    if (val == null) return '';
    const str = val.toString().replace(/"/g, '""');
    return `"${str}"`;
  };

  const getValue = (item, field) => {
    if (isAggregated && item[`total_${field}`] != null && item.samples) {
      return item[`total_${field}`] / item.samples;
    }
    return item[field] ?? null;
  };

  const evaluateStatus = (item) => {
    const messages = Object.keys(THRESHOLDS).map(field => {
      const val = getValue(item, field);
      const { min, max } = THRESHOLDS[field];
      if (val == null) return null;
      if (val < min) return `${FIELD_LABELS[field]}:L`;
      if (val > max) return `${FIELD_LABELS[field]}:H`;
      return null;
    }).filter(Boolean);

    return messages.length ? messages.join(', ') : '正常';
  };

  const fields = customFields || CSV_FIELDS;
  const header = fields.map(field => escapeCSV(FIELD_LABELS[field] || field)).join(',');

  const rows = data.map(item =>
    fields.map(field => {
      let value;
      if (field === 'timestamp') {
        value = formatDateTimeForCSV(field, item.timestamp || '', fields);
      } else if (field === 'status') {
        value = evaluateStatus(item);
      } else {
        const val = getValue(item, field);
        value = typeof val === 'number' ? val.toFixed(2) : val;
      }
      return escapeCSV(value);
    }).join(',')
  );

  const csvContent = '\uFEFF' + [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sensor_data_export.csv';
  a.click();
  URL.revokeObjectURL(url);
}
