import { NextRequest, NextResponse } from 'next/server';
import { buildOrderData, PaymentRequest } from '@/lib/buildOrderData';
import { 
  buildCashPaymentPayload,
  buildCashOrderData 
} from '@/lib/cashPaymentHandler';

export const runtime = 'nodejs';

async function saveOrderJsonToBackend(orderId: number | string, orderData: any): Promise<void> {
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  const endpoint = `${backendUrl}/api/kiosk/order/save-json`;

  try {
    console.log(`📤 [saveOrderJsonToBackend] Saving order JSON for Order ID: ${orderId}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        orderData: orderData
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ [saveOrderJsonToBackend] Failed to save order JSON:`, error);
    } else {
      const data = await response.json();
      console.log(`✅ [saveOrderJsonToBackend] Order JSON saved successfully`, data);
    }
  } catch (error) {
    console.error('❌ [saveOrderJsonToBackend] Error:', error);
  }
}

function validatePaymentRequest(body: PaymentRequest): { valid: boolean; error?: string } {
  if (!body.restaurantRef) {
    return { valid: false, error: 'Missing restaurantRef' };
  }

  if (!body.paymentMethod) {
    return { valid: false, error: 'Missing paymentMethod' };
  }

  if (!body.orderData || !body.orderData.cartItems) {
    return { valid: false, error: 'Missing orderData or cartItems' };
  }

  if (!body.orderData.customerName || !body.orderData.customerEmail) {
    return { valid: false, error: 'Missing customer information' };
  }

  return { valid: true };
}

async function processCashPayment(body: PaymentRequest) {
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  const paymentEndpoint = `${backendUrl}/api/kiosk/payment/process`;

  const orderId = body.nextOrderId || Math.floor(Date.now() / 1000);
  const cashPayload = buildCashPaymentPayload(body, orderId);
  const orderData = buildCashOrderData(body, orderId);

  console.log(`💰 [Cash Payment] Processing cash/bancontact order:`, {
    orderId,
    total: cashPayload.totalPrice,
    method: cashPayload.paymentMethod
  });

  try {
    const backendResponse = await fetch(paymentEndpoint, {
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
        orderJson: orderData,
      }),
    });

    const backendData = await backendResponse.json();

    if (!backendResponse.ok) {
      console.error(`❌ [Cash Payment] Backend error:`, backendData);
      throw new Error(backendData.error || 'Backend payment processing failed');
    }

    console.log(`✅ [Cash Payment] Order processed successfully:`, {
      orderId: backendData.orderId,
      status: backendData.status
    });

    console.log('📋 [buildCashOrderData] Generated JSON Order:', JSON.stringify(orderData, null, 2));

    return {
      success: true,
      orderId: backendData.orderId || orderId,
      status: backendData.status || 'created',
      paid: backendData.paid || false,
      orderData: orderData,
      message: backendData.message || 'Order created successfully. Payment pending.',
      paymentMethod: cashPayload.paymentMethod
    };
  } catch (error) {
    console.error('❌ [Cash Payment] Processing error:', error);
    throw error;
  }
}

async function processGenericPayment(body: PaymentRequest) {
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  const paymentEndpoint = `${backendUrl}/api/kiosk/payment/process`;

  console.log(`🔄 [/api/payment/submit] Processing ${body.paymentMethod} payment request:`, {
    method: body.paymentMethod,
    restaurant: body.restaurantRef,
    total: body.orderData.totalPrice
  });

  const orderId = body.nextOrderId || Math.floor(Date.now() / 1000);
  const orderData = buildOrderData(body);

  const backendResponse = await fetch(paymentEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      restaurantRef: body.restaurantRef,
      restaurantName: body.restaurantName,
      restaurantFirstName: body.restaurantFirstName,
      restaurantLastName: body.restaurantLastName,
      paymentMethod: body.paymentMethod,
      totalPrice: body.orderData.totalPrice,
      deliveryMethod: body.orderData.deliveryMethod,
      deliveryFee: 0,
      customerName: body.orderData.customerName,
      customerEmail: body.orderData.customerEmail,
      customerPhone: body.orderData.customerPhone,
      customerNotes: body.orderData.customerNotes,
      cartItems: body.orderData.cartItems,
      kioskId: body.kioskId,
      orderJson: orderData,
    }),
  });

  const backendData = await backendResponse.json();

  if (!backendResponse.ok) {
    console.error(`❌ [/api/payment/submit] Backend error:`, backendData);
    return {
      success: false,
      error: backendData.error || 'Payment processing failed',
      details: backendData.details || 'Unknown error'
    };
  }

  console.log(`✅ [/api/payment/submit] Backend response:`, backendData);

  if (backendData.requiresRedirect) {
    console.log(`🔀 [/api/payment/submit] Redirecting to payment gateway`);
    return {
      success: true,
      requiresRedirect: true,
      redirectUrl: backendData.redirectUrl,
      orderCode: backendData.orderCode,
      tempOrderId: backendData.tempOrderId,
    };
  }

  console.log('📋 [buildOrderData] Generated JSON Order:', JSON.stringify(orderData, null, 2));

  return {
    success: true,
    orderId: backendData.orderId,
    status: backendData.status,
    paid: backendData.paid,
    orderData: orderData,
    message: backendData.message,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json();

    const validation = validatePaymentRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid payment request' },
        { status: 400 }
      );
    }

    let response;

    if (body.paymentMethod === 'cash' || body.paymentMethod === 'bancontact') {
      response = await processCashPayment(body);
    } else {
      response = await processGenericPayment(body);
    }

    if (!response.success) {
      return NextResponse.json(response, { status: 400 });
    }

    return NextResponse.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isConnectionError = errorMessage.includes('ECONNREFUSED') || 
                             errorMessage.includes('fetch failed') ||
                             errorMessage.includes('Backend server');
    
    console.error('❌ [/api/payment/submit] Error:', errorMessage);
    
    return NextResponse.json(
      { 
        success: false,
        error: isConnectionError 
          ? 'Backend server unavailable. Please check that the backend is running.'
          : 'Internal server error',
        details: errorMessage,
        backendUrl: process.env.BACKEND_API_URL || 'http://localhost:8000'
      },
      { status: isConnectionError ? 503 : 500 }
    );
  }
}
