import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

export const Settings = () => {
  const { homeId } = useParams();
  const [formData, setFormData] = useState({
    electricPrice: '',
    waterPrice: ''
  });
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({
    name: '',
    price: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSettings = async () => {
    const { data } = await supabase.from('Setting').select('*').eq('id_home', homeId).limit(1);
    const settings = data?.[0];
    if (settings) {
      setFormData({
        electricPrice: new Intl.NumberFormat('vi-VN').format(settings.electric_price || 0),
        waterPrice: new Intl.NumberFormat('vi-VN').format(settings.water_price || 0)
      });
    } else {
      await supabase.from('Setting').insert({ id_home: Number(homeId), electric_price: 0, water_price: 0 });
      setFormData({
        electricPrice: '0',
        waterPrice: '0'
      });
    }
  };

  const loadServices = async () => {
    const { data } = await supabase.from('Service').select('*').eq('id_home', homeId);
    setServices(data || []);
  };

  const formatCurrency = (value) => {
    const numberValue = parseFloat(value.replace(/[.,]/g, ""));
    return isNaN(numberValue) ? "" : new Intl.NumberFormat('vi-VN').format(numberValue);
  };

  const handleChange = (field, value) => {
    const formattedValue = formatCurrency(value);
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    setError(null);
  };

  const saveSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      await supabase
        .from('Setting')
        .update({ 
          electric_price: Number(formData.electricPrice.replace(/[.,]/g, '')), 
          water_price: Number(formData.waterPrice.replace(/[.,]/g, '')) 
        })
        .eq('id_home', homeId);
    } catch (e) {
      setError('Cập nhật thất bại: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const addService = async () => {
    if (!newService.name || !newService.price) {
      setError('Vui lòng nhập đầy đủ thông tin dịch vụ');
      return;
    }
    try {
      await supabase.from('Service').insert({ 
        service_name: newService.name, 
        service_price: Number(newService.price.replace(/[.,]/g, '')), 
        id_home: Number(homeId) 
      });
      setNewService({ name: '', price: '' });
      loadServices();
    } catch (e) {
      setError('Thêm dịch vụ thất bại: ' + e.message);
    }
  };

  const deleteService = async (serviceId) => {
    if (confirm('Bạn có chắc muốn xóa dịch vụ này?')) {
      try {
        await supabase.from('Service').delete().eq('service_id', serviceId);
        loadServices();
      } catch (e) {
        setError('Xóa dịch vụ thất bại: ' + e.message);
      }
    }
  };

  useEffect(() => { loadSettings(); loadServices(); }, [homeId]);

  const format = (n) => new Intl.NumberFormat('vi-VN').format(n);

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Cài đặt hệ thống</h1>
        <p className="page-subtitle">
          Cấu hình giá điện, nước và quản lý dịch vụ
        </p>
      </div>

      {/* Price Settings */}
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">⚡ Cài đặt giá mặc định</h3>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Giá điện (₫/kWh)</label>
              <input 
                className="form-input" 
                value={formData.electricPrice} 
                onChange={(e) => handleChange('electricPrice', e.target.value.replace(/[^0-9.,]/g, ''))} 
                placeholder="Ví dụ: 3.000" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Giá nước (₫/m³)</label>
              <input 
                className="form-input" 
                value={formData.waterPrice} 
                onChange={(e) => handleChange('waterPrice', e.target.value.replace(/[^0-9.,]/g, ''))} 
                placeholder="Ví dụ: 15.000" 
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

          <div className="flex justify-end">
            <button 
              onClick={saveSettings} 
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
                  Cập nhật giá
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Services Management */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🔧 Quản lý dịch vụ</h3>
        </div>
        <div className="card-body">
          {/* Add New Service */}
          <div className="form-row mb-8">
            <div className="form-group">
              <label className="form-label">Tên dịch vụ</label>
              <input 
                className="form-input" 
                value={newService.name} 
                onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))} 
                placeholder="Ví dụ: Internet, Vệ sinh, Bảo vệ..." 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Đơn giá (₫)</label>
              <input 
                className="form-input" 
                value={newService.price} 
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.,]/g, '');
                  const formattedValue = formatCurrency(value);
                  setNewService(prev => ({ ...prev, price: formattedValue }));
                }} 
                placeholder="Ví dụ: 100.000" 
              />
            </div>
            <div className="form-group flex items-end">
              <button 
                onClick={addService} 
                className="btn btn-success btn-lg"
              >
                <span>➕</span>
                Thêm dịch vụ
              </button>
            </div>
          </div>

          {/* Services List */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Tên dịch vụ</th>
                  <th>Đơn giá</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center p-8">
                      <div className="text-6xl mb-4">🔧</div>
                      <div className="text-xl font-bold mb-2">Chưa có dịch vụ nào</div>
                      <div className="text-muted">Thêm dịch vụ đầu tiên để sử dụng</div>
                    </td>
                  </tr>
                ) : (
                  services.map((service) => (
                    <tr key={service.service_id} className="fade-in">
                      <td>
                        <div className="font-semibold">{service.service_name}</div>
                      </td>
                      <td>
                        <div className="font-bold text-success">{format(service.service_price)} ₫</div>
                      </td>
                      <td>
                        <button 
                          onClick={() => deleteService(service.service_id)} 
                          className="btn btn-danger btn-sm"
                        >
                          🗑️ Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};


