import React, { useState } from 'react';
import '../styles/Announcements.css';

const Announcements = () => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    recipients: 'all',
    attachment: null
  });

  const [selectedVolunteers, setSelectedVolunteers] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [announcements] = useState([
    {
      id: 1,
      subject: 'Food Drive This Saturday',
      message: 'Reminder about the food drive event this Saturday at 9 AM. Please arrive 15 minutes early.',
      createdBy: 'Admin User',
      createdDate: '2025-10-20',
      status: 'Published'
    },
    {
      id: 2,
      subject: 'New Volunteer Orientation',
      message: 'Welcome to all new volunteers! Please attend the orientation session next week.',
      createdBy: 'Admin User',
      createdDate: '2025-10-18',
      status: 'Published'
    }
  ]);

  const volunteers = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Mike Johnson' },
    { id: 4, name: 'Sarah Williams' }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleVolunteerSelection = (volunteerId) => {
    if (selectedVolunteers.includes(volunteerId)) {
      setSelectedVolunteers(selectedVolunteers.filter(id => id !== volunteerId));
    } else {
      setSelectedVolunteers([...selectedVolunteers, volunteerId]);
    }
  };

  const handlePreview = () => {
    if (!formData.subject || !formData.message) {
      alert('Please fill in subject and message');
      return;
    }
    setShowPreview(true);
  };

  const handlePost = () => {
    console.log('Posting announcement:', formData);
    console.log('Selected volunteers:', selectedVolunteers);
    setFormData({ subject: '', message: '', recipients: 'all' });
    setSelectedVolunteers([]);
    setShowPreview(false);
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
  };

  return (
    <div className="announcements-container">
      <div className="page-header">
        <h1>Announcements</h1>
        <p>Create and manage announcements for volunteers</p>
      </div>

      <div className="content-grid">
        <div className="create-section">
          <div className="card">
            <h2>Create New Announcement</h2>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Enter announcement subject"
                maxLength={100}
                className="input-field"
              />
              <span className="char-count">{formData.subject.length}/100</span>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Enter your announcement message"
                maxLength={2000}
                rows={8}
                className="textarea-field"
              />
              <span className="char-count">{formData.message.length}/2000</span>
            </div>

            <div className="form-group">
              <label htmlFor="attachment">Attachment (Optional)</label>
              <input
                type="file"
                id="attachment"
                accept="image/*,.pdf"
                onChange={(e) => setFormData({...formData, attachment: e.target.files[0]})}
                className="file-input"
              />
              {formData.attachment && (
                <p className="file-name">{formData.attachment.name}</p>
              )}
            </div>

            <div className="form-group">
              <label>Send To</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="recipients"
                    value="all"
                    checked={formData.recipients === 'all'}
                    onChange={handleInputChange}
                  />
                  All Volunteers
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="recipients"
                    value="selected"
                    checked={formData.recipients === 'selected'}
                    onChange={handleInputChange}
                  />
                  Selected Volunteers
                </label>
              </div>
            </div>

            {formData.recipients === 'selected' && (
              <div className="form-group">
                <label>Select Volunteers</label>
                <div className="volunteers-list">
                  {volunteers.map(volunteer => (
                    <label key={volunteer.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedVolunteers.includes(volunteer.id)}
                        onChange={() => handleVolunteerSelection(volunteer.id)}
                      />
                      {volunteer.name}
                    </label>
                  ))}
                </div>
                {selectedVolunteers.length > 0 && (
                  <p className="selected-count">
                    {selectedVolunteers.length} volunteer(s) selected
                  </p>
                )}
              </div>
            )}

            <div className="form-actions">
              <button onClick={handlePreview} className="btn-preview">
                Preview
              </button>
            </div>
          </div>
        </div>

        <div className="history-section">
          <div className="card">
            <h2>Previous Announcements</h2>
            <div className="announcements-list">
              {announcements.map(announcement => (
                <div key={announcement.id} className="announcement-item">
                  <div className="announcement-header">
                    <h3>{announcement.subject}</h3>
                    <span className={`status-badge ${announcement.status.toLowerCase()}`}>
                      {announcement.status}
                    </span>
                  </div>
                  <p className="announcement-message">{announcement.message}</p>
                  <div className="announcement-meta">
                    <span>By {announcement.createdBy}</span>
                    <span>{new Date(announcement.createdDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="preview-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Preview Announcement</h2>
              <button onClick={handleCancelPreview} className="close-btn">&times;</button>
            </div>
            <div className="modal-body">
              <div className="preview-card">
                <h3>{formData.subject}</h3>
                <p className="preview-message">{formData.message}</p>
                {formData.attachment && (
                  <div className="preview-attachment">
                    <img 
                      src={URL.createObjectURL(formData.attachment)} 
                      alt="Attachment preview" 
                      className="attachment-image"
                    />
                    <p className="attachment-name">{formData.attachment.name}</p>
                  </div>
                )}
                <div className="preview-meta">
                  <p><strong>Recipients:</strong> {formData.recipients === 'all' 
                    ? 'All Volunteers' 
                    : `${selectedVolunteers.length} Selected Volunteer(s)`}
                  </p>
                  <p><strong>Posted:</strong> {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={handleCancelPreview} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handlePost} className="btn-post">
                Post Announcement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;