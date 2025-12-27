import React, { useState } from 'react';
import '../styles/Events.css';

const Events = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [events, setEvents] = useState([
    // Sample event for demonstration
    {
      id: 1,
      title: 'Sample Event',
      date: '2025-12-21',
      time: '10:00',
      location: 'Community Center',
      description: 'This is a sample event to demonstrate the layout.',
      images: []
    }
  ]);

  const [eventData, setEventData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    images: []
  });

  const [previewImages, setPreviewImages] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventData({
      ...eventData,
      [name]: value
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxImages = 3;
    
    if (files.length + eventData.images.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images`);
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validFiles = files.filter(file => validTypes.includes(file.type));

    if (validFiles.length !== files.length) {
      alert('Please only upload .jpg, .jpeg, .png, or .webp files');
      return;
    }

    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    
    setEventData({
      ...eventData,
      images: [...eventData.images, ...validFiles]
    });
    
    setPreviewImages([...previewImages, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newImages = eventData.images.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    
    URL.revokeObjectURL(previewImages[index]);
    
    setEventData({
      ...eventData,
      images: newImages
    });
    setPreviewImages(newPreviews);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!eventData.title || !eventData.date || !eventData.time || !eventData.location || !eventData.description) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingEvent) {
      // Update existing event
      setEvents(events.map(event => 
        event.id === editingEvent.id 
          ? { ...eventData, id: event.id }
          : event
      ));
      alert('Event updated successfully!');
      setEditingEvent(null);
    } else {
      // Create new event
      const newEvent = {
        ...eventData,
        id: Date.now()
      };
      setEvents([newEvent, ...events]);
      alert('Event created successfully!');
    }

    // Reset form
    resetForm();
  };

  const resetForm = () => {
    setEventData({
      title: '',
      date: '',
      time: '',
      location: '',
      description: '',
      images: []
    });
    previewImages.forEach(url => URL.revokeObjectURL(url));
    setPreviewImages([]);
    setShowCreateForm(false);
  };

  const handleEdit = (event) => {
    setEventData({
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description,
      images: event.images || []
    });
    setEditingEvent(event);
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setEvents(events.filter(event => event.id !== eventId));
      alert('Event deleted successfully!');
    }
  };

  const handleCancel = () => {
    resetForm();
    setEditingEvent(null);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="events-page">
      <div className="events-header">
        <div>
          <h1 className="page-title">Events Management</h1>
          <p className="page-description">Create and manage volunteer events</p>
        </div>
        {!showCreateForm && (
          <button className="btn-create-event" onClick={() => setShowCreateForm(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create Event
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="create-event-section">
          <div className="section-header">
            <h2>{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
            <button className="btn-close" onClick={handleCancel}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="event-form">
            <div className="form-group">
              <label htmlFor="event-images" className="form-label">
                Event Images (Optional - Up to 3 images)
              </label>
              <div className="image-upload-container">
                <input
                  type="file"
                  id="event-images"
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  onChange={handleImageUpload}
                  className="image-input"
                  disabled={eventData.images.length >= 3}
                />
                <label htmlFor="event-images" className={`image-upload-label ${eventData.images.length >= 3 ? 'disabled' : ''}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <span>{eventData.images.length >= 3 ? 'Maximum 3 images' : 'Click to upload images'}</span>
                </label>
              </div>
              
              {previewImages.length > 0 && (
                <div className="image-previews">
                  {previewImages.map((preview, index) => (
                    <div key={index} className="image-preview">
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="remove-image-btn"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="title" className="form-label">Event Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={eventData.title}
                onChange={handleInputChange}
                placeholder="Enter event title"
                className="form-input"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date" className="form-label">Date *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={eventData.date}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="time" className="form-label">Time *</label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={eventData.time}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="location" className="form-label">Location *</label>
              <input
                type="text"
                id="location"
                name="location"
                value={eventData.location}
                onChange={handleInputChange}
                placeholder="Enter event location"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">Description *</label>
              <textarea
                id="description"
                name="description"
                value={eventData.description}
                onChange={handleInputChange}
                placeholder="Enter event description"
                rows="5"
                className="form-textarea"
                required
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn-submit">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {editingEvent ? (
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  ) : (
                    <polyline points="20 6 9 17 4 12"></polyline>
                  )}
                </svg>
                {editingEvent ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="events-list-section">
        <h2 className="section-title">All Events</h2>
        
        {events.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <h3>No Events Yet</h3>
            <p>Click "Create Event" to add your first volunteer event</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <div key={event.id} className="event-card">
                {event.images && event.images.length > 0 && (
                  <div className="event-image">
                    <img src={URL.createObjectURL(event.images[0])} alt={event.title} />
                  </div>
                )}
                
                <div className="event-content">
                  <h3 className="event-title">{event.title}</h3>
                  
                  <div className="event-details">
                    <div className="event-detail">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <span>{formatDate(event.date)}</span>
                    </div>
                    
                    <div className="event-detail">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>{formatTime(event.time)}</span>
                    </div>
                    
                    <div className="event-detail">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>{event.location}</span>
                    </div>
                  </div>
                  
                  <p className="event-description">{event.description}</p>
                </div>
                
                <div className="event-actions">
                  <button className="btn-edit" onClick={() => handleEdit(event)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(event.id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;