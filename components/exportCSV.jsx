import { CSV_FIELDS, FIELD_LABELS, THRESHOLDS } from './constants';

export function exportCSV(data, isAggregated) {
  if (!Array.isArray(data) || data.length === 0) {
    alert("データが存在しません");
    return;
  }

  const escapeCSV = (val) => {
    if (val == null) return '';
    const str = val.toString().replace(/"/g, '""');
    return `"${str}"`;
  };

  const averageValue = (item, field) => {
    if (isAggregated && item[`total_${field}`] != null && item.samples) {
      return item[`total_${field}`] / item.samples;
    }
    return item[field] ?? null;
  };

  const evaluateStatus = (item) => {
    const messages = Object.keys(THRESHOLDS).map(field => {
      const val = averageValue(item, field);
      const { min, max } = THRESHOLDS[field];
      if (val == null) return null;
      if (val < min) return `${FIELD_LABELS[field]}:L`;
      if (val > max) return `${FIELD_LABELS[field]}:H`;
      return null;
    }).filter(Boolean);

    return messages.length ? messages.join(', ') : 'Good';
  };

  const header = CSV_FIELDS.map(field => escapeCSV(FIELD_LABELS[field] || field)).join(',');

  const rows = data.map(item =>
    CSV_FIELDS.map(field => {
      let value;

      if (field === 'timestamp') {
        value = item.timestamp?.replace('T', ' ').replace(/#\w+$/, '');
      } else if (field === 'status') {
        value = evaluateStatus(item);
      } else {
        const val = averageValue(item, field);
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
