import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile } from './store/slices/authSlice';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Boards from './pages/Boards/Boards';
import Board from './pages/Board/Board';
import Members from './pages/Members/Members';
import Layout from './components/Layout/Layout';
import LoginModal from './components/LoginModal/LoginModal';

function AppContent() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { showLoginModal } = useAuth();

  useEffect(() => {
    if (token) {
      dispatch(getProfile());
    }
  }, [token, dispatch]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/boards"
          element={
            <Layout>
              <Boards />
            </Layout>
          }
        />
        <Route
          path="/boards/:id"
          element={
            <Layout>
              <Board />
            </Layout>
          }
        />
        <Route
          path="/boards/:id/members"
          element={
            <Layout>
              <Members />
            </Layout>
          }
        />
        <Route path="/" element={<Navigate to="/boards" replace />} />
      </Routes>
      {showLoginModal && <LoginModal />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
