import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TodoPage } from './components/TodoPage';
import { GoalsPage } from './components/GoalsPage';
import { AIChatPage } from './components/AIChatPage';
import { AuthPage } from './components/AuthPage';
import { api } from './services/api';
import posthog from 'posthog-js';

declare global {
  interface Window {
    Intercom: (...args: any[]) => void;
  }
}

function App() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const user = await api.getMe();
          setUserEmail(user.email);
        } catch (error) {
          console.error("Token invalid or expired", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleAuthSuccess = (email: string) => {
    setUserEmail(email);
    posthog.identify(email, { email: email });
    window.Intercom('boot', {
      api_base: 'https://api-iam.intercom.io',
      app_id: 'dcadjsbz',
      email: email,
      name: email.split('@')[0],
    });
  };

  const handleLogout = () => {
    api.logout();
    setUserEmail(null);
    posthog.reset();
  };

  if (loading) {
    return <div style={styles.appContainer}></div>; // Optional loading state
  }

  if (!userEmail) {
    return (
      <div style={styles.appContainer}>
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div style={styles.appContainer}>
        <Sidebar
          userEmail={userEmail}
          onLogout={handleLogout}
        />

        <main style={styles.mainContent}>
          <Routes>
            <Route path="/todos" element={<TodoPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/chat" element={<AIChatPage />} />
            <Route path="*" element={<Navigate to="/todos" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  appContainer: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-primary)',
  },
  mainContent: {
    flexGrow: 1,
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
};

export default App;
