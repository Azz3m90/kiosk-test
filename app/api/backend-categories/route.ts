import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to fetch categories from Laravel backend
 * GET /api/backend-categories
 */
export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      );
    }

    // Fetch categories from Laravel backend
    const response = await fetch(`${apiUrl}/api/categories`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error(`Laravel API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: 'Failed to fetch categories from backend' },
        { status: response.status }
      );
    }

    const categories = await response.json();

    // Transform Laravel categories to match kiosk format
    const transformedCategories = Array.isArray(categories)
      ? categories.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.ref || cat.name.toLowerCase().replace(/\s+/g, '-'),
          description: cat.description || '',
          color: cat.color || '#000000',
          imageUrl: cat.image_url || null,
          order: cat.category_order || 0,
        }))
      : [];

    // Add 'all' category at the beginning
    const allCategories = [
      {
        id: 0,
        name: 'All',
        slug: 'all',
        description: 'All items',
        color: '#666666',
        imageUrl: null,
        order: -1,
      },
      ...transformedCategories.sort((a: any, b: any) => a.order - b.order),
    ];

    return NextResponse.json(allCategories, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    
    if (error instanceof TypeError && error.message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}