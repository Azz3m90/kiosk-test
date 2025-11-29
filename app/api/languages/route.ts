import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to fetch restaurant languages from Laravel backend
 * GET /api/languages?restaurant=Test-FastCaisse
 * 
 * Features:
 * - Fetches from Laravel languages endpoint
 * - Returns available languages and default language
 * - Includes language metadata (code, name, isDefault, isAvailable)
 */
export async function GET(request: NextRequest) {
  try {
    const restaurantName = request.nextUrl.searchParams.get('restaurant') || process.env.NEXT_PUBLIC_RESTAURANT_NAME || 'Test-FastCaisse';
    console.log('🔍 /api/languages: Received request for restaurant:', restaurantName);

    const backendUrl = `https://fastcaisse.be/food3/public/api/restaurants/${encodeURIComponent(restaurantName)}/languages`;
    console.log('🚀 /api/languages: Calling backend URL:', backendUrl);

    // Fetch languages from Laravel backend
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    console.log('📥 /api/languages: Backend response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`❌ /api/languages: Backend error: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json(
        { error: `Backend returned ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const laravelData = await response.json();
    console.log('✅ /api/languages: Backend data received:', laravelData);

    // Extract and validate the data
    const languagesData = laravelData.data;
    
    if (!languagesData) {
      console.error('❌ /api/languages: Invalid response structure (no data field)');
      return NextResponse.json(
        { error: 'Invalid response structure from backend' },
        { status: 500 }
      );
    }

    // Return the data with proper structure
    const result = {
      restaurant_ref: languagesData.restaurant_ref,
      restaurant_name: languagesData.restaurant_name,
      languages: languagesData.languages || [],
      default_language: languagesData.default_language,
      available_count: languagesData.available_count || 0,
    };
    
    console.log('✅ /api/languages: Returning success response');
    
    return NextResponse.json(
      { data: result },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      }
    );
  } catch (error) {
    console.error('❌ /api/languages: Error:', error);

    if (error instanceof TypeError && error.message.includes('timeout')) {
      console.error('⏱️ /api/languages: Request timeout to backend');
      return NextResponse.json(
        { error: 'Request timeout to backend (10s)' },
        { status: 504 }
      );
    }

    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Internal server error: ${errorMsg}` },
      { status: 500 }
    );
  }
}