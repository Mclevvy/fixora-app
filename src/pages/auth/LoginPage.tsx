// src/pages/auth/LoginPage.tsx
import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonLoading,
  IonToast,
} from '@ionic/react';
import {
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  logoGoogle,
} from 'ionicons/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css'; // WALANG IMPORT NG IMAGE DITO

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('danger');
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const redirectUser = (role: string) => {
    if (role === 'customer') navigate('/customer/home', { replace: true });
    else if (role === 'mechanic') navigate('/mechanic/dashboard', { replace: true });
    else if (role === 'admin') navigate('/admin/users', { replace: true });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setToastMessage('Please fill in all fields');
      setToastColor('danger');
      setShowToast(true);
      return;
    }
    setIsLoading(true);
    try {
      const user = await login(email, password);
      redirectUser(user.role);
    } catch (error: any) {
      setToastMessage(error.message || 'Login failed. Check your credentials.');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const user = await loginWithGoogle('customer');
      redirectUser(user.role);
    } catch (error: any) {
      setToastMessage(error.message || 'Google sign-in failed.');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="auth-page" fullscreen>
        <div className="auth-wrapper">
          <div className="auth-card">
            
            {/* ✅ DIRETSO SA PUBLIC FOLDER ANG PATH */}
            <div className="auth-logo-header">
              <img src="/fixora-logo.png" alt="Fixora Logo" className="auth-logo-img" />
            </div>

            <h1 className="auth-title">Welcome to Fixora</h1>
            <p className="auth-subtitle">Sign in to continue</p>

            <form className="auth-form" onSubmit={handleLogin}>
              <div className="input-group">
                <IonIcon icon={mailOutline} />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="input-group">
                <IonIcon icon={lockClosedOutline} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
                </button>
              </div>

              <div className="forgot-password">
                <a href="#">Forgot password?</a>
              </div>

              <button type="submit" className="auth-btn" disabled={isLoading}>
                Sign In
              </button>
            </form>

            <div className="divider" style={{ marginTop: '24px' }}>
              <div className="divider-line" />
              <span className="divider-text">OR</span>
              <div className="divider-line" />
            </div>

            <button
              type="button"
              className="google-btn"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              style={{ marginTop: '16px', width: '100%' }}
            >
              <IonIcon icon={logoGoogle} />
              Continue with Google
            </button>

            <div className="auth-footer">
              Don't have an account?
              <Link to="/register">Sign up</Link>
            </div>
          </div>
        </div>

        <IonLoading isOpen={isLoading} message="Please wait..." />
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;