import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const KPICard = ({ label, value, trend, trendValue, icon: Icon, color = 'accent', prefix = '', suffix = '' }) => {
  const trendDir = trend === 'up' ? 'up' : trend === 'down' ? 'down' : 'neutral';

  return (
    <div className={`kpi-card ${color}`}>
      <div className="kpi-header">
        <div className={`kpi-icon ${color}`}>
          {Icon && <Icon size={20} />}
        </div>
        {trendValue !== undefined && (
          <div className={`kpi-trend ${trendDir}`}>
            {trendDir === 'up'   && <TrendingUp size={12} />}
            {trendDir === 'down' && <TrendingDown size={12} />}
            {trendDir === 'neutral' && <Minus size={12} />}
            {trendValue}%
          </div>
        )}
      </div>
      <div className="kpi-value">{prefix}{value}{suffix}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
};

export default KPICard;
