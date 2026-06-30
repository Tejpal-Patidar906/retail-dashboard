import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import KPICard from '../components/ui/KPICard';
import RevenueChart from '../components/charts/RevenueChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { IndianRupee, ShoppingCart, TrendingUp, RotateCcw, Package } from 'lucide-react';
import { useSales } from '../hooks/useSales';

const Overview = () => {
  const { summary, dailySales, monthlySales, topProducts, loading, refetch } = useSales({ period: '30' });

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—';
  const fmtNum = (n) => n != null ? Number(n).toLocaleString() : '—';

  // Monthly chart data
  const monthlyData = monthlySales.map(item => ({
    label: item._id,
    revenue: Math.round(item.revenue),
    target: Math.round(item.revenue * 1.15), // simulated target
  }));

  return (
    <Layout
      title="Overview"
      subtitle={`Dashboard summary · Last 30 days · ${new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}`}
      onRefresh={refetch}
      loading={loading}
    >
      {/* KPI Grid */}
      <div className="section">
        <div className="grid kpi-grid">
          <KPICard
            label="Total Revenue"
            value={fmt(summary?.totalRevenue)}
            icon={IndianRupee}
            color="accent"
            trend="up"
            trendValue={12.4}
          />
          <KPICard
            label="Transactions"
            value={fmtNum(summary?.transactionCount)}
            icon={ShoppingCart}
            color="green"
            trend="up"
            trendValue={8.1}
          />
          <KPICard
            label="Avg. Order Value"
            value={summary?.aov != null ? `₹${Number(summary.aov).toFixed(2)}` : '—'}
            icon={TrendingUp}
            color="purple"
            trend="up"
            trendValue={3.2}
          />
          <KPICard
            label="Return Rate"
            value={summary?.returnRate != null ? `${summary.returnRate}%` : '—'}
            icon={RotateCcw}
            color="red"
            trend="down"
            trendValue={1.1}
          />
        </div>
      </div>

      {/* Revenue + Category charts */}
      <div className="section">
        <div className="grid chart-grid-3">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Revenue &amp; Profit Trend</div>
                <div className="card-subtitle">Last 14 days — area chart</div>
              </div>
            </div>
            <RevenueChart data={dailySales} mode="daily" />
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Revenue by Category</div>
                <div className="card-subtitle">Sales distribution</div>
              </div>
            </div>
            <CategoryPieChart data={topProducts} />
          </div>
        </div>
      </div>

      {/* Monthly + Top Products */}
      <div className="section">
        <div className="grid chart-grid-3">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Monthly Revenue vs Target</div>
                <div className="card-subtitle">Bar chart — last 12 months</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,38,64,0.8)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#4A5270', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4A5270', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip
                  contentStyle={{ background: '#131829', border: '1px solid #1E2640', borderRadius: 10 }}
                  labelStyle={{ color: '#4A5270', fontSize: '0.75rem' }}
                  itemStyle={{ color: '#E2E8F8', fontSize: '0.85rem' }}
                />
                <Bar dataKey="revenue" fill="#5B8AF0" radius={[4,4,0,0]} name="Revenue" />
                <Bar dataKey="target"  fill="rgba(167,139,250,0.4)" radius={[4,4,0,0]} name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Top Products</div>
              <div className="card-subtitle">By revenue this month</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {loading ? (
                <div className="flex-center" style={{ padding: 24 }}><div className="spinner"/></div>
              ) : topProducts.slice(0, 5).map((p, idx) => {
                const maxRevenue = topProducts[0]?.totalRevenue || 1;
                const pct = (p.totalRevenue / maxRevenue) * 100;
                return (
                  <div key={p._id || idx}>
                    <div className="flex-between mb-4">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          width: 24, height: 24, borderRadius: 6,
                          background: `rgba(91,138,240,${0.2 - idx * 0.03})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                          flexShrink: 0,
                        }}>
                          {idx + 1}
                        </span>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--muted2)' }}>{p.sku} · {p.category}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
                        ₹{p.totalRevenue?.toLocaleString()}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #5B8AF0, #A78BFA)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Overview;
