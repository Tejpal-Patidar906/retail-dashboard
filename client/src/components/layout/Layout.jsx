import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import api from '../../services/api';

const Layout = ({ children, title, subtitle, onRefresh, loading }) => {
  const socketRef = useRef(null);
  const [alertCount, setAlertCount] = useState(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // Fetch initial alert count
    api.get('/inventory/alerts').then(res => {
      setAlertCount(res.data.count || 0);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // Setup Socket.io
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('new_sale', ({ revenue, profit }) => {
      // Staff ko revenue notification nahi dikhani
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser?.role !== 'staff') {
        toast.success(`💰 New sale! +₹${revenue?.toFixed(2)}`, { duration: 3000 });
      }
    });

    socket.on('stock_alert', ({ product, stock, status }) => {
      toast(`⚠️ Low stock: ${product} (${stock} left)`, {
        icon: '📦',
        style: { borderColor: 'var(--yellow)', color: 'var(--yellow)' },
        duration: 5000,
      });
      setAlertCount(c => c + 1);
    });

    socket.on('staff_update', ({ staff }) => {
      toast(`👤 Staff update: ${staff?.user?.name}`, { duration: 2500 });
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div className="app-layout">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      <Sidebar 
        alertCount={alertCount} 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
      />
      <div className="main-content">
        <Topbar 
          title={title} 
          subtitle={subtitle} 
          onRefresh={onRefresh} 
          loading={loading}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />
        <main className="page-container fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
