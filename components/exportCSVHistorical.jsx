// exportCSV.js
import { FIELD_LABELS } from './constants';  // ラベル定義（例：{ "Avg. Temperature": "平均温度" }）

export function exportCSV(data, isAggregated = false, customFields = null) {
  if (!data || data.length === 0) {
    alert("出力するデータがありません");
    return;
  }

  // ✅ "DATE" を先頭に強制追加（重複を除外）
  const fields = ['DATE', ...(customFields || []).filter(f => f !== 'DATE')];

  // ✅ ラベル定義（なければフィールド名を使う）
  const labels = fields.map(field => FIELD_LABELS[field] || field);

  // ✅ ヘッダー作成
  const csvHeader = labels.join(',');

  // ✅ データ1行ずつ変換
  const csvRows = data.map(row =>
    fields.map(field => {
      const value = getValue(row, field, isAggregated);
      return escapeCSV(value);
    }).join(',')
  );

  // ✅ CSV結合
  const csvContent = [csvHeader, ...csvRows].join('\n');

  // ✅ CSVとしてダウンロード
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'sensor_data_export.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ✅ CSV用の値加工（カンマや改行などに対応）
function escapeCSV(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ✅ 値取得ロジック（集計モードの場合は平均値計算）
function getValue(item, field, isAggregated) {
  if (field === 'DATE') return item['DATE'] || '';
  if (isAggregated && item[`total_${field}`] != null && item.samples) {
    return (item[`total_${field}`] / item.samples).toFixed(2);
  }
  return item[field] ?? '';
}
