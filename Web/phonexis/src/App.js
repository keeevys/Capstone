import { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Modules from './components/Modules';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Profile from './components/Profile';
import AlphabetRecognition from './components/Modules/AlphabetRecognition';
import CVCWords from './components/Modules/CVCWords';
import VowelsConsonant from './components/Modules/VowelsConsonant';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState('login');
  const [activeModule, setActiveModule] = useState('alphabet');
  const [currentUser, setCurrentUser] = useState(null);
  const [resetEmail, setResetEmail] = useState(null);

  const handleAuthSuccess = (userProfile) => {
    if (userProfile) {
      setCurrentUser(userProfile);
    }

    setIsAuthenticated(true);
  };

  const renderView = () => {
    if (!isAuthenticated) {
      switch (activeView) {
        case 'register':
          return <Register onNavigate={setActiveView} onSuccess={handleAuthSuccess} />;
        case 'forgotpassword':
          return (
            <ForgotPassword 
              onNavigate={setActiveView} 
              onEmailSubmit={(email) => {
                setResetEmail(email);
                setActiveView('reset');
              }} 
            />
          );
        case 'reset':
          return <ResetPassword onNavigate={setActiveView} email={resetEmail} />;
        case 'login':
        default:
          return <Login onNavigate={setActiveView} onSuccess={handleAuthSuccess} />;
      }
    }

    switch (activeView) {
      case 'alphabet':
        return (
          <AlphabetRecognition
            onComplete={() => setActiveView('dashboard')}
            onBack={() => setActiveView('dashboard')}
          />
        );
      case 'cvc':
        return (
          <CVCWords
            onComplete={() => setActiveView('dashboard')}
            onBack={() => setActiveView('dashboard')}
          />
        );
      case 'vowels':
        return (
          <VowelsConsonant
            onComplete={() => setActiveView('dashboard')}
            onBack={() => setActiveView('dashboard')}
          />
        );
      case 'modules':
        return (
          <Modules
            activeModule={activeModule}
            onNavigate={setActiveView}
            onSelectModule={setActiveModule}
            onLogout={() => {
              setIsAuthenticated(false);
              setActiveView('login');
            }}
          />
        );
      case 'profile':
        return (
          <Profile
            onNavigate={setActiveView}
            user={currentUser}
            onLogout={() => {
              setIsAuthenticated(false);
              setCurrentUser(null);
              setActiveView('login');
            }}
          />
        );
      case 'dashboard':
      default:
        return (
          <Dashboard
            onNavigate={setActiveView}
            onSelectModule={setActiveModule}
            user={currentUser}
            onLogout={() => {
              setIsAuthenticated(false);
              setCurrentUser(null);
              setActiveView('login');
            }}
          />
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="app-shell">
        <div className="app-orb app-orb-left" aria-hidden="true" />
        <div className="app-orb app-orb-right" aria-hidden="true" />

        <main className="app-main app-auth-main app-login-main">{renderView()}</main>
      </div>
    );
  }

  return <div className="app-shell app-shell-authenticated">{renderView()}</div>;
}

export default App;
