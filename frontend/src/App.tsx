import React, { useState } from 'react';
import { AuthProvider, useAuth } from './store/AuthContext';
import { Login } from './pages/Login';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Rewards } from './pages/Rewards';
import { Tasks } from './pages/Tasks';
import { Admin } from './pages/Admin';

const MainApp: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  // The Web Portal is exclusively for Admin and Municipal Staff
  return <Admin />;
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
