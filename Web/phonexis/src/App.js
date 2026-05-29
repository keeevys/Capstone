import { useState, useEffect } from 'react';
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
  const [completedPretests, setCompletedPretests] = useState([]);
  const [vowelsCompleted, setVowelsCompleted] = useState(false);
  const [cvcCompleted, setCvcCompleted] = useState(false);

  // Build a stable storage key for the logged-in user
  const getProgressKey = (user) => {
    if (!user) return null;
    const id = user.id || user.email || user.user_metadata?.email || JSON.stringify(user);
    return `phonexis_progress_${String(id)}`;
  };

  // Load progress for the current user when they log in
  useEffect(() => {
    if (!currentUser) return;
    try {
      const key = getProgressKey(currentUser);
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        setCompletedPretests(parsed.completedPretests || []);
        setVowelsCompleted(!!parsed.vowelsCompleted);
        setCvcCompleted(!!parsed.cvcCompleted);
      } else {
        // initialize empty progress
        setCompletedPretests([]);
        setVowelsCompleted(false);
        setCvcCompleted(false);
      }
    } catch (e) {
      // ignore parse errors
      setCompletedPretests([]);
      setVowelsCompleted(false);
      setCvcCompleted(false);
    }
  }, [currentUser]);

  // Persist progress whenever it changes for the logged-in user
  useEffect(() => {
    if (!currentUser) return;
    try {
      const key = getProgressKey(currentUser);
      const payload = JSON.stringify({ completedPretests, vowelsCompleted, cvcCompleted });
      localStorage.setItem(key, payload);
    } catch (e) {
      // ignore storage errors
    }
  }, [currentUser, completedPretests, vowelsCompleted, cvcCompleted]);

  const vowelsUnlocked = completedPretests.length >= 3;
  const cvcUnlocked = vowelsCompleted;
  const completedStages = Math.min(completedPretests.length, 3) + (vowelsCompleted ? 1 : 0) + (cvcCompleted ? 1 : 0);
  const overallProgress = Math.round((completedStages / 5) * 100);

  const handlePretestComplete = (difficulty) => {
    setCompletedPretests((currentPretests) => {
      if (currentPretests.includes(difficulty)) {
        return currentPretests;
      }

      return [...currentPretests, difficulty];
    });
  };

  const openModule = (moduleKey) => {
    if (moduleKey === 'vowels' && !vowelsUnlocked) {
      return;
    }

    if (moduleKey === 'cvc' && !cvcUnlocked) {
      return;
    }

    setActiveModule(moduleKey);
    setActiveView(moduleKey);
  };

  const handleVowelsComplete = () => {
    setVowelsCompleted(true);
    setActiveView('dashboard');
  };

  const handleCvcComplete = () => {
    setCvcCompleted(true);
    setActiveView('dashboard');
  };

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
            onPretestComplete={handlePretestComplete}
            onBack={() => setActiveView('dashboard')}
          />
        );
      case 'cvc':
        if (!cvcUnlocked) {
          return (
            <Dashboard
              onNavigate={setActiveView}
              onSelectModule={openModule}
              user={currentUser}
              overallProgress={overallProgress}
              vowelsUnlocked={vowelsUnlocked}
              cvcUnlocked={cvcUnlocked}
              onLogout={() => {
                setIsAuthenticated(false);
                setCurrentUser(null);
                setActiveView('login');
              }}
            />
          );
        }

        return (
          <CVCWords
            onComplete={handleCvcComplete}
            onBack={() => setActiveView('dashboard')}
          />
        );
      case 'vowels':
        if (!vowelsUnlocked) {
          return (
            <Dashboard
              onNavigate={setActiveView}
              onSelectModule={openModule}
              user={currentUser}
              overallProgress={overallProgress}
              vowelsUnlocked={vowelsUnlocked}
              onLogout={() => {
                setIsAuthenticated(false);
                setCurrentUser(null);
                setActiveView('login');
              }}
            />
          );
        }

        return (
          <VowelsConsonant
            unlocked={vowelsUnlocked}
            onComplete={handleVowelsComplete}
            onBack={() => setActiveView('dashboard')}
          />
        );
      case 'modules':
        return (
          <Modules
            activeModule={activeModule}
            onNavigate={setActiveView}
            onSelectModule={openModule}
            vowelsUnlocked={vowelsUnlocked}
            cvcUnlocked={cvcUnlocked}
            onComplete={() => {
              if (activeModule === 'vowels') {
                handleVowelsComplete();
                return;
              }

              if (activeModule === 'cvc') {
                handleCvcComplete();
              }
            }}
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
            onSelectModule={openModule}
            user={currentUser}
            overallProgress={overallProgress}
            vowelsUnlocked={vowelsUnlocked}
            cvcUnlocked={cvcUnlocked}
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
