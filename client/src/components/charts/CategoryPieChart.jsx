import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#5B8AF0', '#34D99E', '#A78BFA', '#F5C842'];
const RADIAN = Math.PI / 180;

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-row">
        <span className="tooltip-dot" style={{ background: payload[0].payload.fill }} />
        <span style={{ color: 'var(--muted2)', fontSize: '0.78rem' }}>{payload[0].name}:</span>
        <span style={{ color: payload[0].payload.fill }}>₹{payload[0].value?.toLocaleString()}</span>
      </div>
    </div>
  );
};

const CategoryPieChart = ({ data = [] }) => {
  // Aggregate by category
  const categoryMap = {};
  data.forEach(item => {
    const cat = item.category || item._id || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + (item.totalRevenue || item.revenue || 0);
  });

  const chartData = Object.entries(categoryMap).map(([name, value], i) => ({
    name,
    value: Math.round(value),
    fill: COLORS[i % COLORS.length],
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex-center" style={{ height: 240, color: 'var(--muted2)' }}>
        No category data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={95}
          paddingAngle={3}
          dataKey="value"
          labelLine={false}
          label={renderCustomLabel}
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.fill} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '0.78rem', color: '#4A5270', paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CategoryPieChart;
