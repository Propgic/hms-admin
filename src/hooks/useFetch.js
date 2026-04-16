import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export function useFetch(url, options = {}) {
  const { immediate = true, params = {} } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (overrideParams) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(url, { params: overrideParams || params });
        const result = res.data.data || res.data;
        setData(result);
        return result;
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Something went wrong';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url, JSON.stringify(params)]
  );

  useEffect(() => {
    if (immediate && url) {
      fetchData();
    }
  }, [immediate, url, JSON.stringify(params)]);

  return { data, loading, error, refetch: fetchData, setData };
}
