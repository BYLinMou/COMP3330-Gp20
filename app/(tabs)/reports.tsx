import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { RefreshableScrollView } from '../../components/refreshable-scroll-view';
import { 
  getSpendingBreakdown,
  type Transaction 
} from '../../src/services/transactions';
import { useAuth } from '../../src/providers/AuthProvider';

const { width } = Dimensions.get('window');

type TabType = 'trends' | 'compare' | 'merchants' | 'search' | 'breakdown' | 'weekly';

export default function ReportsScreen() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('trends');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [spendingData, setSpendingData] = useState<Array<{
    category: string;
    amount: number;
    color: string;
    percentage: number;
  }>>([]);

  const totalIncome = 2500.00;
  const totalSpent = 192.50;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const actualSpending = [1800, 2100, 1650, 1900, 2200, 1700];
  const budgetTarget = [2000, 2000, 2000, 2000, 2000, 2000];

  const maxValue = Math.max(...actualSpending, ...budgetTarget);

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
      loadSpendingData();
    }
  }, [session]);

  async function loadSpendingData() {
    try {
      setLoading(true);
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      const breakdown = await getSpendingBreakdown(startDate, endDate);
      
      const total = Object.values(breakdown).reduce<number>((sum, val) => sum + (val as number), 0);
      const chartData = Object.entries(breakdown).map(([category, amount]) => ({
        category,
        amount: amount as number,
        color: categoryColors[category] || Colors.chartPurple,
        percentage: Math.round(((amount as number) / total) * 100),
      }));
      
      setSpendingData(chartData);
    } catch (error) {
      console.error('Error loading spending data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      const breakdown = await getSpendingBreakdown(startDate, endDate);
      
      const total = Object.values(breakdown).reduce<number>((sum, val) => sum + (val as number), 0);
      const chartData = Object.entries(breakdown).map(([category, amount]) => ({
        category,
        amount: amount as number,
        color: categoryColors[category] || Colors.chartPurple,
        percentage: Math.round(((amount as number) / total) * 100),
      }));
      
      setSpendingData(chartData);
    } catch (error) {
      console.error('Error refreshing spending data:', error);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <RefreshableScrollView 
        style={styles.content}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
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
            style={[styles.tab, activeTab === 'breakdown' && styles.tabActive]}
            onPress={() => setActiveTab('breakdown')}
          >
            <Text style={[styles.tabText, activeTab === 'breakdown' && styles.tabTextActive]}>
              Breakdown
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'weekly' && styles.tabActive]}
            onPress={() => setActiveTab('weekly')}
          >
            <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>
              Weekly
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

        {/* Breakdown Tab */}
        {activeTab === 'breakdown' && (
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
                <View style={styles.chartContainerBreakdown}>
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
                <View style={styles.breakdownLegend}>
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
        )}

        {/* Weekly Tab */}
        {activeTab === 'weekly' && (
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
        )}

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
  // Breakdown tab styles
  chartContainerBreakdown: {
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
  breakdownLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendColumn: {
    flex: 1,
    gap: 12,
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
  // Weekly tab styles
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
  // Empty and loading states
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
