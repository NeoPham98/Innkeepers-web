import React, { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

export const InvoiceList = () => {
  const { accountId, homeId } = useParams();
  const location = useLocation();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(() => {
    const viaState = location.state?.flashSuccess;
    if (viaState) return viaState;
    try {
      const viaStorage = sessionStorage.getItem('flashSuccess');
      if (viaStorage) {
        sessionStorage.removeItem('flashSuccess');
        return viaStorage;
      }
    } catch {}
    return '';
  });
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('Invoice').select('*').eq('id_home', homeId);
      const formatted = (data || []).map((row) => ({
        ...row,
        service_id: Array.isArray(row.service_id) ? row.service_id : (row.service_id ? (() => { try { return JSON.parse(row.service_id); } catch { return []; } })() : []),
      }));
      formatted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setInvoices(formatted);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [homeId]);
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(''), 3000);
      return () => clearTimeout(id);
    }
  }, [toast]);
  // Reset/clamp page when data changes or home switches
  useEffect(() => { setCurrentPage(1); }, [homeId]);
  const totalPages = Math.max(1, Math.ceil(invoices.length / pageSize));
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [totalPages, currentPage]);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, invoices.length);
  const pageInvoices = invoices.slice(startIdx, endIdx);

  // Ensure we always work with numbers even if API returns strings with separators
  const toNumber = (v) => {
    const num = typeof v === 'number' ? v : Number(String(v ?? '0').replace(/[.,]/g, ''));
    return isNaN(num) ? 0 : num;
  };
  const format = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(toNumber(n)));

  // Calculate statistics
  const totalRevenue = invoices.reduce((sum, inv) => sum + toNumber(inv.total_amount), 0);
  const totalInvoices = invoices.length;
  const thisMonthInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.created_at);
    const now = new Date();
    return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
  });
  const thisMonthRevenue = thisMonthInvoices.reduce((sum, inv) => sum + toNumber(inv.total_amount), 0);

  if (loading) {
    return (
      <div className="loading">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="fade-in">
      {toast && (
        <div className="toast">
          <span>✅ {toast}</span>
          <span className="toast-close" onClick={() => setToast('')}>✕</span>
        </div>
      )}
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Danh sách hóa đơn</h1>
        <p className="page-subtitle">
          Quản lý và theo dõi tất cả hóa đơn của nhà trọ
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Tổng hóa đơn</span>
            <div className="stat-icon primary">📋</div>
          </div>
          <div className="stat-value">{totalInvoices}</div>
          <div className="stat-change">Hóa đơn đã tạo</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Tổng doanh thu</span>
            <div className="stat-icon success">💰</div>
          </div>
          <div className="stat-value">{format(totalRevenue)} ₫</div>
          <div className="stat-change positive">Tổng thu nhập</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Hóa đơn tháng này</span>
            <div className="stat-icon info">📅</div>
          </div>
          <div className="stat-value">{thisMonthInvoices.length}</div>
          <div className="stat-change">Hóa đơn trong tháng</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Doanh thu tháng này</span>
            <div className="stat-icon warning">📊</div>
          </div>
          <div className="stat-value">{format(thisMonthRevenue)} ₫</div>
          <div className="stat-change positive">Thu nhập tháng này</div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📄 Danh sách hóa đơn</h3>
        </div>
        <div className="card-body p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Ngày tạo</th>
                  <th>Tên phòng</th>
                  <th>Người thuê</th>
                  <th>Tiền phòng</th>
                  <th>Tiền điện</th>
                  <th>Tiền nước</th>
                  <th>Tổng tiền</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pageInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8">
                      <div className="text-6xl mb-4">📄</div>
                      <div className="text-xl font-bold mb-2">Chưa có hóa đơn nào</div>
                      <div className="text-muted">Bắt đầu tạo hóa đơn đầu tiên</div>
                    </td>
                  </tr>
                ) : (
                  pageInvoices.map((row) => (
                    <tr key={row.id_invoice} className="fade-in">
                      <td>
                        <div className="text-sm text-muted">
                          {new Date(row.created_at).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-xs text-muted">
                          {new Date(row.created_at).toLocaleTimeString('vi-VN')}
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold">{row.room_name}</div>
                      </td>
                      <td>
                        <div className="font-medium">{row.roomer}</div>
                        <div className="text-sm text-muted">{row.phone_number}</div>
                      </td>
                      <td>
                        <div className="font-semibold text-success">{format(row.room_price || 0)} ₫</div>
                      </td>
                      <td>
                        <div className="font-semibold">{format(row.total_electric_use || 0)} kWh</div>
                        <div className="text-sm text-muted">{format(row.number_price || 0)} ₫</div>
                      </td>
                      <td>
                        <div className="font-semibold">{format(row.total_water_use || 0)} người </div>
                        <div className="text-sm text-muted">{format(row.total_water_price || 0)} ₫</div>
                      </td>
                      <td>
                        <div className="font-extrabold text-xl text-danger">{format(row.total_amount)} ₫</div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link 
                            to={`/app/homes/${accountId}/${homeId}/invoices/${row.id_invoice}`} 
                            className="btn btn-primary btn-sm"
                          >
                            👁️ Xem
                          </Link>
                          <button 
                            onClick={async () => { 
                              if (confirm('Bạn có chắc muốn xóa hóa đơn này?')) {
                                await supabase.from('Invoice').delete().eq('id_invoice', row.id_invoice); 
                                load(); 
                              }
                            }} 
                            className="btn btn-danger btn-sm"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination footer */}
          <div className="flex items-center justify-between p-4">
            <div className="text-sm text-muted">
              Hiển thị {invoices.length === 0 ? 0 : startIdx + 1}-{endIdx} trên {invoices.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-secondary btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                ◀ Trước
              </button>
              <div className="text-sm font-semibold">
                Trang {currentPage}/{totalPages}
              </div>
              <button
                className="btn btn-secondary btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau ▶
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


