import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-label">{label}</div>
      <div className="tooltip-row">
        <span className="tooltip-dot" style={{ background: '#A78BFA' }} />
        <span style={{ color: 'var(--muted2)', fontSize: '0.78rem' }}>Visits:</span>
        <span style={{ color: '#A78BFA' }}>{payload[0]?.value}</span>
      </div>
    </div>
  );
};

const FootTrafficChart = ({ data = [] }) => {
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8AM - 10PM
  const chartData = hours.map(h => {
    const found = data.find(d => d.hour === h);
    return {
      label: `${h}:00`,
      visits: found?.visits || 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#A78BFA" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,38,64,0.8)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#4A5270', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval={2}
        />
        <YAxis
          tick={{ fill: '#4A5270', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="visits"
          stroke="#A78BFA"
          strokeWidth={2.5}
          fill="url(#trafficGrad)"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0, fill: '#A78BFA' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default FootTrafficChart;
