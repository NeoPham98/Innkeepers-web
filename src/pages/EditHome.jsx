import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

export const EditHome = () => {
  const { accountId, homeId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    homeName: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('Home').select('*').eq('id_home', homeId).single();
      if (data) {
        setFormData({
          homeName: data.home_name || '',
          address: data.home_address || ''
        });
      }
    })();
  }, [homeId]);

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
      const { error } = await supabase
        .from('Home')
        .update({ 
          home_name: formData.homeName, 
          home_address: formData.address 
        })
        .eq('id_home', homeId);
      if (error) throw error;
      navigate(`/app/homes/${accountId}`);
      // Trigger refresh homes in AppShell
      window.dispatchEvent(new CustomEvent('refreshHomes'));
    } catch (e) {
      setError('Cập nhật thất bại: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Chỉnh sửa nhà trọ</h1>
        <p className="page-subtitle">
          Cập nhật thông tin nhà trọ của bạn
        </p>
      </div>

      <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="card-header">
          <h3 className="card-title">✏️ Thông tin nhà trọ</h3>
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
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <span>✅</span>
                  Cập nhật nhà trọ
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


