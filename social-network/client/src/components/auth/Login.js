import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGraduationCap, FaUsers, FaBook, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import TwoFactorVerify from './TwoFactorVerify';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const { login, loginWith2FA, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    clearError();
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    const result = await login(formData);
    setLoading(false);
    
    if (result.requireTwoFactor) {
      // 2FA is required
      setTwoFactorRequired(true);
      setTempToken(result.tempToken);
    } else if (result.success) {
      navigate('/');
    }
  };

  const handle2FASuccess = async (data) => {
    // Login successful with 2FA
    loginWith2FA(data);
    navigate('/');
  };

  const handle2FACancel = () => {
    setTwoFactorRequired(false);
    setTempToken(null);
  };

  // Show 2FA verification screen
  if (twoFactorRequired && tempToken) {
    return (
      <TwoFactorVerify 
        tempToken={tempToken}
        onSuccess={handle2FASuccess}
        onCancel={handle2FACancel}
      />
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-branding">
          <div className="auth-logo">E</div>
          <h1>EduConnect</h1>
          <p>Connect with classmates, share knowledge, and manage your learning journey all in one place.</p>
        </div>
        
        <div className="auth-features">
          <div className="feature-item">
            <FaUsers />
            <span>Connect with classmates and educators</span>
          </div>
          <div className="feature-item">
            <FaBook />
            <span>Integrated Moodle LMS courses</span>
          </div>
          <div className="feature-item">
            <FaGraduationCap />
            <span>Track your academic progress</span>
          </div>
          <div className="feature-item">
            <FaCheckCircle />
            <span>Stay updated with deadlines</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Welcome back</h2>
            <p>Sign in to continue to EduConnect</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="auth-error">
                <FaExclamationCircle />
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <div className="input-wrapper">
                <FaEnvelope />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <FaLock />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?
              <Link to="/register">Create account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
