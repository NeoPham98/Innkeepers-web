import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip,
} from 'chart.js';
import { supabase } from '../lib/supabase.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip);

export const Chart = () => {
  const { homeId } = useParams();
  const [year, setYear] = useState(new Date().getFullYear());
  const [series, setSeries] = useState(Array(12).fill(0));
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('Invoice')
        .select('*')
        .eq('id_home', homeId)
        .gte('created_at', `${year}-01-01`)
        .lte('created_at', `${year}-12-31`);
      const monthly = Array(12).fill(0);
      (data || []).forEach((row) => { const m = new Date(row.created_at).getMonth(); monthly[m] += Number(row.total_amount || 0); });
      setSeries(monthly);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [homeId, year]);

  const labels = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n));

  const totalRevenue = series.reduce((a,b) => a+b, 0);
  const avgRevenue = totalRevenue / 12;
  const maxMonth = series.indexOf(Math.max(...series)) + 1;
  const minMonth = series.indexOf(Math.min(...series)) + 1;

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
        <h1 className="page-title">Báo cáo doanh thu</h1>
        <p className="page-subtitle">
          Phân tích và theo dõi doanh thu theo thời gian
        </p>
      </div>



      {/* Statistics Cards */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Tổng doanh thu năm</span>
            <div className="stat-icon success">💰</div>
          </div>
          <div className="stat-value">{fmt(totalRevenue)} ₫</div>
          <div className="stat-change positive">Năm {year}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Doanh thu trung bình</span>
            <div className="stat-icon info">📊</div>
          </div>
          <div className="stat-value">{fmt(avgRevenue)} ₫</div>
          <div className="stat-change">Mỗi tháng</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Tháng cao nhất</span>
            <div className="stat-icon warning">📈</div>
          </div>
          <div className="stat-value">Tháng {maxMonth}</div>
          <div className="stat-change positive">{fmt(series[maxMonth - 1])} ₫</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Tháng thấp nhất</span>
            <div className="stat-icon danger">📉</div>
          </div>
          <div className="stat-value">Tháng {minMonth}</div>
          <div className="stat-change">{fmt(series[minMonth - 1])} ₫</div>
        </div>
      </div>

            {/* Year Selector */}
            <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">📊 Biểu đồ doanh thu năm {year}</h3>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-center gap-6 mb-8">
            <button 
              onClick={() => setYear((y) => y - 1)} 
              className="btn btn-secondary"
            >
              ◀ Năm trước
            </button>
            <div className="text-2xl font-bold text-primary">{year}</div>
            <button 
              onClick={() => setYear((y) => y + 1)} 
              className="btn btn-secondary"
            >
              Năm sau ▶
            </button>
          </div>

          <div className="chart-container" style={{ height: '400px', position: 'relative' }}>
            <Line
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                  legend: { display: false }, 
                  tooltip: { 
                    callbacks: { 
                      label: (ctx) => ` ${fmt(Number(ctx.raw))} ₫` 
                    } 
                  } 
                },
                scales: { 
                  y: { 
                    ticks: { 
                      callback: (v) => {
                        const value = Number(v);
                        if (value >= 1000000) return `${(value/1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${Math.round(value/1000)}K`;
                        return String(Math.round(value));
                      } 
                    } 
                  } 
                }
              }}
              data={{ 
                labels, 
                datasets: [{ 
                  data: series, 
                  borderColor: '#6366f1', 
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  pointBackgroundColor: '#818cf8', 
                  pointBorderColor: '#6366f1',
                  pointBorderWidth: 2,
                  pointRadius: 6,
                  tension: 0.35,
                  fill: true
                }] 
              }}
            />
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📅 Chi tiết theo tháng</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-4 gap-4">
            {series.map((amount, index) => (
              <div key={index} className="text-center p-4 bg-tertiary rounded-xl">
                <div className="text-sm text-muted mb-1">Tháng {index + 1}</div>
                <div className="font-bold text-lg text-primary">{fmt(amount)} ₫</div>
                <div className="text-xs text-muted">
                  {amount > 0 ? `${((amount / totalRevenue) * 100).toFixed(1)}%` : '0%'} của năm
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

