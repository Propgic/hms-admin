import { createContext, useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import endpoints from '../api/endpoints';
import { setPlatformCurrency, setExchangeRates, subscribeCurrency } from '../utils/formatters';

export const PlatformSettingsContext = createContext({
  settings: null,
  currency: 'INR',
  refresh: async () => {},
});

export function PlatformSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [currency, setCurrencyState] = useState('INR');

  const refresh = useCallback(async () => {
    try {
      const res = await api.get(endpoints.publicSettings);
      const data = res.data?.data || res.data || {};
      setSettings(data);
      if (data.exchangeRates) setExchangeRates(data.exchangeRates);
      if (data.currency) setPlatformCurrency(data.currency);
    } catch {
      // public endpoint may fail before backend is ready — fall back to defaults
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsub = subscribeCurrency((code) => setCurrencyState(code));
    return () => unsub();
  }, [refresh]);

  return (
    <PlatformSettingsContext.Provider value={{ settings, currency, refresh }}>
      {children}
    </PlatformSettingsContext.Provider>
  );
}
