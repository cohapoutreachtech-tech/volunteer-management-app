import React, { useState } from 'react';
import '../styles/VolunteerProfile.css';

const VolunteerProfile = () => {
  // Mock volunteer data - in real app this would come from backend/auth
  const [volunteerData] = useState({
    firstName: 'Max',
    lastName: 'Stevens',
    email: 'max.stevens@email.com',
    phone: '919-456-7234',
    dateOfBirth: '1999-03-15',
    companyName: 'Tech Solutions Inc.',
    isIndividual: false,
    profilePicture: null, // In real app would be URL to uploaded image
    tshirtSize: 'L',
    facebookHandle: '@maxstevens',
    instagramHandle: '@max_stevens',
    textOptIn: true,
    whyVolunteer: 'I am passionate about giving back to my community and making a positive impact. Volunteering allows me to connect with others and contribute to meaningful causes.',
    eventsSignedUp: [
      'Car Show & Music Festival on April 27, 2025',
      'Annual Back 2 School Bash on August 16, 2025'
    ],
    totalHoursAvailable: '10-15 hours per month',
    communityServiceHours: true,
    offenderPolicyConfirmed: true,
    additionalComments: 'I have experience working with children and am excited to help with event planning and social media.'
  });

  const [isEditMode, setIsEditMode] = useState(false);

  const calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="volunteer-profile-container">
      <div className="profile-page-header">
        <h1>My Profile</h1>
        <button className="btn-edit-profile" onClick={() => setIsEditMode(!isEditMode)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          {isEditMode ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      <div className="profile-main-card">
        <div className="profile-header-banner">
          <div className="profile-picture-section">
            <div className="profile-picture">
              {volunteerData.profilePicture ? (
                <img src={volunteerData.profilePicture} alt="Profile" />
              ) : (
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              )}
            </div>
            {isEditMode && (
              <button className="btn-upload-photo">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                Upload Photo
              </button>
            )}
          </div>
          
          <div className="profile-header-info-section">
            <h2>{volunteerData.firstName} {volunteerData.lastName}</h2>
            <p className="profile-subtitle">{volunteerData.email}</p>
            <div className="profile-badges">
              <span className="badge-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                {volunteerData.phone}
              </span>
              <span className="badge-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Age {calculateAge(volunteerData.dateOfBirth)}
              </span>
              <span className="badge-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                T-Shirt: {volunteerData.tshirtSize}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-sections-grid">
          <div className="profile-info-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Personal Information
            </h3>
            <div className="info-rows">
              <div className="info-row">
                <span className="info-row-label">Full Name</span>
                <span className="info-row-value">{volunteerData.firstName} {volunteerData.lastName}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Email Address</span>
                <span className="info-row-value">{volunteerData.email}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Phone Number</span>
                <span className="info-row-value">{volunteerData.phone}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Date of Birth</span>
                <span className="info-row-value">{new Date(volunteerData.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">T-Shirt Size</span>
                <span className="info-row-value">{volunteerData.tshirtSize}</span>
              </div>
            </div>
          </div>

          <div className="profile-info-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              Organization Details
            </h3>
            <div className="info-rows">
              <div className="info-row">
                <span className="info-row-label">Volunteering As</span>
                <span className="info-row-value">
                  {volunteerData.isIndividual ? (
                    <span className="volunteer-type-badge individual">Individual</span>
                  ) : (
                    <span className="volunteer-type-badge company">Company Representative</span>
                  )}
                </span>
              </div>
              {!volunteerData.isIndividual && (
                <div className="info-row">
                  <span className="info-row-label">Company Name</span>
                  <span className="info-row-value">{volunteerData.companyName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="profile-info-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
              Social Media
            </h3>
            <div className="info-rows">
              <div className="info-row">
                <span className="info-row-label">Facebook Handle</span>
                <span className="info-row-value">{volunteerData.facebookHandle || 'Not provided'}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Instagram Handle</span>
                <span className="info-row-value">{volunteerData.instagramHandle || 'Not provided'}</span>
              </div>
            </div>
          </div>

          <div className="profile-info-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Communication Preferences
            </h3>
            <div className="info-rows">
              <div className="info-row">
                <span className="info-row-label">Text Message Notifications</span>
                <span className="info-row-value">
                  {volunteerData.textOptIn ? (
                    <span className="opt-in-badge enabled">Enabled</span>
                  ) : (
                    <span className="opt-in-badge disabled">Disabled</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-info-section full-width">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              Why I Want to Volunteer
            </h3>
            <p className="text-content">{volunteerData.whyVolunteer}</p>
          </div>

          <div className="profile-info-section full-width">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Events Signed Up For
            </h3>
            <div className="events-tags">
              {volunteerData.eventsSignedUp.map((event, index) => (
                <span key={index} className="event-tag-profile">{event}</span>
              ))}
            </div>
          </div>

          <div className="profile-info-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Availability & Hours
            </h3>
            <div className="info-rows">
              <div className="info-row">
                <span className="info-row-label">Total Hours Available</span>
                <span className="info-row-value">{volunteerData.totalHoursAvailable}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Community Service Hours</span>
                <span className="info-row-value">
                  {volunteerData.communityServiceHours ? (
                    <span className="yes-badge">Yes</span>
                  ) : (
                    <span className="no-badge">No</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-info-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Compliance
            </h3>
            <div className="info-rows">
              <div className="info-row">
                <span className="info-row-label">Offender Policy Confirmed</span>
                <span className="info-row-value">
                  {volunteerData.offenderPolicyConfirmed && (
                    <span className="confirmed-badge">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Confirmed
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {volunteerData.additionalComments && (
            <div className="profile-info-section full-width">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Additional Comments
              </h3>
              <p className="text-content">{volunteerData.additionalComments}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfile;