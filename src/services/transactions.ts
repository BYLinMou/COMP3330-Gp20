import { supabase } from './supabase';
import type { Category } from './categories';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  occurred_at: string;
  merchant: string | null;
  category_id: string | null;
  source: 'manual' | 'ocr' | 'ai';
  note: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  // Joined data (optional)
  category?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  period: 'monthly' | 'yearly';
  amount: number;
  start_date: string;
  created_at: string;
  updated_at: string;
}

export type TransactionRealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';
export type TransactionChange = {
  eventType: TransactionRealtimeEvent;
  new?: Transaction | null;
  old?: Transaction | null;
};

/**
 * Subscribe to realtime changes on the current user's transactions.
 * Returns an unsubscribe function. Requires Supabase Realtime enabled for table.
 */
export async function subscribeToTransactionChanges(
  onChange: (change: TransactionChange) => void,
  options?: { userId?: string }
) {
  const { userId } = options || {};
  const user = userId
    ? { id: userId }
    : (await supabase.auth.getUser()).data.user;

  if (!user) {
    throw new Error('User not authenticated');
  }

  const channel = supabase
    .channel(`public:transactions:${user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${user.id}`,
      },
      (payload: any) => {
        onChange({
          eventType: payload.eventType as TransactionRealtimeEvent,
          new: (payload.new ?? null) as Transaction | null,
          old: (payload.old ?? null) as Transaction | null,
        });
      }
    )
    .subscribe();

  // Return cleanup function
  return async () => {
    try {
      await channel.unsubscribe();
    } catch (e) {
      // Fallback
      // @ts-ignore
      supabase.removeChannel?.(channel);
    }
  };
}

/**
 * Fetch recent transactions for the current user
 * @param limit - Maximum number of transactions to fetch (default: 10)
 */
export async function getRecentTransactions(limit: number = 10) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }

    return data as Transaction[];
  } catch (error) {
    console.error('Failed to fetch recent transactions:', error);
    throw error;
  }
}

/**
 * Fetch transactions for a specific date range
 */
export async function getTransactionsByDateRange(startDate: string, endDate: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('user_id', user.id)
      .gte('occurred_at', startDate)
      .lte('occurred_at', endDate)
      .order('occurred_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions by date range:', error);
      throw error;
    }

    return data as Transaction[];
  } catch (error) {
    console.error('Failed to fetch transactions by date range:', error);
    throw error;
  }
}

/**
 * Calculate spending breakdown by category
 */
export async function getSpendingBreakdown(startDate: string, endDate: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        amount,
        category:categories(name)
      `)
      .eq('user_id', user.id)
      .gte('occurred_at', startDate)
      .lte('occurred_at', endDate)
      .lt('amount', 0); // Only expenses (negative amounts)

    if (error) {
      console.error('Error fetching spending breakdown:', error);
      throw error;
    }

    // Group by category and sum amounts
    const breakdown = (data as any[]).reduce((acc, transaction) => {
      const categoryName = transaction.category?.name || 'Uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += Math.abs(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

    return breakdown;
  } catch (error) {
    console.error('Failed to fetch spending breakdown:', error);
    throw error;
  }
}

/**
 * Calculate total income and expenses for a date range
 */
export async function getIncomeAndExpenses(startDate: string, endDate: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', user.id)
      .gte('occurred_at', startDate)
      .lte('occurred_at', endDate);

    if (error) {
      console.error('Error fetching income and expenses:', error);
      throw error;
    }

    const transactions = data as Transaction[];
    const income = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = Math.abs(
      transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    );

    return { income, expenses, balance: income - expenses };
  } catch (error) {
    console.error('Failed to fetch income and expenses:', error);
    throw error;
  }
}

/**
 * Get balances grouped by payment method for the current user
 * Note: Currently returns payment methods with placeholder balances
 * TODO: Update when payment_method tracking is added to transactions table
 */
export async function getBalancesByPaymentMethod() {
  try {
    // Import payment methods service
    const { getPaymentMethods } = await import('./payment-methods');
    
    // Get available payment methods
    const paymentMethods = await getPaymentMethods();
    
    // Create balances object with payment methods
    // For now, we'll show some sample data until payment method tracking is implemented
    const balances: Record<string, number> = {};
    
    // Add some common payment methods with sample balances for demonstration
    // In production, this would query actual transaction data
    paymentMethods.slice(0, 5).forEach((method, index) => {
      // Sample data - replace with actual transaction queries when payment_method field is added
      balances[method.name] = 0;
    });
    
    return balances;
  } catch (error) {
    console.error('Failed to fetch balances by payment method:', error);
    throw error;
  }
}

/**
 * Add a new transaction
 */
export async function addTransaction(
  transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          ...transaction,
          user_id: user.id,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }

    return data as Transaction;
  } catch (error) {
    console.error('Failed to add transaction:', error);
    throw error;
  }
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(
  id: string,
  updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }

    return data as Transaction;
  } catch (error) {
    console.error('Failed to update transaction:', error);
    throw error;
  }
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(id: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    throw error;
  }
}

/**
 * Get all transactions for the current user
 */
export async function getAllTransactions() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false });

    if (error) {
      console.error('Error fetching all transactions:', error);
      throw error;
    }

    return data as Transaction[];
  } catch (error) {
    console.error('Failed to fetch all transactions:', error);
    throw error;
  }
}

export type TransactionFilter = {
  type?: 'all' | 'income' | 'expense';
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
};

/**
 * Filter transactions based on criteria
 */
export function filterTransactions(
  transactions: Transaction[],
  filter: TransactionFilter
): Transaction[] {
  let filtered = [...transactions];

  // Apply type filter
  if (filter.type && filter.type !== 'all') {
    if (filter.type === 'income') {
      filtered = filtered.filter((t) => t.amount > 0);
    } else if (filter.type === 'expense') {
      filtered = filtered.filter((t) => t.amount < 0);
    }
  }

  // Apply search query
  if (filter.searchQuery && filter.searchQuery.trim()) {
    const query = filter.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.merchant?.toLowerCase().includes(query) ||
        t.category?.name?.toLowerCase().includes(query) ||
        t.note?.toLowerCase().includes(query)
    );
  }

  // Apply date range filter
  if (filter.startDate) {
    filtered = filtered.filter((t) => t.occurred_at >= filter.startDate!);
  }
  if (filter.endDate) {
    filtered = filtered.filter((t) => t.occurred_at <= filter.endDate!);
  }

  // Apply category filter
  if (filter.categoryId) {
    filtered = filtered.filter((t) => t.category_id === filter.categoryId);
  }

  return filtered;
}

/**
 * Get transaction statistics
 */
export function getTransactionStats(transactions: Transaction[]) {
  const income = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = Math.abs(
    transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  return {
    totalIncome: income,
    totalExpense: expense,
    balance: income - expense,
    count: transactions.length,
  };
}

/**
 * Get current budget
 */
export async function getCurrentBudget() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const now = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .lte('start_date', now)
      .order('start_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching budget:', error);
      throw error;
    }

    return data as Budget | null;
  } catch (error) {
    console.error('Failed to fetch budget:', error);
    throw error;
  }
}

/**
 * Set or update budget
 */
export async function setBudget(amount: number, period: 'monthly' | 'yearly', startDate: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('budgets')
      .insert([
        {
          amount,
          period,
          start_date: startDate,
          user_id: user.id,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error setting budget:', error);
      throw error;
    }

    return data as Budget;
  } catch (error) {
    console.error('Failed to set budget:', error);
    throw error;
  }
}
