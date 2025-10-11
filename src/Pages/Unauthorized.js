import React from 'react';
import { Link } from 'react-router-dom';
import './Unauthorized.css';

const Unauthorized = () => {
  return (
    <div className="unauth-container">
      <div className="unauth-box">
        <h1>🚫 403 - Access Denied</h1>
        <p>You don’t have permission to view this page.</p>
        <Link to="/Home" className="back-btn">← Back to Dashboard</Link>
      </div>
    </div>
  );
};

export default Unauthorized;
