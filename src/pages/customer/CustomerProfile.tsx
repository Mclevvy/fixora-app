// src/pages/customer/CustomerProfile.tsx
import React, { useState, useEffect } from 'react';
import {
  IonContent, IonPage, IonIcon, IonSpinner, IonModal, IonAlert, IonToast,
} from '@ionic/react';
import {
  personOutline, mailOutline, callOutline, createOutline, carSportOutline, addOutline, 
  trashOutline, cardOutline, lockClosedOutline, logOutOutline, chevronForwardOutline, 
  calendarOutline, receiptOutline, cameraOutline, 
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  updateUserProfile, getUserVehicles, addUserVehicle, deleteUserVehicle, 
  getCustomerBookings, changeUserPassword, uploadProfilePicture, 
} from '../../api/firebaseService';
import { Vehicle, Booking } from '../../types';
import './CustomerProfile.css';

const CustomerProfile: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false); 

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);

  const [showDeleteVehicleAlert, setShowDeleteVehicleAlert] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('success');

  useEffect(() => {
    if (user) {
      loadData();
      setEditName(user.fullName);
      setEditPhone(user.phone || '');
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [vehiclesData, bookingsData] = await Promise.all([
        getUserVehicles(user.id),
        getCustomerBookings(user.id),
      ]);
      setVehicles(vehiclesData);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (message: string, color: string = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      showMessage('Please select an image file', 'danger');
      return;
    }

    setIsUploadingImage(true);
    try {
      const newImageUrl = await uploadProfilePicture(user.id, file);
      updateUser({ ...user, profileImage: newImageUrl });
      showMessage('Profile picture updated successfully');
    } catch (error) {
      showMessage('Failed to upload image. Please try again.', 'danger');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!editName.trim() || !editPhone.trim()) {
      showMessage('Please fill in all fields', 'danger');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateUserProfile(user.id, {
        fullName: editName.trim(),
        phone: editPhone.trim(),
      });
      updateUser({
        ...user,
        fullName: editName.trim(),
        phone: editPhone.trim(),
      });
      showMessage('Profile updated successfully');
      setShowEditModal(false);
    } catch (error) {
      showMessage('Failed to update profile', 'danger');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const openAddVehicleModal = () => {
    setVehicleMake(''); setVehicleModel(''); setVehicleYear(''); setVehiclePlate(''); setVehicleColor('');
    setShowVehicleModal(true);
  };

  const handleAddVehicle = async () => {
    if (!vehicleMake.trim() || !vehicleModel.trim() || !vehicleYear.trim() || !vehiclePlate.trim() || !vehicleColor.trim()) {
      showMessage('Please fill in all vehicle fields', 'danger'); return;
    }
    if (!user) return;

    const year = parseInt(vehicleYear);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      showMessage('Please enter a valid year', 'danger'); return;
    }

    setIsSavingVehicle(true);
    try {
      await addUserVehicle(user.id, {
        make: vehicleMake.trim(), model: vehicleModel.trim(), year,
        plateNumber: vehiclePlate.trim(), color: vehicleColor.trim(),
      });
      showMessage('Vehicle added successfully');
      setShowVehicleModal(false);
      loadData();
    } catch (error) {
      showMessage('Failed to add vehicle', 'danger');
    } finally {
      setIsSavingVehicle(false);
    }
  };

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    try {
      await deleteUserVehicle(vehicleToDelete);
      showMessage('Vehicle removed');
      loadData();
    } catch (error) {
      showMessage('Failed to remove vehicle', 'danger');
    } finally {
      setShowDeleteVehicleAlert(false);
      setVehicleToDelete(null);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage('Please fill in all password fields', 'danger'); return;
    }
    if (newPassword.length < 6) {
      showMessage('New password must be at least 6 characters', 'danger'); return;
    }
    if (newPassword !== confirmPassword) {
      showMessage('New passwords do not match', 'danger'); return;
    }
    if (currentPassword === newPassword) {
      showMessage('New password must be different from current', 'danger'); return;
    }

    setIsChangingPassword(true);
    try {
      await changeUserPassword(currentPassword, newPassword);
      showMessage('Password changed successfully');
      setShowPasswordModal(false);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (error: any) {
      let msg = 'Failed to change password';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') msg = 'Current password is incorrect';
      else if (error.code === 'auth/weak-password') msg = 'New password is too weak';
      else if (error.code === 'auth/requires-recent-login') msg = 'Please log out and log in again to change password';
      showMessage(msg, 'danger');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return 'N/A'; }
  };

  const formatDateTime = (iso: string) => {
    try { return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch { return 'N/A'; }
  };

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((b) => b.status === 'completed').length;
  const totalSpent = bookings.filter((b) => b.paymentStatus === 'paid').reduce((sum, b) => sum + (b.price || 0), 0);

  const recentBookings = bookings.slice(0, 3);
  const paymentHistory = bookings.filter((b) => b.paymentStatus === 'paid').sort((a, b) => (b.paidAt || b.createdAt).localeCompare(a.paidAt || a.createdAt)).slice(0, 5);

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="profile-page" fullscreen>
          <div className="profile-loading"><IonSpinner name="crescent" /><p>Loading profile...</p></div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent 
        className="profile-page" 
        fullscreen
        style={{ '--background': 'linear-gradient(180deg, #f0f9ff 0%, #bae6fd 100%)' } as React.CSSProperties}
      >
        <div className="profile-container">
          
          {/* ✅ BAGONG SHADE (Cyan/Blue Gradient) */}
          <div 
            className="profile-header" 
            style={{ 
              background: 'linear-gradient(135deg, #00b4d8 0%, #06b6d4 100%)',
              boxShadow: '0 10px 30px -10px rgba(0, 180, 216, 0.5)'
            }}
          >
            <label htmlFor="profile-upload" style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}>
              <div className="profile-avatar">
                {isUploadingImage ? (
                  <IonSpinner name="crescent" style={{ color: 'white' }} />
                ) : user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.fullName}
                    className="profile-avatar-img"
                  />
                ) : (
                  user?.fullName?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              <div style={{
                position: 'absolute', bottom: 0, right: 0, background: '#00b4d8', 
                borderRadius: '50%', padding: '6px', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', border: '2px solid white'
              }}>
                <IonIcon icon={cameraOutline} style={{ color: 'white', fontSize: '16px' }} />
              </div>
            </label>
            <input 
              id="profile-upload" 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleImageUpload} 
              disabled={isUploadingImage}
            />

            <h1>{user?.fullName || 'Customer'}</h1>
            <p>{user?.email}</p>
            <span className="profile-role-badge">
              {user?.role?.toUpperCase() || 'CUSTOMER'}
            </span>
          </div>

          {/* STATS */}
          <div className="stats-row">
            <div className="stat-box">
              <p className="stat-value">{totalBookings}</p>
              <p className="stat-label">Bookings</p>
            </div>
            <div className="stat-box">
              <p className="stat-value">{completedBookings}</p>
              <p className="stat-label">Completed</p>
            </div>
            <div className="stat-box">
              <p className="stat-value">₱{totalSpent.toLocaleString()}</p>
              <p className="stat-label">Spent</p>
            </div>
          </div>

          {/* PROFILE INFORMATION */}
          <div className="profile-section">
            <div className="section-title-row">
              <h2 className="profile-section-title">Profile Information</h2>
              <button
                className="section-action-btn"
                onClick={() => {
                  setEditName(user?.fullName || '');
                  setEditPhone(user?.phone || '');
                  setShowEditModal(true);
                }}
              >
                <IonIcon icon={createOutline} /> Edit
              </button>
            </div>
            <div className="profile-card">
              <div className="profile-row">
                <div className="profile-icon"><IonIcon icon={personOutline} /></div>
                <div className="profile-content">
                  <div className="profile-value">Full Name</div>
                  <div className="profile-sublabel">{user?.fullName || '—'}</div>
                </div>
              </div>
              <div className="profile-row">
                <div className="profile-icon"><IonIcon icon={mailOutline} /></div>
                <div className="profile-content">
                  <div className="profile-value">Email Address</div>
                  <div className="profile-sublabel">{user?.email || '—'}</div>
                </div>
              </div>
              <div className="profile-row">
                <div className="profile-icon"><IonIcon icon={callOutline} /></div>
                <div className="profile-content">
                  <div className="profile-value">Contact Number</div>
                  <div className="profile-sublabel">{user?.phone || 'Not set'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* VEHICLE DETAILS */}
          <div className="profile-section">
            <div className="section-title-row">
              <h2 className="profile-section-title">Vehicle Details ({vehicles.length})</h2>
            </div>

            {vehicles.length === 0 ? (
              <div className="empty-card"><IonIcon icon={carSportOutline} /><p>No vehicles added yet</p></div>
            ) : (
              <div className="profile-card">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="vehicle-row">
                    <div className="vehicle-icon"><IonIcon icon={carSportOutline} /></div>
                    <div className="profile-content">
                      <div className="profile-value">{vehicle.make} {vehicle.model} ({vehicle.year})</div>
                      <div className="vehicle-meta">{vehicle.plateNumber} • {vehicle.color}</div>
                    </div>
                    <button
                      className="icon-action-btn danger"
                      onClick={() => { setVehicleToDelete(vehicle.id); setShowDeleteVehicleAlert(true); }}
                    >
                      <IonIcon icon={trashOutline} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button className="add-btn-full" onClick={openAddVehicleModal}>
              <IonIcon icon={addOutline} /> Add New Vehicle
            </button>
          </div>

          {/* BOOKING HISTORY */}
          <div className="profile-section">
            <div className="section-title-row">
              <h2 className="profile-section-title">Booking History ({bookings.length})</h2>
              {bookings.length > 0 && (
                <button className="section-action-btn" onClick={() => navigate('/customer/bookings')}>See All</button>
              )}
            </div>

            {recentBookings.length === 0 ? (
              <div className="empty-card"><IonIcon icon={calendarOutline} /><p>No bookings yet</p></div>
            ) : (
              <div className="profile-card history-card">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="history-item" onClick={() => navigate(`/customer/booking/${booking.id}`)}>
                    <div className="history-row">
                      <div className="history-content">
                        <div className="history-title">{booking.serviceType === 'repair' ? 'Repair Service' : 'Roadside Assistance'}</div>
                        <div className="history-subtitle">{booking.vehicle.make} {booking.vehicle.model}</div>
                      </div>
                      <span className={`badge-small badge-${booking.status}`}>{booking.status.replace('-', ' ')}</span>
                    </div>
                    <div className="history-meta-row">
                      <span className="history-date">{formatDate(booking.createdAt)}</span>
                      <span className="history-amount">{booking.price > 0 ? `₱${booking.price.toLocaleString()}` : 'TBD'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PAYMENT HISTORY */}
          <div className="profile-section">
            <div className="section-title-row">
              <h2 className="profile-section-title">Payment History ({paymentHistory.length})</h2>
            </div>

            {paymentHistory.length === 0 ? (
              <div className="empty-card"><IonIcon icon={cardOutline} /><p>No payment transactions yet</p></div>
            ) : (
              <div className="profile-card history-card">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="history-item">
                    <div className="history-row">
                      <div className="history-content">
                        <div className="history-title">{payment.serviceType === 'repair' ? 'Repair Service' : 'Roadside Assistance'}</div>
                        <div className="history-subtitle">#{payment.id.slice(0, 8).toUpperCase()}</div>
                      </div>
                      <span className="history-amount">₱{payment.price.toLocaleString()}</span>
                    </div>
                    <div className="history-meta-row">
                      <span className="history-date">{formatDateTime(payment.paidAt || payment.createdAt)}</span>
                      <span className="badge-small badge-paid">{payment.paymentStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACCOUNT SETTINGS */}
          <div className="profile-section">
            <h2 className="profile-section-title">Account Settings</h2>
            <div className="profile-card">
              <button className="profile-link" onClick={() => setShowPasswordModal(true)}>
                <div className="profile-icon"><IonIcon icon={lockClosedOutline} /></div>
                <div className="profile-content">
                  <div className="profile-value">Change Password</div>
                  <div className="profile-sublabel">Update your account password</div>
                </div>
                <IonIcon icon={chevronForwardOutline} className="chevron" />
              </button>
              <button className="profile-link" onClick={() => navigate('/customer/bookings')}>
                <div className="profile-icon"><IonIcon icon={receiptOutline} /></div>
                <div className="profile-content">
                  <div className="profile-value">My Bookings</div>
                  <div className="profile-sublabel">View all service requests</div>
                </div>
                <IonIcon icon={chevronForwardOutline} className="chevron" />
              </button>
            </div>
            <button className="logout-btn-full" onClick={() => setShowLogoutAlert(true)}>
              <IonIcon icon={logOutOutline} /> Logout
            </button>
          </div>
        </div>

        {/* MODALS */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonContent className="modal-content">
            <h2 className="modal-title">Edit Profile</h2>
            <p className="modal-subtitle">Update your personal information</p>
            <div className="form-field"><label>Full Name</label><input type="text" placeholder="Enter your full name" value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
            <div className="form-field"><label>Contact Number</label><input type="tel" placeholder="+63 912 345 6789" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /></div>
            <div className="form-field"><label>Email Address</label><input type="email" value={user?.email || ''} disabled style={{ background: '#f9fafb', color: '#9ca3af' }} /><p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0 0' }}>Email cannot be changed</p></div>
            <button className="modal-btn primary" onClick={handleSaveProfile} disabled={isSavingProfile}>{isSavingProfile ? 'Saving...' : 'Save Changes'}</button>
            <button className="modal-btn secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
          </IonContent>
        </IonModal>

        <IonModal isOpen={showVehicleModal} onDidDismiss={() => setShowVehicleModal(false)}>
          <IonContent className="modal-content">
            <h2 className="modal-title">Add Vehicle</h2>
            <p className="modal-subtitle">Add a new vehicle to your account</p>
            <div className="form-field"><label>Brand / Make</label><input type="text" placeholder="e.g., Toyota, Honda, Ford" value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} /></div>
            <div className="form-field"><label>Model</label><input type="text" placeholder="e.g., Vios, Civic, Ranger" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} /></div>
            <div className="form-field"><label>Year</label><input type="number" placeholder="e.g., 2020" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} /></div>
            <div className="form-field"><label>Plate Number</label><input type="text" placeholder="e.g., ABC 123" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} /></div>
            <div className="form-field"><label>Color</label><input type="text" placeholder="e.g., White, Black, Silver" value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} /></div>
            <button className="modal-btn primary" onClick={handleAddVehicle} disabled={isSavingVehicle}>{isSavingVehicle ? 'Adding...' : 'Add Vehicle'}</button>
            <button className="modal-btn secondary" onClick={() => setShowVehicleModal(false)}>Cancel</button>
          </IonContent>
        </IonModal>

        <IonModal isOpen={showPasswordModal} onDidDismiss={() => setShowPasswordModal(false)}>
          <IonContent className="modal-content">
            <h2 className="modal-title">Change Password</h2>
            <p className="modal-subtitle">Enter your current password and choose a new one</p>
            <div className="form-field"><label>Current Password</label><input type="password" placeholder="Enter current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
            <div className="form-field"><label>New Password</label><input type="password" placeholder="At least 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
            <div className="form-field"><label>Confirm New Password</label><input type="password" placeholder="Re-enter new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
            <button className="modal-btn primary" onClick={handleChangePassword} disabled={isChangingPassword}>{isChangingPassword ? 'Changing...' : 'Change Password'}</button>
            <button className="modal-btn secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showDeleteVehicleAlert}
          onDidDismiss={() => setShowDeleteVehicleAlert(false)}
          header="Remove Vehicle"
          message="Are you sure you want to remove this vehicle?"
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Remove', role: 'destructive', handler: handleDeleteVehicle },
          ]}
        />

        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header="Logout"
          message="Are you sure you want to log out of Fixora?"
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Logout', role: 'destructive', handler: handleLogout },
          ]}
        />

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={2500} color={toastColor} />
      </IonContent>
    </IonPage>
  );
};

export default CustomerProfile;