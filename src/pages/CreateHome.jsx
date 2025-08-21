import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

export const CreateHome = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    homeName: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const save = async () => {
    setError(null);
    if (!formData.homeName || !formData.address) { 
      setError('Vui lòng nhập đầy đủ thông tin bắt buộc'); 
      return; 
    }
    
    try {
      setLoading(true);
      const { error } = await supabase.from('Home').insert({
        home_name: formData.homeName,
        home_address: formData.address,
        id_account: Number(accountId),
      });
      if (error) throw error;
      navigate(`/app/homes/${accountId}`);
      // Trigger refresh homes in AppShell
      window.dispatchEvent(new CustomEvent('refreshHomes'));
    } catch (e) {
      setError('Tạo nhà thất bại: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Tạo nhà trọ mới</h1>
        <p className="page-subtitle">
          Thêm nhà trọ mới vào hệ thống quản lý của bạn
        </p>
      </div>

      <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="card-header">
          <h3 className="card-title">🏗️ Thông tin nhà trọ</h3>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <span className="text-danger">*</span> Tên nhà trọ
              </label>
              <input 
                className="form-input" 
                value={formData.homeName} 
                onChange={(e) => handleChange('homeName', e.target.value)} 
                placeholder="Ví dụ: Nhà trọ Sunshine, Khu trọ ABC..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <span className="text-danger">*</span> Địa chỉ
              </label>
              <input 
                className="form-input" 
                value={formData.address} 
                onChange={(e) => handleChange('address', e.target.value)} 
                placeholder="Ví dụ: 18/158 Trảng Dài, Biên Hòa, Đồng Nai"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-danger rounded-xl text-white mb-6">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-end">
            <button 
              onClick={() => navigate(`/app/homes/${accountId}`)} 
              className="btn btn-secondary"
              disabled={loading}
            >
              ❌ Hủy bỏ
            </button>
            <button 
              onClick={save} 
              disabled={loading} 
              className="btn btn-primary btn-lg"
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Đang tạo...
                </>
              ) : (
                <>
                  <span>✅</span>
                  Tạo nhà trọ
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="card mt-8" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="card-header">
          <h3 className="card-title">💡 Mẹo tạo nhà trọ hiệu quả</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">📝 Đặt tên rõ ràng</h4>
              <p className="text-muted text-sm">
                Đặt tên nhà trọ dễ nhớ và mô tả được đặc điểm nổi bật
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📍 Địa chỉ chi tiết</h4>
              <p className="text-muted text-sm">
                Ghi địa chỉ đầy đủ để người thuê dễ dàng tìm kiếm
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🏗️ Quản lý phòng</h4>
              <p className="text-muted text-sm">
                Thông tin phòng sẽ được cập nhật khi tạo phòng trong nhà trọ
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📊 Theo dõi hiệu quả</h4>
              <p className="text-muted text-sm">
                Hệ thống sẽ tự động tính toán thống kê và báo cáo
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


