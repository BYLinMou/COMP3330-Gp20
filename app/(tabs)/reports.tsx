import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import FloatingChatButton from '../../components/floating-chat-button';

const { width } = Dimensions.get('window');

type TabType = 'trends' | 'compare' | 'merchants' | 'search';

export default function ReportsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('trends');

  const totalIncome = 2500.00;
  const totalSpent = 192.50;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const actualSpending = [1800, 2100, 1650, 1900, 2200, 1700];
  const budgetTarget = [2000, 2000, 2000, 2000, 2000, 2000];

  const maxValue = Math.max(...actualSpending, ...budgetTarget);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Income and Spent Cards */}
        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={styles.summaryAmount}>${totalIncome.toFixed(2)}</Text>
            <View style={styles.trendIcon}>
              <Ionicons name="trending-up" size={24} color={Colors.white} />
            </View>
          </View>

          <View style={[styles.summaryCard, styles.spentCard]}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryAmount}>${totalSpent.toFixed(2)}</Text>
            <View style={styles.trendIcon}>
              <Ionicons name="trending-down" size={24} color={Colors.white} />
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'trends' && styles.tabActive]}
            onPress={() => setActiveTab('trends')}
          >
            <Text style={[styles.tabText, activeTab === 'trends' && styles.tabTextActive]}>
              Trends
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'compare' && styles.tabActive]}
            onPress={() => setActiveTab('compare')}
          >
            <Text style={[styles.tabText, activeTab === 'compare' && styles.tabTextActive]}>
              Compare
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'merchants' && styles.tabActive]}
            onPress={() => setActiveTab('merchants')}
          >
            <Text style={[styles.tabText, activeTab === 'merchants' && styles.tabTextActive]}>
              Merchants
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'search' && styles.tabActive]}
            onPress={() => setActiveTab('search')}
          >
            <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>
              Search
            </Text>
          </TouchableOpacity>
        </View>

        {/* Spending Trends Chart */}
        {activeTab === 'trends' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Spending Trends</Text>
            <Text style={styles.cardSubtitle}>Monthly spending vs budget over time</Text>

            <View style={styles.chartContainer}>
              {/* Y-axis labels */}
              <View style={styles.yAxisLabels}>
                <Text style={styles.yAxisLabel}>2200</Text>
                <Text style={styles.yAxisLabel}>1650</Text>
                <Text style={styles.yAxisLabel}>1100</Text>
                <Text style={styles.yAxisLabel}>550</Text>
                <Text style={styles.yAxisLabel}>0</Text>
              </View>

              {/* Chart area */}
              <View style={styles.chartArea}>
                {/* Grid lines */}
                <View style={styles.gridLines}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <View key={i} style={styles.gridLine} />
                  ))}
                </View>

                {/* Data points and lines */}
                <View style={styles.dataContainer}>
                  {months.map((month, index) => {
                    const actualHeight = (actualSpending[index] / maxValue) * 140;
                    const budgetHeight = (budgetTarget[index] / maxValue) * 140;

                    return (
                      <View key={month} style={styles.dataColumn}>
                        {/* Budget line point */}
                        <View
                          style={[
                            styles.dataPoint,
                            styles.budgetPoint,
                            { bottom: budgetHeight },
                          ]}
                        />
                        {/* Actual line point */}
                        <View
                          style={[
                            styles.dataPoint,
                            styles.actualPoint,
                            { bottom: actualHeight },
                          ]}
                        />
                      </View>
                    );
                  })}
                </View>

                {/* X-axis labels */}
                <View style={styles.xAxisLabels}>
                  {months.map((month) => (
                    <Text key={month} style={styles.xAxisLabel}>
                      {month}
                    </Text>
                  ))}
                </View>
              </View>
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.chartPurple }]} />
                <Text style={styles.legendText}>Actual Spending</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.chartCyan }]} />
                <Text style={styles.legendText}>Budget Target</Text>
              </View>
            </View>
          </View>
        )}

        {/* Compare Tab */}
        {activeTab === 'compare' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Compare Periods</Text>
            <Text style={styles.cardSubtitle}>Coming soon...</Text>
          </View>
        )}

        {/* Merchants Tab */}
        {activeTab === 'merchants' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Top Merchants</Text>
            <Text style={styles.cardSubtitle}>Coming soon...</Text>
          </View>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Search Transactions</Text>
            <Text style={styles.cardSubtitle}>Coming soon...</Text>
          </View>
        )}

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
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  incomeCard: {
    backgroundColor: Colors.success,
  },
  spentCard: {
    backgroundColor: Colors.error,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  trendIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    opacity: 0.3,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.textPrimary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 200,
    marginBottom: 16,
  },
  yAxisLabels: {
    width: 40,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: Colors.gray200,
  },
  dataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 160,
    position: 'relative',
  },
  dataColumn: {
    flex: 1,
    position: 'relative',
  },
  dataPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    left: '50%',
    marginLeft: -5,
    borderWidth: 2,
    backgroundColor: Colors.white,
  },
  actualPoint: {
    borderColor: Colors.chartPurple,
  },
  budgetPoint: {
    borderColor: Colors.chartCyan,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  xAxisLabel: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
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
  legendText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
