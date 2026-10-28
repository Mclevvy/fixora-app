// src/pages/admin/AdminUsers.tsx
import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon, IonSpinner, IonToast } from '@ionic/react';
import { personOutline, constructOutline, shieldOutline, lockClosedOutline, lockOpenOutline, searchOutline } from 'ionicons/icons';
import { getAllUsers, toggleUserStatus } from '../../api/firebaseService';
import { User } from '../../types';
import './Admin.css';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'mechanic'>('all');
  const [toast, setToast] = useState({ show: false, msg: '', color: 'success' });

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

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.isActive === false ? true : false;
    try {
      await toggleUserStatus(user.id, newStatus);
      setToast({ show: true, msg: `User ${newStatus ? 'Activated' : 'Deactivated'}`, color: 'success' });
      loadUsers();
    } catch (e) {
      setToast({ show: true, msg: 'Failed to update user', color: 'danger' });
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === 'mechanic') return constructOutline;
    if (role === 'admin') return shieldOutline;
    return personOutline;
  };

  return (
    <IonPage>
      <IonContent className="admin-page" fullscreen>
        <div className="admin-container">
          <div className="admin-header">
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
                {filteredUsers.map((u) => (
                  <div key={u.id} className="admin-card">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: u.isActive === false ? '#f3f4f6' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: u.isActive === false ? '#9ca3af' : '#1a4d3e' }}>
                      <IonIcon icon={getRoleIcon(u.role)} style={{ fontSize: 22 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: u.isActive === false ? '#9ca3af' : '#1f2937', textDecoration: u.isActive === false ? 'line-through' : 'none' }}>
                        {u.fullName}
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.role} • {u.email}
                      </p>
                    </div>
                    <button 
                      className={`admin-btn ${u.isActive !== false ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => handleToggleStatus(u)}
                    >
                      <IonIcon icon={u.isActive !== false ? lockClosedOutline : lockOpenOutline} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {u.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <IonToast isOpen={toast.show} onDidDismiss={() => setToast({ ...toast, show: false })} message={toast.msg} color={toast.color} duration={2000} />
      </IonContent>
    </IonPage>
  );
};

export default AdminUsers;