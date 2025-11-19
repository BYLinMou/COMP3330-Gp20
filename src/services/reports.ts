import { supabase } from './supabase';
import type { Transaction } from './transactions';
import { getMonthlyBudgetAmount } from './budgets';
import { getProfile } from './profiles';

export interface MonthlyTrend {
  month: string;
  year: number;
  actualSpending: number;
  budgetTarget: number;
}

export interface WeeklySpending {
  day: string;
  amount: number;
}

export interface SpendingSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
}

export interface MerchantSummary {
  merchant: string;
  amount: number;
  transactionCount: number;
  percentage: number;
}

/**
 * Get monthly spending trends for the past N months
 */
export async function getMonthlyTrends(monthsCount: number = 6): Promise<MonthlyTrend[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get monthly budget amount
    const monthlyBudget = await getMonthlyBudgetAmount();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsCount);

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, occurred_at')
      .eq('user_id', user.id)
      .gte('occurred_at', startDate.toISOString())
      .lte('occurred_at', endDate.toISOString())
      .lt('amount', 0); // Only expenses

    if (error) {
      console.error('Error fetching monthly trends:', error);
      throw error;
    }

    // Group by month
    const monthlyData: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    (data as Transaction[]).forEach((transaction) => {
      const date = new Date(transaction.occurred_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = 0;
      }
      monthlyData[key] += Math.abs(transaction.amount);
    });

    // Build trends array for the last N months
    const trends: MonthlyTrend[] = [];
    const today = new Date();
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${targetDate.getFullYear()}-${targetDate.getMonth()}`;
      
      trends.push({
        month: months[targetDate.getMonth()],
        year: targetDate.getFullYear(),
        actualSpending: monthlyData[key] || 0,
        budgetTarget: monthlyBudget,
      });
    }

    return trends;
  } catch (error) {
    console.error('Failed to fetch monthly trends:', error);
    throw error;
  }
}

/**
 * Get weekly spending for the current week
 */
export async function getWeeklySpending(): Promise<WeeklySpending[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get the start of the week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, occurred_at')
      .eq('user_id', user.id)
      .gte('occurred_at', startOfWeek.toISOString())
      .lte('occurred_at', endOfWeek.toISOString())
      .lt('amount', 0); // Only expenses

    if (error) {
      console.error('Error fetching weekly spending:', error);
      throw error;
    }

    // Group by day
    const dailyData: Record<string, number> = {};
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    (data as Transaction[]).forEach((transaction) => {
      const date = new Date(transaction.occurred_at);
      const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1; // Convert Sunday (0) to 6
      const dayName = daysOfWeek[dayIndex];
      
      if (!dailyData[dayName]) {
        dailyData[dayName] = 0;
      }
      dailyData[dayName] += Math.abs(transaction.amount);
    });

    // Build weekly array
    return daysOfWeek.map((day) => ({
      day,
      amount: dailyData[day] || 0,
    }));
  } catch (error) {
    console.error('Failed to fetch weekly spending:', error);
    throw error;
  }
}

/**
 * Get spending summary for a date range
 * Uses profile income if set, otherwise uses calculated income from transactions
 */
export async function getSpendingSummary(startDate: string, endDate: string): Promise<SpendingSummary> {
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
      console.error('Error fetching spending summary:', error);
      throw error;
    }

    const transactions = data as Transaction[];
    
    // Calculate income from transactions
    const transactionIncome = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = Math.abs(
      transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    );

    // Get profile income (use this as primary source)
    const profile = await getProfile();
    const income = profile?.income || transactionIncome;

    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses,
      transactionCount: transactions.length,
    };
  } catch (error) {
    console.error('Failed to fetch spending summary:', error);
    throw error;
  }
}

/**
 * Get top merchants by spending
 */
export async function getTopMerchants(startDate: string, endDate: string, limit: number = 10): Promise<MerchantSummary[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('merchant, amount')
      .eq('user_id', user.id)
      .gte('occurred_at', startDate)
      .lte('occurred_at', endDate)
      .lt('amount', 0) // Only expenses
      .not('merchant', 'is', null);

    if (error) {
      console.error('Error fetching top merchants:', error);
      throw error;
    }

    // Group by merchant
    const merchantData: Record<string, { amount: number; count: number }> = {};
    let totalSpending = 0;

    (data as Transaction[]).forEach((transaction) => {
      const merchant = transaction.merchant || 'Unknown';
      const amount = Math.abs(transaction.amount);
      
      if (!merchantData[merchant]) {
        merchantData[merchant] = { amount: 0, count: 0 };
      }
      
      merchantData[merchant].amount += amount;
      merchantData[merchant].count += 1;
      totalSpending += amount;
    });

    // Convert to array and sort
    const merchants: MerchantSummary[] = Object.entries(merchantData)
      .map(([merchant, { amount, count }]) => ({
        merchant,
        amount,
        transactionCount: count,
        percentage: (amount / totalSpending) * 100,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);

    return merchants;
  } catch (error) {
    console.error('Failed to fetch top merchants:', error);
    throw error;
  }
}

/**
 * Compare spending between two periods
 */
export async function compareSpendingPeriods(
  period1Start: string,
  period1End: string,
  period2Start: string,
  period2End: string
) {
  try {
    const [summary1, summary2] = await Promise.all([
      getSpendingSummary(period1Start, period1End),
      getSpendingSummary(period2Start, period2End),
    ]);

    const expensesDiff = summary2.totalExpenses - summary1.totalExpenses;
    const expensesPercentChange = summary1.totalExpenses > 0 
      ? (expensesDiff / summary1.totalExpenses) * 100 
      : 0;

    const incomeDiff = summary2.totalIncome - summary1.totalIncome;
    const incomePercentChange = summary1.totalIncome > 0 
      ? (incomeDiff / summary1.totalIncome) * 100 
      : 0;

    return {
      period1: summary1,
      period2: summary2,
      comparison: {
        expensesDiff,
        expensesPercentChange,
        incomeDiff,
        incomePercentChange,
      },
    };
  } catch (error) {
    console.error('Failed to compare spending periods:', error);
    throw error;
  }
}

/**
 * Get category breakdown with trend comparison
 */
export async function getCategoryTrends(
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Fetch current period
    const { data: currentData, error: currentError } = await supabase
      .from('transactions')
      .select('amount, category:categories(name)')
      .eq('user_id', user.id)
      .gte('occurred_at', currentStart)
      .lte('occurred_at', currentEnd)
      .lt('amount', 0);

    if (currentError) throw currentError;

    // Fetch previous period
    const { data: previousData, error: previousError } = await supabase
      .from('transactions')
      .select('amount, category:categories(name)')
      .eq('user_id', user.id)
      .gte('occurred_at', previousStart)
      .lte('occurred_at', previousEnd)
      .lt('amount', 0);

    if (previousError) throw previousError;

    // Calculate current breakdown
    const currentBreakdown: Record<string, number> = {};
    (currentData as any[]).forEach((t) => {
      const category = t.category?.name || 'Uncategorized';
      currentBreakdown[category] = (currentBreakdown[category] || 0) + Math.abs(t.amount);
    });

    // Calculate previous breakdown
    const previousBreakdown: Record<string, number> = {};
    (previousData as any[]).forEach((t) => {
      const category = t.category?.name || 'Uncategorized';
      previousBreakdown[category] = (previousBreakdown[category] || 0) + Math.abs(t.amount);
    });

    // Combine and compare
    const allCategories = new Set([
      ...Object.keys(currentBreakdown),
      ...Object.keys(previousBreakdown),
    ]);

    const trends = Array.from(allCategories).map((category) => {
      const current = currentBreakdown[category] || 0;
      const previous = previousBreakdown[category] || 0;
      const change = current - previous;
      const percentChange = previous > 0 ? (change / previous) * 100 : 0;

      return {
        category,
        currentAmount: current,
        previousAmount: previous,
        change,
        percentChange,
      };
    });

    return trends.sort((a, b) => b.currentAmount - a.currentAmount);
  } catch (error) {
    console.error('Failed to fetch category trends:', error);
    throw error;
  }
}
