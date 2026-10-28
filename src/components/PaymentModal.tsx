// src/components/PaymentModal.tsx
import React, { useState } from 'react';
import {
  IonModal,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import {
  closeOutline,
  cardOutline,
  lockClosedOutline,
  alertCircleOutline,
  phonePortraitOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import './PaymentModal.css';

interface PaymentModalProps {
  isOpen: boolean;
  amount: number;
  bookingId: string;
  onClose: () => void;
  onSuccess: (transactionId: string) => void;
  onFailure: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  amount,
  bookingId,
  onClose,
  onSuccess,
  onFailure,
}) => {
  // ✅ State para sa Card at GCash
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gcash'>('card');

  // Card states
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');

  // GCash state
  const [gcashNumber, setGcashNumber] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const isCardValid =
    cardNumber.replace(/\s/g, '').length === 16 &&
    expiry.length === 5 &&
    cvc.length >= 3 &&
    name.trim().length > 1;

  const isGCashValid = gcashNumber.length === 11 && gcashNumber.startsWith('09');

  const isValid = paymentMethod === 'card' ? isCardValid : isGCashValid;

  const handlePay = async () => {
    setError('');
    if (!isValid) {
      setError(`Please fill in all ${paymentMethod === 'card' ? 'card' : 'GCash'} details correctly.`);
      return;
    }

    setIsProcessing(true);

    try {
      // ✅ SIMULATION NG GCASH O CARD
      if (paymentMethod === 'gcash') {
        // GCash flow: Mag-load ng mas matagal para kunwari nag-re-redirect
        await new Promise((r) => setTimeout(r, 2500)); 
      } else {
        // Card flow
        await new Promise((r) => setTimeout(r, 1800));
      }

      // Simulate failure
      const testFail = 
        (paymentMethod === 'card' && cardNumber.replace(/\s/g, '') === '4000000000000002') ||
        (paymentMethod === 'gcash' && gcashNumber === '09000000000'); // Fake fail number

      if (testFail) {
        setError(`${paymentMethod === 'card' ? 'Card' : 'GCash'} payment declined. Please try again.`);
        onFailure();
        setIsProcessing(false);
        return;
      }

      // Generate fake transaction ID base sa method
      const prefix = paymentMethod === 'card' ? 'pi_card_' : 'gcash_';
      const fakeTransactionId = `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      
      onSuccess(fakeTransactionId);
    } catch (e: any) {
      setError(e.message || 'Payment failed. Please try again.');
      onFailure();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    setCardNumber('');
    setExpiry('');
    setCvc('');
    setName('');
    setGcashNumber('');
    setError('');
    onClose();
  };

  const formatGCashNumber = (val: string) => {
    return val.replace(/\D/g, '').slice(0, 11);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="payment-modal">
      <div className="payment-modal-content">
        {/* Header */}
        <div className="payment-modal-header">
          <div className="payment-modal-title">
            <h2>Payment</h2>
            <p>Secure checkout</p>
          </div>
          <button className="payment-close" onClick={handleClose} disabled={isProcessing}>
            <IonIcon icon={closeOutline} />
          </button>
        </div>

        {/* Amount Card */}
        <div className="payment-amount-card">
          <div className="payment-amount-label">Amount to Pay</div>
          <div className="payment-amount-value">₱{amount.toLocaleString()}</div>
          <div className="payment-amount-note">
            <IonIcon icon={lockClosedOutline} />
            <span>Secured encryption</span>
          </div>
        </div>

        {/* ✅ PAYMENT METHOD TABS */}
        <div className="payment-method-tabs">
          <button 
            className={`method-tab ${paymentMethod === 'card' ? 'active' : ''}`}
            onClick={() => { setPaymentMethod('card'); setError(''); }}
            disabled={isProcessing}
          >
            <IonIcon icon={cardOutline} /> Credit/Debit Card
          </button>
          <button 
            className={`method-tab ${paymentMethod === 'gcash' ? 'active gcash-active' : ''}`}
            onClick={() => { setPaymentMethod('gcash'); setError(''); }}
            disabled={isProcessing}
          >
            <span className="gcash-logo-text">GCash</span>
          </button>
        </div>

        {/* ✅ CARD FORM */}
        {paymentMethod === 'card' && (
          <div className="payment-form animate-fade-in">
            <label>Card Number</label>
            <div className="payment-input-wrap">
              <IonIcon icon={cardOutline} className="payment-input-icon" />
              <input
                type="text"
                inputMode="numeric"
                placeholder="4242 4242 4242 4242"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                disabled={isProcessing}
                maxLength={19}
              />
            </div>

            <div className="payment-row">
              <div className="payment-col">
                <label>Expiry</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  disabled={isProcessing}
                  maxLength={5}
                />
              </div>
              <div className="payment-col">
                <label>CVC</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="123"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  disabled={isProcessing}
                  maxLength={4}
                />
              </div>
            </div>

            <label>Name on Card</label>
            <input
              type="text"
              placeholder="Juan Dela Cruz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isProcessing}
            />
          </div>
        )}

        {/* ✅ GCASH FORM */}
        {paymentMethod === 'gcash' && (
          <div className="payment-form animate-fade-in">
            <div className="gcash-info-box">
              <IonIcon icon={phonePortraitOutline} />
              <p>Enter your GCash registered mobile number. You will be redirected to the GCash app to complete the payment.</p>
            </div>
            
            <label>GCash Mobile Number</label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="0912 345 6789"
              value={gcashNumber}
              onChange={(e) => setGcashNumber(formatGCashNumber(e.target.value))}
              disabled={isProcessing}
              maxLength={11}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="payment-error">
            <IonIcon icon={alertCircleOutline} />
            <span>{error}</span>
          </div>
        )}

        {/* Test Cards Note */}
        <div className="payment-test-note">
          <strong>Test scenarios:</strong>
          {paymentMethod === 'card' ? (
            <>
              <span>Success: 4242 4242 4242 4242</span>
              <span>Failure: 4000 0000 0000 0002</span>
            </>
          ) : (
            <>
              <span>Success: Any 09XX number</span>
              <span>Failure: 09000000000</span>
            </>
          )}
        </div>

        {/* Submit Button */}
        <button
          className={`payment-submit ${paymentMethod === 'gcash' ? 'gcash-btn' : ''}`}
          onClick={handlePay}
          disabled={!isValid || isProcessing}
        >
          {isProcessing ? (
            <>
              <IonSpinner name="crescent" style={{ width: 20, height: 20 }} />
              {paymentMethod === 'gcash' ? 'Connecting to GCash...' : 'Processing...'}
            </>
          ) : (
            <>
              <IonIcon icon={lockClosedOutline} />
              Pay ₱{amount.toLocaleString()}
            </>
          )}
        </button>
      </div>
    </IonModal>
  );
};

export default PaymentModal;