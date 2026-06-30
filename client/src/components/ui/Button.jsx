const Button = ({
  children, onClick, variant = 'primary', size = '', disabled = false,
  loading = false, icon: Icon, type = 'button', className = '', ...props
}) => (
  <button
    type={type}
    className={`btn btn-${variant}${size ? ` btn-${size}` : ''} ${className}`}
    onClick={onClick}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? (
      <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
    ) : Icon ? (
      <Icon size={15} />
    ) : null}
    {children}
  </button>
);

export default Button;
