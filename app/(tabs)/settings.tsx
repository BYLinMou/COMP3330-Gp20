import { LinearGradient } from "expo-linear-gradient";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ProgressBar } from "react-native-paper"; // 或其他进度条库
import { supabase } from "../../src/services/supabase";
import { useAuth } from "../../src/providers/AuthProvider";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { session } = useAuth();

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Sign out error', error.message);
    }
    // 退出成功后，AuthProvider 会检测到会话变化，Gate 会自动跳转到登录页
  }
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <LinearGradient colors={["#7F00FF", "#56CCF2"]} style={styles.header}>
          <Text style={styles.appName}>AuraPet</Text>
          <Text style={styles.subtitle}>Smart Budgeting Companion</Text>
        </LinearGradient>

        {/* Balance Card */}
        <LinearGradient colors={["#7F00FF", "#56CCF2"]} style={styles.card}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceValue}>$1,247.50</Text>
          <View style={styles.row}>
            <Text>Income: $2500</Text>
            <Text>Spent: $1630</Text>
          </View>
        </LinearGradient>

        {/* Monthly Budget */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.cardTitle}>Monthly Budget</Text>
            <Text style={styles.badge}>82% used</Text>
          </View>
          <Text>$1630 spent / $2000 budget</Text>
          <ProgressBar progress={0.82} color="black" style={{ marginVertical: 8 }} />
          <Text style={{ color: "red" }}>⚠️ You're close to your budget limit!</Text>
        </View>

        {/* Spending Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending Breakdown</Text>
          {/* 饼图 / 图表在这里 */}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 20, borderRadius: 16, margin: 16 },
  appName: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#fff" },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    margin: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceLabel: { color: "#fff" },
  balanceValue: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  badge: {
    backgroundColor: "red",
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 12,
  },
  signOutButton: {
    backgroundColor: "#ff4444",
    padding: 16,
    borderRadius: 12,
    margin: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  signOutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
