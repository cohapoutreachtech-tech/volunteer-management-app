import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import AdminLayout from './components/AdminLayout';
import VolunteerLayout from './components/VolunteerLayout';
import RegistrationPage from './components/RegistrationPage';
import './App.css';

function App() {
  const [userRole, setUserRole] = useState(null);

  const handleRoleSelect = (role) => {
    setUserRole(role);
  };

  const handleBackToLanding = () => {
    setUserRole(null);
  };

  if (!userRole) {
    return <LandingPage onSelectRole={handleRoleSelect} />;
  }

  if (userRole === 'admin') {
    return <AdminLayout />;
  }
  
  if (userRole === 'volunteer') {
    return <VolunteerLayout />;
  }

  if (userRole === 'register') {
    return <RegistrationPage onBack={handleBackToLanding} />;
  }
}

export default App;