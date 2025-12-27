import React, { useState } from 'react';
import '../styles/Reports.css';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('volunteer-hours');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const volunteerHoursData = [
    { id: 1, name: 'John Doe', totalHours: 45.5, eventsAttended: 8 },
    { id: 2, name: 'Jane Smith', totalHours: 38.0, eventsAttended: 6 },
    { id: 3, name: 'Mike Johnson', totalHours: 52.5, eventsAttended: 10 },
    { id: 4, name: 'Sarah Williams', totalHours: 29.0, eventsAttended: 5 }
  ];

  const eventParticipationData = [
    { id: 1, eventName: 'Food Drive', totalHours: 120, volunteers: 15 },
    { id: 2, eventName: 'Community Cleanup', totalHours: 85, volunteers: 12 },
    { id: 3, eventName: 'School Supply Drive', totalHours: 95, volunteers: 10 },
    { id: 4, eventName: 'Senior Center Visit', totalHours: 60, volunteers: 8 }
  ];

  const monthlySummary = {
    totalHours: 247,
    activeVolunteers: 42,
    totalEvents: 8,
    averageHours: 5.9
  };

  const leaderboardData = [
    { rank: 1, name: 'Mike Johnson', hours: 52.5 },
    { rank: 2, name: 'John Doe', hours: 45.5 },
    { rank: 3, name: 'Jane Smith', hours: 38.0 },
    { rank: 4, name: 'Sarah Williams', hours: 29.0 },
    { rank: 5, name: 'Tom Brown', hours: 26.5 },
    { rank: 6, name: 'Lisa Davis', hours: 24.0 },
    { rank: 7, name: 'David Miller', hours: 21.5 },
    { rank: 8, name: 'Emily Wilson', hours: 19.0 },
    { rank: 9, name: 'Chris Taylor', hours: 17.5 },
    { rank: 10, name: 'Anna Martinez', hours: 15.0 }
  ];

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  const handleExport = () => {
    console.log('Exporting report:', activeReport);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const renderReportContent = () => {
    switch (activeReport) {
      case 'volunteer-hours':
        return (
          <div className="report-content">
            <div className="report-header">
              <h2>Volunteer Hours Report</h2>
              <div className="export-buttons">
                <button onClick={handleExport} className="btn-export">
                  Export to CSV
                </button>
                <button onClick={handleExportPDF} className="btn-export btn-pdf">
                  Export to PDF
                </button>
              </div>
            </div>
            <div className="filters">
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="date-input"
              />
              <span className="date-separator">to</span>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="date-input"
              />
            </div>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Volunteer Name</th>
                  <th>Total Hours</th>
                  <th>Events Attended</th>
                </tr>
              </thead>
              <tbody>
                {volunteerHoursData.map(volunteer => (
                  <tr key={volunteer.id}>
                    <td>{volunteer.name}</td>
                    <td>{volunteer.totalHours.toFixed(1)} hrs</td>
                    <td>{volunteer.eventsAttended}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'event-participation':
        return (
          <div className="report-content">
            <div className="report-header">
              <h2>Event Participation Report</h2>
              <div className="export-buttons">
                <button onClick={handleExport} className="btn-export">
                  Export to CSV
                </button>
                <button onClick={handleExportPDF} className="btn-export btn-pdf">
                  Export to PDF
                </button>
              </div>
            </div>
            <div className="filters">
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="date-input"
              />
              <span className="date-separator">to</span>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="date-input"
              />
            </div>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Total Hours</th>
                  <th>Number of Volunteers</th>
                </tr>
              </thead>
              <tbody>
                {eventParticipationData.map(event => (
                  <tr key={event.id}>
                    <td>{event.eventName}</td>
                    <td>{event.totalHours} hrs</td>
                    <td>{event.volunteers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'monthly-summary':
        return (
          <div className="report-content">
            <div className="report-header">
              <h2>Monthly Summary</h2>
              <div className="export-buttons">
                <button onClick={handleExport} className="btn-export">
                  Export to CSV
                </button>
                <button onClick={handleExportPDF} className="btn-export btn-pdf">
                  Export to PDF
                </button>
              </div>
            </div>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-label">Total Hours</div>
                <div className="summary-value">{monthlySummary.totalHours}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Active Volunteers</div>
                <div className="summary-value">{monthlySummary.activeVolunteers}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Total Events</div>
                <div className="summary-value">{monthlySummary.totalEvents}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Average Hours/Volunteer</div>
                <div className="summary-value">{monthlySummary.averageHours}</div>
              </div>
            </div>
          </div>
        );

      case 'leaderboard':
        return (
          <div className="report-content">
            <div className="report-header">
              <h2>Volunteer Leaderboard</h2>
              <div className="export-buttons">
                <button onClick={handleExport} className="btn-export">
                  Export to CSV
                </button>
                <button onClick={handleExportPDF} className="btn-export btn-pdf">
                  Export to PDF
                </button>
              </div>
            </div>
            <table className="report-table leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Volunteer Name</th>
                  <th>Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map(volunteer => (
                  <tr key={volunteer.rank} className={volunteer.rank <= 3 ? 'top-three' : ''}>
                    <td className="rank-cell">
                      {volunteer.rank <= 3 ? (
                        <span className="medal">{volunteer.rank === 1 ? '🥇' : volunteer.rank === 2 ? '🥈' : '🥉'}</span>
                      ) : (
                        volunteer.rank
                      )}
                    </td>
                    <td>{volunteer.name}</td>
                    <td>{volunteer.hours.toFixed(1)} hrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="reports-container">
      <div className="page-header">
        <h1>Reports</h1>
        <p>Generate and export volunteer activity reports</p>
      </div>

      <div className="reports-layout">
        <div className="reports-sidebar">
          <button
            className={`report-option ${activeReport === 'volunteer-hours' ? 'active' : ''}`}
            onClick={() => setActiveReport('volunteer-hours')}
          >
            Volunteer Hours Report
          </button>
          <button
            className={`report-option ${activeReport === 'event-participation' ? 'active' : ''}`}
            onClick={() => setActiveReport('event-participation')}
          >
            Event Participation Report
          </button>
          <button
            className={`report-option ${activeReport === 'monthly-summary' ? 'active' : ''}`}
            onClick={() => setActiveReport('monthly-summary')}
          >
            Monthly Summary
          </button>
          <button
            className={`report-option ${activeReport === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveReport('leaderboard')}
          >
            Volunteer Leaderboard
          </button>
        </div>

        <div className="reports-main">
          {renderReportContent()}
        </div>
      </div>
    </div>
  );
};

export default Reports;