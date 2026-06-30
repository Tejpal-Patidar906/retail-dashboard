import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import KPICard from '../components/ui/KPICard';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import FootTrafficChart from '../components/charts/FootTrafficChart';
import { Users, Repeat, Heart, TrendingDown } from 'lucide-react';
import api from '../services/api';

const segmentConfig = {
  VIP:     { color: 'purple', gradient: 'linear-gradient(90deg, #A78BFA, #7C3AED)' },
  Regular: { color: 'accent', gradient: 'linear-gradient(90deg, #5B8AF0, #3B82F6)' },
  New:     { color: 'green',  gradient: 'linear-gradient(90deg, #34D99E, #10B981)' },
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [segments,  setSegments]  = useState([]);
  const [traffic,   setTraffic]   = useState([]);
  const [kpis,      setKpis]      = useState(null);
  const [loading,   setLoading]   = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [custRes, segRes, trafficRes] = await Promise.all([
        api.get('/customers'),
        api.get('/customers/segments'),
        api.get('/customers/traffic'),
      ]);
      setCustomers(custRes.data.data);
      setKpis(custRes.data.kpis);
      setSegments(segRes.data.data);
      setTraffic(trafficRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const totalCust = segments.reduce((s, seg) => s + seg.count, 0) || 1;

  const columns = [
    {
      key: 'name', label: 'Customer',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="staff-avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
            {v.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <div className="staff-name">{v}</div>
            <div className="staff-email">{row.email || 'No email'}</div>
          </div>
        </div>
      )
    },
    { key: 'phone',   label: 'Phone',    render: (v) => <span className="text-muted text-sm">{v || '—'}</span> },
    { key: 'segment', label: 'Segment',  render: (v) => <Badge color={segmentConfig[v]?.color || 'muted'}>{v}</Badge> },
    { key: 'totalSpent', label: 'Total Spent', render: (v) => <span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{v?.toLocaleString()}</span> },
    { key: 'visits',  label: 'Visits',   render: (v) => <span className="font-semibold">{v}</span> },
    { key: 'lastVisit', label: 'Last Visit', render: (v) => <span className="text-muted text-sm">{v ? new Date(v).toLocaleDateString() : '—'}</span> },
  ];

  return (
    <Layout title="Customers" subtitle="Customer segments, foot traffic, and directory" onRefresh={fetchAll} loading={loading}>
      {/* KPIs */}
      <div className="section">
        <div className="grid kpi-grid">
          <KPICard label="Total Customers" value={kpis?.totalCustomers ?? '—'} icon={Users}       color="accent" trend="up" trendValue={6.2} />
          <KPICard label="Repeat Rate"     value={kpis?.repeatRate != null ? `${kpis.repeatRate}%` : '—'} icon={Repeat} color="green"  trend="up" trendValue={4.1} />
          <KPICard label="Avg. LTV"        value={kpis?.avgLTV != null ? `₹${kpis.avgLTV}` : '—'}  icon={Heart}   color="purple" trend="up" trendValue={8.5} />
          <KPICard label="Churn Rate"      value={kpis?.churnRate != null ? `${kpis.churnRate}%` : '—'} icon={TrendingDown} color="red" trend="down" trendValue={1.2} />
        </div>
      </div>

      {/* Charts Row */}
      <div className="section">
        <div className="grid chart-grid-3">
          {/* Foot Traffic */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Hourly Foot Traffic</div>
                <div className="card-subtitle">Store visits this week by hour</div>
              </div>
            </div>
            <FootTrafficChart data={traffic} />
          </div>

          {/* Segments */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Customer Segments</div>
              <div className="card-subtitle">Distribution by segment</div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {segments.map(seg => {
                const pct = ((seg.count / totalCust) * 100).toFixed(1);
                const cfg = segmentConfig[seg._id] || { color: 'muted', gradient: 'var(--accent)' };
                return (
                  <div key={seg._id} className="segment-item">
                    <div className="segment-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Badge color={cfg.color} dot>{seg._id}</Badge>
                        <span style={{ fontSize: '0.82rem', color: 'var(--muted2)' }}>{seg.count} customers</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>{pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: cfg.gradient }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted2)', marginTop: 4 }}>
                      Total spent: ₹{seg.totalSpent?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="section">
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="card-title">Customer Directory</div>
            <span className="text-muted text-sm">{customers.length} customers</span>
          </div>
          <Table columns={columns} data={customers} loading={loading} emptyText="No customers found" />
        </div>
      </div>
    </Layout>
  );
};

export default Customers;
