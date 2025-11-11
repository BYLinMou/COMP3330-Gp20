import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  // Mock data
  const balance = 1247.50;
  const income = 2500;
  const spent = 1630;
  const budget = 2000;
  const budgetUsed = Math.round((spent / budget) * 100);

  const spendingData = [
    { category: 'Food', amount: 450, color: Colors.chartPurple, percentage: 28 },
    { category: 'Transport', amount: 280, color: Colors.chartCyan, percentage: 17 },
    { category: 'Entertainment', amount: 180, color: Colors.chartOrange, percentage: 11 },
    { category: 'Shopping', amount: 320, color: Colors.chartRed, percentage: 20 },
    { category: 'Bills', amount: 400, color: Colors.chartGreen, percentage: 24 },
  ];

  const recentTransactions = [
    { id: 1, name: 'Coffee Shop', amount: -4.50, time: '2 hours ago', category: 'Food' },
    { id: 2, name: 'Subway Ticket', amount: -2.80, time: '5 hours ago', category: 'Transport' },
    { id: 3, name: 'Salary Deposit', amount: 2500.00, time: '1 day ago', category: 'Income' },
    { id: 4, name: 'Netflix', amount: -12.99, time: '2 days ago', category: 'Entertainment' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        style={styles.header}
      >
        <Text style={styles.appName}>AuraPet</Text>
        <Text style={styles.subtitle}>Smart Budgeting Companion</Text>
      </LinearGradient>

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
              {spendingData.slice(0, 3).map((item) => (
                <View key={item.category} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendLabel}>{item.category}</Text>
                  <Text style={styles.legendAmount}>${item.amount}</Text>
                </View>
              ))}
            </View>
            <View style={styles.legendColumn}>
              {spendingData.slice(3).map((item) => (
                <View key={item.category} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendLabel}>{item.category}</Text>
                  <Text style={styles.legendAmount}>${item.amount}</Text>
                </View>
              ))}
            </View>
          </View>
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
          {recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionName}>{transaction.name}</Text>
                <Text style={styles.transactionTime}>{transaction.time}</Text>
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
                <Text style={styles.transactionCategory}>{transaction.category}</Text>
              </View>
            </View>
          ))}
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
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
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
});
