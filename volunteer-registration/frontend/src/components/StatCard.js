import React from 'react';
import '../styles/StatCard.css';

const StatCard = ({ title, value, subtitle, icon, isPercentage }) => {
  const getIcon = () => {
    switch (icon) {
      case 'users':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        );
      case 'clock':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        );
      case 'trending':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        <span className="stat-icon">{getIcon()}</span>
      </div>
      <div className="stat-content">
        {isPercentage ? (
          <div className="percentage-container">
            <svg className="percentage-circle" width="60" height="60">
              <circle cx="30" cy="30" r="25" fill="none" stroke="#e5e7eb" strokeWidth="4"></circle>
              <circle cx="30" cy="30" r="25" fill="none" stroke="#4f46e5" strokeWidth="4" strokeDasharray="157" strokeDashoffset="0"></circle>
            </svg>
            <span className="percentage-text">{value}</span>
          </div>
        ) : (
          <div className="stat-value">{value}</div>
        )}
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
};

export default StatCard;