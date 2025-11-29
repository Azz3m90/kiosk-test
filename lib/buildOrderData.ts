import type { 
  OrderMenuItem, 
  MenuCategory, 
  Addition,
  CartItem as CartItemType,
  SelectedOption
} from '@/types';

export interface PaymentRequest {
  restaurantRef: string;
  restaurantName: string;
  restaurantFirstName: string;
  restaurantLastName: string;
  paymentMethod: string;
  orderData: {
    cartItems: CartItemType[];
    totalPrice: number;
    deliveryMethod: string;
    diningMethod: string;
    deliveryFee?: number;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerNotes?: string;
  };
  kioskId?: string;
  nextOrderId?: number;
}

export interface OrderData {
  id: number;
  current_state: string;
  store: {
    ref: string;
    name: string;
  };
  kiosk_id: string;
  eater: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string | null;
    postal_code: string | null;
    city: string;
    extra_address_info: string | null;
    email_address: string | null;
    street: string | null;
    house_number: string | null;
    message: string;
  };
  cart: {
    items: Array<{
      ref: number | string;
      title: string;
      special_instructions: string;
      quantity: string;
      price: {
        unit_price: {
          amount: number;
          currency_code: string;
          formatted_amount: string;
        };
        total_price: {
          amount: number;
          currency_code: string;
          formatted_amount: string;
        };
      };
      menuItems: Array<{
        ref: number;
        title: string;
        extra: number;
        quantity: number;
        price: {
          unit_price: {
            amount: number;
            currency_code: string;
            formatted_amount: string;
          };
          total_price: {
            amount: number;
            currency_code: string;
            formatted_amount: string;
          };
        };
      }>;
      menuCategorys: Array<{
        ref: string;
        title: string;
        category_ref: string;
        category_title: string;
        quantity: number;
        price: {
          unit_price: {
            amount: number;
            currency_code: string;
            formatted_amount: string;
          };
          total_price: {
            amount: number;
            currency_code: string;
            formatted_amount: string;
          };
        };
      }>;
      additions: Array<{
        ref: number;
        title: string;
        quantity: number;
        price: {
          unit_price: {
            amount: number;
            currency_code: string;
            formatted_amount: string;
          };
          total_price: {
            amount: number;
            currency_code: string;
            formatted_amount: string;
          };
        };
      }>;
    }>;
    additional_options: null;
    points_redeemed: string;
    loyalty_discount: string;
    special_instructions: string;
    additional_address_information: null;
  };
  payment: {
    charges: {
      total: {
        amount: number;
        currency_code: string;
        formatted_amount: string;
      };
      tax: {
        amount: null;
        currency_code: string;
        formatted_amount: null;
      };
      delivery_fee: {
        amount: number;
        currency_code: string;
        formatted_amount: null;
      };
    };
    payment_type: string;
  };
  requested_order_time: {
    delivery_method: string;
    order_time: null;
    day: null;
    time_of_day: null;
  };
  created_at: string;
  type: string;
  table_name: null;
  delivery_location: {
    postal_code: null;
    city: string;
    extra_address_info: null;
    street: null;
    house_number: null;
  };
}

function formatCurrency(amount: number): string {
  const str = amount.toFixed(2);
  const trimmed = str.replace(/\.?0+$/, '');
  return `${trimmed} EUR`;
}

export function buildOrderData(body: PaymentRequest): OrderData {
  console.log('🔨 buildOrderData - Input deliveryMethod:', body.orderData.deliveryMethod);
  const kioskId = (body.restaurantFirstName || '') + (body.restaurantLastName || '') || body.kioskId || 'kiosk_default';

  const cartItems = body.orderData.cartItems.map((item) => {
    return {
      ref: item.ref || item.menuItemId,
      title: item.name,
      special_instructions: item.specialInstructions || '',
      quantity: String(item.quantity),
      price: {
        unit_price: {
          amount: Math.round(item.basePrice * 100),
          currency_code: 'EUR',
          formatted_amount: formatCurrency(item.basePrice)
        },
        total_price: {
          amount: Math.round(item.basePrice * item.quantity * 100),
          currency_code: 'EUR',
          formatted_amount: formatCurrency(item.basePrice * item.quantity)
        }
      },
      menuItems: (item.menuItems || []).map(mi => ({
        ref: Number(mi.ref),
        title: mi.title,
        extra: mi.extra || 0,
        quantity: Number(mi.quantity) * item.quantity,
        price: mi.price && mi.price.unit_price ? {
          unit_price: {
            amount: mi.price.unit_price.amount,
            currency_code: mi.price.unit_price.currency_code || 'EUR',
            formatted_amount: mi.price.unit_price.formatted_amount
          },
          total_price: {
            amount: Math.round(mi.price.unit_price.amount * Number(mi.quantity) * item.quantity),
            currency_code: mi.price.total_price.currency_code || 'EUR',
            formatted_amount: formatCurrency((mi.price.unit_price.amount * Number(mi.quantity) * item.quantity) / 100)
          }
        } : { unit_price: { amount: 0, currency_code: 'EUR', formatted_amount: '0 EUR' }, total_price: { amount: 0, currency_code: 'EUR', formatted_amount: '0 EUR' } }
      })),
      menuCategorys: (item.menuCategorys || []).map(mc => ({
        ref: String(mc.ref),
        title: mc.title,
        category_ref: mc.category_ref ? String(mc.category_ref) : '',
        category_title: mc.category_title,
        quantity: Number(mc.quantity) * item.quantity,
        price: mc.price && mc.price.unit_price ? {
          unit_price: {
            amount: mc.price.unit_price.amount,
            currency_code: mc.price.unit_price.currency_code || 'EUR',
            formatted_amount: mc.price.unit_price.formatted_amount
          },
          total_price: {
            amount: Math.round(mc.price.unit_price.amount * Number(mc.quantity) * item.quantity),
            currency_code: mc.price.total_price.currency_code || 'EUR',
            formatted_amount: formatCurrency((mc.price.unit_price.amount * Number(mc.quantity) * item.quantity) / 100)
          }
        } : { unit_price: { amount: 0, currency_code: 'EUR', formatted_amount: '0 EUR' }, total_price: { amount: 0, currency_code: 'EUR', formatted_amount: '0 EUR' } }
      })),
      additions: (item.additions || []).map(add => ({
        ref: Number(add.ref),
        title: add.title,
        quantity: Number(add.quantity) * item.quantity,
        price: add.price && add.price.unit_price ? {
          unit_price: {
            amount: add.price.unit_price.amount,
            currency_code: add.price.unit_price.currency_code || 'EUR',
            formatted_amount: formatCurrency(add.price.unit_price.amount / 100)
          },
          total_price: {
            amount: Math.round(add.price.unit_price.amount * Number(add.quantity) * item.quantity),
            currency_code: add.price.total_price?.currency_code || 'EUR',
            formatted_amount: formatCurrency((add.price.unit_price.amount * Number(add.quantity) * item.quantity) / 100)
          }
        } : { unit_price: { amount: 0, currency_code: 'EUR', formatted_amount: '0 EUR' }, total_price: { amount: 0, currency_code: 'EUR', formatted_amount: '0 EUR' } }
      }))
    };
  });

  const totalPriceCents = Math.round(body.orderData.totalPrice * 100);
  const totalFormatted = formatCurrency(body.orderData.totalPrice);

  const orderData: OrderData = {
    id: body.nextOrderId || Math.floor(Date.now() / 1000),
    current_state: 'CREATED',
    store: {
      ref: body.restaurantRef,
      name: body.restaurantRef
    },
    kiosk_id: kioskId,
    eater: {
      id: '',
      first_name: body.restaurantFirstName,
      last_name: body.restaurantLastName,
      phone_number: body.orderData.customerPhone ? body.orderData.customerPhone : null,
      postal_code: null,
      city: '',
      extra_address_info: null,
      email_address: null,
      street: null,
      house_number: null,
      message: body.orderData.customerNotes || ''
    },
    cart: {
      items: cartItems,
      additional_options: null,
      points_redeemed: '0',
      loyalty_discount: '0',
      special_instructions: body.orderData.customerNotes || '',
      additional_address_information: null
    },
    payment: {
      charges: {
        total: {
          amount: totalPriceCents,
          currency_code: 'EUR',
          formatted_amount: totalFormatted
        },
        tax: {
          amount: null,
          currency_code: 'EUR',
          formatted_amount: null
        },
        delivery_fee: {
          amount: 0,
          currency_code: 'EUR',
          formatted_amount: null
        }
      },
      payment_type: body.paymentMethod
    },
    requested_order_time: {
      delivery_method: body.orderData.deliveryMethod,
      order_time: null,
      day: null,
      time_of_day: null
    },
    created_at: new Date().toISOString(),
    type: body.orderData.deliveryMethod,
    table_name: null,
    delivery_location: {
      postal_code: null,
      city: '',
      extra_address_info: null,
      street: null,
      house_number: null
    }
  };

  console.log('✅ buildOrderData - Output type:', orderData.type, 'delivery_method:', orderData.requested_order_time.delivery_method);
  return orderData;
}
