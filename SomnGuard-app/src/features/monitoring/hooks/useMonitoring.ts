import { useState } from 'react';
export function useMonitoring() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  return { isMonitoring, toggleMonitoring: () => setIsMonitoring((current) => !current) };
}


