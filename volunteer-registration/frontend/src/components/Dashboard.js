import React from 'react';
import StatCard from './StatCard';
import useDashboardData from '../hooks/useDashboardData';
import '../styles/Dashboard.css';

const Dashboard = ({ setCurrentPage }) => {
  const { stats } = useDashboardData();

  const quickActions = [
    {
      title: 'Create Event',
      description: 'Add a new volunteer event',
      icon: 'event',
      action: () => setCurrentPage('Events'),
      color: '#5145cd'
    },
    {
      title: 'Approve Hours',
      description: 'Review pending hour submissions',
      icon: 'approve',
      action: () => setCurrentPage('Pending Approvals'),
      color: '#10b981'
    },
    {
      title: 'View Volunteers',
      description: 'Manage volunteer profiles',
      icon: 'volunteers',
      action: () => setCurrentPage('Volunteers'),
      color: '#f59e0b'
    }
  ];

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'event':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        );
      case 'approve':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case 'volunteers':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard">
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <section className="dashboard-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions-vertical">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="quick-action-card"
              onClick={action.action}
              style={{ '--action-color': action.color }}
            >
              <div className="action-icon" style={{ background: action.color }}>
                {getIcon(action.icon)}
              </div>
              <div className="action-content">
                <h3 className="action-title">{action.title}</h3>
                <p className="action-description">{action.description}</p>
              </div>
              <div className="action-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;