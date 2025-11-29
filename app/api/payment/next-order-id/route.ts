import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${backendUrl}/api/kiosk/payment/next-order-id`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.debug(`ℹ️ [/api/payment/next-order-id] Using timestamp fallback`);
      return NextResponse.json({
        success: true,
        nextOrderId: Math.floor(Date.now() / 1000)
      });
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      nextOrderId: result.nextOrderId || Math.floor(Date.now() / 1000)
    });

  } catch (error) {
    console.debug('ℹ️ [/api/payment/next-order-id] Backend unavailable, using timestamp fallback');
    return NextResponse.json({
      success: true,
      nextOrderId: Math.floor(Date.now() / 1000)
    });
  }
}
