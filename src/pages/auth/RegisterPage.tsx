// src/pages/auth/RegisterPage.tsx
import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonLoading,
  IonToast,
} from '@ionic/react';
import {
  personOutline,
  mailOutline,
  lockClosedOutline,
  callOutline,
  eyeOutline,
  eyeOffOutline,
  logoGoogle,
  constructOutline,
  personCircleOutline,
  shieldOutline,
  cashOutline,
  buildOutline,
} from 'ionicons/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { saveMechanicProfile } from '../../api/firebaseService';
import './Auth.css';

const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'customer' | 'mechanic' | 'admin'>('customer');
  
  const [specialization, setSpecialization] = useState('General Repair');
  const [hourlyRate, setHourlyRate] = useState('250');

  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('danger');
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const redirectUser = (userRole: string) => {
    if (userRole === 'customer') navigate('/customer/home', { replace: true });
    else if (userRole === 'mechanic') navigate('/mechanic/dashboard', { replace: true });
    else if (userRole === 'admin') navigate('/admin/users', { replace: true });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !password) {
      setToastMessage('Please fill in all fields');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (password.length < 6) {
      setToastMessage('Password must be at least 6 characters');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    try {
      const user = await register({ email, password, fullName, phone, role });
      
      if (role === 'mechanic') {
        await saveMechanicProfile(user.id, {
          fullName,
          email,
          phone,
          specialization,
          hourlyRate: Number(hourlyRate) || 250,
          status: 'offline',
          category: 'repair',
          rating: 0,
          totalReviews: 0,
        });
      }

      redirectUser(user.role);
    } catch (error: any) {
      setToastMessage(error.message || 'Registration failed.');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    try {
      const user = await loginWithGoogle(role);
      redirectUser(user.role);
    } catch (error: any) {
      setToastMessage(error.message || 'Google sign-up failed.');
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
            
            {/* Tinanggal na ang back button dito */}

            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join Fixora to immediately fix your vehicle</p>

            <div className="role-selector">
              <div
                className={`role-option ${role === 'customer' ? 'active' : ''}`}
                onClick={() => setRole('customer')}
              >
                <IonIcon icon={personCircleOutline} />
                <span>Customer</span>
              </div>
              <div
                className={`role-option ${role === 'mechanic' ? 'active' : ''}`}
                onClick={() => setRole('mechanic')}
              >
                <IonIcon icon={constructOutline} />
                <span>Mechanic</span>
              </div>
              <div
                className={`role-option ${role === 'admin' ? 'active' : ''}`}
                onClick={() => setRole('admin')}
              >
                <IonIcon icon={shieldOutline} />
                <span>Admin</span>
              </div>
            </div>

            <button
              type="button"
              className="google-btn"
              onClick={handleGoogleRegister}
              disabled={isLoading}
              style={{ width: '100%' }}
            >
              <IonIcon icon={logoGoogle} />
              Continue with Google
            </button>

            <div className="divider" style={{ margin: '20px 0' }}>
              <div className="divider-line" />
              <span className="divider-text">OR</span>
              <div className="divider-line" />
            </div>

            <form className="auth-form" onSubmit={handleRegister}>
              <div className="input-group">
                <IonIcon icon={personOutline} />
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

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
                <IonIcon icon={callOutline} />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {role === 'mechanic' && (
                <>
                  <div className="input-group">
                    <IonIcon icon={buildOutline} />
                    <input
                      type="text"
                      placeholder="Specialization (e.g. General Repair)"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <IonIcon icon={cashOutline} />
                    <input
                      type="number"
                      placeholder="Hourly Rate (e.g. 250)"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="input-group">
                <IonIcon icon={lockClosedOutline} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
                </button>
              </div>

              <button
                type="submit"
                className="auth-btn"
                disabled={isLoading}
                style={{ marginTop: '4px' }}
              >
                Create Account
              </button>
            </form>

            <div className="auth-footer">
              Already have an account?
              <Link to="/login">Sign in</Link>
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

export default RegisterPage;