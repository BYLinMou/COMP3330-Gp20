/**
 * Currency Service
 * Provides available currencies for the application
 * Future: can be extended to fetch from backend or user settings
 */

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

/**
 * Get list of available currencies
 * Currently returns hardcoded list: USD, HKD, CNY
 * TODO: Replace with backend API call or user settings
 */
export async function getCurrencies(): Promise<Currency[]> {
  // Default currency list
  const currencies: Currency[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  ];

  return Promise.resolve(currencies);
}

/**
 * Subscribe to currency changes (placeholder for future realtime updates)
 * Currently returns a no-op unsubscribe function
 * TODO: Implement realtime subscription when backend supports it
 */
export async function subscribeToCurrencyChanges(
  handler: (change: any) => void
): Promise<() => Promise<void>> {
  // Placeholder: no realtime updates yet
  // In the future, this could subscribe to a Supabase table or settings changes
  
  return async () => {
    // No-op unsubscribe
  };
}
