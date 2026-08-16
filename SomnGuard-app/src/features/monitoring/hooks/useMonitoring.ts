import { useEffect, useState } from 'react';
function formatTime() { const now = new Date(); return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`; }
export function useMonitoring() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [time, setTime] = useState(formatTime());
  useEffect(() => { const interval = setInterval(() => setTime(formatTime()), 10000); return () => clearInterval(interval); }, []);
  return { isMonitoring, time, toggleMonitoring: () => setIsMonitoring((current) => !current) };
}


