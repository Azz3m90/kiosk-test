import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Fetch restaurant configuration from Laravel backend
 * Includes: name, description, logo URLs, settings
 * 
 * Query params:
 * - restaurant: Restaurant name (required)
 * 
 * @returns Restaurant config with logo URLs
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const restaurantName = searchParams.get('restaurant');

    if (!restaurantName) {
      return NextResponse.json(
        { error: 'Restaurant name is required' },
        { status: 400 }
      );
    }

    // Get backend URL from environment
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const apiUrl = `${backendUrl}/api/restaurants/by-name/${encodeURIComponent(restaurantName)}/complete-data`;
    
    console.log(`🔍 [/api/config] Fetching from: ${apiUrl}`);
    
    // Fetch complete restaurant data from Laravel
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [/api/config] Backend response: ${response.status} ${response.statusText}`);
      console.error(`❌ [/api/config] Response body: ${errorText}`);
      return NextResponse.json(
        { 
          error: 'Failed to fetch restaurant configuration',
          details: `Backend returned ${response.status}: ${response.statusText}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      console.error(`❌ [/api/config] Invalid response structure`);
      console.error(`❌ [/api/config] Response:`, JSON.stringify(data).substring(0, 500));
      return NextResponse.json(
        { error: 'Invalid restaurant configuration' },
        { status: 404 }
      );
    }

    const restaurant = data.data.restaurant;
    const media = data.data.media || {};
    const settings = data.data.settings || {};
    
    console.log(`✅ [/api/config] Got media:`, JSON.stringify(media).substring(0, 200));

    // Helper function to build media URL from id and file_name
    const buildMediaUrl = (mediaItem: any) => {
      if (!mediaItem?.id || !mediaItem?.file_name) return null;
      
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const fileName = mediaItem.file_name.split('/').pop(); // Extract just the filename
      const url = `${baseUrl}/assets/img/logo/${mediaItem.id}/${fileName}`;
      
      console.log(`✅ [/api/config] Built URL: id=${mediaItem.id}, file=${mediaItem.file_name} -> ${url}`);
      return url;
    };

    // Extract dining methods from settings
    const diningMethods: any = {};
    if (settings.eat_in_method) {
      diningMethods.eatin = {
        title: settings.eat_in_method.title || 'Eat In',
        bgColor: settings.eat_in_method.bg_color || '#89fb60',
        enabled: true
      };
    }
    if (settings.pickup_method) {
      diningMethods.pickup = {
        title: settings.pickup_method.title || 'Pickup',
        bgColor: settings.pickup_method.bg_color || '#89fb60',
        enabled: true
      };
    }
    // Delivery method is disabled - do not extract from backend
    // if (settings.delivery_method) {
    //   diningMethods.delivery = {
    //     title: settings.delivery_method.title || 'Delivery',
    //     bgColor: settings.delivery_method.bg_color || '#89fb60',
    //     enabled: true
    //   };
    // }

    // Extract payment methods from settings
    const paymentMethods: any = {};
    const paymentMethodMapping = [
      { key: 'payment_methods_cash', id: 'cash', title: 'Cash', icon: 'banknote' },
      { key: 'payment_methods_credit_card', id: 'credit_card', title: 'Credit Card', icon: 'creditcard' },
      { key: 'payment_methods_bancontact', id: 'bancontact', title: 'Bancontact', icon: 'bancontact' },
      { key: 'payment_methods_vivawallet', id: 'vivawallet', title: 'VivaWallet', icon: 'wallet' },
      { key: 'payment_methods_local_(vivawallet)', id: 'vivawallet', title: 'VivaWallet', icon: 'wallet' },
      { key: 'payment_methods_ccv', id: 'ccv', title: 'CCV', icon: 'smartphone' },
      { key: 'payment_methods_counter', id: 'counter', title: 'Pay at Counter', icon: 'store' }
    ];

    paymentMethodMapping.forEach(({ key, id, title, icon }) => {
      if (settings[key] && !paymentMethods[id]) {
        const setting = settings[key];
        let cleanTitle = setting.title && setting.title.trim() ? setting.title : title;
        
        cleanTitle = cleanTitle
          .replace(/^payment\s+methods?:\s*/i, '')
          .replace(/^local\s*\(([^)]+)\)\s*/i, '$1')
          .trim();
        
        if (!cleanTitle || cleanTitle.toLowerCase().startsWith('payment')) {
          cleanTitle = title;
        }
        
        let cleanContent = '';
        if (setting.content && setting.content.trim()) {
          cleanContent = setting.content
            .replace(/<[^>]*>/g, '')
            .replace(/^payment\s+methods?:\s*/i, '')
            .trim();
        }
        
        paymentMethods[id] = {
          title: cleanTitle || title,
          enabled: true,
          icon: icon,
          content: cleanContent,
          bgColor: setting.bg_color || '#89fb60'
        };
      }
    });

    // Extract configuration needed for the frontend
    const config = {
      success: true,
      data: {
        name: restaurant.name || 'Restaurant Kiosk',
        description: restaurant.description || '',
        ref: restaurant.ref || '',
        logo: {
          header: buildMediaUrl(media.logo_header) || null,
          footer: buildMediaUrl(media.logo_footer) || null,
        },
        media: media,
        settings: settings,
        diningMethods: diningMethods,
        paymentMethods: paymentMethods,
        languages: data.data.languages || [],
        defaultLanguage: data.data.languages?.[0]?.code || 'en',
        status: data.data.status || {},
      }
    };
    
    console.log(`✅ [/api/config] Dining methods extracted:`, Object.keys(diningMethods));
    console.log(`✅ [/api/config] Payment methods extracted:`, Object.keys(paymentMethods));

    console.log(`✅ [/api/config] Sending response with logo:`, {
      header: config.data.logo.header ? '✓ Set' : '✗ Missing',
      footer: config.data.logo.footer ? '✓ Set' : '✗ Missing'
    });

    // Cache for 5 minutes
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });

  } catch (error) {
    console.error('Error in /api/config:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}