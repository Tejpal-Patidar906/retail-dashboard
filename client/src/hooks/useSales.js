import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useSales = (options = {}) => {
  const [summary, setSummary]         = useState(null);
  const [dailySales, setDailySales]   = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [sales, setSales]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const { branch, period } = options;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (branch) params.branch = branch;
      if (period) params.period = period;

      const [sumRes, dailyRes, monthlyRes, topRes, salesRes] = await Promise.all([
        api.get('/sales/summary', { params }),
        api.get('/sales/daily',   { params: { ...params, days: 14 } }),
        api.get('/sales/monthly', { params }),
        api.get('/sales/top-products', { params: { ...params, limit: 10 } }),
        api.get('/sales', { params: { ...params, limit: 20 } }),
      ]);

      setSummary(sumRes.data.data);
      setDailySales(dailyRes.data.data);
      setMonthlySales(monthlyRes.data.data);
      setTopProducts(topRes.data.data);
      setSales(salesRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  }, [branch, period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { summary, dailySales, monthlySales, topProducts, sales, loading, error, refetch: fetchAll };
};
