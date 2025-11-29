export interface PaymentSubmissionData {
  restaurantRef: string;
  restaurantName: string;
  restaurantFirstName: string;
  restaurantLastName: string;
  paymentMethod: string;
  orderData: {
    cartItems: any[];
    totalPrice: number;
    deliveryMethod: string;
    diningMethod: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerNotes?: string;
  };
  kioskId?: string;
  nextOrderId?: number;
}

export interface PaymentResponse {
  success: boolean;
  data?: any;
  orderData?: any;
  error?: string;
  details?: string;
}

export async function submitPayment(paymentData: PaymentSubmissionData): Promise<PaymentResponse> {
  try {
    console.log('🔄 [Payment Service] Submitting payment:', {
      method: paymentData.paymentMethod,
      total: paymentData.orderData.totalPrice,
      restaurant: paymentData.restaurantRef
    });

    const response = await fetch('/api/payment/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const result: PaymentResponse = await response.json();

    if (!response.ok) {
      console.error('❌ [Payment Service] Payment submission failed:', result);
      return {
        success: false,
        error: result.error || 'Payment failed',
        details: result.details || 'Unknown error',
      };
    }

    console.log('✅ [Payment Service] Payment submitted successfully');
    console.log('📋 [Payment Service] Order Data:', result.orderData);
    return result;
  } catch (error) {
    console.error('❌ [Payment Service] Error submitting payment:', error);
    return {
      success: false,
      error: 'Network error',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function getPaymentMethodTitle(method: string, translations: any): string {
  const methodMap: Record<string, string> = {
    cash: 'cash',
    credit_card: 'credit_card',
    bancontact: 'bancontact',
    vivawallet: 'vivawallet',
    ccv: 'ccv',
    counter: 'counter',
  };

  return translations[methodMap[method]] || method;
}
