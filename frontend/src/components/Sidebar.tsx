import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  CalendarRange,
  Compass,
  ChevronRight,
  User2,
  FolderLock,
  LogOut,
  MessageSquare
} from 'lucide-react';

interface SidebarProps {
  userEmail: string;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ userEmail, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isTodosActive = location.pathname.startsWith('/todos');
  const isGoalsActive = location.pathname.startsWith('/goals');
  const isChatActive = location.pathname.startsWith('/chat');

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brand}>
        <div style={styles.logoDot} />
        <h2 style={styles.brandName}>O N Y X</h2>
      </div>

      {/* Main Navigation */}
      <nav style={styles.navGroup}>
        <span style={styles.sectionHeader}>CORE</span>

        <button
          onClick={() => navigate('/todos')}
          style={{
            ...styles.navItem,
            ...(isTodosActive ? styles.activeNavItem : {})
          }}
        >
          <CheckSquare size={18} style={isTodosActive ? styles.activeIcon : styles.icon} />
          <span style={styles.navText}>Todos</span>
          {isTodosActive && <ChevronRight size={14} style={styles.chevron} />}
        </button>

        <button
          onClick={() => navigate('/goals')}
          style={{
            ...styles.navItem,
            ...(isGoalsActive ? styles.activeNavItem : {})
          }}
        >
          <CalendarRange size={18} style={isGoalsActive ? styles.activeIcon : styles.icon} />
          <span style={styles.navText}>Upcoming Goals</span>
          {isGoalsActive && <ChevronRight size={14} style={styles.chevron} />}
        </button>

        <button
          onClick={() => navigate('/chat')}
          style={{
            ...styles.navItem,
            ...(isChatActive ? styles.activeNavItem : {})
          }}
        >
          <MessageSquare size={18} style={isChatActive ? styles.activeIcon : styles.icon} />
          <span style={styles.navText}>AI Chat</span>
          {isChatActive && <ChevronRight size={14} style={styles.chevron} />}
        </button>
      </nav>

      {/* Placeholders for Future Implementation */}
      <div style={styles.navGroup}>
        <span style={styles.sectionHeader}>WORKSPACE</span>

        <div style={styles.inactiveNavItem}>
          <Compass size={18} style={styles.disabledIcon} />
          <span style={styles.inactiveText}>Explore Analytics</span>
          <span style={styles.badge}>soon</span>
        </div>

        <div style={styles.inactiveNavItem}>
          <FolderLock size={18} style={styles.disabledIcon} />
          <span style={styles.inactiveText}>Shared Projects</span>
          <span style={styles.badge}>soon</span>
        </div>
      </div>

      {/* Footer Profile Area */}
      <div style={styles.footer}>
        <div style={styles.profileContainer}>
          <div style={styles.avatar}>
            <User2 size={16} />
          </div>
          <div style={styles.profileDetails}>
            <span style={styles.profileName} title={userEmail}>
              {userEmail.split('@')[0]}
            </span>
            <span style={styles.profileRole}>Online User</span>
          </div>
        </div>
        <button onClick={onLogout} style={styles.settingsBtn} title="Log Out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    width: 'var(--sidebar-width)',
    height: '100%',
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px 24px 12px',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '24px',
  },
  logoDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'var(--accent-gradient)',
  },
  brandName: {
    fontSize: '1.1rem',
    fontWeight: '700',
    letterSpacing: '3px',
    color: 'var(--text-primary)',
  },
  navGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '28px',
  },
  sectionHeader: {
    fontSize: '0.7rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    letterSpacing: '1.5px',
    paddingLeft: '12px',
    marginBottom: '6px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.95rem',
    fontWeight: '500',
    textAlign: 'left',
    transition: 'var(--transition-smooth)',
    width: '100%',
  },
  activeNavItem: {
    backgroundColor: 'var(--accent-light)',
    color: 'var(--text-primary)',
    border: '1px solid var(--accent-border)',
  },
  icon: {
    marginRight: '12px',
    color: 'var(--text-secondary)',
    transition: 'var(--transition-smooth)',
  },
  activeIcon: {
    marginRight: '12px',
    color: 'var(--accent)',
  },
  navText: {
    flexGrow: 1,
  },
  chevron: {
    color: 'var(--accent)',
  },
  // Inactive slots
  inactiveNavItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'not-allowed',
    userSelect: 'none',
  },
  disabledIcon: {
    marginRight: '12px',
    color: 'var(--text-muted)',
    opacity: 0.5,
  },
  inactiveText: {
    flexGrow: 1,
    opacity: 0.7,
  },
  badge: {
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    backgroundColor: 'var(--bg-tertiary)',
    padding: '2px 6px',
    borderRadius: '4px',
    color: 'var(--text-muted)',
    border: '1px solid var(--border-color)',
  },
  // Footer
  footer: {
    marginTop: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '16px',
    borderTop: '1px solid var(--border-color)',
  },
  profileContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)',
  },
  profileDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  profileName: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  profileRole: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  settingsBtn: {
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};
