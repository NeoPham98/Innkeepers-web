import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

export const Homes = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const [homes, setHomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyRevenue, setMonthlyRevenue] = useState({});
  const [invoiceCounts, setInvoiceCounts] = useState({});

  const fetchMonthlyRevenueByHome = async () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const from = new Date(Date.UTC(currentYear, currentMonth, 1)).toISOString();
    const to = new Date(Date.UTC(currentYear, currentMonth + 1, 1)).toISOString();

    const { data, error } = await supabase
      .from('Invoice')
      .select('id_home,total_amount,created_at')
      .gte('created_at', from)
      .lt('created_at', to);
    if (error) return {};

    return (data || []).reduce((acc, inv) => {
      const amount = parseFloat(inv.total_amount) || 0;
      acc[inv.id_home] = (acc[inv.id_home] || 0) + amount;
      return acc;
    }, {});
  };

  const fetchInvoiceCountByHome = async () => {
    // Lấy tất cả hóa đơn của các nhà thuộc account này
    const { data: homesData, error: homesError } = await supabase
      .from('Home')
      .select('id_home')
      .eq('id_account', accountId);
    
    if (homesError) return {};

    const homeIds = homesData.map(home => home.id_home);
    
    if (homeIds.length === 0) return {};

    const { data, error } = await supabase
      .from('Invoice')
      .select('id_invoice, id_home')
      .in('id_home', homeIds);
    
    if (error) return {};

    return (data || []).reduce((acc, inv) => {
      acc[inv.id_home] = (acc[inv.id_home] || 0) + 1;
      return acc;
    }, {});
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Home')
        .select('*')
        .eq('id_account', accountId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const revenue = await fetchMonthlyRevenueByHome();
      const counts = await fetchInvoiceCountByHome();
      setMonthlyRevenue(revenue);
      setInvoiceCounts(counts);
      setHomes(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [accountId]);

  const format = (n) => new Intl.NumberFormat('vi-VN').format(n);
  const monthName = useMemo(() => `Tháng ${new Date().getMonth() + 1}`, []);

  // Calculate statistics
  const totalHomes = homes.length;
  const totalRooms = homes.reduce((sum, home) => sum + (home.room_total || 0), 0);
  const totalEmptyRooms = homes.reduce((sum, home) => sum + (home.room_total_empty || 0), 0);
  const totalRevenue = Object.values(monthlyRevenue).reduce((sum, rev) => sum + rev, 0);
  const occupancyRate = totalRooms > 0 ? ((totalRooms - totalEmptyRooms) / totalRooms * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="loading">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Quản lý nhà trọ</h1>
        <p className="page-subtitle">
          Tổng quan về các nhà trọ và thống kê chi tiết về tình hình kinh doanh
        </p>
      </div>

      {/* Dashboard Stats */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Tổng số nhà</span>
            <div className="stat-icon primary">🏠</div>
          </div>
          <div className="stat-value">{totalHomes}</div>
          <div className="stat-change">Nhà trọ đang quản lý</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Tổng số phòng</span>
            <div className="stat-icon info">🚪</div>
          </div>
          <div className="stat-value">{totalRooms}</div>
          <div className="stat-change">Phòng trong tất cả nhà</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Tỷ lệ lấp đầy</span>
            <div className="stat-icon warning">📊</div>
          </div>
          <div className="stat-value">{occupancyRate}%</div>
          <div className="stat-change positive">
            {totalRooms - totalEmptyRooms}/{totalRooms} phòng đã thuê
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Doanh thu {monthName}</span>
            <div className="stat-icon success">💰</div>
          </div>
          <div className="stat-value">{format(totalRevenue)} ₫</div>
          <div className="stat-change positive">Tổng thu nhập tháng này</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <h2 className="text-2xl font-bold">Danh sách nhà trọ</h2>
          <span className="text-muted">({totalHomes} nhà)</span>
        </div>
        <div className="toolbar-right">
          <Link to={`/app/homes/${accountId}/new`} className="btn btn-primary btn-lg">
            <span>🏗️</span>
            Tạo nhà mới
          </Link>
        </div>
      </div>

      {/* Homes Grid */}
      <div className="grid grid-2">
        {homes.map((home, index) => (
          <div key={home.id_home} className="card fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="card-title">{home.home_name}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/app/homes/${accountId}/${home.id_home}/edit`)} 
                    className="btn btn-secondary btn-sm"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={async () => { 
                      if (confirm('Bạn có chắc muốn xóa nhà này?')) {
                        await supabase.from('Home').delete().eq('id_home', home.id_home); 
                        load(); 
                        // Trigger refresh homes in AppShell
                        window.dispatchEvent(new CustomEvent('refreshHomes'));
                      }
                    }} 
                    className="btn btn-danger btn-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-3xl">📍</div>
                <p className="text-muted text-lg">{home.home_address}</p>
              </div>
              
              <div className="grid grid-4 mb-6">
                <div className="text-center p-4 bg-secondary rounded-xl">
                  <div className="text-2xl mb-2">🏠</div>
                  <div className="text-sm text-muted">Tổng phòng</div>
                  <div className="font-bold text-xl">{home.room_total || 0}</div>
                </div>
                <div className="text-center p-4 bg-warning rounded-xl">
                  <div className="text-2xl mb-2">🔓</div>
                  <div className="text-sm text-muted">Phòng trống</div>
                  <div className="font-bold text-xl">{home.room_total_empty || 0}</div>
                </div>
                <div className="text-center p-4 bg-success rounded-xl">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="text-sm text-muted">Đang thuê</div>
                  <div className="font-bold text-xl">{home.room_total - (home.room_total_empty || 0)}</div>
                </div>
                                 <div className="text-center p-4 bg-info rounded-xl">
                   <div className="text-2xl mb-2">📋</div>
                   <div className="text-sm text-muted">Hóa đơn</div>
                   <div className="font-bold text-xl">{invoiceCounts[home.id_home] || 0}</div>
                 </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-tertiary rounded-xl">
                <div>
                  <div className="text-sm text-muted">Doanh thu {monthName}</div>
                  <div className="font-bold text-2xl text-success">
                    {format(monthlyRevenue[home.id_home] || 0)} ₫
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted">Tỷ lệ lấp đầy</div>
                  <div className="font-bold text-lg">
                    {home.room_total > 0 
                      ? (((home.room_total - (home.room_total_empty || 0)) / home.room_total * 100).toFixed(1))
                      : 0}%
                  </div>
                </div>
              </div>
            </div>
            <div className="card-footer">
              <Link to={`/app/homes/${accountId}/${home.id_home}`} className="btn btn-primary w-full">
                👁️ Xem chi tiết
              </Link>
            </div>
          </div>
        ))}
      </div>

      {homes.length === 0 && (
        <div className="card text-center fade-in">
          <div className="card-body p-12">
            <div className="text-8xl mb-6">🏠</div>
            <h3 className="text-2xl font-bold mb-4">Chưa có nhà trọ nào</h3>
            <p className="text-muted text-lg mb-8 max-w-md mx-auto">
              Bắt đầu hành trình quản lý nhà trọ bằng cách tạo nhà đầu tiên
            </p>
            <Link to={`/app/homes/${accountId}/new`} className="btn btn-primary btn-lg">
              <span>🏗️</span>
              Tạo nhà đầu tiên
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};


