import { NextRequest, NextResponse } from 'next/server';
import type { PaymentRequest } from '@/lib/buildOrderData';
import { 
  processPayment, 
  validatePaymentRequest,
  getAvailablePaymentMethods
} from '@/lib/paymentController';

export const runtime = 'nodejs';

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  validationErrors?: Record<string, string>;
}

interface SuccessResponse {
  success: true;
  data: any;
  timestamp: string;
}

type ApiResponse = SuccessResponse | ErrorResponse;

function createErrorResponse(
  error: string,
  code: string = 'PAYMENT_ERROR',
  statusCode: number = 400
): [ApiResponse, number] {
  return [
    {
      success: false,
      error,
      code,
    },
    statusCode,
  ];
}

function createSuccessResponse(data: any): [ApiResponse, number] {
  return [
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    200,
  ];
}

async function validateRequest(body: unknown): Promise<{
  valid: boolean;
  data?: PaymentRequest;
  error?: string;
}> {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      error: 'Invalid request body',
    };
  }

  const paymentRequest = body as PaymentRequest;

  const validation = validatePaymentRequest(paymentRequest);

  if (!validation.valid) {
    return {
      valid: false,
      error: validation.error,
    };
  }

  return {
    valid: true,
    data: paymentRequest,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const startTime = Date.now();
  const correlationId = request.headers.get('X-Correlation-ID') || 
    `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(`
╔════════════════════════════════════════════════════════════╗
║ PAYMENT SUBMISSION REQUEST                                 ║
║ Correlation ID: ${correlationId}
║ Timestamp: ${new Date().toISOString()}
╚════════════════════════════════════════════════════════════╝
  `);

  try {
    const body = await request.json();
    console.log(`📋 Request body received:`, {
      method: body.paymentMethod,
      restaurant: body.restaurantRef,
      cartItems: body.orderData?.cartItems?.length,
    });

    const requestValidation = await validateRequest(body);
    if (!requestValidation.valid) {
      console.error(`❌ Request validation failed:`, requestValidation.error);
      const [errorResponse, statusCode] = createErrorResponse(
        requestValidation.error || 'Invalid request',
        'VALIDATION_ERROR',
        400
      );
      return NextResponse.json(errorResponse, { status: statusCode });
    }

    const paymentData = requestValidation.data!;

    console.log(`✅ Request validation passed`);
    console.log(`🔄 Processing payment...`);

    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      console.error(`❌ BACKEND_API_URL environment variable not set`);
      const [errorResponse, statusCode] = createErrorResponse(
        'Backend configuration error',
        'CONFIG_ERROR',
        500
      );
      return NextResponse.json(errorResponse, { status: statusCode });
    }

    const paymentResult = await processPayment(paymentData, backendUrl);

    const processingTime = Date.now() - startTime;
    console.log(`
╔════════════════════════════════════════════════════════════╗
║ PAYMENT PROCESSING COMPLETED                               ║
║ Status: ${paymentResult.success ? '✅ SUCCESS' : '❌ FAILED'}
║ Processing Time: ${processingTime}ms
║ Order ID: ${paymentResult.orderId || 'N/A'}
╚════════════════════════════════════════════════════════════╝
    `);

    if (!paymentResult.success) {
      const [errorResponse, statusCode] = createErrorResponse(
        paymentResult.error || 'Payment processing failed',
        'PAYMENT_FAILED',
        402
      );
      return NextResponse.json(errorResponse, { status: statusCode });
    }

    const [successResponse] = createSuccessResponse({
      orderId: paymentResult.orderId,
      status: paymentResult.status,
      paid: paymentResult.paid,
      message: paymentResult.message,
      paymentUrl: paymentResult.paymentUrl,
      sessionId: paymentResult.sessionId,
      processingTime: `${processingTime}ms`,
    });

    return NextResponse.json(successResponse, {
      headers: {
        'X-Correlation-ID': correlationId,
        'X-Processing-Time': `${processingTime}ms`,
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : '';

    console.error(`
╔════════════════════════════════════════════════════════════╗
║ CRITICAL ERROR                                             ║
║ Processing Time: ${processingTime}ms
║ Error: ${errorMessage}
║ Stack: ${errorStack?.split('\n')[1] || 'N/A'}
╚════════════════════════════════════════════════════════════╝
    `);

    const [errorResponse, statusCode] = createErrorResponse(
      `Payment processing error: ${errorMessage}`,
      'INTERNAL_ERROR',
      500
    );

    return NextResponse.json(errorResponse, {
      status: statusCode,
      headers: {
        'X-Correlation-ID': correlationId,
        'X-Processing-Time': `${processingTime}ms`,
      },
    });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const methods = getAvailablePaymentMethods();

    console.log(`📋 Available payment methods requested`);

    const [successResponse] = createSuccessResponse({
      methods,
      count: methods.length,
    });

    return NextResponse.json(successResponse);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`❌ Error retrieving payment methods:`, errorMessage);

    const [errorResponse, statusCode] = createErrorResponse(
      'Failed to retrieve payment methods',
      'CONFIG_ERROR',
      500
    );

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
      'Content-Type': 'application/json',
    },
  });
}
