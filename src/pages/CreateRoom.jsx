import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

export const CreateRoom = () => {
  const { accountId, homeId } = useParams();
  const navigate = useNavigate();
  // Date helpers for dd/mm/yyyy display and ISO storage
  const formatDateToDisplay = (input) => {
    const date = input instanceof Date ? input : new Date(input);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDisplayDateToISO = (str) => {
    const match = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(String(str || ''));
    if (!match) return '';
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDateInput = (value) => {
    const digits = String(value).replace(/[^0-9]/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0,2)}/${digits.slice(2)}`;
    return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`;
  };

  const [formData, setFormData] = useState({
    roomName: '',
    quantity: '',
    roomer: '',
    phoneNumber: '',
    hometown: '',
    cccdNumber: '',
    roomPrice: '',
    deposit: '',
    rentalDate: formatDateToDisplay(new Date()),
    note: '',
    isActive: true,
    frontCardImg: null,
    backCardImg: null,
    contractImg: [null, null]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const formatCurrency = (value) => {
    const numberValue = parseFloat(value.replace(/[.,]/g, ""));
    return isNaN(numberValue) ? "" : new Intl.NumberFormat('vi-VN').format(numberValue);
  };

  const handleCurrencyChange = (field, value) => {
    const formattedValue = formatCurrency(value);
    setFormData(prev => ({ 
      ...prev, 
      [field]: formattedValue
    }));
  };

  const handleImageUpload = async (field, index = null) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (field === 'contractImg') {
            const newContractImages = [...formData.contractImg];
            newContractImages[index] = event.target.result;
            setFormData(prev => ({ ...prev, contractImg: newContractImages }));
          } else {
            setFormData(prev => ({ ...prev, [field]: event.target.result }));
          }
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  const removeImage = (field, index = null) => {
    if (field === 'contractImg') {
      const newContractImages = [...formData.contractImg];
      newContractImages[index] = null;
      setFormData(prev => ({ ...prev, contractImg: newContractImages }));
    } else {
      setFormData(prev => ({ ...prev, [field]: null }));
    }
  };

  const save = async () => {
    setError(null);
    if (!formData.roomName || !formData.quantity || !formData.roomer || !formData.phoneNumber || !formData.roomPrice) { 
      setError('Vui lòng nhập đầy đủ thông tin bắt buộc'); 
      return; 
    }
    try {
      setLoading(true);
      const createdAt = new Date();
      const { error } = await supabase.from('Rooms').insert({
        id_home: Number(homeId),
        room_name: formData.roomName,
        roomer: formData.roomer,
        is_active: formData.isActive,
        phone_number: formData.phoneNumber,
        hometown: formData.hometown,
        cccd_number: formData.cccdNumber,
        rental_date: parseDisplayDateToISO(formData.rentalDate) || new Date().toISOString(),
        note: formData.note,
        deposit: formData.deposit ? Number(formData.deposit.replace(/[.,]/g, '')) : 0,
        room_price: Number(formData.roomPrice.replace(/[.,]/g, '')),
        front_card_img: formData.frontCardImg,
        back_card_img: formData.backCardImg,
        contract_img: JSON.stringify(formData.contractImg),
        quantity: Number(formData.quantity),
        created_at: createdAt.toISOString(),
      });
      if (error) throw error;
      
      // Trigger menu refresh
      window.dispatchEvent(new CustomEvent('refreshHomes'));
      
      navigate(`/app/homes/${accountId}/${homeId}`);
    } catch (e) {
      setError('Tạo phòng thất bại: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Tạo phòng mới</h1>
        <p className="page-subtitle">
          Thêm phòng mới vào nhà trọ và quản lý thông tin người thuê
        </p>
      </div>

      <div className="card" style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="card-header">
          <h3 className="card-title">🚪 Thông tin phòng</h3>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <span className="text-danger">*</span> Tên phòng
              </label>
              <input 
                className="form-input" 
                value={formData.roomName} 
                onChange={(e) => handleChange('roomName', e.target.value)} 
                placeholder="Ví dụ: Phòng 101, Phòng A1..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <span className="text-danger">*</span> Số người
              </label>
              <input 
                type="number"
                className="form-input" 
                value={formData.quantity} 
                onChange={(e) => handleChange('quantity', e.target.value)} 
                placeholder="Ví dụ: 1, 2, 3..."
                min="1"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="text-danger">*</span> Khách thuê
            </label>
            <input 
              className="form-input" 
              value={formData.roomer} 
              onChange={(e) => handleChange('roomer', e.target.value)} 
              placeholder="Ví dụ: Nguyễn Văn A"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <span className="text-danger">*</span> Số điện thoại
              </label>
              <input 
                className="form-input" 
                value={formData.phoneNumber} 
                onChange={(e) => handleChange('phoneNumber', e.target.value)} 
                placeholder="Ví dụ: 0387022221"
              />
            </div>
            <div className="form-group">
              <label className="form-label">CCCD/CMND</label>
              <input 
                className="form-input" 
                value={formData.cccdNumber} 
                onChange={(e) => handleChange('cccdNumber', e.target.value)} 
                placeholder="Ví dụ: 046440849881"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Quê quán / Địa chỉ</label>
            <textarea 
              className="form-textarea" 
              value={formData.hometown} 
              onChange={(e) => handleChange('hometown', e.target.value)} 
              placeholder="Ví dụ: Hà Nội, Quận Ba Đình..."
              rows="3"
            />
          </div>

          {/* Upload ảnh CCCD */}
          <div className="form-group">
            <label className="form-label">📷 Ảnh CCCD</label>
            <div className="grid-2 gap-4">
              <div className="form-group">
                <label className="form-label">Mặt trước</label>
                <div className="image-upload-container">
                  {formData.frontCardImg ? (
                    <div className="image-preview-container">
                      <img 
                        src={formData.frontCardImg} 
                        alt="CCCD mặt trước" 
                        className="image-preview"
                      />
                      <button 
                        onClick={() => removeImage('frontCardImg')}
                        className="image-remove-btn"
                      >
                        ❌
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleImageUpload('frontCardImg')}
                      className="image-upload-btn"
                    >
                      📷 Tải ảnh CCCD mặt trước
                    </button>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Mặt sau</label>
                <div className="image-upload-container">
                  {formData.backCardImg ? (
                    <div className="image-preview-container">
                      <img 
                        src={formData.backCardImg} 
                        alt="CCCD mặt sau" 
                        className="image-preview"
                      />
                      <button 
                        onClick={() => removeImage('backCardImg')}
                        className="image-remove-btn"
                      >
                        ❌
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleImageUpload('backCardImg')}
                      className="image-upload-btn"
                    >
                      📷 Tải ảnh CCCD mặt sau
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Upload ảnh hợp đồng */}
          <div className="form-group">
            <label className="form-label">📄 Ảnh hợp đồng</label>
            <div className="grid-2 gap-4">
              {[0, 1].map((index) => (
                <div key={index} className="form-group">
                  <label className="form-label">Trang {index + 1}</label>
                  <div className="image-upload-container">
                    {formData.contractImg[index] ? (
                      <div className="image-preview-container">
                        <img 
                          src={formData.contractImg[index]} 
                          alt={`Hợp đồng trang ${index + 1}`} 
                          className="image-preview"
                        />
                        <button 
                          onClick={() => removeImage('contractImg', index)}
                          className="image-remove-btn"
                        >
                          ❌
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleImageUpload('contractImg', index)}
                        className="image-upload-btn"
                      >
                        📄 Tải ảnh hợp đồng trang {index + 1}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tiền cọc (₫)</label>
              <input 
                className="form-input" 
                value={formData.deposit} 
                onChange={(e) => handleCurrencyChange('deposit', e.target.value)} 
                placeholder="Ví dụ: 1.000.000"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <span className="text-danger">*</span> Giá phòng (₫/tháng)
              </label>
              <input 
                className="form-input" 
                value={formData.roomPrice} 
                onChange={(e) => handleCurrencyChange('roomPrice', e.target.value)} 
                placeholder="Ví dụ: 1.000.000"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ngày bắt đầu thuê</label>
              <input 
                className="form-input" 
                value={formData.rentalDate} 
                onChange={(e) => handleChange('rentalDate', formatDateInput(e.target.value))} 
                placeholder="dd/mm/yyyy"
              />
            </div>
            <div className="form-group">
              <label className="toggle-label">
                Trạng thái phòng
                <span className={`toggle-status ${formData.isActive ? 'active' : 'inactive'}`}>
                  {formData.isActive ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              </label>
              <div className="toggle-container" style={{ marginTop: '8px' }}>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Ghi chú (tùy chọn)</label>
            <textarea 
              className="form-textarea" 
              value={formData.note} 
              onChange={(e) => handleChange('note', e.target.value)} 
              placeholder="Ví dụ: Ở 2 người, có xe máy, yêu cầu đặc biệt..."
              rows="3"
            />
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
              onClick={() => navigate(`/app/homes/${accountId}/${homeId}`)} 
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
                  Tạo phòng
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


