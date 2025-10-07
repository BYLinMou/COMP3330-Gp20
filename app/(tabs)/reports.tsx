import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2,
  useShadowColorFromDataset: false,
};

const lineData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      data: [1650, 1800, 1500, 1700, 2000, 1600], // 估計從截圖的Actual Spending
      color: (opacity = 1) => `rgba(128, 0, 128, ${opacity})`, // 紫色
      strokeWidth: 2,
    },
    {
      data: [2200, 2200, 2200, 2200, 2200, 2200], // Budget Target 水平線
      color: (opacity = 1) => `rgba(0, 191, 255, ${opacity})`, // 藍色
      strokeWidth: 1,
      withDots: false,
      withDash: true, // 虛線 (但chart-kit不直接支持，需自訂)
    },
  ],
  legend: ["Actual Spending", "Budget Target"],
};

export default function ReportScreen() {
  const [activeTab, setActiveTab] = useState("Trends");

  return (
    <ScrollView style={styles.container}>
      {/* Total Income and Total Spent */}
      <View style={styles.summaryRow}>
        <LinearGradient colors={["#32CD32", "#228B22"]} style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Income</Text>
          <Text style={styles.summaryValue}>$2500.00</Text>
          <Text style={styles.arrow}>↑</Text>
        </LinearGradient>
        <LinearGradient colors={["#FF4500", "#FF0000"]} style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={styles.summaryValue}>$192.50</Text>
          <Text style={styles.arrow}>↓</Text>
        </LinearGradient>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "Trends" && styles.activeTab]}
          onPress={() => setActiveTab("Trends")}
        >
          <Text style={[styles.tabText, activeTab === "Trends" && styles.activeTabText]}>Trends</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "Compare" && styles.activeTab]}
          onPress={() => setActiveTab("Compare")}
        >
          <Text style={[styles.tabText, activeTab === "Compare" && styles.activeTabText]}>Compare</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "Merchants" && styles.activeTab]}
          onPress={() => setActiveTab("Merchants")}
        >
          <Text style={[styles.tabText, activeTab === "Merchants" && styles.activeTabText]}>Merchants</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "Search" && styles.activeTab]}
          onPress={() => setActiveTab("Search")}
        >
          <Text style={[styles.tabText, activeTab === "Search" && styles.activeTabText]}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      {activeTab === "Trends" && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Spending Trends</Text>
          <Text style={styles.chartSubtitle}>Monthly spending vs budget over time</Text>
          <LineChart
            data={lineData}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            bezier // 使線條平滑
            style={styles.chart}
          />
        </View>
      )}
      {activeTab === "Compare" && <Text style={styles.placeholder}>Compare Content Coming Soon...</Text>}
      {activeTab === "Merchants" && <Text style={styles.placeholder}>Merchants Content Coming Soon...</Text>}
      {activeTab === "Search" && <Text style={styles.placeholder}>Search Content Coming Soon...</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", margin: 16 },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 8,
  },
  summaryLabel: { color: "#fff", fontSize: 14 },
  summaryValue: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  arrow: { color: "#fff", fontSize: 18 },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#000",
  },
  tabText: {
    color: "#000",
    fontSize: 14,
  },
  activeTabText: {
    color: "#fff",
  },
  chartSection: {
    margin: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 8,
  },
  chart: {
    borderRadius: 8,
  },
  placeholder: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 32,
  },
});