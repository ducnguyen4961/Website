export function formatTimestamp(timestamp) {
  if (!timestamp) return '-';
  const ts = timestamp.split('#')[0];
  const date = new Date(ts);
  if (isNaN(date)) return timestamp;
  return date.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
