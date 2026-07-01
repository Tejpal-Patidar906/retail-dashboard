import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-label">{label}</div>
      {payload.map(entry => (
        <div key={entry.name} className="tooltip-row">
          <span className="tooltip-dot" style={{ background: entry.color }} />
          <span style={{ color: 'var(--muted2)', fontSize: '0.78rem' }}>{entry.name}:</span>
          <span style={{ color: entry.color }}>₹{entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const RevenueChart = ({ data = [], mode = 'daily' }) => {
  const formattedData = data.map(item => ({
    ...item,
    label: mode === 'daily'
      ? new Date(item._id).toLocaleDateString('en', { month: 'short', day: 'numeric' })
      : item._id,
    revenue: Math.round(item.revenue),
    profit: Math.round(item.profit),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={formattedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#5B8AF0" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#5B8AF0" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#34D99E" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#34D99E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,38,64,0.8)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#4A5270', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#4A5270', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '0.78rem', color: '#4A5270', paddingTop: 12 }}
          iconType="circle"
          iconSize={8}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#5B8AF0"
          strokeWidth={2.5}
          fill="url(#revenueGrad)"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0, fill: '#5B8AF0' }}
        />
        <Area
          type="monotone"
          dataKey="profit"
          name="Profit"
          stroke="#34D99E"
          strokeWidth={2.5}
          fill="url(#profitGrad)"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0, fill: '#34D99E' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;
