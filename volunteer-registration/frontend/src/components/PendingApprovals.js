import React, { useState } from 'react';
import '../styles/PendingApprovals.css';

const PendingApprovals = () => {
  const [pendingHours, setPendingHours] = useState([
    {
      id: 1,
      volunteer: 'Max Stevens',
      date: '2025-10-15',
      hours: 4.5,
      activity: 'Food Distribution',
      status: 'Pending'
    },
    {
      id: 2,
      volunteer: 'Steven Hicks',
      date: '2025-10-14',
      hours: 3.0,
      activity: 'Community Outreach',
      status: 'Pending'
    },
    {
      id: 3,
      volunteer: 'Kyle Klein',
      date: '2025-10-13',
      hours: 5.5,
      activity: 'Event Setup',
      status: 'Pending'
    },
    {
      id: 4,
      volunteer: 'Max Stevens',
      date: '2025-10-12',
      hours: 2.0,
      activity: 'Administrative Support',
      status: 'Pending'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const handleApprove = (id) => {
    console.log(`Approved submission ${id}`);
  };

  const handleReject = (id) => {
    console.log(`Rejected submission ${id}`);
  };

  const handleEdit = (id) => {
    console.log(`Edit submission ${id}`);
  };

  return (
    <div className="pending-approvals-page">
      <div className="page-header">
        <h1 className="page-title">Pending Approvals</h1>
        <div className="header-info">
          <span className="pending-count">{pendingHours.length} submissions pending</span>
        </div>
      </div>

      <div className="search-filter-bar">
        <div className="search-container">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Search by volunteer or activity"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="approvals-grid">
        {pendingHours.map((submission) => (
          <div key={submission.id} className="approval-card">
            <div className="card-header">
              <div className="volunteer-info">
                <h3 className="volunteer-name">{submission.volunteer}</h3>
                <span className="submission-date">{new Date(submission.date).toLocaleDateString()}</span>
              </div>
              <span className="status-badge pending">{submission.status}</span>
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="info-label">Activity:</span>
                <span className="info-value">{submission.activity}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Hours:</span>
                <span className="info-value hours-value">{submission.hours} hours</span>
              </div>
            </div>
            <div className="card-actions">
              <button className="action-button edit-button" onClick={() => handleEdit(submission.id)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
              <button className="action-button reject-button" onClick={() => handleReject(submission.id)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Reject
              </button>
              <button className="action-button approve-button" onClick={() => handleApprove(submission.id)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingApprovals;