import React, { useState } from 'react';
import '../styles/VolunteerAnnouncements.css';

const VolunteerAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      subject: 'Food Drive This Saturday',
      message: 'Reminder about the food drive event this Saturday at 9 AM. Please arrive 15 minutes early.',
      createdBy: 'Admin User',
      createdDate: '2025-10-20',
      status: 'Published',
      acknowledged: false,
      attachment: null
    },
    {
      id: 2,
      subject: 'New Volunteer Orientation',
      message: 'Welcome to all new volunteers! Please attend the orientation session next week.',
      createdBy: 'Admin User',
      createdDate: '2025-10-18',
      status: 'Published',
      acknowledged: true,
      attachment: null
    },
    {
      id: 3,
      subject: 'Meet at the Circle @ 5pm',
      message: 'All Volunteer make sure to carry Umbrellas and meet at the Walb Circle @ 5pm. PFA a map of the location',
      createdBy: 'Admin User',
      createdDate: '2025-10-15',
      status: 'Published',
      acknowledged: false,
      attachment: '/location-map.png'
    }
  ]);

  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleAcknowledge = (id) => {
    setAnnouncements(announcements.map(announcement => 
      announcement.id === id 
        ? { ...announcement, acknowledged: true }
        : announcement
    ));
  };

  const handleViewDetails = (announcement) => {
    setSelectedAnnouncement(announcement);
  };

  const handleCloseModal = () => {
    setSelectedAnnouncement(null);
  };

  const handleImageClick = (imagePath) => {
    setSelectedImage(imagePath);
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  const unacknowledgedCount = announcements.filter(a => !a.acknowledged).length;

  return (
    <div className="volunteer-announcements-container">
      <div className="page-header">
        <h1>Announcements</h1>
        <p>Stay updated with the latest news and events</p>
        {unacknowledgedCount > 0 && (
          <div className="unread-badge">
            {unacknowledgedCount} unread announcement{unacknowledgedCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="announcements-grid">
        {announcements.map(announcement => (
          <div 
            key={announcement.id} 
            className={`announcement-card ${announcement.acknowledged ? 'acknowledged' : 'unread'}`}
          >
            <div className="card-header">
              <div className="header-left">
                <h3>{announcement.subject}</h3>
                {!announcement.acknowledged && (
                  <span className="new-badge">NEW</span>
                )}
              </div>
              <span className="date">
                {new Date(announcement.createdDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>

            <p className="announcement-preview">
              {announcement.message.length > 120 
                ? announcement.message.substring(0, 120) + '...' 
                : announcement.message}
            </p>

            {announcement.attachment && (
              <div 
                className="has-attachment"
                onClick={() => handleImageClick(announcement.attachment)}
                style={{ cursor: 'pointer' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
                <span>Has attachment (click to view)</span>
              </div>
            )}

            <div className="card-footer">
              <span className="posted-by">Posted by {announcement.createdBy}</span>
              <div className="card-actions">
                <button 
                  className="btn-view-details"
                  onClick={() => handleViewDetails(announcement)}
                >
                  View Details
                </button>
                {!announcement.acknowledged && (
                  <button 
                    className="btn-acknowledge"
                    onClick={() => handleAcknowledge(announcement.id)}
                    title="Mark as read"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                  </button>
                )}
                {announcement.acknowledged && (
                  <span className="acknowledged-icon" title="Acknowledged">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedAnnouncement && (
        <div className="announcement-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedAnnouncement.subject}</h2>
              <button onClick={handleCloseModal} className="close-btn">&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="modal-meta">
                <span>
                  <strong>Posted by:</strong> {selectedAnnouncement.createdBy}
                </span>
                <span>
                  <strong>Date:</strong> {new Date(selectedAnnouncement.createdDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <div className="announcement-detail-card">
                <p className="announcement-full-message">
                  {selectedAnnouncement.message}
                </p>

                {selectedAnnouncement.attachment && (
                  <div className="attachment-preview">
                    <img 
                      src={selectedAnnouncement.attachment} 
                      alt="Location map"
                      className="attachment-image"
                      onClick={() => handleImageClick(selectedAnnouncement.attachment)}
                      style={{ cursor: 'pointer' }}
                    />
                    <p className="attachment-label">Click image to enlarge</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {!selectedAnnouncement.acknowledged ? (
                <button 
                  className="btn-acknowledge-modal"
                  onClick={() => {
                    handleAcknowledge(selectedAnnouncement.id);
                    handleCloseModal();
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                  </svg>
                  Acknowledge
                </button>
              ) : (
                <div className="acknowledged-message">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                  </svg>
                  <span>Acknowledged</span>
                </div>
              )}
              <button onClick={handleCloseModal} className="btn-close-modal">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showImageModal && (
        <div className="image-modal" onClick={handleCloseImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleCloseImageModal} className="image-close-btn">&times;</button>
            <img src={selectedImage} alt="Enlarged view" className="enlarged-image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerAnnouncements;