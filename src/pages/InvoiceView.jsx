import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

export const InvoiceView = () => {
  const { accountId, homeId, invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState({ electric_price: 0, water_price: 0 });
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // numeric helper
  const toNumber = (v) => {
    const num = typeof v === 'number' ? v : Number(String(v ?? '0').replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('Invoice').select('*').eq('id_invoice', invoiceId).limit(1);
      const row = data?.[0];
      setInvoice(row);
      if (row?.id_home) {
        const { data: setts } = await supabase.from('Setting').select('*').eq('id_home', row.id_home).limit(1);
        if (setts?.[0]) setSettings(setts[0]);
      }
      let ids = [];
      try {
        ids = Array.isArray(row?.service_id) ? row?.service_id : JSON.parse(row?.service_id || '[]');
      } catch {}
      if (ids.length) {
        const { data: sv } = await supabase.from('Service').select('*').in('service_id', ids);
        setServices(sv || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [invoiceId]);

  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(toNumber(n)));

  const deleteInvoice = async () => {
    if (confirm('Bạn có chắc muốn xóa hóa đơn này?')) {
      try {
        await supabase.from('Invoice').delete().eq('id_invoice', invoiceId);
        navigate(`/app/homes/${accountId}/${homeId}/invoices`);
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">Hóa đơn không tồn tại</h1>
        </div>
        <div className="card text-center">
          <div className="card-body p-12">
            <div className="text-8xl mb-6">❌</div>
            <h3 className="text-2xl font-bold mb-4">Không tìm thấy hóa đơn</h3>
            <p className="text-muted text-lg mb-8">
              Hóa đơn này có thể đã bị xóa hoặc không tồn tại
            </p>
            <button 
              onClick={() => navigate(`/app/homes/${accountId}/${homeId}/invoices`)}
              className="btn btn-primary btn-lg"
            >
              ← Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalElectricUsed = toNumber(invoice.total_electric_use || 0) + 
    (invoice.total_bnl_use && invoice.divideByPeople ? 
      toNumber(invoice.total_bnl_use / invoice.divideByPeople * invoice.quantity) : 
      toNumber(invoice.total_bnl_use || 0));

  // BNL breakdown
  const bnlUnitPrice = toNumber(settings.electric_price);
  const bnlRawUse = toNumber(invoice.total_bnl_use || 0);
  const bnlEffectiveUse = invoice.isShared && invoice.divideByPeople
    ? (bnlRawUse / toNumber(invoice.divideByPeople)) * toNumber(invoice.quantity)
    : bnlRawUse;
  const bnlAmount = Math.round(bnlEffectiveUse * bnlUnitPrice);

  // Electric breakdown (only electricity, excluding BNL)
  const electricUnitPrice = toNumber(settings.electric_price);
  const electricUse = toNumber(invoice.total_electric_use || 0);
  const electricAmount = Math.round(electricUse * electricUnitPrice);

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Chi tiết hóa đơn</h1>
        <p className="page-subtitle">
          Hóa đơn phòng {invoice.room_name} - {new Date(invoice.created_at).toLocaleDateString('vi-VN')}
        </p>
      </div>

      {/* Invoice Header */}
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">📄 {invoice.room_name}</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-2 gap-6">
            <div>
              <div className="text-sm text-muted mb-1">Ngày lập hóa đơn</div>
              <div className="font-semibold">
                {new Date(invoice.created_at).toLocaleString('vi-VN')}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted mb-1">Mã hóa đơn</div>
              <div className="font-semibold">#{invoice.id_invoice}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">👤 Thông tin khách hàng</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-2 gap-6">
            <div>
              <div className="text-sm text-muted mb-1">Họ và tên</div>
              <div className="font-bold text-lg">{invoice.roomer}</div>
            </div>
            <div>
              <div className="text-sm text-muted mb-1">Số điện thoại</div>
              <div className="font-semibold">{invoice.phone_number}</div>
            </div>
            <div>
              <div className="text-sm text-muted mb-1">Số người</div>
              <div className="font-semibold">{toNumber(invoice.quantity)} người</div>
            </div>
            <div>
              <div className="text-sm text-muted mb-1">Giá phòng</div>
              <div className="font-bold text-success">{fmt(invoice.room_price)} ₫</div>
            </div>
          </div>
        </div>
      </div>

		{/* Meter Readings + Services Side by Side */}
		<div className="grid grid-2 gap-8 mb-8">
			{/* Left card: Meter readings */}
			<div className="card">
				<div className="card-header">
					<h3 className="card-title">📊 Chỉ số đồng hồ</h3>
				</div>
				<div className="card-body">
					<div className="space-y-8">
						<div>
							<h4 className="font-semibold mb-4 text-primary">⚡ Điện</h4>
							<div className="space-y-3">
								<div className="flex justify-between">
									<span className="text-muted">Số cũ:</span>
									<span className="font-semibold">{toNumber(invoice.old_electric_number) || 0}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted">Số mới:</span>
									<span className="font-semibold">{toNumber(invoice.new_electric_number) || 0}</span>
								</div>
                <div className="flex justify-between border-top pt-2" style={{ borderTop: '1px solid var(--border-light)' }}></div>
								<div className="flex justify-between border-t pt-2">
									<span className="font-semibold">Tiêu thụ:</span>
									<span className="font-bold text-primary">{toNumber(invoice.total_electric_use) || 0} kWh</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted">Đơn giá:</span>
									<span>{fmt(settings.electric_price)} ₫/kWh</span>
								</div>
								<div className="flex justify-between bg-tertiary p-3 rounded-lg">
									<span className="font-semibold">Thành tiền điện:</span>
									<span className="font-bold text-success">{fmt(electricAmount)} ₫</span>
								</div>
							</div>
						</div>
						<div>
							<h4 className="font-semibold mb-4 text-info">💧 Nước</h4>
							<div className="space-y-3">
								<div className="flex justify-between">
									<span className="text-muted">Số lượng (người):</span>
									<span className="font-semibold">{toNumber(invoice.quantity)}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted">Đơn giá:</span>
									<span>{fmt(settings.water_price)} ₫/người</span>
								</div>
								<div className="flex justify-between bg-tertiary p-3 rounded-lg">
									<span className="font-semibold">Thành tiền:</span>
									<span className="font-bold text-success">{fmt(invoice.total_water_price)} ₫</span>
								</div>
							</div>
						</div>
						{toNumber(invoice.total_bnl_use) > 0 && (
							<div>
								<h4 className="font-semibold mb-4 text-warning">🔌 Bình nóng lạnh</h4>
								<div className="space-y-3">
									<div className="flex justify-between">
										<span className="text-muted">Số cũ:</span>
										<span className="font-semibold">{toNumber(invoice.old_bnl) || 0}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted">Số mới:</span>
										<span className="font-semibold">{toNumber(invoice.new_bnl) || 0}</span>
									</div>
									{invoice.isShared && invoice.divideByPeople && (
										<>

											<div className="text-sm text-muted">Chia đầu người: {toNumber(invoice.divideByPeople)} người</div>
										</>
									)}
									<div className="flex justify-between border-top pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
										<span className="font-semibold">Tiêu thụ:</span>
										<span className="font-bold text-warning">{fmt(bnlEffectiveUse)} kWh</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted">Đơn giá:</span>
										<span>{fmt(bnlUnitPrice)} ₫/kWh</span>
									</div>
									<div className="flex justify-between bg-tertiary p-3 rounded-lg">
										<span className="font-semibold">Thành tiền BNL:</span>
										<span className="font-bold text-success">{fmt(bnlAmount)} ₫</span>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
			{/* Right card: Services used */}
			<div className="card">
				<div className="card-header">
					<h3 className="card-title">🔧 Dịch vụ sử dụng</h3>
				</div>
				<div className="card-body">
					<div className="space-y-4">
						{services.map((service) => (
							<div key={service.service_id} className="flex justify-between items-center p-4 bg-tertiary rounded-xl">
								<div>
									<div className="font-semibold">{service.service_name}</div>
									<div className="text-sm text-muted">Dịch vụ bổ sung</div>
								</div>
								<div className="font-bold text-success">{fmt(service.service_price)} ₫</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>

      {/* Summary */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">💰 Tổng kết thanh toán</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted">Tiền phòng:</span>
              <span className="font-semibold">{fmt(invoice.room_price)} ₫</span>
            </div>
            <div className="flex justify-between border-top pt-2" style={{ borderTop: '1px solid var(--border-light)' }}></div>
            <div className="flex justify-between items-center">
              <span className="text-muted">Tiền điện:</span>
              <span className="font-semibold">{fmt(electricAmount)} ₫</span>
            </div>
            <div className="flex justify-between border-top pt-2" style={{ borderTop: '1px solid var(--border-light)' }}></div>
            <div className="flex justify-between items-center">
              <span className="text-muted">Tiền nước:</span>
              <span className="font-semibold">{fmt(invoice.total_water_price)} ₫</span>
            </div>
            <div className="flex justify-between border-top pt-2" style={{ borderTop: '1px solid var(--border-light)' }}></div>
            {toNumber(invoice.total_bnl_use) > 0 && (
              <>
              <div className="flex justify-between items-center">
                <span className="text-muted">Tiền bình nóng lạnh:</span>
                <span className="font-semibold">{fmt(bnlAmount)} ₫</span>
              </div>
              <div className="flex justify-between border-top pt-2" style={{ borderTop: '1px solid var(--border-light)' }}></div>
              </>
              
              
            )}
            
            {services.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-muted">Dịch vụ:</span>
                <span className="font-semibold">
                  {fmt(services.reduce((sum, s) => sum + toNumber(s.service_price), 0))} ₫
                </span>
              </div>
            )}
            <div className="flex justify-between border-top pt-2" style={{ borderTop: '1px solid var(--border-light)' }}></div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Tổng cộng:</span>
                <span className="text-2xl font-bold text-success">{fmt(invoice.total_amount)} ₫</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


