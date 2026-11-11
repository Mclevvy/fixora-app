// src/pages/mechanic/MechanicDashboard.tsx
import React, { useEffect, useState } from 'react';
import {
  IonContent, IonPage, IonIcon, IonSpinner, IonRefresher, IonRefresherContent,
} from '@ionic/react';
import {
  constructOutline, checkmarkDoneOutline, carSportOutline, arrowForwardOutline,
  timeOutline, star, cashOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToMechanicBookings, subscribeToPendingBookings, getMechanicProfile,
} from '../../api/firebaseService';
import { Booking } from '../../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import './MechanicDashboard.css';

const MechanicDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [myJobs, setMyJobs] = useState<Booking[]>([]);
  const [pending, setPending] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [rating, setRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  
  const [mechanicStatus, setMechanicStatus] = useState<'available' | 'busy' | 'offline'>('offline');

  useEffect(() => {
    if (!user) return;

    getMechanicProfile(user.id).then((profile) => {
      if (profile) {
        setRating(profile.rating || 0);
        setTotalReviews(profile.totalReviews || 0);
        setMechanicStatus(profile.status || 'offline');
      }
    });

    const unsub1 = subscribeToMechanicBookings(user.id, (data) => {
      setMyJobs(data);
      setIsLoading(false);
    });

    const unsub2 = subscribeToPendingBookings((data) => {
      const relevantPending = data.filter(b => !b.mechanicId || b.mechanicId === user.id);
      setPending(relevantPending);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  const activeJobs = myJobs.filter((b) => ['accepted', 'in-progress'].includes(b.status));
  const completedJobs = myJobs.filter((b) => b.status === 'completed');
  const cancelledJobs = myJobs.filter((b) => b.status === 'cancelled');
  
  const todayStr = new Date().toISOString().split('T')[0];
  
  // ✅ BINAGO: 90% ng price (kung paid na) ang earnings ni Mechanic
  const todaysEarnings = completedJobs
    .filter(b => b.paymentStatus === 'paid' && (b.updatedAt || b.createdAt).startsWith(todayStr))
    .reduce((sum, b) => sum + ((b.price || 0) * 0.90), 0);

  const doRefresh = (event: any) => {
    setTimeout(() => event.detail.refresher ? event.detail.complete() : event.detail.complete(), 800);
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        fullDate: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }
    return days;
  };

  const last7Days = getLast7Days();
  
  const weeklyData = last7Days.map(dayInfo => {
    // ✅ BINAGO: 90% share at paid status filter
    const dayJobs = completedJobs.filter(b => b.paymentStatus === 'paid' && (b.updatedAt || b.createdAt).startsWith(dayInfo.fullDate));
    const dayEarnings = dayJobs.reduce((sum, b) => sum + ((b.price || 0) * 0.90), 0);
    return {
      name: dayInfo.dayName,
      jobs: dayJobs.length,
      earnings: dayEarnings,
    };
  });

  const statusData = [
    { name: 'Pending', value: pending.length, color: '#f59e0b' },
    { name: 'Active', value: activeJobs.length, color: '#3b82f6' },
    { name: 'Completed', value: completedJobs.length, color: '#10b981' },
    { name: 'Cancelled', value: cancelledJobs.length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="mech-dash">
          <div className="mech-center">
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="mech-dash" fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={doRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="mech-dash-header">
          <div className="mech-header-info">
            <p className="mech-greeting">Welcome back,</p>
            <h1 className="mech-name">{user?.fullName || 'Mechanic'}</h1>
            
            <div className="mech-rating-badge">
              <IonIcon icon={star} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{rating > 0 ? rating.toFixed(1) : 'New'}</span>
                <span className="mech-review-count">({totalReviews} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 20px 0 20px', marginBottom: '-8px' }}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
            Ready to Get to Work?
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.4 }}>
            Manage your bookings, track your jobs, and keep your customers moving.
          </p>
        </div>

        <div className="mech-stats-grid">
          <div className="mech-stat-card">
            <div className="mech-stat-icon blue">
              <IonIcon icon={constructOutline} />
            </div>
            <div className="mech-stat-info">
              <h3>{activeJobs.length}</h3>
              <p>Active Jobs</p>
            </div>
          </div>

          <div className="mech-stat-card">
            <div className="mech-stat-icon cyan">
              <IonIcon icon={checkmarkDoneOutline} />
            </div>
            <div className="mech-stat-info">
              <h3>{completedJobs.length}</h3>
              <p>Completed</p>
            </div>
          </div>

          <div className="mech-stat-card">
            <div className="mech-stat-icon yellow">
              <IonIcon icon={cashOutline} />
            </div>
            <div className="mech-stat-info">
              {/* ✅ IPINAKITA ANG 90% EARNINGS PARA SA ARAW NA ITO */}
              <h3>₱{todaysEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p>Today's Earnings (90%)</p>
            </div>
          </div>

          <div className="mech-stat-card">
            <div className="mech-stat-icon purple">
              <IonIcon icon={timeOutline} />
            </div>
            <div className="mech-stat-info">
              <h3>{pending.length}</h3>
              <p>New Requests</p>
            </div>
          </div>
        </div>

        <div className="mech-section">
          <div className="mech-section-head">
            <h2>Weekly Job Performance</h2>
          </div>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="jobs" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mech-section">
          <div className="mech-section-head">
            <h2>Earnings Trend</h2>
          </div>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₱${val}`} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: any) => [`₱${value}`, 'Earnings']} />
                <Line type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {statusData.length > 0 && (
          <div className="mech-section">
            <div className="mech-section-head">
              <h2>Booking Status</h2>
            </div>
            <div className="chart-card" style={{ display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {pending.length > 0 && (
          <div className="mech-section">
            <div className="mech-section-head">
              <h2>New Requests</h2>
              <button onClick={() => navigate('/mechanic/jobs')}>
                View all <IonIcon icon={arrowForwardOutline} />
              </button>
            </div>
            <div className="mech-job-list">
              {pending.slice(0, 2).map((job) => (
                <div key={job.id} className="mech-job-card" onClick={() => navigate(`/mechanic/job/${job.id}`)}>
                  <div className="mech-job-icon"><IonIcon icon={constructOutline} /></div>
                  <div className="mech-job-info">
                    <h4>{job.customerName || 'Customer'}</h4>
                    <p>{job.vehicle?.make} {job.vehicle?.model} • {job.vehicle?.plateNumber}</p>
                  </div>
                  <span className="mech-job-status pending">New</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mech-section">
          <div className="mech-section-head">
            <h2>Active Jobs</h2>
            <button onClick={() => navigate('/mechanic/jobs')}>
              View all <IonIcon icon={arrowForwardOutline} />
            </button>
          </div>
          {activeJobs.length === 0 ? (
            <div className="mech-empty">
              <IonIcon icon={carSportOutline} />
              <p>No active jobs right now</p>
            </div>
          ) : (
            <div className="mech-job-list">
              {activeJobs.slice(0, 3).map((job) => (
                <div key={job.id} className="mech-job-card" onClick={() => navigate(`/mechanic/job/${job.id}`)}>
                  <div className="mech-job-icon"><IonIcon icon={constructOutline} /></div>
                  <div className="mech-job-info">
                    <h4>{job.customerName || 'Customer'}</h4>
                    <p>{job.vehicle?.make} {job.vehicle?.model} • {job.vehicle?.plateNumber}</p>
                  </div>
                  <span className={`mech-job-status ${job.status}`}>
                    {job.status === 'in-progress' ? 'In Progress' : 'Accepted'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MechanicDashboard;