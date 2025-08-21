import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

export const CreateInvoice = () => {
  const { accountId, homeId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const roomId = params.get('roomId');

  const [room, setRoom] = useState(null);
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState({});
  const [servicePrices, setServicePrices] = useState({});
  const [electricPrice, setElectricPrice] = useState(0);
  const [waterPrice, setWaterPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  const [oldE, setOldE] = useState('');
  const [newE, setNewE] = useState('');
  const [oldW, setOldW] = useState('');
  const [newW, setNewW] = useState('');
  const [oldBNL, setOldBNL] = useState('');
  const [newBNL, setNewBNL] = useState('');
  const [shareBNL, setShareBNL] = useState(false);
  const [divideBy, setDivideBy] = useState('');

  // Ensure numeric coercion everywhere
  const toNumber = (v) => {
    const num = typeof v === 'number' ? v : Number(String(v ?? '0').replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const load = async () => {
    const { data: roomData } = await supabase.from('Rooms').select('*').eq('id_room', roomId).limit(1);
    setRoom(roomData?.[0]);
    const { data: sv } = await supabase.from('Service').select('*').eq('id_home', homeId);
    setServices(sv || []);
    const { data: setts } = await supabase.from('Setting').select('*').eq('id_home', homeId).limit(1);
    if (setts?.[0]) { setElectricPrice(toNumber(setts[0].electric_price || 0)); setWaterPrice(toNumber(setts[0].water_price || 0)); }
  };

  const fetchLatestInvoice = async () => {
    if (!roomId) return;
    const { data } = await supabase
      .from('Invoice')
      .select('*')
      .eq('id_room', roomId)
      .order('created_at', { ascending: false })
      .limit(1);
    const last = data?.[0];
    if (last) {
      setOldE(String(last.new_electric_number || ''));
      setOldBNL(String(last.new_bnl || ''));
      let ids = [];
      try {
        ids = Array.isArray(last.service_id) ? last.service_id : JSON.parse(last.service_id || '[]');
      } catch {}
      const map = {};
      const prices = {};
      ids.forEach((id) => {
        map[id] = true;
        const s = (services || []).find((x) => x.service_id === id);
        if (s) prices[id] = toNumber(s.service_price);
      });
      setSelected(map);
      setServicePrices(prices);
    }
  };

  useEffect(() => { load(); }, [homeId, roomId]);
  useEffect(() => { if (services.length) fetchLatestInvoice(); }, [services]);

  const num = (val) => toNumber(val);
  const calcE = () => num(newE) - num(oldE);
  const calcW = () => num(newW) - num(oldW);
  const calcBNL = () => num(newBNL) - num(oldBNL);
  const totalElectric = calcE() * num(electricPrice);
  const waterQty = num(room?.quantity || 0);
  const totalWater = waterQty * num(waterPrice);
  const bnlEffectiveUse = shareBNL && num(divideBy) > 0
    ? (calcBNL() / num(divideBy)) * num(room?.quantity || 1)
    : calcBNL();
  const totalBNL = bnlEffectiveUse * num(electricPrice);
  const totalServices = Object.keys(selected).reduce((sum, id) => selected[Number(id)] ? sum + num(servicePrices[Number(id)] || (services.find(s => s.service_id === Number(id))?.service_price || 0)) : sum, 0);
  const total = Math.floor(num(totalElectric) + num(totalWater) + num(totalBNL) + num(room?.room_price || 0) + num(totalServices));

  const save = async () => {
    if (!room) return;
    setLoading(true);
    try {
      const serviceIds = Object.keys(selected).filter((id) => selected[Number(id)]).map((x) => Number(x));
      const row = {
        id_room: room.id_room,
        created_at: new Date().toISOString(),
        roomer: room.roomer,
        phone_number: room.phone_number,
        new_water_number: num(newW),
        old_water_number: num(oldW),
        quantity: num(room.quantity),
        total_water_use: waterQty,
        total_water_price: totalWater,
        new_electric_number: num(newE),
        old_electric_number: num(oldE),
        total_electric_use: calcE(),
        old_bnl: num(oldBNL),
        new_bnl: num(newBNL),
        total_bnl_use: calcBNL(),
        service_id: serviceIds,
        room_price: num(room.room_price),
        total_amount: total,
        room_name: room.room_name,
        id_home: Number(homeId),
        number_electric: calcE() + bnlEffectiveUse,
        number_price: Math.floor(num(totalElectric) + num(totalBNL)),
        isShared: shareBNL,
        divideByPeople: shareBNL ? num(divideBy) : null,
      };
      await supabase.from('Invoice').insert(row);
      try { sessionStorage.setItem('flashSuccess', 'Tạo hóa đơn thành công'); } catch {}
      navigate(`/app/homes/${accountId}/${homeId}/invoices`, { state: { flashSuccess: 'Tạo hóa đơn thành công' } });
    } catch (error) {
      console.error('Error creating invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const format = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(num(n)));

  if (!room) {
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
        <h1 className="page-title">Tạo hóa đơn mới</h1>
        <p className="page-subtitle">
          Tạo hóa đơn cho phòng {room.room_name}
        </p>
      </div>

      <div className="card" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div className="card-header">
          <h3 className="card-title">📄 {room.room_name}</h3>
        </div>
        <div className="card-body">
          {/* Room Info */}
          <div className="grid grid-2 gap-6 mb-8">
            <div>
              <div className="text-sm text-muted mb-1">Người thuê</div>
              <div className="font-semibold">{room.roomer}</div>
            </div>
            <div>
              <div className="text-sm text-muted mb-1">Số điện thoại</div>
              <div className="font-semibold">{room.phone_number}</div>
            </div>
            <div>
              <div className="text-sm text-muted mb-1">Giá phòng</div>
              <div className="font-bold text-success">{format(room.room_price)} ₫</div>
            </div>
            <div>
              <div className="text-sm text-muted mb-1">Số người</div>
              <div className="font-semibold">{num(room.quantity)} người</div>
            </div>
          </div>

          {/* Meter Readings */}
          <div className="form-group">
            <label className="form-label">📊 Chỉ số đồng hồ</label>
            <div className="grid grid-3 gap-6">
              <div>
                <label className="form-label">Số điện cũ</label>
                <input className="form-input" value={oldE} onChange={(e) => setOldE(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
              </div>
              <div>
                <label className="form-label">Số nước cũ</label>
                <input className="form-input" value={oldW} onChange={(e) => setOldW(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
              </div>
              <div>
                <label className="form-label">Số BNL cũ</label>
                <input className="form-input" value={oldBNL} onChange={(e) => setOldBNL(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="grid grid-3 gap-6">
              <div>
                <label className="form-label">Số điện mới</label>
                <input className="form-input" value={newE} onChange={(e) => setNewE(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
              </div>
              <div>
                <label className="form-label">Số nước mới</label>
                <input className="form-input" value={newW} onChange={(e) => setNewW(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
              </div>
              <div>
                <label className="form-label">Số BNL mới</label>
                <input className="form-input" value={newBNL} onChange={(e) => setNewBNL(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
              </div>
            </div>
          </div>

          {/* BNL Sharing */}
          <div className="form-group">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={shareBNL} 
                  onChange={(e) => setShareBNL(e.target.checked)} 
                  className="form-checkbox"
                />
                <span>Chia đầu người cho BNL</span>
              </label>
              {shareBNL && (
                <input 
                  className="form-input" 
                  value={divideBy} 
                  onChange={(e) => setDivideBy(e.target.value.replace(/[^0-9]/g, ''))} 
                  placeholder="Nhập số người để chia" 
                  style={{ maxWidth: 220 }} 
                />
              )}
            </div>
          </div>

          {/* Services */}
          {services.length > 0 && (
            <div className="form-group">
              <label className="form-label">🔧 Dịch vụ thêm</label>
              <div className="grid grid-2 gap-4">
                {services.map((s) => (
                  <div key={s.service_id} className="flex items-center gap-4 p-4 bg-tertiary rounded-xl">
                    <input 
                      type="checkbox" 
                      checked={!!selected[s.service_id]} 
                      onChange={() => setSelected((prev) => ({ ...prev, [s.service_id]: !prev[s.service_id] }))} 
                      className="form-checkbox"
                    />
                    <span className="font-semibold flex-1">{s.service_name}</span>
                    <span className="font-bold text-success">
                      {format(servicePrices[s.service_id] ?? s.service_price)} ₫
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calculation Table */}
          <div className="form-group">
            <label className="form-label">💰 Bảng tính giá tiền</label>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th className="text-left">Hạng mục</th>
                    <th className="text-center">Số lượng</th>
                    <th className="text-center">Đơn giá</th>
                    <th className="text-center">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Tiền điện</td>
                    <td className="text-center">{calcE()}</td>
                    <td className="text-center">{format(electricPrice)} ₫</td>
                    <td className="text-center font-semibold">{format(totalElectric)} ₫</td>
                  </tr>
                  <tr>
                    <td>Tiền BNL</td>
                    <td className="text-center">{shareBNL && num(divideBy) ? (calcBNL() / num(divideBy) * num(room?.quantity || 1)) : calcBNL()}</td>
                    <td className="text-center">{format(electricPrice)} ₫</td>
                    <td className="text-center font-semibold">{format(totalBNL)} ₫</td>
                  </tr>
                  <tr>
                    <td>Tiền nước</td>
                    <td className="text-center">{waterQty}</td>
                    <td className="text-center">{format(waterPrice)} ₫</td>
                    <td className="text-center font-semibold">{format(totalWater)} ₫</td>
                  </tr>
                  <tr>
                    <td>Tiền phòng</td>
                    <td className="text-center">1</td>
                    <td className="text-center">-</td>
                    <td className="text-center font-semibold">{format(room?.room_price || 0)} ₫</td>
                  </tr>
                  <tr>
                    <td>Dịch vụ</td>
                    <td className="text-center">-</td>
                    <td className="text-center">-</td>
                    <td className="text-center font-semibold">{format(totalServices)} ₫</td>
                  </tr>
                  <tr className="bg-tertiary">
                    <td className="font-bold text-danger text-lg">Tổng tiền</td>
                    <td className="text-center">-</td>
                    <td className="text-center">-</td>
                    <td className="text-center font-bold text-success text-xl">{format(total)} ₫</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <button 
              onClick={() => navigate(`/app/homes/${accountId}/${homeId}/invoices`)} 
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
                  Tạo hóa đơn
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


