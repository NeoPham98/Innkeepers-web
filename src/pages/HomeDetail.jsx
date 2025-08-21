import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

export const HomeDetail = () => {
  const { accountId, homeId } = useParams();
  const navigate = useNavigate();
  const [home, setHome] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data: homes } = await supabase.from('Home').select('*').eq('id_home', homeId).limit(1);
      setHome(homes?.[0] || null);
      const { data: rs } = await supabase.from('Rooms').select('*').eq('id_home', homeId);
      setRooms(rs || []);
      if (homes?.[0]) {
        await supabase
          .from('Home')
          .update({ room_total: (rs || []).length, room_total_empty: (rs || []).filter(r => r.is_active === false).length })
          .eq('id_home', homeId);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [homeId]);

  const format = (n) => new Intl.NumberFormat('vi-VN').format(Number(n || 0));

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
        <h1 className="page-title">{home?.home_name || 'Chi tiết nhà trọ'}</h1>
        <p className="page-subtitle">
          Quản lý phòng và thông tin chi tiết của nhà trọ
        </p>
      </div>

      {/* Home Info Card */}
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">🏠 Thông tin nhà trọ</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-2 gap-6">
            <div>
              <div className="text-sm text-muted mb-1">Tên nhà trọ</div>
              <div className="text-xl font-bold">{home?.home_name}</div>
            </div>
            <div>
              <div className="text-sm text-muted mb-1">Địa chỉ</div>
              <div className="text-lg">{home?.home_address}</div>
            </div>
            <div>
              <div className="text-sm text-muted mb-1">Tổng số phòng</div>
              <div className="text-2xl font-bold text-primary">{home?.room_total || 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted mb-1">Phòng trống</div>
              <div className="text-2xl font-bold text-warning">{home?.room_total_empty || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <h2 className="text-2xl font-bold">Danh sách phòng</h2>
          <span className="text-muted">({rooms.length} phòng)</span>
        </div>
        <div className="toolbar-right">
          <Link to={`/app/homes/${accountId}/${homeId}/rooms/new`} className="btn btn-primary btn-lg">
            <span>➕</span>
            Thêm phòng mới
          </Link>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-2">
        {rooms.map((room, index) => (
          <div key={room.id_room} className="card fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="card-title">{room.room_name}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/app/homes/${accountId}/${homeId}/rooms/${room.id_room}/edit`)} 
                    className="btn btn-secondary btn-sm"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={async () => { 
                      if (confirm('Bạn có chắc muốn xóa phòng này?')) {
                        await supabase.from('Rooms').delete().eq('id_room', room.id_room); 
                        load(); 
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
              <div className="grid grid-2 gap-4 mb-6">
                <div>
                  <div className="text-sm text-muted">Người thuê</div>
                  <div className="font-semibold">{room.roomer || 'Chưa có'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted">Số người</div>
                  <div className="font-semibold">{room.quantity || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted">Số điện thoại</div>
                  <div className="font-semibold">{room.phone_number || 'Chưa có'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted">Ngày bắt đầu thuê</div>
                  <div className="font-semibold">
                    {room.rental_date ? new Date(room.rental_date).toLocaleDateString('vi-VN') : 'Chưa có'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-tertiary rounded-xl mb-6">
                <div>
                  <div className="text-sm text-muted">Giá phòng</div>
                  <div className="font-bold text-2xl text-success">{format(room.room_price)} ₫</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted">Trạng thái</div>
                  <div className={`font-bold text-lg ${room.is_active ? 'text-success' : 'text-danger'}`}>
                    {room.is_active ? 'Hoạt động' : 'Không hoạt động'}
                  </div>
                </div>
              </div>
            </div>
            <div className="card-footer">
              <Link 
                to={`/app/homes/${accountId}/${homeId}/invoices/new?roomId=${room.id_room}`} 
                className={`btn w-full ${room.is_active ? 'btn-primary' : 'btn-secondary'}`}
                style={{ opacity: room.is_active ? 1 : 0.5, pointerEvents: room.is_active ? 'auto' : 'none' }}
              >
                📄 Tạo hóa đơn
              </Link>
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="card text-center fade-in">
          <div className="card-body p-12">
            <div className="text-8xl mb-6">🚪</div>
            <h3 className="text-2xl font-bold mb-4">Chưa có phòng nào</h3>
            <p className="text-muted text-lg mb-8 max-w-md mx-auto">
              Bắt đầu quản lý bằng cách thêm phòng đầu tiên vào nhà trọ
            </p>
            <Link to={`/app/homes/${accountId}/${homeId}/rooms/new`} className="btn btn-primary btn-lg">
              <span>➕</span>
              Thêm phòng đầu tiên
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};


