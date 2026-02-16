import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, register, clearError } from '../../store/slices/authSlice';
import { useAuth } from '../../context/AuthContext';
import './LoginModal.css';

function LoginModal() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const { closeLoginModal, onLoginSuccess } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    let result;
    
    if (isLogin) {
      result = await dispatch(login({ email: formData.email, password: formData.password }));
    } else {
      result = await dispatch(register(formData));
    }

    if (!result.error) {
      onLoginSuccess();
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    dispatch(clearError());
    setFormData({ name: '', email: '', password: '' });
  };

  return (
    <div className="login-modal-overlay" onClick={closeLoginModal}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={closeLoginModal}>×</button>
        
        <h2>{isLogin ? 'Login to continue' : 'Create an account'}</h2>
        <p className="modal-subtitle">
          {isLogin 
            ? 'Sign in to add tasks and collaborate' 
            : 'Join TaskFlow to start collaborating'}
        </p>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="modal-form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
            </div>
          )}
          
          <div className="modal-form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="modal-form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="modal-submit-btn" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <p className="modal-switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={switchMode}>
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginModal;
