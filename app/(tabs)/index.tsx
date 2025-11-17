import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { 
  getRecentTransactions, 
  getIncomeAndExpenses, 
  getSpendingBreakdown,
  subscribeToTransactionChanges,
  type Transaction 
} from '../../src/services/transactions';
import { useAuth } from '../../src/providers/AuthProvider';

const { width } = Dimensions.get('window');

// Helper function to format relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

export default function HomeScreen() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [spent, setSpent] = useState(0);
  const [spendingData, setSpendingData] = useState<Array<{
    category: string;
    amount: number;
    color: string;
    percentage: number;
  }>>([]);

  const budget = 2000; // This could also come from Supabase
  const budgetUsed = Math.round((spent / budget) * 100);

  // Category color mapping
  const categoryColors: Record<string, string> = {
    'Food': Colors.chartPurple,
    'Transport': Colors.chartCyan,
    'Entertainment': Colors.chartOrange,
    'Shopping': Colors.chartRed,
    'Bills': Colors.chartGreen,
    'Income': Colors.success,
  };

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  // Realtime: refresh when transactions change
  useEffect(() => {
    if (!session) return;
    let unsub: undefined | (() => Promise<void>);
    (async () => {
      try {
        unsub = await subscribeToTransactionChanges(() => {
          // Re-fetch summary + recent list on any change
          loadData();
        });
      } catch (e) {
        console.warn('Realtime subscription not active:', e);
      }
    })();
    return () => {
      if (unsub) {
        unsub().catch(() => {});
      }
    };
  }, [session]);

  async function loadData() {
    try {
      setLoading(true);
      
      // Get current month date range
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      // Fetch all data in parallel
      const [transactions, stats, breakdown] = await Promise.all([
        getRecentTransactions(10),
        getIncomeAndExpenses(startDate, endDate),
        getSpendingBreakdown(startDate, endDate),
      ]);

      setRecentTransactions(transactions);
      setIncome(stats.income);
      setSpent(stats.expenses);
      setBalance(stats.balance);

      // Transform spending breakdown into chart data
      const total = Object.values(breakdown).reduce<number>((sum, val) => sum + (val as number), 0);
      const chartData = Object.entries(breakdown).map(([category, amount]) => ({
        category,
        amount: amount as number,
        color: categoryColors[category] || Colors.chartPurple,
        percentage: Math.round(((amount as number) / total) * 100),
      }));
      
      setSpendingData(chartData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Ionicons name="wallet-outline" size={24} color={Colors.white} />
          </View>
          <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
          <View style={styles.balanceFooter}>
            <View style={styles.balanceItem}>
              <Ionicons name="trending-up" size={16} color={Colors.white} />
              <Text style={styles.balanceItemText}>Income: ${income}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Ionicons name="trending-down" size={16} color={Colors.white} />
              <Text style={styles.balanceItemText}>Spent: ${spent}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Monthly Budget */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Monthly Budget</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{budgetUsed}% used</Text>
            </View>
          </View>
          <View style={styles.budgetInfo}>
            <Text style={styles.budgetAmount}>${spent} spent</Text>
            <Text style={styles.budgetAmount}>${budget} budget</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${budgetUsed}%` }]} />
          </View>
          <View style={styles.warningContainer}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.warningText}>You're close to your budget limit!</Text>
          </View>
        </View>

        {/* Spending Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending Breakdown</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : spendingData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="pie-chart-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No spending data yet</Text>
            </View>
          ) : (
            <>
              {/* Donut Chart */}
              <View style={styles.chartContainer}>
                <View style={styles.donutChart}>
                  {spendingData.map((item, index) => {
                    const totalDegrees = spendingData.reduce((sum, d) => sum + (d.percentage * 3.6), 0);
                    let startDegree = 0;
                    for (let i = 0; i < index; i++) {
                      startDegree += spendingData[i].percentage * 3.6;
                    }
                    return (
                      <View
                        key={item.category}
                        style={[
                          styles.chartSegment,
                          {
                            backgroundColor: item.color,
                            transform: [
                              { rotate: `${startDegree}deg` },
                            ],
                          },
                        ]}
                      />
                    );
                  })}
                  <View style={styles.donutHole} />
                </View>
              </View>

              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendColumn}>
                  {spendingData.slice(0, Math.ceil(spendingData.length / 2)).map((item) => (
                    <View key={item.category} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text style={styles.legendLabel}>{item.category}</Text>
                      <Text style={styles.legendAmount}>${item.amount.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.legendColumn}>
                  {spendingData.slice(Math.ceil(spendingData.length / 2)).map((item) => (
                    <View key={item.category} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text style={styles.legendLabel}>{item.category}</Text>
                      <Text style={styles.legendAmount}>${item.amount.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>

        {/* This Week */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>This Week</Text>
          <View style={styles.weekChart}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
              const heights = [60, 40, 70, 30, 80, 95, 75];
              return (
                <View key={day} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View style={[styles.bar, { height: heights[index] }]} />
                  </View>
                  <Text style={styles.barLabel}>{day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Transactions</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : recentTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            recentTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionName}>
                    {transaction.merchant || 'Transaction'}
                  </Text>
                  <Text style={styles.transactionTime}>
                    {getRelativeTime(transaction.occurred_at)}
                  </Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      transaction.amount > 0 ? styles.incomeAmount : styles.expenseAmount,
                    ]}
                  >
                    {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                  </Text>
                  <Text style={styles.transactionCategory}>
                    {transaction.category?.name || 'Uncategorized'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 16,
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceItemText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '500',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  budgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  progressBar: {
    height: 10,
    backgroundColor: Colors.gray200,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.textPrimary,
    borderRadius: 5,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  warningText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  donutChart: {
    width: 180,
    height: 180,
    borderRadius: 90,
    position: 'relative',
    overflow: 'hidden',
  },
  chartSegment: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 90,
  },
  donutHole: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    top: 40,
    left: 40,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendColumn: {
    flex: 1,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  weekChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 28,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  incomeAmount: {
    color: Colors.success,
  },
  expenseAmount: {
    color: Colors.error,
  },
  transactionCategory: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 12,
  },
});
