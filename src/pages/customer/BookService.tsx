// src/pages/customer/BookService.tsx
import React, { useState, useEffect } from 'react';
import {
  IonContent, IonPage, IonIcon, IonLoading, IonToast, IonSpinner, IonModal, useIonRouter,
} from '@ionic/react';
import {
  constructOutline, carSportOutline, documentTextOutline, locationOutline, addOutline, navigateOutline, closeOutline,
  carOutline, calendarOutline, textOutline, colorPaletteOutline // 👈 IDINAGDAG NA ICONS
} from 'ionicons/icons';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createBooking, getAllMechanics, getUserVehicles, addUserVehicle } from '../../api/firebaseService';
import { reverseGeocode } from '../../api/geocoding';
import { Mechanic, ServiceType, Vehicle, ServiceItem } from '../../types';
import InteractiveMap from '../../components/InteractiveMap';
import './BookService.css';

const DEFAULT_LAT = 14.5995;
const DEFAULT_LNG = 120.9842;

const BookService: React.FC = () => {
  const { user } = useAuth();
  const router = useIonRouter();
  const [searchParams] = useSearchParams();
  const preselectedMechanicId = searchParams.get('mechanic');
  const preselectedServiceId = searchParams.get('serviceId');

  const [serviceType, setServiceType] = useState<ServiceType>('repair');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [issueDescription, setIssueDescription] = useState('');
  const [locationAddress, setLocationAddress] = useState('');

  const [latitude, setLatitude] = useState(DEFAULT_LAT);
  const [longitude, setLongitude] = useState(DEFAULT_LNG);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('danger');
  
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [newMake, setNewMake] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newColor, setNewColor] = useState('');
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);

  useEffect(() => {
    if (user) loadVehicles();
    fetchAddressFromCoords(DEFAULT_LAT, DEFAULT_LNG);
  }, [user]);

  useEffect(() => {
    if (preselectedMechanicId) loadMechanicInfo();
  }, [preselectedMechanicId]);

  const loadVehicles = async () => {
    if (!user) return;
    setIsLoadingVehicles(true);
    try {
      const data = await getUserVehicles(user.id);
      setVehicles(data);
      if (data.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const loadMechanicInfo = async () => {
    try {
      const all = await getAllMechanics();
      const found = all.find((m) => m.id === preselectedMechanicId);
      if (found) {
        setMechanic(found);
        if (preselectedServiceId && found.services) {
          const selected = found.services.find(s => s.id === preselectedServiceId);
          if (selected) setSelectedService(selected);
        } 
        else if (found.services && found.services.length > 0) {
          setSelectedService(found.services[0]);
        }
      }
    } catch (error) {
      console.error('Error loading mechanic:', error);
    }
  };

  const showMessage = (message: string, color: string = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const openAddVehicleModal = () => {
    setNewMake(''); setNewModel(''); setNewYear(''); setNewPlate(''); setNewColor('');
    setShowVehicleModal(true);
  };

  const handleSaveNewVehicle = async () => {
    if (!newMake.trim() || !newModel.trim() || !newYear.trim() || !newPlate.trim() || !newColor.trim()) {
      showMessage('Please fill in all vehicle fields', 'danger');
      return;
    }
    const yearNum = parseInt(newYear);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      showMessage('Please enter a valid year', 'danger');
      return;
    }
    if (!user) return;

    setIsSavingVehicle(true);
    try {
      const newVehicleId = await addUserVehicle(user.id, {
        make: newMake.trim(), model: newModel.trim(), year: yearNum,
        plateNumber: newPlate.trim(), color: newColor.trim(),
      });
      const refreshed = await getUserVehicles(user.id);
      setVehicles(refreshed);
      setSelectedVehicleId(newVehicleId);
      setShowVehicleModal(false);
      showMessage('Vehicle added successfully', 'success');
    } catch (error: any) {
      console.error('❌ FIRESTORE ERROR ❌', error);
      showMessage(`Failed to add vehicle: ${error?.message || 'Unknown error'}`, 'danger');
    } finally {
      setIsSavingVehicle(false);
    }
  };

  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    setIsGeocodingAddress(true);
    try {
      const address = await reverseGeocode(lat, lng);
      setLocationAddress(address);
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  const handleMapLocationChange = async (lat: number, lng: number) => {
    if (isNaN(lat) || isNaN(lng)) return;
    setLatitude(lat);
    setLongitude(lng);
    await fetchAddressFromCoords(lat, lng);
  };

  const getCurrentLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      showMessage('Geolocation is not supported', 'danger');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (isNaN(lat) || isNaN(lng)) {
          setIsLocating(false);
          return showMessage('Failed to get GPS coordinates', 'danger');
        }
        setLatitude(lat);
        setLongitude(lng);
        await fetchAddressFromCoords(lat, lng);
        setIsLocating(false);
      },
      (error) => {
        console.error('Location error:', error);
        showMessage('Unable to get location. Please allow access.', 'danger');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mechanic && mechanic.status !== 'available') {
      return showMessage('This mechanic is currently offline and cannot accept bookings.', 'danger');
    }

    if (!selectedVehicleId) return showMessage('Please select a vehicle', 'danger');
    if (mechanic && mechanic.services && mechanic.services.length > 0 && !selectedService) return showMessage('Please select a service', 'danger');
    if (!locationAddress.trim()) return showMessage('Please set your location', 'danger');
    if (!user) return;

    const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
    if (!vehicle) return showMessage('Vehicle not found', 'danger');

    setIsLoading(true);
    try {
      const bookingData: any = {
        customerId: user.id, 
        customerName: user.fullName, 
        customerPhone: user.phone, 
        customerProfileImage: user.profileImage || '', 
        serviceType,
        serviceName: selectedService ? selectedService.name : 'General Service',
        vehicle, issueDescription: issueDescription.trim() || 'No additional notes',
        location: { latitude, longitude, address: locationAddress.trim() }, status: 'pending',
        price: selectedService ? selectedService.price : 0, paymentStatus: 'pending', createdAt: new Date().toISOString(),
      };

      if (mechanic) {
        bookingData.mechanicId = mechanic.id;
        bookingData.mechanicName = mechanic.fullName;
      }

      await createBooking(bookingData);
      showMessage('Booking created successfully!', 'success');
      setTimeout(() => {
        router.push('/customer/bookings', 'forward', 'replace');
      }, 1500);
    } catch (error: any) {
      console.error('Booking error:', error);
      showMessage(error.message || 'Failed to create booking', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="book-page" fullscreen>
        <div className="book-container">
          
          <div className="book-header" style={{ marginBottom: '20px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Book a Service</h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>
              {mechanic ? `Booking with ${mechanic.fullName}` : "Tell us what you need and we'll connect you with a mechanic"}
            </p>
          </div>

          <div className="form-section">
            <label className="form-label">SERVICE TYPE</label>
            <div className="service-types">
              <div className={`service-type-card ${serviceType === 'repair' ? 'active' : ''}`} onClick={() => setServiceType('repair')}>
                <IonIcon icon={constructOutline} /><span>Home Repair</span>
              </div>
              <div className={`service-type-card ${serviceType === 'roadside' ? 'active' : ''}`} onClick={() => setServiceType('roadside')}>
                <IonIcon icon={carSportOutline} /><span>Roadside Assistance</span>
              </div>
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">SELECT VEHICLE</label>
            {isLoadingVehicles ? (
              <div style={{ textAlign: 'center', padding: '20px' }}><IonSpinner name="crescent" /></div>
            ) : (
              <div className="vehicle-list">
                {vehicles.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' }}>Please add your vehicle to proceed.</div>
                ) : (
                  vehicles.map((vehicle) => (
                    <div key={vehicle.id} className={`vehicle-option ${selectedVehicleId === vehicle.id ? 'active' : ''}`} onClick={() => setSelectedVehicleId(vehicle.id)}>
                      <div className="vehicle-icon"><IonIcon icon={carSportOutline} /></div>
                      <div className="vehicle-info">
                        <h3>{vehicle.make} {vehicle.model} ({vehicle.year})</h3>
                        <p>{vehicle.plateNumber} • {vehicle.color}</p>
                      </div>
                    </div>
                  ))
                )}
                <button type="button" className="add-vehicle-btn" onClick={openAddVehicleModal}><IonIcon icon={addOutline} /> Add New Vehicle</button>
              </div>
            )}
          </div>

          <div className="form-section">
            <label className="form-label">DESCRIBE THE ISSUE</label>
            <div className="form-input">
              <IonIcon icon={documentTextOutline} />
              <textarea placeholder="Describe your vehicle issue in detail..." value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} rows={3} />
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">YOUR LOCATION</label>
            <div className="form-input" style={{ marginBottom: '12px' }}>
              <IonIcon icon={locationOutline} />
              {isGeocodingAddress ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}><IonSpinner name="crescent" style={{ width: '18px', height: '18px' }} /><span>Getting address...</span></div>
              ) : (
                <input type="text" placeholder="Enter your current address" value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)} />
              )}
            </div>
            <InteractiveMap latitude={latitude} longitude={longitude} onLocationChange={handleMapLocationChange} draggable={true} height="260px" zoom={16} />
            
            <button type="button" className="location-btn" onClick={getCurrentLocation} disabled={isLocating}>
              {isLocating ? <IonSpinner name="crescent" /> : <IonIcon icon={navigateOutline} />}
              {isLocating ? 'Getting location...' : 'Use My Current Location'}
            </button>
          </div>

          <button type="button" className="submit-btn" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating Booking...' : 'Confirm Booking'}
          </button>
        </div>

        {/* ✅ BAGONG MODAL DESIGN (Walang Ionic Header, may icons) */}
        <IonModal isOpen={showVehicleModal} onDidDismiss={() => setShowVehicleModal(false)}>
          <IonContent className="vehicle-modal-content">
            
            <div className="vehicle-modal-header">
              <h2>Add New Vehicle</h2>
              <button className="vehicle-modal-close" onClick={() => setShowVehicleModal(false)}>
                <IonIcon icon={closeOutline} />
              </button>
            </div>
            
            <p className="vehicle-modal-subtitle">Enter your vehicle details below.</p>

            <div className="vehicle-form-field">
              <label>Brand / Make</label>
              <div className="vehicle-input-wrapper">
                <IonIcon icon={carOutline} />
                <input type="text" placeholder="e.g., Toyota" value={newMake} onChange={(e) => setNewMake(e.target.value)} />
              </div>
            </div>

            <div className="vehicle-form-field">
              <label>Model</label>
              <div className="vehicle-input-wrapper">
                <IonIcon icon={carOutline} />
                <input type="text" placeholder="e.g., Vios" value={newModel} onChange={(e) => setNewModel(e.target.value)} />
              </div>
            </div>

            <div className="vehicle-form-field">
              <label>Year</label>
              <div className="vehicle-input-wrapper">
                <IonIcon icon={calendarOutline} />
                <input type="number" placeholder="e.g., 2020" value={newYear} onChange={(e) => setNewYear(e.target.value)} />
              </div>
            </div>

            <div className="vehicle-form-field">
              <label>Plate Number</label>
              <div className="vehicle-input-wrapper">
                <IonIcon icon={textOutline} />
                <input type="text" placeholder="e.g., ABC 123" value={newPlate} onChange={(e) => setNewPlate(e.target.value)} />
              </div>
            </div>

            <div className="vehicle-form-field">
              <label>Color</label>
              <div className="vehicle-input-wrapper">
                <IonIcon icon={colorPaletteOutline} />
                <input type="text" placeholder="e.g., White" value={newColor} onChange={(e) => setNewColor(e.target.value)} />
              </div>
            </div>

            <button className="vehicle-modal-btn primary" onClick={handleSaveNewVehicle} disabled={isSavingVehicle}>
              {isSavingVehicle ? 'Saving...' : 'Save Vehicle'}
            </button>
            <button className="vehicle-modal-btn secondary" onClick={() => setShowVehicleModal(false)}>
              Cancel
            </button>

          </IonContent>
        </IonModal>

        <IonLoading isOpen={isLoading} message="Creating booking..." />
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={2500} color={toastColor} />
      </IonContent>
    </IonPage>
  );
};

export default BookService;