import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Volunteers from './Volunteers';
import Events from './Events';
import ApprovedHours from './ApprovedHours';
import Announcements from './Announcements';
import PendingApprovals from './PendingApprovals';
import Reports from './Reports';
import '../styles/Layout.css';

const Layout = () => {
  const [currentPage, setCurrentPage] = useState('Dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'Dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'Volunteers':
        return <Volunteers />;
      case 'Events':
        return <Events />;
      case 'Approved Hours':
        return <ApprovedHours />;
      case 'Pending Approvals':
        return <PendingApprovals />;
      case 'Announcements':
        return <Announcements />;
      case 'Reports':
        return <Reports />;
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="layout">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="main-content">
        <header className="header">
          <div className="header-right">
            <button className="notification-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>
            <div className="user-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
        </header>
        {renderPage()}
      </div>
    </div>
  );
};

export default Layout;