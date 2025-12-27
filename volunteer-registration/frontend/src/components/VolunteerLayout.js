import React, { useState } from 'react';
import VolunteerSidebar from './VolunteerSidebar';
import VolunteerDashboard from './VolunteerDashboard';
import ClockInHours from './ClockInHours';
import VolunteerAnnouncements from './VolunteerAnnouncements';
import VolunteerProfile from './VolunteerProfile';
import '../styles/VolunteerLayout.css';

const VolunteerLayout = () => {
  const [currentPage, setCurrentPage] = useState('Dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'Dashboard':
        return <VolunteerDashboard />;
      case 'Clock In Hours':
        return <ClockInHours />;
      case 'Announcements':
        return <VolunteerAnnouncements />;
      case 'Profile':
        return <VolunteerProfile />;
      default:
        return <VolunteerDashboard />;
    }
  };

  return (
    <div className="volunteer-layout">
      <VolunteerSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="volunteer-main-content">
        <header className="volunteer-header">
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

export default VolunteerLayout;