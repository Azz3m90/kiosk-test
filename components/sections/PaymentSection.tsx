'use client';

import { useState, useMemo, useEffect } from 'react';
import { useKiosk } from '@/context/KioskContext';
import { useTranslation } from '@/hooks/useTranslation';
import { validateCardNumber, validateCVV } from '@/lib/utils';
import { submitPayment } from '@/lib/payment';
import { PaymentSuccessMessage } from './payment/PaymentSuccessMessage';
import { OrderDataDisplay } from './payment/OrderDataDisplay';
import { PaymentMethodSelector } from './payment/PaymentMethodSelector';
import { CardPaymentForm } from './payment/CardPaymentForm';
import { CashPaymentView } from './payment/CashPaymentView';
import { VivaWalletView } from './payment/VivaWalletView';
import { BancontactView } from './payment/BancontactView';
import { CCVView } from './payment/CCVView';
import { CounterView } from './payment/CounterView';
import { PaymentSummaryPanel } from './payment/PaymentSummaryPanel';
import type { PaymentMethod } from '@/types';

export function PaymentSection() {
  const { resetKiosk, availablePaymentMethods, cart, restaurantName, restaurantRef, restaurantFirstName, restaurantLastName, restaurantEmail, diningMethod } = useKiosk();
  const { t } = useTranslation();

  const firstEnabledMethod = useMemo(() => {
    const enabled = Object.entries(availablePaymentMethods).find(([_, method]) => method.enabled);
    return (enabled?.[0] as PaymentMethod) || 'cash';
  }, [availablePaymentMethods]);

  const deliveryMethod = useMemo(() => {
    console.log('🔄 PaymentSection - diningMethod:', diningMethod);
    return diningMethod || 'pickup';
  }, [diningMethod]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(firstEnabledMethod);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderData, setOrderData] = useState<any>(null);
  const [nextOrderId, setNextOrderId] = useState<number | null>(null);

  useEffect(() => {
    const fetchNextOrderId = async () => {
      try {
        const response = await fetch('/api/payment/next-order-id');
        const data = await response.json();
        if (data.success && data.nextOrderId) {
          setNextOrderId(data.nextOrderId);
        }
      } catch (error) {
        console.warn('Failed to fetch next order ID:', error);
      }
    };
    
    fetchNextOrderId();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (paymentMethod === 'credit_card') {
      if (!cardNumber || !validateCardNumber(cardNumber)) {
        newErrors.cardNumber = t('invalid_card_number');
      }
      if (!cardName.trim()) {
        newErrors.cardName = t('card_name_required');
      }
      if (!expiryDate.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
        newErrors.expiryDate = t('invalid_expiry_date');
      }
      if (!cvv || !validateCVV(cvv)) {
        newErrors.cvv = t('invalid_cvv');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const totalPrice = cart.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);

      console.log('💳 PaymentSection - Submitting payment with deliveryMethod:', deliveryMethod);

      const response = await submitPayment({
        restaurantRef: restaurantRef || 'unknown',
        restaurantName: restaurantName || 'Unknown',
        restaurantFirstName: restaurantFirstName || 'kiosk',
        restaurantLastName: restaurantLastName || 'kiosk',
        paymentMethod,
        orderData: {
          cartItems: cart,
          totalPrice,
          deliveryMethod: deliveryMethod,
          diningMethod: deliveryMethod,
          customerName: restaurantFirstName || 'Customer',
          customerEmail: restaurantEmail || '',
          customerPhone: '',
          customerNotes: '',
        },
        kioskId: 'kiosk_default',
        nextOrderId: nextOrderId || undefined,
      });

      if (!response.success) {
        throw new Error(response.error || 'Payment failed');
      }

      if (response.orderData) {
        setOrderData(response.orderData);
      }

      setIsProcessing(false);
      setPaymentSuccess(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      console.error('❌ Payment error:', errorMessage);
      setPaymentError(errorMessage);
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <section className="flex flex-col min-h-[calc(100vh-220px)] sm:min-h-[calc(100vh-200px)] lg:min-h-[calc(100vh-180px)] max-h-[calc(100vh-140px)] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg animate-fade-in pb-16 sm:pb-20 lg:pb-24">
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <PaymentSuccessMessage />
            {orderData && <OrderDataDisplay orderData={orderData} />}
            <div className="flex justify-center pt-4">
              <button
                onClick={() => {
                  resetKiosk();
                  setPaymentSuccess(false);
                  setOrderData(null);
                }}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                {t('new_order')}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col min-h-[calc(100vh-220px)] sm:min-h-[calc(100vh-200px)] lg:min-h-[calc(100vh-180px)] max-h-[calc(100vh-140px)] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg animate-fade-in pb-16 sm:pb-20 lg:pb-24">
      {/* Section Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-2 sm:py-3 lg:py-4 px-3 sm:px-4 lg:px-6 rounded-t-2xl flex-shrink-0">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('payment_title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1">{t('payment_subtitle')}</p>
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        {paymentError && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 font-semibold">{t('error')}: {paymentError}</p>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Payment Method Selection */}
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
            />

            {/* Credit Card Payment Form */}
            {paymentMethod === 'credit_card' && (
              <CardPaymentForm
                cardNumber={cardNumber}
                setCardNumber={setCardNumber}
                cardName={cardName}
                setCardName={setCardName}
                expiryDate={expiryDate}
                setExpiryDate={setExpiryDate}
                cvv={cvv}
                setCvv={setCvv}
                errors={errors}
              />
            )}

            {/* Cash Payment */}
            {paymentMethod === 'cash' && <CashPaymentView />}

            {/* Bancontact Payment */}
            {paymentMethod === 'bancontact' && <BancontactView />}

            {/* Counter Payment */}
            {paymentMethod === 'counter' && <CounterView />}

            {/* VivaWallet Payment */}
            {paymentMethod === 'vivawallet' && <VivaWalletView />}

            {/* CCV Payment */}
            {paymentMethod === 'ccv' && <CCVView />}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <PaymentSummaryPanel
              onPayment={handlePayment}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </div>
    </section>
  );
}