import React, { useState } from 'react';
import '../styles/VolunteerDashboard.css';

const VolunteerDashboard = () => {
  const [events] = useState([
    {
      id: 1,
      title: 'Amazing Season of Hope - Harvest Festival',
      date: 'December 21, 2025',
      time: '9:00 AM - 4:00 PM',
      location: 'Community Center, 123 Main St',
      description: 'Join us for our annual harvest festival! Help distribute food, set up booths, and spread joy in the community.',
      volunteersNeeded: 25,
      volunteersSignedUp: 4,
      images: [
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
        'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
        'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800'
      ],
      currentImageIndex: 0
    },
    {
      id: 2,
      title: 'MLK Day Celebration Parade',
      date: 'January 17, 2026',
      time: '10:00 AM - 2:00 PM',
      location: 'Downtown Main Street',
      description: 'Honor Dr. Martin Luther King Jr. by participating in our community parade. Volunteers needed for setup, parade coordination, and cleanup.',
      volunteersNeeded: 40,
      volunteersSignedUp: 32,
      images: [
        'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800',
        'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800',
        'https://images.unsplash.com/photo-1464047736614-af63643285bf?w=800'
      ],
      currentImageIndex: 0
    }
  ]);

  const [currentImages, setCurrentImages] = useState(
    events.reduce((acc, event) => ({ ...acc, [event.id]: 0 }), {})
  );

  const nextImage = (eventId, totalImages) => {
    setCurrentImages(prev => ({
      ...prev,
      [eventId]: (prev[eventId] + 1) % totalImages
    }));
  };

  const prevImage = (eventId, totalImages) => {
    setCurrentImages(prev => ({
      ...prev,
      [eventId]: prev[eventId] === 0 ? totalImages - 1 : prev[eventId] - 1
    }));
  };

  return (
    <div className="volunteer-dashboard">
      <div className="dashboard-header">
        <h1>Volunteer Dashboard</h1>
        <p>Welcome back! Here are the upcoming events this week.</p>
      </div>

      <div className="events-grid">
        {events.map(event => (
          <div key={event.id} className="event-card">
            <div className="event-slideshow">
              <img 
                src={event.images[currentImages[event.id]]} 
                alt={event.title}
                className="event-image"
              />
              <button 
                className="slideshow-btn prev-btn"
                onClick={() => prevImage(event.id, event.images.length)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button 
                className="slideshow-btn next-btn"
                onClick={() => nextImage(event.id, event.images.length)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
              <div className="slideshow-dots">
                {event.images.map((_, index) => (
                  <span 
                    key={index} 
                    className={`dot ${currentImages[event.id] === index ? 'active' : ''}`}
                    onClick={() => setCurrentImages(prev => ({ ...prev, [event.id]: index }))}
                  />
                ))}
              </div>
            </div>

            <div className="event-content">
              <h2>{event.title}</h2>
              
              <div className="event-details">
                <div className="event-detail-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>{event.date}</span>
                </div>
                <div className="event-detail-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{event.time}</span>
                </div>
                <div className="event-detail-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{event.location}</span>
                </div>
              </div>

              <p className="event-description">{event.description}</p>

              <div className="event-volunteers">
                <div className="volunteers-progress">
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill"
                      style={{ width: `${(event.volunteersSignedUp / event.volunteersNeeded) * 100}%` }}
                    ></div>
                  </div>
                  <span className="volunteers-count">
                    {event.volunteersSignedUp} / {event.volunteersNeeded} volunteers
                  </span>
                </div>
              </div>

              <div className="event-actions">
                <button className="btn-primary">Sign Up</button>
                <button className="btn-secondary">View Details</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VolunteerDashboard;