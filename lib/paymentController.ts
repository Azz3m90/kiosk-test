import type { PaymentRequest } from './buildOrderData';
import { buildCashPaymentPayload, buildCashOrderData } from './cashPaymentHandler';

interface PaymentMethod {
  name: string;
  handler: (request: PaymentRequest, backendUrl: string) => Promise<any>;
}

interface PaymentResponse {
  success: boolean;
  orderId?: number;
  status?: string;
  paid?: boolean;
  message?: string;
  paymentUrl?: string;
  sessionId?: string;
  orderData?: any;
  error?: string;
  details?: any;
}

const PAYMENT_METHODS: Record<string, PaymentMethod> = {
  cash: {
    name: 'Cash',
    handler: processCashPayment,
  },
  bancontact: {
    name: 'Bancontact',
    handler: processCashPayment,
  },
  credit_card: {
    name: 'Credit Card',
    handler: processCreditCardPayment,
  },
  vivawallet: {
    name: 'Viva Wallet',
    handler: processLocalPayment,
  },
  ccv: {
    name: 'CCV',
    handler: processLocalPayment,
  },
  counter: {
    name: 'Counter Payment',
    handler: processCounterPayment,
  },
};

async function processCashPayment(
  body: PaymentRequest,
  backendUrl: string
): Promise<PaymentResponse> {
  console.log(`💰 [Cash Payment] Processing payment for restaurant: ${body.restaurantRef}`);

  const orderId = body.nextOrderId || Math.floor(Date.now() / 1000);
  const cashPayload = buildCashPaymentPayload(body, orderId);

  try {
    const backendResponse = await fetch(`${backendUrl}/api/kiosk/payment/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        restaurantRef: cashPayload.restaurantRef,
        restaurantName: cashPayload.restaurantName,
        paymentMethod: cashPayload.paymentMethod,
        totalPrice: cashPayload.totalPrice,
        deliveryMethod: cashPayload.deliveryMethod,
        deliveryFee: cashPayload.deliveryFee,
        customerName: cashPayload.customerName,
        customerEmail: cashPayload.customerEmail,
        customerPhone: cashPayload.customerPhone,
        customerNotes: cashPayload.customerNotes,
        cartItems: cashPayload.cartItems,
        kioskId: cashPayload.kioskId,
        additionalOptions: cashPayload.additionalOptions,
        vat: cashPayload.vat,
      }),
    });

    const backendData = await backendResponse.json();

    if (!backendResponse.ok) {
      console.error(`❌ [Cash Payment] Backend error:`, backendData);
      return {
        success: false,
        error: backendData.error || 'Backend payment processing failed',
        details: backendData.details,
      };
    }

    console.log(`✅ [Cash Payment] Order processed successfully:`, {
      orderId: backendData.orderId,
      status: backendData.status,
    });

    const orderData = buildCashOrderData(body, backendData.orderId || orderId);

    return {
      success: true,
      orderId: backendData.orderId || orderId,
      status: backendData.status || 'Processing',
      paid: backendData.paid || false,
      orderData: orderData,
      message: backendData.message || 'Order created successfully. Payment pending.',
    };
  } catch (error) {
    console.error('❌ [Cash Payment] Processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing error',
    };
  }
}

async function processCreditCardPayment(
  body: PaymentRequest,
  backendUrl: string
): Promise<PaymentResponse> {
  console.log(`💳 [Credit Card] Initializing payment session`);

  const orderId = body.nextOrderId || Math.floor(Date.now() / 1000);

  try {
    const initResponse = await fetch(`${backendUrl}/api/kiosk/payment/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        restaurantRef: body.restaurantRef,
        restaurantName: body.restaurantName,
        totalPrice: body.orderData.totalPrice,
        deliveryFee: body.orderData.deliveryFee || 0,
        customerName: body.orderData.customerName,
        customerEmail: body.orderData.customerEmail,
        customerPhone: body.orderData.customerPhone,
        orderId: orderId,
        cartItems: body.orderData.cartItems,
      }),
    });

    const initData = await initResponse.json();

    if (!initResponse.ok) {
      console.error(`❌ [Credit Card] Initialization failed:`, initData);
      return {
        success: false,
        error: initData.error || 'Failed to initialize payment',
      };
    }

    console.log(`✅ [Credit Card] Payment session created:`, {
      sessionId: initData.sessionId,
    });

    return {
      success: true,
      orderId: orderId,
      status: 'Pending Payment',
      paid: false,
      paymentUrl: initData.paymentUrl,
      sessionId: initData.sessionId,
      message: 'Proceed to payment gateway',
    };
  } catch (error) {
    console.error('❌ [Credit Card] Initialization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment initialization error',
    };
  }
}

async function processLocalPayment(
  body: PaymentRequest,
  backendUrl: string,
  paymentMethod: string = 'vivawallet'
): Promise<PaymentResponse> {
  console.log(`🏪 [${paymentMethod}] Processing local payment`);

  const orderId = body.nextOrderId || Math.floor(Date.now() / 1000);

  try {
    const backendResponse = await fetch(`${backendUrl}/api/kiosk/payment/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        restaurantRef: body.restaurantRef,
        restaurantName: body.restaurantName,
        paymentMethod: paymentMethod,
        totalPrice: body.orderData.totalPrice,
        deliveryMethod: body.orderData.deliveryMethod,
        deliveryFee: body.orderData.deliveryFee || 0,
        customerName: body.orderData.customerName,
        customerEmail: body.orderData.customerEmail,
        customerPhone: body.orderData.customerPhone,
        customerNotes: body.orderData.customerNotes,
        cartItems: body.orderData.cartItems,
        kioskId: body.kioskId,
      }),
    });

    const backendData = await backendResponse.json();

    if (!backendResponse.ok) {
      console.error(`❌ [${paymentMethod}] Backend error:`, backendData);
      return {
        success: false,
        error: backendData.error || 'Local payment processing failed',
      };
    }

    console.log(`✅ [${paymentMethod}] Order processed:`, {
      orderId: backendData.orderId,
      status: backendData.status,
    });

    return {
      success: true,
      orderId: backendData.orderId || orderId,
      status: backendData.status || 'Processing',
      paid: backendData.paid || false,
      message: backendData.message || 'Order created successfully.',
    };
  } catch (error) {
    console.error(`❌ [${paymentMethod}] Processing error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing error',
    };
  }
}

async function processCounterPayment(
  body: PaymentRequest,
  backendUrl: string
): Promise<PaymentResponse> {
  console.log(`🏦 [Counter] Processing counter payment`);

  const orderId = body.nextOrderId || Math.floor(Date.now() / 1000);

  try {
    const backendResponse = await fetch(`${backendUrl}/api/kiosk/payment/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        restaurantRef: body.restaurantRef,
        restaurantName: body.restaurantName,
        paymentMethod: 'counter',
        totalPrice: body.orderData.totalPrice,
        deliveryMethod: body.orderData.deliveryMethod || 'counter',
        deliveryFee: 0,
        customerName: body.orderData.customerName,
        customerEmail: body.orderData.customerEmail,
        customerPhone: body.orderData.customerPhone,
        customerNotes: body.orderData.customerNotes,
        cartItems: body.orderData.cartItems,
        kioskId: body.kioskId,
      }),
    });

    const backendData = await backendResponse.json();

    if (!backendResponse.ok) {
      console.error(`❌ [Counter] Backend error:`, backendData);
      return {
        success: false,
        error: backendData.error || 'Counter payment creation failed',
      };
    }

    console.log(`✅ [Counter] Order awaiting counter payment:`, {
      orderId: backendData.orderId,
    });

    return {
      success: true,
      orderId: backendData.orderId || orderId,
      status: 'Awaiting Counter Payment',
      paid: false,
      message: 'Order created. Please proceed to counter for payment.',
    };
  } catch (error) {
    console.error('❌ [Counter] Processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Counter payment creation error',
    };
  }
}

export function validatePaymentRequest(body: PaymentRequest): {
  valid: boolean;
  error?: string;
} {
  const errors: string[] = [];

  if (!body.restaurantRef) {
    errors.push('Missing restaurantRef');
  }

  if (!body.paymentMethod) {
    errors.push('Missing paymentMethod');
  }

  if (!PAYMENT_METHODS[body.paymentMethod]) {
    errors.push(`Invalid payment method: ${body.paymentMethod}`);
  }

  if (!body.orderData || !body.orderData.cartItems) {
    errors.push('Missing orderData or empty cart');
  }

  if (body.orderData.cartItems?.length === 0) {
    errors.push('Cart is empty');
  }

  if (!body.orderData?.customerName) {
    errors.push('Missing customer name');
  }

  if (!body.orderData?.customerEmail) {
    errors.push('Missing customer email');
  }

  if (body.orderData?.totalPrice === undefined || body.orderData.totalPrice <= 0) {
    errors.push('Invalid order total');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: errors.join('; '),
    };
  }

  return { valid: true };
}

export async function processPayment(
  body: PaymentRequest,
  backendUrl?: string
): Promise<PaymentResponse> {
  const url = backendUrl || process.env.BACKEND_API_URL || 'http://localhost:8000';

  console.log('=== Payment Processing Started ===');
  console.log(`Payment Method: ${body.paymentMethod}`);
  console.log(`Restaurant: ${body.restaurantRef}`);
  console.log(`Amount: ${body.orderData.totalPrice}`);

  try {
    const validation = validatePaymentRequest(body);
    if (!validation.valid) {
      console.error('❌ Validation failed:', validation.error);
      return {
        success: false,
        error: validation.error,
      };
    }

    const paymentMethod = PAYMENT_METHODS[body.paymentMethod];
    if (!paymentMethod) {
      console.error('❌ Invalid payment method:', body.paymentMethod);
      return {
        success: false,
        error: `Invalid payment method: ${body.paymentMethod}`,
      };
    }

    const result = await paymentMethod.handler(body, url);

    if (result.success) {
      console.log('✅ Payment processed successfully');
    } else {
      console.error('❌ Payment processing failed:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected payment error',
    };
  }
}

export async function handleCreditCardCallback(
  callbackData: any,
  backendUrl?: string
): Promise<PaymentResponse> {
  const url = backendUrl || process.env.BACKEND_API_URL || 'http://localhost:8000';

  console.log('=== Credit Card Callback Processing ===');
  console.log(`Transaction ID: ${callbackData.transactionId}`);
  console.log(`Status: ${callbackData.status}`);

  try {
    const response = await fetch(`${url}/api/kiosk/payment/credit-card-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(callbackData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Callback processing failed:', data);
      return {
        success: false,
        error: data.error || 'Callback processing failed',
      };
    }

    console.log('✅ Callback processed successfully');
    return {
      success: true,
      message: data.message,
      status: data.orderStatus,
    };
  } catch (error) {
    console.error('❌ Callback error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Callback processing error',
    };
  }
}

export function getAvailablePaymentMethods(): Array<{
  id: string;
  name: string;
}> {
  return Object.entries(PAYMENT_METHODS).map(([id, method]) => ({
    id,
    name: method.name,
  }));
}
