import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { RefreshableScrollView } from '../../components/refreshable-scroll-view';
import FlippablePetCard from '../../components/flippable-pet-card';
import { 
  getRecentTransactions, 
  getIncomeAndExpenses,
  getBalancesByPaymentMethod,
  subscribeToTransactionChanges,
  deleteTransaction,
  type Transaction 
} from '../../src/services/transactions';
import { getPaymentMethods, type PaymentMethod } from '../../src/services/payment-methods';
import { useAuth } from '../../src/providers/AuthProvider';
import { getPetState, getActivePet, type PetState, type UserPet } from '../../src/services/pet';

// Helper function to format relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return '1d ago';
  return `${diffDays}d ago`;
}

export default function HomeScreen() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [spent, setSpent] = useState(0);
  const [petState, setPetState] = useState<PetState | null>(null);
  const [activePet, setActivePet] = useState<UserPet | null>(null);
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);
  const [isBalanceFlipped, setIsBalanceFlipped] = useState(false);
  const [paymentMethodBalances, setPaymentMethodBalances] = useState<Record<string, number>>({});
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  
  // Animation ref for balance card flip
  const balanceFlipAnimation = useRef(new Animated.Value(0)).current;

  const budget = 2000;
  const budgetUsed = Math.round((spent / budget) * 100);

  // Initial data load
  useEffect(() => {
    if (!session) return;
    loadData();
  }, [session]);

  // Realtime: refresh when transactions change
  useEffect(() => {
    if (!session) return;
    let unsub: undefined | (() => Promise<void>);
    (async () => {
      try {
        unsub = await subscribeToTransactionChanges(() => {
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

  const handleBalanceFlip = async () => {
    if (!isBalanceFlipped) {
      // Load payment method balances when flipping to back
      try {
        setLoadingPaymentMethods(true);
        const methods = await getPaymentMethods();
        const balances: Record<string, number> = {};
        
        // For demo, distribute balance across payment methods
        const methodsToShow = methods.slice(0, 6);
        const balancePerMethod = balance / methodsToShow.length;
        
        methodsToShow.forEach((method, index) => {
          if (index === 0) {
            balances[method.name] = balancePerMethod * 1.5;
          } else if (index === 1) {
            balances[method.name] = balancePerMethod * 0.8;
          } else {
            balances[method.name] = balancePerMethod * 0.5;
          }
        });
        
        setPaymentMethodBalances(balances);
      } catch (error) {
        console.error('Error loading payment methods:', error);
      } finally {
        setLoadingPaymentMethods(false);
      }
    }

    Animated.spring(balanceFlipAnimation, {
      toValue: isBalanceFlipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();

    setIsBalanceFlipped(!isBalanceFlipped);
  };

  async function loadData() {
    try {
      setLoading(true);
      
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      const [transactions, stats] = await Promise.all([
        getRecentTransactions(10),
        getIncomeAndExpenses(startDate, endDate),
      ]);

      // Load pet data
      try {
        const [state, active] = await Promise.all([
          getPetState(),
          getActivePet(),
        ]);
        setPetState(state);
        setActivePet(active);
      } catch (petError: any) {
        console.error('Error loading pet data:', petError);
      }

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

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <RefreshableScrollView
        style={styles.content}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        {/* Pet Section - Flippable */}
        <View style={styles.petSection}>
          <FlippablePetCard 
            petState={petState} 
            activePet={activePet} 
            size="small"
            onPetChanged={loadData}
          />
        </View>

        {/* Balance Card - Flippable */}
        <TouchableOpacity 
          style={styles.balanceCardContainer} 
          onPress={handleBalanceFlip}
          activeOpacity={0.9}
        >
          <Animated.View
            style={[
              styles.balanceCard,
              {
                transform: [{ 
                  rotateY: balanceFlipAnimation.interpolate({
                    inputRange: [0, 180],
                    outputRange: ['0deg', '180deg'],
                  })
                }],
                opacity: balanceFlipAnimation.interpolate({
                  inputRange: [0, 90, 180],
                  outputRange: [1, 0, 0],
                }),
              },
            ]}
          >
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Ionicons name="sync-outline" size={20} color={Colors.textSecondary} />
            </View>
            <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
            <View style={styles.balanceFooter}>
              <View style={styles.balanceItem}>
                <Ionicons name="arrow-down-circle" size={16} color={Colors.success} />
                <Text style={styles.balanceItemLabel}>Income</Text>
                <Text style={styles.balanceItemValue}>${income}</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <Ionicons name="arrow-up-circle" size={16} color={Colors.error} />
                <Text style={styles.balanceItemLabel}>Spent</Text>
                <Text style={styles.balanceItemValue}>${spent}</Text>
              </View>
            </View>
            <View style={styles.tapHint}>
              <Ionicons name="sync-outline" size={12} color={Colors.textSecondary} />
              <Text style={styles.tapHintText}>Tap to view by payment method</Text>
            </View>
          </Animated.View>

          {/* Back side - Payment Methods */}
          <Animated.View
            style={[
              styles.balanceCard,
              styles.balanceCardBack,
              {
                transform: [{ 
                  rotateY: balanceFlipAnimation.interpolate({
                    inputRange: [0, 180],
                    outputRange: ['180deg', '360deg'],
                  })
                }],
                opacity: balanceFlipAnimation.interpolate({
                  inputRange: [0, 90, 180],
                  outputRange: [0, 0, 1],
                }),
              },
            ]}
          >
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Payment Methods</Text>
              <Ionicons name="arrow-back-outline" size={20} color={Colors.textSecondary} />
            </View>
            {loadingPaymentMethods ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.paymentMethodsList}>
                {Object.entries(paymentMethodBalances).map(([method, amount]) => (
                  <View key={method} style={styles.paymentMethodItem}>
                    <Text style={styles.paymentMethodName}>{method}</Text>
                    <Text style={styles.paymentMethodAmount}>${amount.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.tapHint}>
              <Ionicons name="arrow-back-outline" size={12} color={Colors.textSecondary} />
              <Text style={styles.tapHintText}>Tap to go back</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* Monthly Budget */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Monthly Budget</Text>
            <View style={[
              styles.badge,
              budgetUsed >= 90 ? styles.badgeDanger : 
              budgetUsed >= 70 ? styles.badgeWarning : 
              styles.badgeSuccess
            ]}>
              <Text style={styles.badgeText}>{budgetUsed}% used</Text>
            </View>
          </View>
          <View style={styles.budgetInfo}>
            <Text style={styles.budgetAmount}>${spent} spent</Text>
            <Text style={styles.budgetAmount}>${budget} budget</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(budgetUsed, 100)}%` }]} />
          </View>
          {budgetUsed >= 90 && (
            <View style={styles.warningContainer}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.warningText}>You're close to your budget limit!</Text>
            </View>
          )}
        </View>

        {/* Recent Transactions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Transactions</Text>
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
              <Pressable
                key={transaction.id}
                onPress={() => {
                  setExpandedTransactionId(
                    expandedTransactionId === transaction.id ? null : transaction.id
                  );
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
                    <View style={styles.expandedDetailRow}>
                      <Text style={styles.expandedDetailLabel}>Date</Text>
                      <Text style={styles.expandedDetailValue}>
                        {new Date(transaction.occurred_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>

                    {transaction.payment_method && (
                      <View style={styles.expandedDetailRow}>
                        <Text style={styles.expandedDetailLabel}>Payment</Text>
                        <Text style={styles.expandedDetailValue}>{transaction.payment_method}</Text>
                      </View>
                    )}

                    {transaction.note && (
                      <View style={styles.expandedDetailRow}>
                        <Text style={styles.expandedDetailLabel}>Note</Text>
                        <Text style={styles.expandedDetailValue}>{transaction.note}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => {
                        Alert.alert(
                          'Delete Transaction',
                          'Are you sure?',
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
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Pressable>
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </RefreshableScrollView>
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
  },
  petSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  balanceCardContainer: {
    height: 180,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  balanceCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    backfaceVisibility: 'hidden',
  },
  balanceCardBack: {
    transform: [{ rotateY: '180deg' }],
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  balanceItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.gray200,
  },
  balanceItemLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  balanceItemValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 'auto',
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
  },
  tapHintText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  paymentMethodsList: {
    marginVertical: 8,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  paymentMethodAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
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
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSuccess: {
    backgroundColor: Colors.success,
  },
  badgeWarning: {
    backgroundColor: Colors.warning,
  },
  badgeDanger: {
    backgroundColor: Colors.error,
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
    height: 8,
    backgroundColor: Colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
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
  transactionExpandedDetails: {
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  expandedDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
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
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 12,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 12,
  },
});
