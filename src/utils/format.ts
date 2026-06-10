// Treasury / GDP amounts in Billions / Trillions
export const fmtB = (n: number): string => {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}T`;
  if (abs >= 1)    return `${sign}$${abs.toFixed(2)}B`;
  if (abs >= 0.001) return `${sign}$${(abs * 1000).toFixed(0)}M`;
  return `${sign}$0`;
};

// Percentages
export const fmtPct = (n: number, decimals = 1): string => {
  const mult = Math.pow(10, decimals);
  return `${(Math.round(n * mult) / mult).toFixed(decimals)}%`;
};

// Population in millions
export const fmtPop = (n: number): string => {
  if (n >= 1000) return `${(n / 1000).toFixed(2)}B`;
  return `${n.toFixed(1)}M`;
};

// Large integers (casualties, etc.)
export const fmtInt = (n: number): string =>
  Math.round(n).toLocaleString('en-US');

// Coordinates format
export const fmtCoord = (lat: number, lon: number): string =>
  `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;

// Ticks counter format
export const fmtTick = (t: number): string => `T+${String(t).padStart(4, '0')}`;

// Session time format in HH:MM:SS
export const fmtSession = (seconds: number): string => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

// Calendar date from ISO string
export const fmtDate = (isoString: string): string => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'UNKNOWN';
  return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
};
