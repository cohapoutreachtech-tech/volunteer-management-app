import React, { useState } from 'react';
import '../styles/LandingPage.css';

const LandingPage = ({ onSelectRole }) => {
  const [isFlipping, setIsFlipping] = useState(false);

  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className={`logo-container ${isFlipping ? 'flipping' : ''}`}>
          <img src="/cohap.png" alt="COHAP" className="logo" />
        </div>
        
        <h1 className="landing-title">COHAP Volunteer Management</h1>
        <p className="landing-subtitle">Choose your portal to continue</p>
        
        <div className="portal-options">
          <div className="portal-card" onClick={() => onSelectRole('admin')}>
            <div className="portal-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <h2>Login as Admin</h2>
            <p>Manage volunteers, approve hours, and send announcements</p>
          </div>
          
          <div className="portal-card" onClick={() => onSelectRole('volunteer')}>
            <div className="portal-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h2>Login as Volunteer</h2>
            <p>View your profile, log hours, and check announcements</p>
          </div>
        </div>

        <div className="register-section">
          <div className="register-divider">
            <span>or</span>
          </div>
          <div className="register-card" onClick={() => onSelectRole('register')}>
            <div className="register-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
            </div>
            <div className="register-content">
              <h3>New Volunteers: Register Here</h3>
              <p>Join our community and start making a difference today</p>
            </div>
            <div className="register-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;