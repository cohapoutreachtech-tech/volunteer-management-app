import React, { useState } from 'react';
import '../styles/Volunteers.css';

const Volunteers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);

  const volunteers = [
    {
      id: 1,
      name: 'Max Stevens',
      phone: '919-456-7234',
      email: 'max.stevens@email.com',
      hours: 92,
      status: 'Active',
      age: 24,
      dob: '1999-03-15',
      gender: 'Male',
      city: 'Raleigh',
      companyName: 'Tech Solutions Inc.',
      tshirtSize: 'L',
      skills: 'Event Planning, Social Media, Photography',
      availability: 'Weekends, Evenings',
      enrollmentYear: 2023,
      courseBatch: 'Fall 2023',
      graduationYear: 2025,
      eventsSignedUp: ['Food Drive', 'Community Cleanup', 'School Supply Drive'],
      recentShifts: [
        { event: 'Food Drive', date: '2025-10-15', hours: 4 },
        { event: 'Community Cleanup', date: '2025-10-08', hours: 3 },
        { event: 'School Supply Drive', date: '2025-09-22', hours: 5 }
      ]
    },
    {
      id: 2,
      name: 'Steven Hicks',
      phone: '984-456-2145',
      email: 'steven.hicks@email.com',
      hours: 23,
      status: 'Active',
      age: 22,
      dob: '2001-07-22',
      gender: 'Male',
      city: 'Durham',
      companyName: 'Individual',
      tshirtSize: 'M',
      skills: 'Marketing, Communication',
      availability: 'Weekends',
      enrollmentYear: 2024,
      courseBatch: 'Spring 2024',
      graduationYear: 2026,
      eventsSignedUp: ['Food Drive', 'Senior Center Visit'],
      recentShifts: [
        { event: 'Food Drive', date: '2025-10-15', hours: 4 },
        { event: 'Senior Center Visit', date: '2025-10-01', hours: 3 }
      ]
    },
    {
      id: 3,
      name: 'Kyle Klein',
      phone: '923-324-6512',
      email: 'kyle.klein@email.com',
      hours: 58,
      status: 'Inactive',
      age: 26,
      dob: '1997-11-08',
      gender: 'Male',
      city: 'Chapel Hill',
      companyName: 'Community Partners LLC',
      tshirtSize: 'XL',
      skills: 'Logistics, Team Leadership',
      availability: 'Flexible',
      enrollmentYear: 2022,
      courseBatch: 'Fall 2022',
      graduationYear: 2024,
      eventsSignedUp: ['Food Drive', 'Community Cleanup'],
      recentShifts: [
        { event: 'Community Cleanup', date: '2025-09-15', hours: 4 },
        { event: 'Food Drive', date: '2025-09-08', hours: 5 }
      ]
    }
  ];

  const handleViewProfile = (volunteer) => {
    setSelectedVolunteer(volunteer);
  };

  const handleCloseProfile = () => {
    setSelectedVolunteer(null);
  };

  const handleExportProfilePDF = (volunteer) => {
    window.print();
  };

  const handleExportHoursCSV = (volunteer) => {
    const csvContent = [
      ['Volunteer Name', 'Event', 'Date', 'Hours'],
      ...volunteer.recentShifts.map(shift => [
        volunteer.name,
        shift.event,
        new Date(shift.date).toLocaleDateString(),
        shift.hours
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${volunteer.name.replace(' ', '_')}_hours.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredVolunteers = volunteers.filter(volunteer =>
    volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    volunteer.phone.includes(searchTerm) ||
    volunteer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="volunteers-container">
      <div className="volunteers-header">
        <h1>Volunteers</h1>
        <div className="header-actions">
          <div className="search-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="volunteers-table-container">
        <table className="volunteers-table">
          <thead>
            <tr>
              <th>VOLUNTEER</th>
              <th>CONTACT</th>
              <th>HOURS</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredVolunteers.map(volunteer => (
              <tr key={volunteer.id}>
                <td className="volunteer-name">{volunteer.name}</td>
                <td>{volunteer.phone}</td>
                <td>{volunteer.hours}</td>
                <td>
                  <span className={`status-badge ${volunteer.status.toLowerCase()}`}>
                    {volunteer.status}
                  </span>
                </td>
                <td>
                  <div className="actions-cell">
                    <button className="btn-action" onClick={() => handleViewProfile(volunteer)}>
                      View
                    </button>
                    <button className="btn-action">
                      Assign Shifts
                    </button>
                    <button className="btn-action">
                      Approve Hours
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedVolunteer && (
        <div className="profile-modal">
          <div className="modal-overlay" onClick={handleCloseProfile}></div>
          <div className="profile-content">
            <button className="close-modal-btn" onClick={handleCloseProfile}>
              &times;
            </button>

            <div className="profile-actions">
              <button className="btn-export-profile" onClick={() => handleExportProfilePDF(selectedVolunteer)}>
                Export Profile as PDF
              </button>
              <button className="btn-export-hours" onClick={() => handleExportHoursCSV(selectedVolunteer)}>
                Export Hours as CSV
              </button>
            </div>

            <div className="profile-header-section">
              <div className="profile-avatar">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className="profile-header-info">
                <h2>{selectedVolunteer.name}</h2>
                <p className="profile-email">{selectedVolunteer.email}</p>
                <span className={`status-badge ${selectedVolunteer.status.toLowerCase()}`}>
                  {selectedVolunteer.status}
                </span>
              </div>
              <div className="profile-hours-badge">
                <div className="hours-number">{selectedVolunteer.hours}</div>
                <div className="hours-label">Total Hours</div>
              </div>
            </div>

            <div className="profile-sections">
              <div className="profile-section">
                <h3>Contact Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Phone</span>
                    <span className="info-value">{selectedVolunteer.phone}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email</span>
                    <span className="info-value">{selectedVolunteer.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">City</span>
                    <span className="info-value">{selectedVolunteer.city}</span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h3>Personal Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Date of Birth</span>
                    <span className="info-value">{new Date(selectedVolunteer.dob).toLocaleDateString()}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Age</span>
                    <span className="info-value">{selectedVolunteer.age}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Gender</span>
                    <span className="info-value">{selectedVolunteer.gender}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">T-Shirt Size</span>
                    <span className="info-value">{selectedVolunteer.tshirtSize}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Company/Organization</span>
                    <span className="info-value">{selectedVolunteer.companyName}</span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h3>Skills & Availability</h3>
                <div className="info-item full-width">
                  <span className="info-label">Skills</span>
                  <span className="info-value">{selectedVolunteer.skills}</span>
                </div>
                <div className="info-item full-width">
                  <span className="info-label">Availability</span>
                  <span className="info-value">{selectedVolunteer.availability}</span>
                </div>
              </div>

              <div className="profile-section">
                <h3>Events Signed Up</h3>
                <div className="events-list">
                  {selectedVolunteer.eventsSignedUp.map((event, index) => (
                    <span key={index} className="event-tag">{event}</span>
                  ))}
                </div>
              </div>

              <div className="profile-section">
                <h3>Recent Shifts</h3>
                <table className="shifts-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Date</th>
                      <th>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedVolunteer.recentShifts.map((shift, index) => (
                      <tr key={index}>
                        <td>{shift.event}</td>
                        <td>{new Date(shift.date).toLocaleDateString()}</td>
                        <td>{shift.hours} hrs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Volunteers;