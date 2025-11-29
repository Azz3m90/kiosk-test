import type { PaymentRequest } from './buildOrderData';

export interface CashPaymentData {
  restaurantRef: string;
  restaurantName: string;
  paymentMethod: 'cash' | 'bancontact';
  totalPrice: number;
  deliveryMethod: string;
  deliveryFee: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerNotes?: string;
  cartItems: any[];
  kioskId?: string;
  additionalOptions?: any[];
  vat?: number;
}

function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

function calculateTotalPrice(
  basePrice: number,
  deliveryMethod: string,
  deliveryFee: number,
  additionalCost: number = 0
): number {
  let total = basePrice;

  if (deliveryMethod === 'delivery') {
    total += deliveryFee;
  }

  total += additionalCost;

  return total;
}

function prepareAdditionalOptions(options: any): any[] | null {
  if (!options || options === 'null' || Object.keys(options).length === 0) {
    return null;
  }

  let parsedOptions = options;

  if (typeof options === 'string') {
    try {
      parsedOptions = JSON.parse(options);
    } catch {
      return null;
    }
  }

  if (!parsedOptions || typeof parsedOptions !== 'object') {
    return null;
  }

  const formattedOptions = [];
  for (const [name, value] of Object.entries(parsedOptions)) {
    formattedOptions.push({
      option_name: name,
      option_value: parseFloat(String(value))
    });
  }

  return formattedOptions.length > 0 ? formattedOptions : null;
}

function buildPriceData(unitPrice: number, quantity: number) {
  const totalPrice = unitPrice * quantity;

  return {
    unit_price: {
      amount: Math.round(unitPrice * 100),
      currency_code: 'EUR',
      formatted_amount: `${formatCurrency(unitPrice)} EUR`
    },
    total_price: {
      amount: Math.round(totalPrice * 100),
      currency_code: 'EUR',
      formatted_amount: `${formatCurrency(totalPrice)} EUR`
    }
  };
}

function buildCashOrderData(paymentRequest: PaymentRequest, orderId: number): any {
  const cartItems = paymentRequest.orderData.cartItems;

  const processedCart = cartItems.map((item) => ({
    ref: item.ref || item.menuItemId,
    title: item.name,
    special_instructions: item.specialInstructions || '',
    quantity: item.quantity,
    price: buildPriceData(item.basePrice, item.quantity),
    menuItems: (item.menuItems || []).map((mi: any) => ({
      ref: Number(mi.ref),
      title: mi.title,
      extra: mi.extra || 0,
      quantity: Number(mi.quantity) * item.quantity,
      price: buildPriceData(
        (mi.price?.unit_price?.amount || 0) / 100,
        Number(mi.quantity) * item.quantity
      )
    })),
    menuCategorys: (item.menuCategorys || []).map((mc: any) => ({
      ref: String(mc.ref),
      title: mc.title,
      category_ref: String(mc.category_ref || ''),
      category_title: mc.category_title,
      quantity: Number(mc.quantity) * item.quantity,
      price: buildPriceData(
        (mc.price?.unit_price?.amount || 0) / 100,
        Number(mc.quantity) * item.quantity
      )
    })),
    additions: (item.additions || []).map((add: any) => ({
      ref: Number(add.ref),
      title: add.title,
      quantity: Number(add.quantity) * item.quantity,
      price: buildPriceData(
        (add.price?.unit_price?.amount || 0) / 100,
        Number(add.quantity) * item.quantity
      )
    }))
  }));

  const totalPrice = Math.round(paymentRequest.orderData.totalPrice * 100);
  const additionalOptions = prepareAdditionalOptions(
    (paymentRequest.orderData as any).additionalOptions
  );

  const kioskId = (paymentRequest.restaurantFirstName || '') + (paymentRequest.restaurantLastName || '') || paymentRequest.kioskId || 'kiosk_default';

  return {
    id: orderId,
    current_state: 'CREATED',
    store: {
      ref: paymentRequest.restaurantRef,
      name: paymentRequest.restaurantRef
    },
    kiosk_id: kioskId,
    eater: {
      id: '',
      first_name: paymentRequest.restaurantFirstName || paymentRequest.orderData.customerName,
      last_name: paymentRequest.restaurantLastName || '',
      phone_number: paymentRequest.orderData.customerPhone || null,
      postal_code: null,
      city: '',
      extra_address_info: null,
      email_address: null,
      street: null,
      house_number: null,
      message: paymentRequest.orderData.customerNotes || ''
    },
    cart: {
      items: processedCart,
      additional_options: additionalOptions,
      points_redeemed: '0',
      loyalty_discount: '0',
      special_instructions: paymentRequest.orderData.customerNotes || '',
      additional_address_information: null
    },
    payment: {
      charges: {
        total: {
          amount: totalPrice,
          currency_code: 'EUR',
          formatted_amount: `${formatCurrency(
            paymentRequest.orderData.totalPrice
          )} EUR`
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
      payment_type: paymentRequest.paymentMethod
    },
    requested_order_time: {
      delivery_method: paymentRequest.orderData.deliveryMethod,
      order_time: null,
      day: null,
      time_of_day: null
    },
    created_at: new Date().toISOString(),
    type: paymentRequest.orderData.deliveryMethod,
    table_name: null,
    delivery_location: {
      postal_code: null,
      city: '',
      extra_address_info: null,
      street: null,
      house_number: null
    }
  };
}

function buildCashPaymentPayload(
  paymentRequest: PaymentRequest,
  orderId: number
): CashPaymentData {
  const totalPrice = calculateTotalPrice(
    paymentRequest.orderData.totalPrice,
    paymentRequest.orderData.deliveryMethod,
    0,
    0
  );

  return {
    restaurantRef: paymentRequest.restaurantRef,
    restaurantName: paymentRequest.restaurantName,
    paymentMethod: paymentRequest.paymentMethod as 'cash' | 'bancontact',
    totalPrice,
    deliveryMethod: paymentRequest.orderData.deliveryMethod,
    deliveryFee: 0,
    customerName: paymentRequest.orderData.customerName,
    customerEmail: paymentRequest.orderData.customerEmail,
    customerPhone: paymentRequest.orderData.customerPhone,
    customerNotes: paymentRequest.orderData.customerNotes,
    cartItems: paymentRequest.orderData.cartItems,
    kioskId: paymentRequest.kioskId,
    additionalOptions: prepareAdditionalOptions(
      (paymentRequest.orderData as any).additionalOptions
    ) || undefined,
    vat: 5
  };
}

export {
  calculateTotalPrice,
  prepareAdditionalOptions,
  buildPriceData,
  buildCashOrderData,
  buildCashPaymentPayload
};
