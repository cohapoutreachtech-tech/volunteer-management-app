import React, { useState } from 'react';
import '../styles/ApprovedHours.css';

const ApprovedHours = () => {
  const [filters, setFilters] = useState({
    volunteer: '',
    event: '',
    startDate: '',
    endDate: '',
    approver: ''
  });

  const [approvedHours] = useState([
    {
      id: 1,
      volunteerName: 'John Doe',
      eventName: 'Food Drive',
      date: '2025-10-15',
      hours: 4.0,
      approvedBy: 'Admin User',
      approvedDate: '2025-10-16'
    },
    {
      id: 2,
      volunteerName: 'Jane Smith',
      eventName: 'Community Cleanup',
      date: '2025-10-18',
      hours: 3.5,
      approvedBy: 'Admin User',
      approvedDate: '2025-10-19'
    },
    {
      id: 3,
      volunteerName: 'Mike Johnson',
      eventName: 'Food Drive',
      date: '2025-10-20',
      hours: 5.0,
      approvedBy: 'Admin User',
      approvedDate: '2025-10-21'
    }
  ]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleExport = () => {
    console.log('Exporting data...');
  };

  const handleClearFilters = () => {
    setFilters({
      volunteer: '',
      event: '',
      startDate: '',
      endDate: '',
      approver: ''
    });
  };

  return (
    <div className="approved-hours-container">
      <div className="page-header">
        <h1>Approved Hours History</h1>
        <p>View and export all approved volunteer hours</p>
      </div>

      <div className="filters-section">
        <div className="filters-grid">
          <input
            type="text"
            name="volunteer"
            placeholder="Search by volunteer name"
            value={filters.volunteer}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="text"
            name="event"
            placeholder="Search by event"
            value={filters.event}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="date"
            name="startDate"
            placeholder="Start date"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="date"
            name="endDate"
            placeholder="End date"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="text"
            name="approver"
            placeholder="Approved by"
            value={filters.approver}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
        <div className="filter-actions">
          <button onClick={handleClearFilters} className="btn-secondary">
            Clear Filters
          </button>
          <button onClick={handleExport} className="btn-primary">
            Export to CSV
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="approved-hours-table">
          <thead>
            <tr>
              <th>Volunteer Name</th>
              <th>Event Name</th>
              <th>Date</th>
              <th>Hours Worked</th>
              <th>Approved By</th>
              <th>Approved Date</th>
            </tr>
          </thead>
          <tbody>
            {approvedHours.map((record) => (
              <tr key={record.id}>
                <td>{record.volunteerName}</td>
                <td>{record.eventName}</td>
                <td>{new Date(record.date).toLocaleDateString()}</td>
                <td>{record.hours.toFixed(1)} hrs</td>
                <td>{record.approvedBy}</td>
                <td>{new Date(record.approvedDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <p>Showing {approvedHours.length} approved hours</p>
      </div>
    </div>
  );
};

export default ApprovedHours;