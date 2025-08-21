import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Add login-page class to prevent scroll
  useEffect(() => {
    document.body.classList.add('login-page');
    document.documentElement.classList.add('login-page');
    document.getElementById('root')?.classList.add('login-page');
    
    return () => {
      document.body.classList.remove('login-page');
      document.documentElement.classList.remove('login-page');
      document.getElementById('root')?.classList.remove('login-page');
    };
  }, []);

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) { 
      setError('Vui lòng nhập đầy đủ Tài khoản và Mật khẩu'); 
      return; 
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Account')
        .select('*')
        .eq('email', email)
        .eq('password', password);
      if (error) throw error;
      if (data && data.length > 0) {
        const user = data[0];
        try { sessionStorage.setItem('authAccountId', String(user.id_account)); } catch {}
        navigate(`/app/homes/${user.id_account}`);
      } else {
        setError('Tài khoản hoặc Mật khẩu không chính xác');
      }
    } catch (e) {
      setError('Có lỗi xảy ra khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      {/* Background Pattern */}
      <div className="login-background">
        <div className="login-pattern"></div>
      </div>
      
      {/* Main Content */}
      <div className="login-content">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="login-logo">
              <div className="logo-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <h1 className="login-title">Chủ Trọ</h1>
            <p className="login-subtitle">Quản lý nhà trọ thật dễ dàng</p>
          </div>

          {/* Form */}
          <div className="login-form">
            <div className="form-group">
              <label className="form-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Email
              </label>
              <div className="input-group">
                <input 
                  className="form-input" 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập email của bạn"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Mật khẩu
              </label>
              <div className="input-group">
                <input 
                  className="form-input" 
                  type={showPassword ? "text" : "password"}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập mật khẩu"
                />
                <button 
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2 16 2 12C2 8 7 4 12 4C16 4 20 8 20 12C20 16 17.94 17.94 17.94 17.94Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4C16 4 20 8 20 12C20 16 17.94 17.94 17.94 17.94" stroke="currentColor" strokeWidth="2"/>
                      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" stroke="currentColor" strokeWidth="2"/>
                      <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                  <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {error}
              </div>
            )}

            <button 
              onClick={handleLogin} 
              disabled={loading} 
              className="login-button"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="10,17 15,12 10,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Đăng nhập
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <p>Hệ thống quản lý nhà trọ thông minh</p>
          </div>
        </div>
      </div>
    </div>
  );
};


