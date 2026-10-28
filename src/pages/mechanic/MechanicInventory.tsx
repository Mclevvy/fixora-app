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

const emptyItem = {
  name: '',
  category: 'Engine',
  quantity: 0,
  price: 0,
  unit: 'pc',
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
          quantity: Number(form.quantity),
          price: Number(form.price),
          unit: form.unit,
          lowStockThreshold: Number(form.lowStockThreshold),
        });
        setToast({ show: true, msg: 'Item updated', color: 'success' });
      } else {
        await addInventoryItem(user.id, {
          name: form.name,
          category: form.category,
          quantity: Number(form.quantity),
          price: Number(form.price),
          unit: form.unit,
          lowStockThreshold: Number(form.lowStockThreshold),
        });
        setToast({ show: true, msg: 'Item added', color: 'success' });
      }
      setShowModal(false);
    } catch (e) {
      console.error(e);
      setToast({ show: true, msg: 'Save failed', color: 'danger' });
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
    (i) => i.quantity <= i.lowStockThreshold
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
        <div className="inv-header">
          <div className="inv-head-row">
            <div>
              <h1>Inventory</h1>
              <p>
                {items.length} items • {lowStockCount} low stock
              </p>
            </div>
            <button className="inv-add-btn" onClick={openAdd}>
              <IonIcon icon={addOutline} /> Add
            </button>
          </div>

          <IonSearchbar
            value={search}
            onIonInput={(e) => setSearch(e.detail.value!)}
            placeholder="Search items..."
            className="inv-search"
          />
        </div>

        {lowStockCount > 0 && (
          <div className="inv-low-banner">
            <IonIcon icon={alertCircleOutline} />
            <span>{lowStockCount} item(s) low in stock</span>
          </div>
        )}

        <div className="inv-list">
          {filtered.length === 0 ? (
            <div className="inv-empty">
              <IonIcon icon={cubeOutline} />
              <p>No items yet. Tap "Add" to start.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const isLow = item.quantity <= item.lowStockThreshold;
              return (
                <div key={item.id} className="inv-card">
                  <div className="inv-card-top">
                    <div className={`inv-icon ${isLow ? 'low' : ''}`}>
                      <IonIcon icon={cubeOutline} />
                    </div>
                    <div className="inv-info">
                      <h3>{item.name}</h3>
                      <p>
                        {item.category} • ₱{item.price.toLocaleString()} /{' '}
                        {item.unit}
                      </p>
                    </div>
                    {/* ✅ PINALITAN: Custom class na imbes na default green badge */}
                    <IonBadge className={`inv-badge ${isLow ? 'low' : ''}`}>
                      {item.quantity} {item.unit}
                    </IonBadge>
                  </div>

                  <div className="inv-card-actions">
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
                      <IonIcon icon={trashOutline} /> Delete
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
              <IonInput
                label="Unit"
                labelPlacement="floating"
                value={form.unit}
                onIonInput={(e) => setForm({ ...form, unit: e.detail.value })}
                className="inv-input half"
              />
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