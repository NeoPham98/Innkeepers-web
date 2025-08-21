import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <figure className="not-found-figure">
          <h1 className="not-found-title">404</h1>
          <img
            className="not-found-image"
            height={300}
            width={500}
            src={'https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif'}
            alt="not-found"
          />
          <div className="not-found-overlay">
            <span className="not-found-message">Trang bạn đang tìm kiếm không tồn tại!</span>
            <div className="not-found-actions">
              <Link to="/" className="btn btn-outline">Về trang chủ</Link>
              <Link to="/login" className="btn btn-primary">Đăng nhập</Link>
            </div>
          </div>
        </figure>
      </div>
    </div>
  );
};


