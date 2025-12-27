import React, { useState, useEffect } from 'react';
import '../styles/ClockInHours.css';

const ClockInHours = () => {
  const [isClockIn, setIsClockIn] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [shifts, setShifts] = useState([
    { id: 1, date: '2025-10-15', startTime: '2:00 PM', endTime: '6:00 PM', hours: 4, status: 'approved' },
    { id: 2, date: '2025-10-20', startTime: '1:00 PM', endTime: '3:30 PM', hours: 2.5, status: 'approved' },
    { id: 3, date: '2025-10-25', startTime: '10:00 AM', endTime: '1:00 PM', hours: 3, status: 'pending' }
  ]);

  useEffect(() => {
    let interval;
    if (isClockIn && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClockIn, startTime]);

  const handleStartShift = () => {
    const now = Date.now();
    setStartTime(now);
    setIsClockIn(true);
    setElapsedTime(0);
  };

  const handleEndShift = () => {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000 / 60 / 60;
    
    const newShift = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      startTime: new Date(startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      endTime: new Date(endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      hours: parseFloat(duration.toFixed(2)),
      status: 'pending'
    };

    setShifts([newShift, ...shifts]);
    setIsClockIn(false);
    setStartTime(null);
    setElapsedTime(0);
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const pendingShifts = shifts.filter(s => s.status === 'pending');
  const approvedShifts = shifts.filter(s => s.status === 'approved');

  return (
    <div className="clock-in-container">
      <div className="clock-section">
        <div className="clock-content">
          <h2>Clock In/Out</h2>
          
          {!isClockIn ? (
            <div className="clock-display">
              <button className="start-shift-btn" onClick={handleStartShift}>
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>Start Shift</span>
              </button>
            </div>
          ) : (
            <div className="clock-display active">
              <div className="timer-display">
                {formatTime(elapsedTime)}
              </div>
              <p className="shift-started">Shift started at {new Date(startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
              <button className="end-shift-btn" onClick={handleEndShift}>
                End Shift
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="shifts-section">
        <div className="shifts-panel pending-panel">
          <h3>Pending Approval</h3>
          <div className="shifts-list">
            {pendingShifts.length === 0 ? (
              <p className="no-shifts">No pending shifts</p>
            ) : (
              pendingShifts.map(shift => (
                <div key={shift.id} className="shift-card pending">
                  <div className="shift-header">
                    <span className="shift-date">{shift.date}</span>
                    <span className="shift-status pending">Pending</span>
                  </div>
                  <div className="shift-details">
                    <div className="shift-time">
                      {shift.startTime} - {shift.endTime}
                    </div>
                    <div className="shift-hours">{shift.hours} hours</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="shifts-panel approved-panel">
          <h3>Approved Shifts</h3>
          <div className="shifts-list">
            {approvedShifts.length === 0 ? (
              <p className="no-shifts">No approved shifts</p>
            ) : (
              approvedShifts.map(shift => (
                <div key={shift.id} className="shift-card approved">
                  <div className="shift-header">
                    <span className="shift-date">{shift.date}</span>
                    <span className="shift-status approved">Approved</span>
                  </div>
                  <div className="shift-details">
                    <div className="shift-time">
                      {shift.startTime} - {shift.endTime}
                    </div>
                    <div className="shift-hours">{shift.hours} hours</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClockInHours;