import { createContext, createElement, type PropsWithChildren, useContext, useMemo, useState } from 'react';

type MonitoringContextValue = {
  isMonitoring: boolean;
  setIsMonitoring: (value: boolean) => void;
  toggleMonitoring: () => void;
};

const MonitoringContext = createContext<MonitoringContextValue | null>(null);

export function MonitoringProvider({ children }: PropsWithChildren) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const value = useMemo(() => ({
    isMonitoring,
    setIsMonitoring,
    toggleMonitoring: () => setIsMonitoring((current) => !current),
  }), [isMonitoring]);

  return createElement(MonitoringContext.Provider, { value }, children);
}

export function useMonitoring() {
  const context = useContext(MonitoringContext);
  if (!context) throw new Error('useMonitoring debe usarse dentro de MonitoringProvider');
  return context;
}


