import { useState, useEffect, useRef, useCallback } from 'react';
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
import Vowels from './components/Modules/Vowels';
import Consonants from './components/Modules/Consonants';
import {
  supabase,
  fetchBackendUsers,
  fetchBackendProgress,
  updateBackendModuleProgress,
  updateBackendModuleVideos,
} from './lib/supabaseClient';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState('login');
  const audioRef = useRef(null);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [activeModule, setActiveModule] = useState('alphabet');
  const [currentUser, setCurrentUser] = useState(null);
  const [resetEmail, setResetEmail] = useState(null);
  const [completedPretests, setCompletedPretests] = useState([]);
  const [completedAlphabetModes, setCompletedAlphabetModes] = useState([]); // Track easy, medium, hard
  const [vowelsCompleted, setVowelsCompleted] = useState(false);
  const [consonantsCompleted, setConsonantsCompleted] = useState(false);
  const [cvcCompleted, setCvcCompleted] = useState(false);
  const [vowelsWatchedVideos, setVowelsWatchedVideos] = useState([]);
  const [consonantsWatchedVideos, setConsonantsWatchedVideos] = useState([]);
  const [cvcWatchedVideos, setCvcWatchedVideos] = useState([]);
  const [isProgressHydrated, setIsProgressHydrated] = useState(false);
  const [backendUserId, setBackendUserId] = useState(null);

  const mapAuthUserToProfile = useCallback((user) => {
    if (!user) {
      return null;
    }

    const firstname = user.user_metadata?.firstname || user.user_metadata?.firstName || user.firstname || user.firstName || '';
    const lastname = user.user_metadata?.lastname || user.user_metadata?.lastName || user.lastname || user.lastName || '';
    const role = user.user_metadata?.role || user.role || 'student';

    return {
      ...user,
      firstname,
      lastname,
      role,
      user_metadata: {
        ...(user.user_metadata || {}),
        firstname,
        lastname,
        role,
        email: user.email || user.user_metadata?.email,
      },
    };
  }, []);

  useEffect(() => {
    try {
      const storedVolume = localStorage.getItem('phonexis_music_volume');
      if (storedVolume !== null) {
        const parsedVolume = Number(storedVolume);
        if (!Number.isNaN(parsedVolume)) {
          setMusicVolume(Math.min(Math.max(parsedVolume, 0), 1));
        }
      }
    } catch (error) {
      // ignore storage errors
    }

    const handleMusicVolumeChange = (event) => {
      const nextVolume = Number(event?.detail);
      if (Number.isNaN(nextVolume)) {
        return;
      }

      const clampedVolume = Math.min(Math.max(nextVolume, 0), 1);
      setMusicVolume(clampedVolume);
    };

    window.addEventListener('phonexis:music-volume-change', handleMusicVolumeChange);

    return () => {
      window.removeEventListener('phonexis:music-volume-change', handleMusicVolumeChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user;

      if (cancelled || !sessionUser) {
        return;
      }

      setCurrentUser(mapAuthUserToProfile(sessionUser));
      setIsAuthenticated(true);
      setActiveView((currentView) => (currentView === 'login' ? 'dashboard' : currentView));
    };

    void restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setActiveView('login');
        return;
      }

      setCurrentUser(mapAuthUserToProfile(session.user));
      setIsAuthenticated(true);
      setActiveView((currentView) => (currentView === 'login' ? 'dashboard' : currentView));
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [mapAuthUserToProfile]);

  // Build a stable storage key for the logged-in user
  const getProgressKey = (user) => {
    if (!user) return null;
    const email = (user.email || user.user_metadata?.email || '').trim().toLowerCase();
    const id = user.id;
    const stableKey = email || id || JSON.stringify(user);
    return `phonexis_progress_${String(stableKey)}`;
  };

  const parseVideoIds = useCallback((videosWatched) => {
    if (!videosWatched) {
      return [];
    }

    if (Array.isArray(videosWatched)) {
      return videosWatched;
    }

    try {
      const parsed = JSON.parse(videosWatched);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }, []);

  const applyProgressSnapshot = useCallback((snapshot = {}) => {
    const nextCompletedPretests = snapshot.completedPretests || [];
    const nextCompletedAlphabetModes = snapshot.completedAlphabetModes || nextCompletedPretests;

    setCompletedPretests(nextCompletedPretests);
    setCompletedAlphabetModes(nextCompletedAlphabetModes);
    setVowelsCompleted(!!snapshot.vowelsCompleted);
    setConsonantsCompleted(!!snapshot.consonantsCompleted);
    setCvcCompleted(!!snapshot.cvcCompleted);
    setVowelsWatchedVideos(parseVideoIds(snapshot.vowelsWatchedVideos));
    setConsonantsWatchedVideos(parseVideoIds(snapshot.consonantsWatchedVideos));
    setCvcWatchedVideos(parseVideoIds(snapshot.cvcWatchedVideos));
  }, [parseVideoIds]);

  const mapBackendProgressToSnapshot = useCallback((progressList = []) => {
    const byModule = new Map(progressList.map((progress) => [String(progress?.moduleName || '').toLowerCase(), progress]));
    const alphabetProgress = byModule.get('alphabet');
    const vowelsProgress = byModule.get('vowels');
    const consonantsProgress = byModule.get('consonants');
    const cvcProgress = byModule.get('cvc');

    return {
      completedPretests: [
        alphabetProgress?.easyModeCompleted ? 'easy' : null,
        alphabetProgress?.mediumModeCompleted ? 'medium' : null,
        alphabetProgress?.hardModeCompleted ? 'hard' : null,
      ].filter(Boolean),
      completedAlphabetModes: [
        alphabetProgress?.easyModeCompleted ? 'easy' : null,
        alphabetProgress?.mediumModeCompleted ? 'medium' : null,
        alphabetProgress?.hardModeCompleted ? 'hard' : null,
      ].filter(Boolean),
      vowelsCompleted: !!(vowelsProgress?.pretestCompleted || vowelsProgress?.completionPercentage >= 100),
      consonantsCompleted: !!(consonantsProgress?.pretestCompleted || consonantsProgress?.completionPercentage >= 100),
      cvcCompleted: !!(cvcProgress?.pretestCompleted || cvcProgress?.completionPercentage >= 100),
      vowelsWatchedVideos: parseVideoIds(vowelsProgress?.videosWatched),
      consonantsWatchedVideos: parseVideoIds(consonantsProgress?.videosWatched),
      cvcWatchedVideos: parseVideoIds(cvcProgress?.videosWatched),
    };
  }, [parseVideoIds]);

  const resetProgressState = useCallback(() => {
    setCompletedPretests([]);
    setCompletedAlphabetModes([]);
    setVowelsCompleted(false);
    setConsonantsCompleted(false);
    setCvcCompleted(false);
    setVowelsWatchedVideos([]);
    setConsonantsWatchedVideos([]);
    setCvcWatchedVideos([]);
    setBackendUserId(null);
    setIsProgressHydrated(false);
  }, []);

  const resolveBackendUserId = useCallback(async (user) => {
    if (!user) {
      return null;
    }

    if (typeof user.id === 'number') {
      return user.id;
    }

    if (typeof user.id === 'string' && /^\d+$/.test(user.id)) {
      return Number(user.id);
    }

    const email = (user.email || user.user_metadata?.email || '').trim().toLowerCase();
    if (!email) {
      return null;
    }

    const backendUsers = await fetchBackendUsers();
    if (backendUsers.error || !Array.isArray(backendUsers.data)) {
      return null;
    }

    const matchedUser = backendUsers.data.find((entry) => String(entry?.email || '').trim().toLowerCase() === email);
    return matchedUser?.id ?? null;
  }, []);

  // Load progress for the current user when they log in
  useEffect(() => {
    if (!currentUser) {
      resetProgressState();
      return;
    }

    let cancelled = false;

    const loadProgress = async () => {
      resetProgressState();

      const resolvedBackendUserId = await resolveBackendUserId(currentUser);

      if (!cancelled) {
        setBackendUserId(resolvedBackendUserId);
      }

      try {
        const key = getProgressKey(currentUser);
        const raw = key ? localStorage.getItem(key) : null;
        if (raw) {
          const parsed = JSON.parse(raw);
          applyProgressSnapshot(parsed);
        } else {
          applyProgressSnapshot({});
        }
      } catch (error) {
        applyProgressSnapshot({});
      }

      if (resolvedBackendUserId) {
        const backendResult = await fetchBackendProgress(resolvedBackendUserId);
        if (!cancelled && !backendResult.error && Array.isArray(backendResult.data) && backendResult.data.length > 0) {
          applyProgressSnapshot(mapBackendProgressToSnapshot(backendResult.data));
        }
      }

      if (!cancelled) {
        setIsProgressHydrated(true);
      }
    };

    void loadProgress();

    return () => {
      cancelled = true;
    };
  }, [currentUser, applyProgressSnapshot, mapBackendProgressToSnapshot, resolveBackendUserId, resetProgressState]);

  useEffect(() => {
    if (!currentUser || !isProgressHydrated) return;

    try {
      const key = getProgressKey(currentUser);
      const payload = JSON.stringify({
        completedPretests,
        completedAlphabetModes,
        vowelsCompleted,
        consonantsCompleted,
        cvcCompleted,
        vowelsWatchedVideos,
        consonantsWatchedVideos,
        cvcWatchedVideos,
      });
      if (key) {
        localStorage.setItem(key, payload);
      }
    } catch (e) {
      // ignore storage errors
    }

    if (!backendUserId) {
      return;
    }

    const syncBackendProgress = async () => {
      await Promise.all([
        updateBackendModuleProgress(backendUserId, 'alphabet', {
          easyModeCompleted: completedPretests.includes('easy'),
          mediumModeCompleted: completedPretests.includes('medium'),
          hardModeCompleted: completedPretests.includes('hard'),
        }),
        updateBackendModuleVideos(backendUserId, 'vowels', vowelsWatchedVideos),
        updateBackendModuleVideos(backendUserId, 'consonants', consonantsWatchedVideos),
        updateBackendModuleVideos(backendUserId, 'cvc', cvcWatchedVideos),
        updateBackendModuleProgress(backendUserId, 'vowels', {
          pretestCompleted: vowelsCompleted,
        }),
        updateBackendModuleProgress(backendUserId, 'consonants', {
          pretestCompleted: consonantsCompleted,
        }),
        updateBackendModuleProgress(backendUserId, 'cvc', {
          pretestCompleted: cvcCompleted,
        }),
      ]);
    };

    void syncBackendProgress();
  }, [currentUser, backendUserId, isProgressHydrated, completedPretests, completedAlphabetModes, vowelsCompleted, consonantsCompleted, cvcCompleted, vowelsWatchedVideos, consonantsWatchedVideos, cvcWatchedVideos]);

  // Background music effect
  useEffect(() => {
    const pauseAudioSafely = () => {
      if (!audioRef.current) {
        return;
      }

      try {
        audioRef.current.pause();
      } catch (error) {
        if (error?.name !== 'NotImplementedError') {
          throw error;
        }
      }
    };

    if (!audioRef.current) {
      audioRef.current = new Audio('/background-music/Children\'s Music  Happy Upbeat Music (Instrumental Music For Kids).mp3');
      audioRef.current.loop = true;
    }

    audioRef.current.volume = musicVolume;

    // Play music when user is authenticated (on dashboard)
    if (isAuthenticated && activeView === 'dashboard') {
      audioRef.current.play().catch(err => {
        console.log('Audio autoplay prevented. User interaction required:', err);
      });
    } else {
      // Pause music when not on dashboard or not authenticated
      pauseAudioSafely();
    }

    return () => {
      // Cleanup on unmount
      pauseAudioSafely();
    };
  }, [isAuthenticated, activeView, musicVolume]);

  // Module progress is driven by the user's completed steps.
  const alphabetProgress = Math.round((completedAlphabetModes.length / 3) * 100);
  const vowelsProgress = vowelsCompleted ? 100 : Math.round((vowelsWatchedVideos.length / 3) * 100);
  const consonantsProgress = consonantsCompleted ? 100 : Math.round((consonantsWatchedVideos.length / 6) * 100);
  const cvcProgress = cvcCompleted || cvcWatchedVideos.length > 0 ? 100 : 0;
  const overallProgress = Math.round((alphabetProgress + vowelsProgress + consonantsProgress + cvcProgress) / 4);
  const vowelsUnlocked = alphabetProgress >= 100;
  const consonantsUnlocked = vowelsProgress >= 100;
  const cvcUnlocked = consonantsProgress >= 100;

  const handlePretestComplete = (difficulty) => {
    setCompletedPretests((currentPretests) => {
      if (currentPretests.includes(difficulty)) {
        return currentPretests;
      }

      return [...currentPretests, difficulty];
    });
  };

  const handleAlphabetModeComplete = (mode) => {
    setCompletedAlphabetModes((currentModes) => {
      if (currentModes.includes(mode)) {
        return currentModes;
      }
      return [...currentModes, mode];
    });
  };

  const openModule = (moduleKey) => {
    if (moduleKey === 'vowels' && !vowelsUnlocked) {
      return;
    }

    if (moduleKey === 'consonants' && !consonantsUnlocked) {
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

  const handleConsonantsComplete = () => {
    setConsonantsCompleted(true);
    setActiveView('dashboard');
  };

  const handleCvcComplete = () => {
    setCvcCompleted(true);
    setActiveView('dashboard');
  };

  const handleAuthSuccess = (userProfile) => {
    if (userProfile) {
      setCurrentUser(mapAuthUserToProfile(userProfile));
    }

    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // ignore sign-out errors and clear local state anyway
    }

    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveView('login');
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
            onProgressUpdate={handleAlphabetModeComplete}
            onBack={() => setActiveView('dashboard')}
            completedModes={completedAlphabetModes}
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
              alphabetProgress={alphabetProgress}
              vowelsProgress={vowelsProgress}
              consonantsProgress={consonantsProgress}
              cvcProgress={cvcProgress}
              vowelsUnlocked={vowelsUnlocked}
              consonantsUnlocked={consonantsUnlocked}
              cvcUnlocked={cvcUnlocked}
              onLogout={handleLogout}
            />
          );
        }

        return (
          <CVCWords
            onComplete={handleCvcComplete}
            onBack={() => setActiveView('dashboard')}
            initialVideosWatched={cvcWatchedVideos}
            onVideosWatchedChange={setCvcWatchedVideos}
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
              alphabetProgress={alphabetProgress}
              vowelsProgress={vowelsProgress}
              consonantsProgress={consonantsProgress}
              cvcProgress={cvcProgress}
              vowelsUnlocked={vowelsUnlocked}
              consonantsUnlocked={consonantsUnlocked}
              cvcUnlocked={cvcUnlocked}
              onLogout={handleLogout}
            />
          );
        }

        return (
          <Vowels
            onComplete={handleVowelsComplete}
            onBack={() => setActiveView('dashboard')}
            initialVideosWatched={vowelsWatchedVideos}
            onVideosWatchedChange={setVowelsWatchedVideos}
          />
        );
      case 'consonants':
        if (!consonantsUnlocked) {
          return (
            <Dashboard
              onNavigate={setActiveView}
              onSelectModule={openModule}
              user={currentUser}
              overallProgress={overallProgress}
              alphabetProgress={alphabetProgress}
              vowelsProgress={vowelsProgress}
              consonantsProgress={consonantsProgress}
              cvcProgress={cvcProgress}
              vowelsUnlocked={vowelsUnlocked}
              consonantsUnlocked={consonantsUnlocked}
              cvcUnlocked={cvcUnlocked}
              onLogout={handleLogout}
            />
          );
        }

        return (
          <Consonants
            onComplete={handleConsonantsComplete}
            onBack={() => setActiveView('dashboard')}
            initialVideosWatched={consonantsWatchedVideos}
            onVideosWatchedChange={setConsonantsWatchedVideos}
            isCompleted={consonantsCompleted}
          />
        );
      case 'modules':
        return (
          <Modules
            activeModule={activeModule}
            onNavigate={setActiveView}
            onSelectModule={openModule}
            vowelsUnlocked={vowelsUnlocked}
            consonantsUnlocked={consonantsUnlocked}
            cvcUnlocked={cvcUnlocked}
            onComplete={() => {
              if (activeModule === 'vowels') {
                handleVowelsComplete();
                return;
              }

              if (activeModule === 'consonants') {
                handleConsonantsComplete();
                return;
              }

              if (activeModule === 'cvc') {
                handleCvcComplete();
              }
            }}
            onLogout={handleLogout}
          />
        );
      case 'profile':
        return (
          <Profile
            onNavigate={setActiveView}
            user={currentUser}
            overallProgress={overallProgress}
            alphabetProgress={alphabetProgress}
            vowelsProgress={vowelsProgress}
            consonantsProgress={consonantsProgress}
            cvcProgress={cvcProgress}
            onLogout={handleLogout}
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
            alphabetProgress={alphabetProgress}
            vowelsProgress={vowelsProgress}
            consonantsProgress={consonantsProgress}
            cvcProgress={cvcProgress}
            vowelsUnlocked={vowelsUnlocked}
            consonantsUnlocked={consonantsUnlocked}
            cvcUnlocked={cvcUnlocked}
            onLogout={handleLogout}
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
