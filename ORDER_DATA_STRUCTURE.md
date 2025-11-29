# Kiosk Order Data Structure - Complete Implementation

## Overview
The kiosk now builds complete order JSON data with menu_categories and additions, matching the food-ordering-app structure.

---

## Data Flow

### Stage 1: Frontend Cart Item (ItemOptionsModal.tsx)
When user adds item with options to cart:

```typescript
CartItem {
  id: string;
  ref: number;
  menuItemId: number;
  name: string;
  description: string;
  basePrice: number;
  finalPrice: number;
  quantity: number;
  image: string;
  type: 'food' | 'drink';
  selectedOptions?: SelectedOption[];
  specialInstructions?: string;
  
  // NEW: Structured option data grouped by category
  menuItems?: OrderMenuItem[];           // Flat array
  menuCategorys?: {                      // Grouped by category with items array
    ref: string;
    name: string;
    items: Array<{
      ref: string;
      name: string;
      qty: number;
      price: number;
    }>;
  }[];
  additions?: Addition[];                // Flat array
}
```

**Example:**
```json
{
  "id": "1762279284831",
  "ref": 882,
  "menuItemId": 882,
  "name": "KAP KEBAB (student)",
  "quantity": 1,
  "basePrice": 8,
  "finalPrice": 9,
  "menuItems": [
    {
      "ref": 882,
      "title": "KAP KEBAB",
      "extra": 0,
      "quantity": 1,
      "price": { "unit_price": {...}, "total_price": {...} }
    }
  ],
  "menuCategorys": [
    {
      "ref": "BOISSON",
      "name": "BOISSON",
      "items": [
        {
          "ref": "924",
          "name": "Purpple ice",
          "qty": 1,
          "price": 0
        }
      ]
    }
  ],
  "additions": [
    {
      "ref": 986,
      "title": "Cheddar sauce",
      "quantity": 1,
      "price": { "unit_price": {...}, "total_price": {...} }
    }
  ]
}
```

---

### Stage 2: Build Order Data (buildOrderData.ts)
Frontend processes cart items for API submission:

The `buildOrderData()` function transforms cart items and creates PaymentRequest with proper formatting:

```typescript
PaymentRequest {
  restaurantRef: string;
  restaurantName: string;
  restaurantFirstName: string;
  restaurantLastName: string;
  paymentMethod: string;
  orderData: {
    cartItems: CartItem[];          // Stage 1 format (grouped menuCategorys)
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
```

---

### Stage 3: Backend Processing (KioskPaymentController.php)
Backend receives grouped structure and processes it:

**Step 1:** `processCartItems()` - Handles grouped menuCategorys structure
```php
foreach ($cartItem['menuCategorys'] as $category) {
    if (isset($category['items']) && is_array($category['items'])) {
        foreach ($category['items'] as $item) {
            // Flattens grouped structure to flat array
        }
    }
}
```

**Step 2:** Creates final OrderData with flat structure:
```json
{
  "id": 16838,
  "current_state": "CREATED",
  "store": { "ref": "KAPS1", "name": "KAPS1" },
  "kiosk_id": "kiosk22",
  "eater": { ... },
  "cart": {
    "items": [
      {
        "ref": 882,
        "title": "KAP KEBAB (student)",
        "special_instructions": "مع دبس وحد",
        "quantity": 1,
        "price": { "unit_price": {...}, "total_price": {...} },
        "menuItems": [
          {
            "ref": 882,
            "title": "KAP KEBAB",
            "extra": 0,
            "quantity": 1,
            "price": { ... }
          }
        ],
        "menuCategorys": [
          {
            "ref": "924",
            "title": "Purpple ice",
            "category_ref": "45",
            "category_title": "BOISSON",
            "quantity": 1,
            "price": { "unit_price": {...}, "total_price": {...} }
          }
        ],
        "additions": [
          {
            "ref": 986,
            "title": "Cheddar sauce",
            "quantity": 1,
            "price": { "unit_price": {...}, "total_price": {...} }
          }
        ]
      }
    ],
    "additional_options": null,
    "special_instructions": ""
  },
  "payment": { ... },
  "created_at": "2025-11-04T19:04:51Z",
  "type": "pickup"
}
```

---

## Option Source Types

Options in menu items are categorized by `sourceType`:

### 1. **menuCategory** (Required Options)
- Grouped by category name
- Represent mandatory selections (e.g., beverage choice with meal combo)
- Grouped structure sent to backend:
  ```json
  {
    "ref": "BOISSON",
    "name": "BOISSON",
    "items": [
      { "ref": "924", "name": "Purpple ice", "qty": 1, "price": 0 }
    ]
  }
  ```

### 2. **addition** (Extra Toppings)
- Flat array structure
- Optional add-ons with additional cost
- Example: extra cheese, sauce, etc.
  ```json
  {
    "ref": 986,
    "title": "Cheddar sauce",
    "quantity": 1,
    "price": { "unit_price": {...}, "total_price": {...} }
  }
  ```

### 3. **default/undefined** (Menu Items)
- Flat array structure
- Core components of the meal
- Used for backward compatibility

---

## Implementation Details

### Files Modified:

1. **types/index.ts**
   - Added `OrderMenuItem` interface (menu items in orders)
   - Added `MenuCategory` interface (menu categories in orders)
   - Added `Addition` interface (additions/toppings)
   - Updated `CartItem` to include these structures

2. **components/ui/ItemOptionsModal.tsx**
   - Groups menuCategorys by category name with items array
   - Builds structured data for menuItems and additions
   - Properly formats prices in cents (EUR currency)

3. **lib/buildOrderData.ts**
   - Imports types from `@/types`
   - Maps cart items and processes grouped structures
   - Uses ref fallback: `item.ref || item.menuItemId`

---

## Price Format

All prices follow this structure:

```json
{
  "unit_price": {
    "amount": 800,                    // Price in cents (8 EUR)
    "currency_code": "EUR",
    "formatted_amount": "8.00 EUR"
  },
  "total_price": {
    "amount": 800,                    // 800 cents × quantity
    "currency_code": "EUR",
    "formatted_amount": "8.00 EUR"
  }
}
```

---

## Verification Checklist

✅ Cart items include ref field (backend ref)
✅ menuItems: flat array with ref, title, extra, quantity, price
✅ menuCategorys: grouped by category with items array
✅ additions: flat array with ref, title, quantity, price
✅ All prices in EUR cents format
✅ Backend processes grouped structure correctly
✅ Final OrderData matches expected flat structure
✅ Types properly defined and imported
✅ Build and lint passing

---

## Example: Complete Order Submission

See `buildOrderData.json` for a complete example of order JSON sent to backend.
