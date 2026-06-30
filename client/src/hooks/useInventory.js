import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useInventory = (options = {}) => {
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts]       = useState([]);
  const [kpis, setKpis]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const { branch, status, search } = options;

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (branch) params.branch = branch;
      if (status && status !== 'all') params.status = status;
      if (search) params.search = search;

      const [invRes, alertRes] = await Promise.all([
        api.get('/inventory', { params }),
        api.get('/inventory/alerts', { params: { branch } }),
      ]);

      setInventory(invRes.data.data);
      setKpis(invRes.data.kpis);
      setAlerts(alertRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  }, [branch, status, search]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const updateStock = useCallback(async (id, updates) => {
    const { data } = await api.put(`/inventory/${id}`, updates);
    await fetchInventory();
    return data.data;
  }, [fetchInventory]);

  const addProduct = useCallback(async (productData) => {
    const { data } = await api.post('/inventory', productData);
    await fetchInventory();
    return data.data;
  }, [fetchInventory]);

  const deleteProduct = useCallback(async (id) => {
    await api.delete(`/inventory/${id}`);
    await fetchInventory();
  }, [fetchInventory]);

  return { inventory, alerts, kpis, loading, error, refetch: fetchInventory, updateStock, addProduct, deleteProduct };
};
