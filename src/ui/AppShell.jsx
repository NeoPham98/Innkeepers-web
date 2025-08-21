import React, { useMemo, useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

export const AppShell = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [homes, setHomes] = useState([]);
  const [loadingHomes, setLoadingHomes] = useState(false);

  const { accountId, homeId, breadcrumbs, currentPage } = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    const result = { accountId: undefined, homeId: undefined, breadcrumbs: [], currentPage: '' };
    
    // Check for new routing structure: /app/homes/{accountId}/{homeId}...
    if (parts[0] === 'app' && parts[1] === 'homes') {
      result.accountId = parts[2];
      result.homeId = parts[3];
    }
    // Fallback for old routing structure: /homes/{accountId}/{homeId}...
    else if (parts[0] === 'homes') {
      result.accountId = parts[1];
      result.homeId = parts[2];
    }
    
    const trail = [];
    if (result.accountId) {
      trail.push({ label: '🏠 Nhà trọ', to: `/app/homes/${result.accountId}` });
    }
    if (result.accountId && result.homeId) {
      trail.push({ label: `📋 Chi tiết nhà`, to: `/app/homes/${result.accountId}/${result.homeId}` });
    }
    
    // Determine current page for better navigation
    if (location.pathname.includes('/invoices')) {
      result.currentPage = 'invoices';
    } else if (location.pathname.includes('/chart')) {
      result.currentPage = 'chart';
    } else if (location.pathname.includes('/settings')) {
      result.currentPage = 'settings';
    } else if (location.pathname.includes('/rooms')) {
      result.currentPage = 'rooms';
    } else if (location.pathname.includes('/new')) {
      result.currentPage = 'new';
    }
    
    result.breadcrumbs = trail;
    return result;
  }, [location.pathname]);

  // Function to load homes data
  const loadHomes = async () => {
    if (!accountId) return;
    
    setLoadingHomes(true);
    try {
      const { data, error } = await supabase
        .from('Home')
        .select('*')
        .eq('id_account', accountId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setHomes(data || []);
    } catch (error) {
      console.error('Error loading homes:', error);
      setHomes([]);
    } finally {
      setLoadingHomes(false);
    }
  };

  // Load homes data when accountId changes
  useEffect(() => {
    loadHomes();
  }, [accountId]);

  // Listen for custom event to refresh homes
  useEffect(() => {
    const handleRefreshHomes = () => {
      loadHomes();
    };

    window.addEventListener('refreshHomes', handleRefreshHomes);
    return () => {
      window.removeEventListener('refreshHomes', handleRefreshHomes);
    };
  }, [accountId]);

  const navItems = useMemo(() => {
    if (!accountId) return [];
    const base = `/app/homes/${accountId}`;
    const items = [
      { 
        label: 'Danh sách nhà', 
        to: base, 
        icon: '🏠',
        description: 'Quản lý tất cả nhà trọ'
      },
      { 
        label: 'Tạo nhà mới', 
        to: `${base}/new`, 
        icon: '➕',
        description: 'Thêm nhà trọ mới',
        variant: 'ghost'
      },
    ];
    
    if (homeId) {
      items.push(
        { 
          label: 'Tổng quan nhà', 
          to: `${base}/${homeId}`, 
          icon: '📋',
          description: 'Xem chi tiết và quản lý phòng'
        },
        { 
          label: 'Hóa đơn', 
          to: `${base}/${homeId}/invoices`, 
          icon: '🧾',
          description: 'Quản lý hóa đơn'
        },
        { 
          label: 'Báo cáo', 
          to: `${base}/${homeId}/chart`, 
          icon: '📈',
          description: 'Xem báo cáo doanh thu'
        },
        { 
          label: 'Cài đặt', 
          to: `${base}/${homeId}/settings`, 
          icon: '⚙️',
          description: 'Cấu hình hệ thống'
        },
      );
    }
    return items;
  }, [accountId, homeId]);

  const closeSidebar = () => setSidebarOpen(false);

  const getCurrentPageTitle = () => {
    switch (currentPage) {
      case 'invoices':
        return '🧾 Quản lý hóa đơn';
      case 'chart':
        return '📈 Báo cáo doanh thu';
      case 'settings':
        return '⚙️ Cài đặt hệ thống';
      case 'rooms':
        return '🚪 Quản lý phòng';
      case 'new':
        return '🏗️ Tạo nhà mới';
      default:
        if (accountId && !homeId) {
          return '🏠 Danh sách nhà trọ';
        } else if (accountId && homeId) {
          return '📋 Chi tiết nhà trọ';
        }
        return '🏨 Innkeeper';
    }
  };

  // Check if we should show home management section
  const shouldShowHomeManagement = homeId && currentPage !== 'new';

  return (
    <div className="app-layout">
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} 
        onClick={closeSidebar}
      />
      
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">🏨</div>
            <div className="logo-text">
              <div className="logo-title">Innkeeper</div>
              <div className="logo-subtitle">Quản lý nhà trọ</div>
            </div>
          </div>
        </div>
        
        <nav className="nav">
          <div className="nav-section">
            <div className="nav-section-title">Menu chính</div>
            
            {/* Danh sách nhà */}
            <Link 
              to={`/app/homes/${accountId}`}
              className={`nav-item${location.pathname.startsWith(`/app/homes/${accountId}`) ? ' active' : ''}`}
              onClick={closeSidebar}
              title="Quản lý tất cả nhà trọ"
            >
              <span className="nav-icon" aria-hidden>🏠</span>
              <span className="nav-label">Danh sách nhà</span>
              {location.pathname.startsWith(`/app/homes/${accountId}`) && <span className="nav-indicator"></span>}
            </Link>

            {/* Homes List - show under "Danh sách nhà" */}
            {accountId && homes.length > 0 && (
              <div className="homes-submenu">
                {loadingHomes ? (
                  <div className="nav-loading">
                    <div className="nav-loading-spinner"></div>
                    <span>Đang tải...</span>
                  </div>
                ) : (
                  homes.map((home) => {
                    const isActive = homeId === home.id_home?.toString();
                    const isCurrentHome = homeId === home.id_home?.toString();
                    
                    return (
                      <div key={home.id_home} className="home-menu-group">
                        {/* Home Item */}
                        <Link 
                          to={`/app/homes/${accountId}/${home.id_home}`} 
                          className={`nav-item home-item${isActive ? ' active' : ''}`} 
                          onClick={closeSidebar}
                          title={`Xem chi tiết: ${home.home_name}`}
                        >
                          <span className="nav-icon" aria-hidden>🏠</span>
                          <span className="nav-label">{home.home_name}</span>
                          {isActive && <span className="nav-indicator"></span>}
                        </Link>

                        {/* Home Management Submenu - only show when this home is active */}
                        {isCurrentHome && shouldShowHomeManagement && (
                          <div className="home-management-submenu">
                            {navItems.slice(2).map((item) => {
                              // Chỉ active khi URL chính xác match với item.to
                              const active = location.pathname === item.to;
                              return (
                                <Link 
                                  key={item.to} 
                                  to={item.to} 
                                  className={`nav-item management-item${active ? ' active' : ''}`} 
                                  onClick={closeSidebar}
                                  title={item.description}
                                >
                                  <span className="nav-icon" aria-hidden>{item.icon}</span>
                                  <span className="nav-label">{item.label}</span>
                                  {active && <span className="nav-indicator"></span>}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tạo nhà mới */}
            <Link 
              to={`/app/homes/${accountId}/new`}
              className={`nav-item ghost${location.pathname === `/app/homes/${accountId}/new` ? ' active' : ''}`}
              onClick={closeSidebar}
              title="Thêm nhà trọ mới"
            >
              <span className="nav-icon" aria-hidden>➕</span>
              <span className="nav-label">Tạo nhà mới</span>
              {location.pathname === `/app/homes/${accountId}/new` && <span className="nav-indicator"></span>}
            </Link>
          </div>
          
          {!accountId && (
            <div className="nav-empty">
              <div className="nav-empty-icon">🔐</div>
              <div className="nav-empty-text">Đăng nhập để bắt đầu</div>
            </div>
          )}
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <div className="user-name">Quản lý</div>
              <div className="user-role">Administrator</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="app-main">
        {/* Header */}
        <header className="header-bar">
          <div className="header-content">
            <div className="header-left">
              <button 
                className="mobile-menu-btn" 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                aria-label="Toggle menu"
              >
                <span className="menu-icon">☰</span>
              </button>
              
              <div className="page-info">
                <h1 className="header-title">{getCurrentPageTitle()}</h1>
                <div className="breadcrumbs">
                  {breadcrumbs.map((bc, i) => (
                    <span key={bc.to} className="crumb">
                      <Link className="crumb-link" to={bc.to}>{bc.label}</Link>
                      {i < breadcrumbs.length - 1 && <span className="crumb-separator">/</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="header-right">
              <div className="header-actions">
                <Link to="/logout" className="logout-btn" title="Đăng xuất">
                  <span className="logout-icon">🚪</span>
                  <span className="logout-text">Đăng xuất</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {props.children ? props.children : <Outlet />}
        </main>
      </div>
    </div>
  );
};


