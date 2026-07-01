import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import api from '../../services/api';

const Layout = ({ children, title, subtitle, onRefresh, loading }) => {
  const [alertCount, setAlertCount] = useState(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // Fetch initial alert count
    api.get('/inventory/alerts').then(res => {
      setAlertCount(res.data.count || 0);
    }).catch(() => {});
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
