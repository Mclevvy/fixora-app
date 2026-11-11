// src/pages/mechanic/MechanicInventory.tsx
import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonSpinner,
  IonSearchbar,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonAlert,
  IonToast,
  IonBadge,
} from '@ionic/react';
import {
  cubeOutline,
  addOutline,
  createOutline,
  trashOutline,
  alertCircleOutline,
  removeCircleOutline,
} from 'ionicons/icons';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '../../api/firebaseService';
import { InventoryItem } from '../../types';
import './MechanicInventory.css';

const CATEGORIES = [
  'Engine',
  'Brakes',
  'Tires',
  'Electrical',
  'Fluids',
  'Tools',
  'Other',
];

const UNITS = ['pcs', 'set', 'liters', 'kg', 'meters', 'hours'];

const emptyItem = {
  name: '',
  category: 'Engine',
  quantity: 0,
  price: 0,
  unit: 'pcs',
  lowStockThreshold: 5,
};

const MechanicInventory: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<any>(emptyItem);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [toast, setToast] = useState({
    show: false,
    msg: '',
    color: 'success',
  });

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToInventory(user.id, (data) => {
      setItems(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, [user]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyItem);
    setShowModal(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({ ...item });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!user || !form.name) {
      setToast({ show: true, msg: 'Name is required', color: 'danger' });
      return;
    }
    try {
      if (editing) {
        await updateInventoryItem(editing.id, {
          name: form.name,
          category: form.category,
          quantity: Number(form.quantity) || 0,
          price: Number(form.price) || 0,
          unit: form.unit || 'pcs',
          lowStockThreshold: Number(form.lowStockThreshold) || 0,
        });
        setToast({ show: true, msg: 'Item updated', color: 'success' });
      } else {
        await addInventoryItem(user.id, {
          name: form.name,
          category: form.category,
          quantity: Number(form.quantity) || 0,
          price: Number(form.price) || 0,
          unit: form.unit || 'pcs',
          lowStockThreshold: Number(form.lowStockThreshold) || 0,
        });
        setToast({ show: true, msg: 'Item added', color: 'success' });
      }
      setShowModal(false);
    } catch (e) {
      console.error(e);
      setToast({ show: true, msg: 'Save failed', color: 'danger' });
    }
  };

  const handleDeduct = async (e: React.MouseEvent, item: InventoryItem) => {
    e.stopPropagation();
    if (item.quantity <= 0) {
      setToast({ show: true, msg: 'Out of stock na po ito.', color: 'warning' });
      return;
    }
    try {
      await updateInventoryItem(item.id, { quantity: Number(item.quantity) - 1 });
      setToast({ show: true, msg: `1 ${item.unit} ng ${item.name} ang nagamit.`, color: 'success' });
    } catch (error) {
      setToast({ show: true, msg: 'Failed to deduct stock', color: 'danger' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInventoryItem(deleteTarget);
      setToast({ show: true, msg: 'Item deleted', color: 'success' });
    } catch (e) {
      console.error(e);
      setToast({ show: true, msg: 'Delete failed', color: 'danger' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = items.filter(
    (i) => Number(i.quantity) <= Number(i.lowStockThreshold)
  ).length;

  if (isLoading) {
    return (
      <IonPage>
        <IonContent>
          <div className="mech-center">
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="inv-page" fullscreen>
        
        {/* ✅ HEADER: Title at Subtitle lang ang naiwan */}
        <div 
          className="inv-header" 
          style={{ 
            paddingBottom: '30px', 
            borderBottomLeftRadius: '32px', 
            borderBottomRightRadius: '32px' 
          }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
              Inventory Management
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 500, lineHeight: 1.5 }}>
              Monitor, organize, and manage your available parts and supplies.
            </p>
          </div>
        </div>

        {/* ✅ NASA LABAS NA: Stats at Add Button */}
        <div 
          style={{ 
            padding: '20px 20px 0 20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px' 
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: '14px', color: '#475569', fontWeight: 600 }}>
              {items.length} items • {lowStockCount} low stock
            </p>
          </div>
          <button 
            className="inv-add-btn" 
            onClick={openAdd} 
            style={{ padding: '8px 16px', fontSize: '13px', boxShadow: '0 4px 10px rgba(14, 165, 233, 0.2)' }}
          >
            <IonIcon icon={addOutline} /> Add
          </button>
        </div>

        {/* ✅ NASA LABAS NA: Search Bar */}
        <div style={{ padding: '0 20px' }}>
          <IonSearchbar
            value={search}
            onIonInput={(e) => setSearch(e.detail.value!)}
            placeholder="Search items..."
            className="inv-search"
            style={{ 
              '--background': 'white', 
              '--border-radius': '16px', 
              '--box-shadow': '0 4px 15px rgba(0, 0, 0, 0.05)' 
            } as React.CSSProperties} // 👈 IDINAGDAG ITO PARA MA-FIX ANG ERROR
          />
        </div>

        {lowStockCount > 0 && (
          <div className="inv-low-banner" style={{ margin: '16px 20px 0' }}>
            <IonIcon icon={alertCircleOutline} />
            <span>{lowStockCount} item(s) low in stock</span>
          </div>
        )}

        {/* ✅ LISTAHAN NG MGA ITEMS (Nasa labas din) */}
        <div 
          className="inv-list" 
          style={{ 
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}
        >
          {filtered.length === 0 ? (
            <div className="inv-empty" style={{ gridColumn: '1 / -1' }}>
              <IonIcon icon={cubeOutline} />
              <p>No items yet. Tap "Add" to start.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const isLow = Number(item.quantity) <= Number(item.lowStockThreshold);
              return (
                <div key={item.id} className="inv-card">
                  <div className="inv-card-top">
                    <div className={`inv-icon ${isLow ? 'low' : ''}`}>
                      <IonIcon icon={cubeOutline} />
                    </div>
                    <div className="inv-info">
                      <h3>{item.name}</h3>
                      <p>
                        {item.category} • ₱{Number(item.price).toLocaleString()} /{' '}
                        {item.unit}
                      </p>
                    </div>
                    <IonBadge className={`inv-badge ${isLow ? 'low' : ''}`}>
                      {item.quantity} {item.unit}
                    </IonBadge>
                  </div>

                  <div className="inv-card-actions">
                    <button
                      className="inv-btn use"
                      onClick={(e) => handleDeduct(e, item)}
                      style={{ background: '#e0f2fe', color: '#0ea5e9', border: 'none', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      <IonIcon icon={removeCircleOutline} /> Use (-1)
                    </button>
                    
                    <button
                      className="inv-btn edit"
                      onClick={() => openEdit(item)}
                    >
                      <IonIcon icon={createOutline} /> Edit
                    </button>
                    <button
                      className="inv-btn delete"
                      onClick={() => setDeleteTarget(item.id)}
                    >
                      <IonIcon icon={trashOutline} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <IonModal
          isOpen={showModal}
          onDidDismiss={() => setShowModal(false)}
          className="inv-modal"
        >
          <div className="inv-modal-content">
            <h2>{editing ? 'Edit Item' : 'Add Item'}</h2>

            <IonInput
              label="Name"
              labelPlacement="floating"
              value={form.name}
              onIonInput={(e) => setForm({ ...form, name: e.detail.value })}
              className="inv-input"
            />

            <IonSelect
              label="Category"
              labelPlacement="floating"
              value={form.category}
              onIonChange={(e) =>
                setForm({ ...form, category: e.detail.value })
              }
              className="inv-input"
            >
              {CATEGORIES.map((c) => (
                <IonSelectOption key={c} value={c}>
                  {c}
                </IonSelectOption>
              ))}
            </IonSelect>

            <div className="inv-input-row">
              <IonInput
                type="number"
                label="Quantity"
                labelPlacement="floating"
                value={form.quantity}
                onIonInput={(e) =>
                  setForm({ ...form, quantity: e.detail.value })
                }
                className="inv-input half"
              />
              
              <IonSelect
                label="Unit"
                labelPlacement="floating"
                value={form.unit}
                onIonChange={(e) => setForm({ ...form, unit: e.detail.value })}
                className="inv-input half"
              >
                {UNITS.map((u) => (
                  <IonSelectOption key={u} value={u}>
                    {u}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </div>

            <IonInput
              type="number"
              label="Price (₱)"
              labelPlacement="floating"
              value={form.price}
              onIonInput={(e) => setForm({ ...form, price: e.detail.value })}
              className="inv-input"
            />

            <IonInput
              type="number"
              label="Low Stock Threshold"
              labelPlacement="floating"
              value={form.lowStockThreshold}
              onIonInput={(e) =>
                setForm({ ...form, lowStockThreshold: e.detail.value })
              }
              className="inv-input"
            />

            <div className="inv-modal-actions">
              <IonButton fill="outline" onClick={() => setShowModal(false)}>
                Cancel
              </IonButton>
              <IonButton onClick={handleSave}>
                {editing ? 'Update' : 'Add'}
              </IonButton>
            </div>
          </div>
        </IonModal>

        <IonAlert
          isOpen={!!deleteTarget}
          onDidDismiss={() => setDeleteTarget(null)}
          header="Delete Item"
          message="Are you sure you want to delete this item?"
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Delete', role: 'destructive', handler: handleDelete },
          ]}
        />

        <IonToast
          isOpen={toast.show}
          onDidDismiss={() => setToast({ ...toast, show: false })}
          message={toast.msg}
          duration={2000}
          color={toast.color}
        />
      </IonContent>
    </IonPage>
  );
};

export default MechanicInventory;