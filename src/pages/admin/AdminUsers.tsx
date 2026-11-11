// src/pages/admin/AdminUsers.tsx
import React, { useState, useEffect } from 'react';
import { 
  IonContent, IonPage, IonIcon, IonSpinner, IonToast, IonModal 
} from '@ionic/react';
import { 
  personOutline, constructOutline, shieldOutline, searchOutline, 
  banOutline, trashOutline, timeOutline, checkmarkCircleOutline,
  alertCircleOutline, closeOutline
} from 'ionicons/icons';
import { getAllUsers, updateUserAccountStatus, deleteUserAccount } from '../../api/firebaseService';
import { User } from '../../types';
import './Admin.css';

const SUSPEND_REASONS = [
  'Unresponsive to bookings',
  'Poor service quality',
  'Tardiness / No-show',
  'Minor policy violation',
  'Other'
];

const BLOCK_REASONS = [
  'Confirmed fraudulent transactions',
  'Repeated serious violations',
  'Harassment or abusive behavior',
  'Fake account or impersonation',
  'Repeated violations despite previous suspensions',
  'Other'
];

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'mechanic'>('all');
  const [toast, setToast] = useState({ show: false, msg: '', color: 'success' });

  // Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'suspend' | 'block' | 'delete' | 'activate' | null>(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [suspendDays, setSuspendDays] = useState<number>(3);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    let result = users;
    if (roleFilter !== 'all') result = result.filter(u => u.role === roleFilter);
    if (search) {
      result = result.filter(u => 
        u.fullName.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredUsers(result);
  }, [users, roleFilter, search]);

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setIsLoading(false);
  };

  const openModal = (user: User, action: 'suspend' | 'block' | 'delete' | 'activate') => {
    setSelectedUser(user);
    setActionType(action);
    setSelectedReason('');
    setEvidence('');
    setSuspendDays(3);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setActionType(null);
    setSelectedReason('');
    setEvidence('');
  };

  const handleConfirmAction = async () => {
    if (!selectedUser || !actionType) return;
    
    if (actionType !== 'activate' && actionType !== 'delete' && !selectedReason) {
      setToast({ show: true, msg: 'Please select a reason.', color: 'warning' });
      return;
    }
    if (actionType === 'block' && !evidence.trim()) {
      setToast({ show: true, msg: 'Supporting evidence is required for blocking.', color: 'warning' });
      return;
    }

    setIsProcessing(true);

    try {
      if (actionType === 'delete') {
        await deleteUserAccount(selectedUser.id, selectedUser.role);
        setToast({ show: true, msg: 'User account deleted permanently.', color: 'success' });
      } else {
        const finalReason = actionType === 'activate' 
          ? 'Account reactivated by Admin' 
          : `${selectedReason}${evidence ? ` | Evidence: ${evidence}` : ''}`;

        const statusMap = {
          'suspend': 'suspended',
          'block': 'blocked',
          'activate': 'active'
        } as const;
        
        await updateUserAccountStatus(
          selectedUser.id, 
          statusMap[actionType], 
          finalReason, 
          actionType === 'suspend' ? suspendDays : 0
        );
        setToast({ show: true, msg: `User successfully ${actionType}d.`, color: 'success' });
      }
      closeModal();
      loadUsers();
    } catch (error) {
      setToast({ show: true, msg: 'Failed to perform action.', color: 'danger' });
    } finally {
      setIsProcessing(false);
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === 'mechanic') return constructOutline;
    if (role === 'admin') return shieldOutline;
    return personOutline;
  };

  const getStatusBadge = (user: User) => {
    const status = user.accountStatus || (user.isActive === false ? 'suspended' : 'active');
    if (status === 'blocked') return <span style={{ fontSize: 10, background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>BLOCKED</span>;
    if (status === 'suspended') return <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>SUSPENDED</span>;
    return <span style={{ fontSize: 10, background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>ACTIVE</span>;
  };

  // ✅ HELPER PARA SA MGA INPUT FIELDS
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    background: '#f8fafc',
    fontSize: '14px',
    color: '#0f172a',
    marginTop: '6px',
    outline: 'none',
    fontFamily: 'inherit'
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  } as React.CSSProperties;

  return (
    <IonPage>
      <IonContent className="admin-page" fullscreen>
        <div className="admin-container">
          
          <div 
            className="admin-header"
            style={{ 
              background: 'linear-gradient(135deg, #00b4d8 0%, #06b6d4 100%)',
              boxShadow: '0 10px 30px -10px rgba(0, 180, 216, 0.5)'
            }}
          >
            <h1>Manage Users</h1>
            <p>Total registered: {users.length}</p>
          </div>

          <div className="admin-content">
            <div className="admin-search-bar">
              <IonIcon icon={searchOutline} style={{ color: '#9ca3af', fontSize: 20 }} />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="admin-filters">
              {['all', 'customer', 'mechanic'].map((role) => (
                <div 
                  key={role}
                  className={`admin-filter-btn ${roleFilter === role ? 'active' : ''}`}
                  onClick={() => setRoleFilter(role as any)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {role}
                </div>
              ))}
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><IonSpinner /></div>
            ) : filteredUsers.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280' }}>No users found.</p>
            ) : (
              <div className="admin-list-grid">
                {filteredUsers.map((u) => {
                  const status = u.accountStatus || (u.isActive === false ? 'suspended' : 'active');
                  
                  return (
                    <div key={u.id} className="admin-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px', opacity: status === 'blocked' ? 0.7 : 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: status === 'active' ? '#f0fdf4' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: status === 'active' ? '#1a4d3e' : '#9ca3af' }}>
                          <IonIcon icon={getRoleIcon(u.role)} style={{ fontSize: 22 }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {u.fullName}
                            </h3>
                            {getStatusBadge(u)}
                          </div>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280', textTransform: 'capitalize' }}>
                            {u.role} • {u.email}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                        {status !== 'active' ? (
                          <button className="admin-btn btn-success" style={{ flex: 1, padding: '8px' }} onClick={() => openModal(u, 'activate')}>
                            <IonIcon icon={checkmarkCircleOutline} style={{ marginRight: 4 }} /> Activate
                          </button>
                        ) : (
                          <>
                            <button className="admin-btn" style={{ flex: 1, padding: '8px', background: '#fef3c7', color: '#92400e', border: 'none' }} onClick={() => openModal(u, 'suspend')}>
                              <IonIcon icon={timeOutline} style={{ marginRight: 4 }} /> Suspend
                            </button>
                            <button className="admin-btn btn-danger" style={{ flex: 1, padding: '8px' }} onClick={() => openModal(u, 'block')}>
                              <IonIcon icon={banOutline} style={{ marginRight: 4 }} /> Block
                            </button>
                          </>
                        )}
                        <button className="admin-btn" style={{ padding: '8px', background: '#fee2e2', color: '#991b1b', border: 'none' }} onClick={() => openModal(u, 'delete')}>
                          <IonIcon icon={trashOutline} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ✅ BAGONG MODERN UI PARA SA MODAL */}
        <IonModal isOpen={!!selectedUser} onDidDismiss={closeModal} style={{ '--border-radius': '24px' }}>
          
          {/* Custom Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a', textTransform: 'capitalize' }}>
                {actionType} User
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Admin Moderation Panel</p>
            </div>
            <button onClick={closeModal} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <IonIcon icon={closeOutline} style={{ fontSize: '20px', color: '#64748b' }} />
            </button>
          </div>

          {/* Content */}
          <IonContent className="ion-padding" style={{ '--background': '#ffffff' } as React.CSSProperties}>
            
            {/* User Info Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
                <IonIcon icon={getRoleIcon(selectedUser?.role || '')} style={{ fontSize: 24 }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{selectedUser?.fullName}</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>{selectedUser?.email}</p>
              </div>
            </div>

            {/* DELETING WARNING */}
            {actionType === 'delete' && (
              <div style={{ background: '#fee2e2', padding: '16px', borderRadius: '12px', color: '#991b1b', fontWeight: '600', fontSize: '14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <IonIcon icon={alertCircleOutline} style={{ fontSize: '24px', flexShrink: 0 }} />
                <span>⚠️ Babala: Permanenteng mabubura ang account na ito at hindi na maibabalik pa.</span>
              </div>
            )}

            {/* SUSPEND PROCESS */}
            {actionType === 'suspend' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>1. Select Reason (Required)</label>
                  <select value={selectedReason} onChange={(e) => setSelectedReason(e.target.value)} style={inputStyle}>
                    <option value="">-- Select a reason --</option>
                    {SUSPEND_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>2. Additional Evidence (Optional)</label>
                  <textarea placeholder="Ilagay ang detalye..." value={evidence} onChange={(e) => setEvidence(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <div>
                  <label style={labelStyle}>3. Duration</label>
                  <select value={suspendDays} onChange={(e) => setSuspendDays(Number(e.target.value))} style={inputStyle}>
                    <option value={1}>1 Day</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>7 Days</option>
                    <option value={30}>30 Days (1 Month)</option>
                  </select>
                </div>
              </div>
            )}

            {/* BLOCK PROCESS */}
            {actionType === 'block' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#991b1b', fontWeight: 700 }}>Violation History</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#7f1d1d', lineHeight: 1.5 }}>
                    {selectedUser?.statusReason ? `Last action reason: ${selectedUser.statusReason}` : 'No previous violation history found.'}
                  </p>
                </div>
                <div>
                  <label style={labelStyle}>1. Blocking Reason (Required)</label>
                  <select value={selectedReason} onChange={(e) => setSelectedReason(e.target.value)} style={inputStyle}>
                    <option value="">-- Select a reason --</option>
                    {BLOCK_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>2. Supporting Evidence (Required)</label>
                  <textarea placeholder="Ilagay ang documented complaints, screenshots links, etc..." value={evidence} onChange={(e) => setEvidence(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'none' }} />
                  <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px', fontWeight: 500 }}>⚠️ Evidence is strictly required for blocking.</p>
                </div>
              </div>
            )}
            
            {actionType === 'activate' && (
              <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.6 }}>Are you sure you want to restore full access to this account?</p>
            )}
          </IonContent>
          
          {/* Custom Footer */}
          <div style={{ padding: '20px 24px', background: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
            <button 
              className="admin-btn" 
              onClick={handleConfirmAction} 
              disabled={
                isProcessing || 
                (actionType !== 'activate' && actionType !== 'delete' && !selectedReason) || 
                (actionType === 'block' && !evidence.trim())
              }
              style={{ 
                width: '100%', 
                padding: '16px', 
                background: actionType === 'delete' ? '#ef4444' : actionType === 'block' ? '#ef4444' : actionType === 'suspend' ? '#f59e0b' : '#10b981', 
                color: 'white', 
                borderRadius: '14px', 
                fontSize: '15px', 
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                opacity: (
                  isProcessing || 
                  (actionType !== 'activate' && actionType !== 'delete' && !selectedReason) || 
                  (actionType === 'block' && !evidence.trim())
                ) ? 0.6 : 1,
                cursor: (
                  isProcessing || 
                  (actionType !== 'activate' && actionType !== 'delete' && !selectedReason) || 
                  (actionType === 'block' && !evidence.trim())
                ) ? 'not-allowed' : 'pointer'
              }}
            >
              {isProcessing ? 'Processing...' : `Confirm ${actionType}`}
            </button>
          </div>
        </IonModal>

        <IonToast isOpen={toast.show} onDidDismiss={() => setToast({ ...toast, show: false })} message={toast.msg} color={toast.color} duration={3000} />
      </IonContent>
    </IonPage>
  );
};

export default AdminUsers;