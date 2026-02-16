import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import SearchBox from '../SearchBox';
import InvitationBell from '../InvitationBell/InvitationBell';
import './Layout.css';

function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, token } = useSelector((state) => state.auth);
  const { requireAuth } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/boards');
  };

  const handleLoginClick = () => {
    requireAuth(() => {});
  };

  const menuItems = [
    { id: 'boards', label: 'Boards', icon: '⊞', path: '/boards' },
    { id: 'members', label: 'Members', icon: '👥', path: '/members' },
    { id: 'settings', label: 'Settings', icon: '⚙', path: '/settings' },
  ];

  return (
    <div className="app-layout">
      <nav className="top-navbar">
        <div className="navbar-left">
          <button 
            className="menu-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            ☰
          </button>
          <div className="logo" onClick={() => navigate('/boards')}>
            <span className="logo-icon">📋</span>
            <span className="logo-text">TaskFlow</span>
          </div>
        </div>

        <div className="navbar-center">
          <SearchBox />
        </div>

        <div className="navbar-right">
          {token ? (
            <>
              <InvitationBell />
              <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle theme">
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button className="create-btn" onClick={() => navigate('/boards')}>
                Create
              </button>
              <div className="user-menu">
                <div className="user-avatar" title={user?.name}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle theme">
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button className="login-btn" onClick={handleLoginClick}>
                Login
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="main-container">
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-content">
            <div className="sidebar-section">
              <h3 className="sidebar-title">Workspace</h3>
              <ul className="sidebar-menu">
                {menuItems.map((item) => (
                  <li
                    key={item.id}
                    className={`menu-item ${location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                  >
                    <span className="menu-icon">{item.icon}</span>
                    {!sidebarCollapsed && <span className="menu-label">{item.label}</span>}
                  </li>
                ))}
              </ul>
            </div>

            <div className="sidebar-section">
              <h3 className="sidebar-title">Your Boards</h3>
              <div className="boards-quick-list">
                <p className="sidebar-hint">Select a board from the main area</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
