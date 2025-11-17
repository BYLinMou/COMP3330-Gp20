import { supabase } from './supabase';

export interface PaymentMethod {
  id: string;
  name: string;
  icon?: string;
  is_default: boolean;
  sort_order: number;
}

/**
 * Get all payment methods
 * Returns predefined payment methods in the correct order
 */
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  // Predefined payment methods with common options
  const paymentMethods: PaymentMethod[] = [
    { id: '1', name: 'Cash', icon: 'cash-outline', is_default: true, sort_order: 1 },
    { id: '2', name: 'Octopus', icon: 'wallet-outline', is_default: false, sort_order: 2 },
    { id: '3', name: 'Credit Card', icon: 'card-outline', is_default: false, sort_order: 3 },
    { id: '4', name: 'Debit Card', icon: 'card-outline', is_default: false, sort_order: 4 },
    { id: '5', name: 'VISA', icon: 'card-outline', is_default: false, sort_order: 5 },
    { id: '6', name: 'Mastercard', icon: 'card-outline', is_default: false, sort_order: 6 },
    { id: '7', name: 'American Express', icon: 'card-outline', is_default: false, sort_order: 7 },
    { id: '8', name: 'Apple Pay', icon: 'logo-apple', is_default: false, sort_order: 8 },
    { id: '9', name: 'Google Pay', icon: 'logo-google', is_default: false, sort_order: 9 },
    { id: '10', name: 'PayPal', icon: 'logo-paypal', is_default: false, sort_order: 10 },
    { id: '11', name: 'WeChat Pay', icon: 'chatbubbles-outline', is_default: false, sort_order: 11 },
    { id: '12', name: 'Alipay', icon: 'wallet-outline', is_default: false, sort_order: 12 },
    { id: '13', name: 'Bank Transfer', icon: 'business-outline', is_default: false, sort_order: 13 },
    { id: '14', name: 'Other', icon: 'ellipsis-horizontal', is_default: false, sort_order: 14 },
  ];

  return paymentMethods;
}

/**
 * Get payment method by name
 * Returns the matching payment method or null if not found
 */
export async function getPaymentMethodByName(name: string): Promise<PaymentMethod | null> {
  if (!name) return null;
  
  const methods = await getPaymentMethods();
  const normalizedName = name.trim().toLowerCase();
  
  return methods.find(m => m.name.toLowerCase() === normalizedName) || null;
}

/**
 * Get default payment method
 * Returns the default payment method (Cash)
 */
export async function getDefaultPaymentMethod(): Promise<PaymentMethod> {
  const methods = await getPaymentMethods();
  return methods.find(m => m.is_default) || methods[0];
}
