import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to fetch full menu from Laravel backend
 * GET /api/menu/full?restaurant=Test-FastCaisse
 * 
 * Features:
 * - Fetches from Laravel menu-full endpoint
 * - Filters out categories where show_in_page: 0
 * - Filters out items from hidden categories
 * - Transforms Laravel data structure to kiosk format
 */
export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const restaurantName = request.nextUrl.searchParams.get('restaurant') || process.env.NEXT_PUBLIC_RESTAURANT_NAME || 'Test-FastCaisse';
    
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      );
    }

    // Fetch full menu from Laravel backend
    const response = await fetch(
      `https://fastcaisse.be/food3/public/api/restaurants/${restaurantName}/menu-full`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      console.error(`Laravel API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: 'Failed to fetch menu from backend' },
        { status: response.status }
      );
    }

    const laravelData = await response.json();

    // Extract data from Laravel response
    // Laravel returns: { success: true, data: { restaurant: {...}, categories: [...], languages: [{code, name, isDefault, isAvailable}, ...], default_language: {code, name} } }
    const laravelCategories = laravelData.data?.categories || [];
    const laravelLanguagesData = laravelData.data?.languages || [];
    
    // Extract language codes from the language objects
    // laravelLanguagesData is an array of objects like {code: 'fr', name: 'Français', isDefault: true, isAvailable: true}
    const laravelLanguages = laravelLanguagesData.map((lang: any) => lang.code || lang);
    
    // Extract default language code
    let defaultLanguage = laravelData.data?.default_language?.code;
    
    if (!defaultLanguage) {
      // Try settings path (for backward compatibility)
      defaultLanguage = laravelData.data?.settings?.restaurant_settings?.default_language?.language;
    }
    
    if (!defaultLanguage) {
      // Try alternative settings path
      defaultLanguage = laravelData.data?.settings?.default_language?.code;
    }
    
    // Fallback to first available language or 'en'
    defaultLanguage = defaultLanguage || laravelLanguages[0] || 'en';
    
    console.log('DEBUG - Available Languages:', laravelLanguages);
    console.log('DEBUG - Default Language:', defaultLanguage);

    // Filter categories: only include categories where show_in_page !== 0
    const visibleCategories = laravelCategories.filter(
      (category: any) => category.show_in_page !== 0 && category.show_in_page !== false
    );

    // Get IDs of visible categories for filtering items
    const visibleCategoryIds = new Set(visibleCategories.map((cat: any) => cat.id));

    // Flatten all items from visible categories
    const allItems: any[] = [];
    visibleCategories.forEach((category: any) => {
      if (Array.isArray(category.items)) {
        category.items.forEach((item: any) => {
          allItems.push({
            ...item,
            categoryId: category.id,
            categoryRef: category.ref,
            categoryName: category.name,
          });
        });
      }
    });

    // Transform categories to match kiosk format
    const transformedCategories = visibleCategories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.ref || cat.name.toLowerCase().replace(/\s+/g, '-'),
      description: cat.description || '',
      color: cat.color || '#000000',
      imageUrl: cat.image_url || null,
      order: cat.category_order || 0,
    }));

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

    // Transform items to match kiosk format
    // Items from Laravel already have additions (options) and other nested data
    const transformedItems = allItems.map((item: any) => {
      const categorySlug = item.categoryRef || 
                          item.categoryName?.toLowerCase().replace(/\s+/g, '-') || 
                          'uncategorized';

      // Transform menu items (main components of combo) from Laravel format
      const optionsMap = new Map<string, any>();
      
      if (Array.isArray(item.menuItems)) {
        const menuItemsGroupName = 'Main Items';
        
        optionsMap.set(menuItemsGroupName, {
          name: menuItemsGroupName,
          type: item.menuItems.length === 1 ? 'radio' : 'checkbox',
          required: true,
          sourceType: 'menuItem',
          choices: [],
        });
        
        const option = optionsMap.get(menuItemsGroupName);
        item.menuItems.forEach((menuItem: any) => {
          option.choices.push({
            name: menuItem.name,
            price: parseFloat(menuItem.price) || 0,
            image: menuItem.image_url || undefined,
            ref: menuItem.id || menuItem.ref,
            id: menuItem.id,
          });
        });
      }

      // Transform additions (options) from Laravel format
      // Group additions by group_name to create proper option groups
      if (Array.isArray(item.additions)) {
        item.additions.forEach((addition: any) => {
          const groupName = addition.group_name || addition.name;
          
          if (!optionsMap.has(groupName)) {
            optionsMap.set(groupName, {
              name: groupName,
              type: addition.selection_type === 'radio' ? 'radio' : 'checkbox',
              required: addition.required === 1 || addition.required === true,
              sourceType: 'addition',
              choices: [],
            });
          }
          
          // Add this choice to the group
          const option = optionsMap.get(groupName);
          option.choices.push({
            name: addition.name,
            price: parseFloat(addition.price) || 0,
            image: addition.image_url || undefined,
            ref: addition.id || addition.ref,
            id: addition.id,
          });
        });
      }

      // Transform menuCategorys (category-based options) from Laravel format
      // These are composite options like "Select a Size", "Choose a Main Dish", etc.
      if (Array.isArray(item.menuCategorys)) {
        item.menuCategorys.forEach((menuCategory: any) => {
          const categoryName = menuCategory.name;
          
          if (!optionsMap.has(categoryName)) {
            // Determine selection type based on qty
            // qty === 1 means single selection (radio) - NO per-choice quantities
            // qty > 1 means multiple selections allowed (checkbox) - YES per-choice quantities
            const selectionType = menuCategory.qty === 1 ? 'radio' : 'checkbox';
            const allowPerChoiceQuantity = menuCategory.qty > 1; // Enable qty controls when qty > 1
            
            optionsMap.set(categoryName, {
              name: categoryName,
              type: selectionType,
              required: true, // All menu categories are required as they're mandatory composition steps
              sourceType: 'menuCategory',
              minSelection: menuCategory.qty === 1 ? 1 : undefined,
              maxSelection: menuCategory.qty > 1 ? menuCategory.qty : undefined,
              allowPerChoiceQuantity: allowPerChoiceQuantity,
              choices: [],
            });
          }
          
          // Add items from this category as choices
          const option = optionsMap.get(categoryName);
          if (Array.isArray(menuCategory.items)) {
            menuCategory.items.forEach((choice: any) => {
              option.choices.push({
                name: choice.name,
                price: parseFloat(choice.price) || 0,
                image: choice.image_url || undefined,
                ref: choice.id || choice.ref,
                id: choice.id,
                categoryRef: menuCategory.id || menuCategory.ref,
                categoryId: menuCategory.id,
              });
            });
          }
        });
      }
      
      const options = Array.from(optionsMap.values());

      return {
        id: item.id,
        name: item.name,
        description: item.ingredients || item.description || '',
        price: parseFloat(item.price) || 0,
        basePrice: parseFloat(item.price) || 0,
        image: item.image_url || '/assets/placeholder.svg',
        category: categorySlug,
        type: 'food', // Default type - can be enhanced with category detection
        hasOptions: options.length > 0,
        options: options,
      };
    });

    return NextResponse.json(
      {
        categories: allCategories,
        items: transformedItems,
        totalItems: transformedItems.length,
        totalCategories: allCategories.length,
        languages: laravelLanguages,
        defaultLanguage: defaultLanguage,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes
        },
      }
    );
  } catch (error) {
    console.error('Error fetching full menu:', error);

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