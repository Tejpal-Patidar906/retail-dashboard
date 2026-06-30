const Badge = ({ children, color = 'muted', dot = false }) => (
  <span className={`badge ${color}`}>
    {dot && (
      <span style={{
        width: 6, height: 6,
        borderRadius: '50%',
        background: 'currentColor',
        display: 'inline-block',
        flexShrink: 0,
      }} />
    )}
    {children}
  </span>
);

export default Badge;
