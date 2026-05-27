import React, { useState } from 'react';
import { api } from '../services/api';
import { Loader2, AlertCircle } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (email: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await api.login(email, password);
        onAuthSuccess(email);
      } else {
        await api.register(email, password);
        await api.login(email, password);
        onAuthSuccess(email);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError(isLogin ? 'Failed to login. Please check your credentials.' : 'Failed to register. Email might be taken.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.card} className="glass-panel">
        <h2 style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p style={styles.subtitle}>
          {isLogin ? 'Enter your credentials to access your tasks.' : 'Sign up to start organizing your life.'}
        </p>

        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={16} style={{ color: 'var(--danger)' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="btn-primary"
            style={styles.submitBtn}
          >
            {loading ? <Loader2 size={16} style={styles.spinner} /> : null}
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div style={styles.toggleContainer}>
          <span style={styles.toggleText}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            style={styles.toggleBtn}
            disabled={loading}
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    borderRadius: 'var(--radius-xl)',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    textAlign: 'center',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    letterSpacing: '0.5px',
  },
  submitBtn: {
    marginTop: '12px',
    justifyContent: 'center',
    height: '44px',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    marginRight: '8px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'var(--danger-bg)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
  },
  toggleContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
    paddingTop: '20px',
    borderTop: '1px solid var(--border-color)',
  },
  toggleText: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
  }
};
