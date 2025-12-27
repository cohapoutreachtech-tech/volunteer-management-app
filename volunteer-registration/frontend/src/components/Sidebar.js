import React from 'react';
import cohapLogo from '../assets/cohap.png';
import '../styles/Sidebar.css';

const Sidebar = ({ currentPage, setCurrentPage }) => {
  const menuItems = [
    { name: 'Dashboard', icon: 'dashboard' },
    { name: 'Volunteers', icon: 'volunteers' },
    { name: 'Events', icon: 'events' },
    { name: 'Pending Approvals', icon: 'pending' },
    { name: 'Approved Hours', icon: 'approved' },
    { name: 'Announcements', icon: 'announcements' },
    { name: 'Reports', icon: 'reports' },
  ];

  const bottomItems = [
    { name: 'Users', icon: 'users' },
    { name: 'Logout', icon: 'logout' },
  ];

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    
    // Redirect to homepage
    window.location.href = 'http://localhost:3000/';
  };

  const handleMenuClick = (itemName) => {
    if (itemName === 'Logout') {
      handleLogout();
    } else {
      setCurrentPage(itemName);
    }
  };

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'dashboard':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        );
      case 'volunteers':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        );
      case 'events':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        );
      case 'pending':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        );
      case 'approved':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case 'announcements':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        );
      case 'reports':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        );
      case 'users':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <polyline points="17 11 19 13 23 9"></polyline>
          </svg>
        );
      case 'logout':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="sidebar">
      <div className="logo-container">
        <img src={cohapLogo} alt="COHAP Logo" className="logo" />
      </div>
      
      <nav className="nav-menu">
        {menuItems.map((item) => (
          <button
            key={item.name}
            className={`nav-item ${currentPage === item.name ? 'active' : ''}`}
            onClick={() => handleMenuClick(item.name)}
          >
            <span className="nav-icon">{getIcon(item.icon)}</span>
            <span className="nav-text">{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="nav-bottom">
        {bottomItems.map((item) => (
          <button
            key={item.name}
            className={`nav-item ${currentPage === item.name ? 'active' : ''}`}
            onClick={() => handleMenuClick(item.name)}
          >
            <span className="nav-icon">{getIcon(item.icon)}</span>
            <span className="nav-text">{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;