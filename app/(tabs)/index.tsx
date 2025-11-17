import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { 
  getRecentTransactions, 
  getIncomeAndExpenses,
  subscribeToTransactionChanges,
  deleteTransaction,
  type Transaction 
} from '../../src/services/transactions';
import { useAuth } from '../../src/providers/AuthProvider';
import FloatingChatButton from '../../components/floating-chat-button';

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
  const [transactionLimit, setTransactionLimit] = useState(10);
  const [showLimitDropdown, setShowLimitDropdown] = useState(false);
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);

  const budget = 2000; // This could also come from Supabase
  const budgetUsed = Math.round((spent / budget) * 100);
  const limitOptions = [5, 10, 20, 50, 100];

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session, transactionLimit]);

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
      const [transactions, stats] = await Promise.all([
        getRecentTransactions(transactionLimit),
        getIncomeAndExpenses(startDate, endDate),
      ]);

      setRecentTransactions(transactions);
      setIncome(stats.income);
      setSpent(stats.expenses);
      setBalance(stats.balance);
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

        {/* Recent Transactions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Transactions</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowLimitDropdown(!showLimitDropdown)}
              >
                <Text style={styles.dropdownButtonText}>{transactionLimit}</Text>
                <Ionicons 
                  name={showLimitDropdown ? "chevron-up" : "chevron-down"} 
                  size={18} 
                  color={Colors.primary} 
                />
              </TouchableOpacity>
              
              {showLimitDropdown && (
                <View style={styles.dropdownMenu}>
                  {limitOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownOption,
                        transactionLimit === option && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        setTransactionLimit(option);
                        setShowLimitDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          transactionLimit === option && styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
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
              <TouchableOpacity
                key={transaction.id}
                onPress={() => {
                  if (expandedTransactionId === transaction.id) {
                    setExpandedTransactionId(null);
                  } else {
                    setExpandedTransactionId(transaction.id);
                  }
                }}
              >
                <View style={styles.transactionItem}>
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

                {expandedTransactionId === transaction.id && (
                  <View style={styles.transactionExpandedDetails}>
                    {/* Category */}
                    <View style={styles.expandedDetailRow}>
                      <Text style={styles.expandedDetailLabel}>Category</Text>
                      <Text style={styles.expandedDetailValue}>
                        {transaction.category?.name || 'Uncategorized'}
                      </Text>
                    </View>

                    {/* Date & Time */}
                    <View style={styles.expandedDetailRow}>
                      <Text style={styles.expandedDetailLabel}>Date & Time</Text>
                      <Text style={styles.expandedDetailValue}>
                        {new Date(transaction.occurred_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>

                    {/* Merchant */}
                    {transaction.merchant && (
                      <View style={styles.expandedDetailRow}>
                        <Text style={styles.expandedDetailLabel}>Merchant</Text>
                        <Text style={styles.expandedDetailValue}>{transaction.merchant}</Text>
                      </View>
                    )}

                    {/* Payment Method */}
                    {transaction.payment_method && (
                      <View style={styles.expandedDetailRow}>
                        <Text style={styles.expandedDetailLabel}>Payment Method</Text>
                        <Text style={styles.expandedDetailValue}>{transaction.payment_method}</Text>
                      </View>
                    )}

                    {/* Source */}
                    <View style={styles.expandedDetailRow}>
                      <Text style={styles.expandedDetailLabel}>Source</Text>
                      <View style={styles.sourceBadge}>
                        <Ionicons 
                          name={
                            transaction.source === 'manual' ? 'create-outline' :
                            transaction.source === 'ocr' ? 'receipt-outline' :
                            'sparkles'
                          }
                          size={12}
                          color={Colors.white}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.sourceBadgeText}>
                          {transaction.source === 'manual' ? 'Manual' :
                           transaction.source === 'ocr' ? 'Receipt (OCR)' :
                           'AI Suggested'}
                        </Text>
                      </View>
                    </View>

                    {/* Items */}
                    {(transaction as any).items && (transaction as any).items.length > 0 && (
                      <View style={styles.expandedDetailRow}>
                        <Text style={styles.expandedDetailLabel}>Items</Text>
                        <View style={styles.itemsList}>
                          {(transaction as any).items.map((item: any, index: number) => (
                            <View key={index} style={styles.itemsListRow}>
                              <Text style={styles.itemsListName}>{item.name}</Text>
                              <View style={styles.itemsListQtyPrice}>
                                <Text style={styles.itemsListQty}>×{item.amount}</Text>
                                <Text style={styles.itemsListPrice}>
                                  ${(item.price * item.amount).toFixed(2)}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Notes */}
                    {transaction.note && (
                      <View style={styles.expandedDetailRow}>
                        <Text style={styles.expandedDetailLabel}>Notes</Text>
                        <Text style={styles.expandedDetailValue}>{transaction.note}</Text>
                      </View>
                    )}

                    {/* Delete Button */}
                    <TouchableOpacity
                      style={styles.transactionDeleteButton}
                      onPress={() => {
                        Alert.alert(
                          'Delete Transaction',
                          'Are you sure you want to delete this transaction?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  await deleteTransaction(transaction.id);
                                  setExpandedTransactionId(null);
                                  loadData();
                                } catch (error) {
                                  Alert.alert('Error', 'Failed to delete transaction');
                                }
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.error} />
                      <Text style={styles.transactionDeleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Floating Chat Button */}
      <FloatingChatButton />
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
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  balanceLabel: {
    fontSize: 13,
    color: Colors.white,
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 10,
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceItemText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '500',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: Colors.error,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  budgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  budgetAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.textPrimary,
    borderRadius: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warningText: {
    fontSize: 12,
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
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  transactionContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  transactionExpandedDetails: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  expandedDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  expandedDetailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  expandedDetailValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sourceBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  itemsList: {
    marginTop: 8,
    backgroundColor: Colors.white,
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemsListRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  itemsListName: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  itemsListQtyPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemsListQty: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  itemsListPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  transactionDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 8,
  },
  transactionDeleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.error,
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
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.gray100,
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray200,
    zIndex: 1000,
    minWidth: 80,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  dropdownOptionSelected: {
    backgroundColor: Colors.primary,
    borderBottomColor: Colors.primary,
  },
  dropdownOptionText: {
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  dropdownOptionTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
});
