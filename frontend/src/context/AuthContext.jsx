import { createContext, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const { token } = useSelector((state) => state.auth);

  const requireAuth = (callback) => {
    if (token) {
      callback();
    } else {
      setPendingAction(() => callback);
      setShowLoginModal(true);
    }
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setPendingAction(null);
  };

  const onLoginSuccess = () => {
    setShowLoginModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  return (
    <AuthContext.Provider value={{ requireAuth, showLoginModal, closeLoginModal, onLoginSuccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
