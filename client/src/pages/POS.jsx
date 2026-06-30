import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Search, ShoppingCart, Plus, Minus, Trash2, Mail, CheckCircle2, User, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useInventory } from '../hooks/useInventory';
import api from '../services/api';
import toast from 'react-hot-toast';

const POS = () => {
  const { inventory, loading: invLoading, refetch: refetchInv } = useInventory();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  // Barcode Scanner Listener
  useEffect(() => {
    let barcodeBuffer = '';
    let timeoutId = null;

    const handleKeyDown = (e) => {
      // Ignore if user is manually typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter' && barcodeBuffer.length > 2) {
        // Find product by SKU
        const product = inventory.find(p => p.sku.toLowerCase() === barcodeBuffer.toLowerCase());
        if (product) {
          addToCart(product);
          toast.success(`Scanned: ${product.name}`);
        } else {
          toast.error(`Unknown Barcode: ${barcodeBuffer}`);
        }
        barcodeBuffer = '';
      } else {
        if (e.key.length === 1) {
          barcodeBuffer += e.key;
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => { barcodeBuffer = ''; }, 100); // Scanners type very fast
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inventory]);

  
  // Cart state
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [successBill, setSuccessBill] = useState(null);

  // New Customer State
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });
  const [customerLoading, setCustomerLoading] = useState(false);
  
  const [mySales, setMySales] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);

  useEffect(() => {
    // Fetch customers for the dropdown
    api.get('/customers').then(res => setCustomers(res.data.data)).catch(console.error);
    api.get('/store/info').then(res => setStoreInfo(res.data.data)).catch(console.error);
    fetchMySales();
  }, []);

  const fetchMySales = () => {
    api.get('/sales/me').then(res => setMySales(res.data.data)).catch(console.error);
  };

  const filteredProducts = useMemo(() => {
    if (!search) return inventory;
    const l = search.toLowerCase();
    return inventory.filter(p => p.name.toLowerCase().includes(l) || p.sku.toLowerCase().includes(l));
  }, [inventory, search]);

  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.error('Out of stock!');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product._id === product._id);
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.error(`Only ${product.stock} available`);
          return prev;
        }
        return prev.map(item => item.product._id === product._id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product._id === id) {
          const newQty = item.qty + delta;
          if (newQty > item.product.stock) {
            toast.error(`Only ${item.product.stock} available`);
            return item;
          }
          if (newQty <= 0) return null; // remove
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.product._id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    setCheckoutLoading(true);

    try {
      const payload = {
        products: cart.map(item => ({ product: item.product._id, qty: item.qty })),
        paymentMethod,
        customer: selectedCustomer || undefined
      };

      const { data } = await api.post('/sales', payload);
      toast.success('Bill Generated Successfully!');
      
      const selectedCustomerObj = customers.find(c => c._id === selectedCustomer);
      setSuccessBill({
        id: data.data._id,
        emailStatus: data.emailStatus,
        total: cartTotal,
        phone: selectedCustomerObj?.phone,
        name: selectedCustomerObj?.name,
        paymentMethod
      });
      setCart([]);
      setSelectedCustomer('');
      refetchInv(); // refresh stock
      fetchMySales(); // refresh my performance
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name) return toast.error('Customer name is required');
    if (!newCustomer.phone) return toast.error('Customer phone is required for billing');
    
    setCustomerLoading(true);
    try {
      const { data } = await api.post('/customers', { ...newCustomer, branch: 'Main Branch', segment: 'Regular', visits: 0, totalSpent: 0 });
      setCustomers(prev => [...prev, data.data]);
      setSelectedCustomer(data.data._id);
      setShowNewCustomerForm(false);
      setNewCustomer({ name: '', email: '', phone: '' });
      toast.success('Customer added successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add customer');
    } finally {
      setCustomerLoading(false);
    }
  };

  return (
    <Layout title="Point of Sale" subtitle="Record sales and generate bills" loading={invLoading}>
      {/* My Performance Bar */}
      {mySales && (
        <div style={{ display: 'flex', gap: 15, marginBottom: 20, padding: 15, background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Today's Sales</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)' }}>₹{mySales.todayTotal.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--muted2)' }}>({mySales.todayCount} bills)</span></div>
          </div>
          <div style={{ width: 1, background: 'var(--border)' }}></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Total Sales (All Time)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--green)' }}>₹{mySales.totalSales.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--muted2)' }}>({mySales.totalCount} bills)</span></div>
          </div>
        </div>
      )}

      {successBill && (
        <div className="card" style={{ marginBottom: 20, border: '1px solid var(--green)', background: 'rgba(52, 217, 158, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--green)' }}>
            <CheckCircle2 size={24} />
            <h3 style={{ margin: 0 }}>Bill Generated!</h3>
          </div>
          <p style={{ marginTop: 10, color: 'var(--muted)' }}>Bill ID: {successBill.id} | Amount: ₹{successBill.total}</p>



          <div style={{ marginTop: 15 }}>
            {successBill.emailStatus?.sent ? (
              successBill.emailStatus.previewUrl ? (
                <a href={successBill.emailStatus.previewUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                  <Mail size={16} /> View Sent Email (Test)
                </a>
              ) : (
                <span style={{ color: 'var(--green)', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle2 size={16} /> Bill sent to customer's email!
                </span>
              )
            ) : (
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Bill saved. (No email provided for this customer)</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
            {successBill.phone && (
              <a 
                href={`https://wa.me/91${successBill.phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Hello ${successBill.name},\nThank you for shopping with us!\nYour bill amount is ₹${successBill.total}.\nBill ID: ${successBill.id}`)}`}
                target="_blank" rel="noreferrer"
                className="btn btn-primary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', background: '#25D366', borderColor: '#25D366' }}
              >
                Send WhatsApp
              </a>
            )}
            <Button variant="ghost" onClick={() => setSuccessBill(null)}>New Sale</Button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 160px)' }}>
        {/* Left Side: Product List */}
        <div className="card" style={{ flex: '1', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="topbar-search" style={{ margin: 0, width: '100%', maxWidth: 'none' }}>
              <Search size={16} color="var(--muted)" />
              <input 
                type="text" 
                placeholder="Search products by name or SKU..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                style={{ fontSize: '0.95rem' }}
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 15, alignContent: 'start' }}>
            {filteredProducts.map(p => (
              <div 
                key={p._id} 
                onClick={() => addToCart(p)}
                style={{ 
                  background: 'var(--surface2)', 
                  border: '1px solid var(--border)',
                  borderRadius: 10, padding: 15, 
                  cursor: p.stock > 0 ? 'pointer' : 'not-allowed',
                  opacity: p.stock > 0 ? 1 : 0.5,
                  transition: 'transform 0.2s, border-color 0.2s'
                }}
                onMouseOver={(e) => { if(p.stock>0) e.currentTarget.style.borderColor = 'var(--accent)' }}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 8 }}>{p.sku}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{p.price}</span>
                  <Badge color={p.stock > 10 ? 'green' : p.stock > 0 ? 'yellow' : 'red'}>{p.stock} in stock</Badge>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--muted)', padding: 40 }}>No products found</div>
            )}
          </div>
        </div>

        {/* Right Side: Cart & Checkout */}
        <div className="card" style={{ width: 400, display: 'flex', flexDirection: 'column', padding: 0 }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <ShoppingCart size={20} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Current Bill</h3>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, padding: 20, minHeight: 150 }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0' }}>
                  <ShoppingCart size={40} opacity={0.2} style={{ margin: '0 auto 10px' }} />
                  Cart is empty
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {cart.map(item => (
                    <div key={item.product._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed var(--border)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.product.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>₹{item.product.price} / unit</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--surface2)', borderRadius: 6, padding: 2 }}>
                          <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => updateQty(item.product._id, -1)}><Minus size={12} /></button>
                          <span style={{ fontSize: '0.85rem', width: 20, textAlign: 'center' }}>{item.qty}</span>
                          <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => updateQty(item.product._id, 1)}><Plus size={12} /></button>
                        </div>
                        <div style={{ fontWeight: 600, width: 60, textAlign: 'right' }}>₹{item.product.price * item.qty}</div>
                        <button className="icon-btn" style={{ color: 'var(--red)' }} onClick={() => removeFromCart(item.product._id)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: 20, borderTop: '1px solid var(--border)', background: 'var(--surface2)', flexShrink: 0 }}>
              <div className="form-group" style={{ marginBottom: 15 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ display: 'flex', gap: 6, alignItems: 'center', margin: 0 }}><User size={14} /> Select Customer</label>
                  <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '0.8rem', height: 'auto' }} onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}>
                    {showNewCustomerForm ? 'Cancel' : '+ New Customer'}
                  </button>
                </div>

                {showNewCustomerForm ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--surface1)', padding: 15, borderRadius: 8, border: '1px dashed var(--border)' }}>
                    <input type="text" className="form-input" placeholder="Name *" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                    <input type="email" className="form-input" placeholder="Email" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} />
                    <input type="text" className="form-input" placeholder="Phone" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                    <Button size="sm" onClick={handleAddCustomer} loading={customerLoading}>Save & Select</Button>
                  </div>
                ) : (
                  <select className="form-input" value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}>
                    <option value="">Walk-in Customer (No email)</option>
                    {customers.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.email || c.phone || 'No email'})</option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Payment Method</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['cash', 'card', 'upi'].map(m => (
                    <button 
                      key={m} 
                      className={`btn ${paymentMethod === m ? 'btn-primary' : 'btn-ghost'}`} 
                      style={{ flex: 1, textTransform: 'capitalize' }}
                      onClick={() => setPaymentMethod(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* UPI QR AND TOTAL ROW */}
              {paymentMethod === 'upi' && cartTotal > 0 && storeInfo?.upiId ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, background: '#fff', padding: '10px 15px', borderRadius: 10, border: '1px dashed var(--accent)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <div style={{ background: '#fff', padding: 4, borderRadius: 6, border: '1px solid var(--border)' }}>
                      <QRCodeCanvas 
                        value={`upi://pay?pa=${storeInfo.upiId}&pn=${encodeURIComponent(storeInfo.name)}&am=${cartTotal}&cu=INR`}
                        size={80}
                        level="M"
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#333', fontSize: '0.9rem' }}>Scan to Pay</div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 2 }}>{storeInfo.upiId}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.4rem' }}>₹{cartTotal.toLocaleString()}</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, fontSize: '1.2rem', fontWeight: 700 }}>
                  <span>Total:</span>
                  <span style={{ color: 'var(--accent)' }}>₹{cartTotal.toLocaleString()}</span>
                </div>
              )}

              {paymentMethod === 'upi' && cartTotal > 0 && !storeInfo?.upiId && (
                <div style={{ marginBottom: 20, padding: 10, background: 'var(--surface2)', borderRadius: 8, color: 'var(--muted)', fontSize: '0.9rem' }}>
                  <QrCode size={16} style={{ marginBottom: -3, marginRight: 5 }} /> 
                  Store UPI ID is not configured in Settings.
                </div>
              )}

              <Button variant="primary" style={{ width: '100%', height: 44, fontSize: '1rem' }} disabled={cart.length === 0} loading={checkoutLoading} onClick={handleCheckout}>
                Generate Bill (Checkout)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default POS;
