import { LinearGradient } from "expo-linear-gradient";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ProgressBar } from "react-native-paper";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PetScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <LinearGradient colors={["#7F00FF", "#56CCF2"]} style={styles.header}>
          <Text style={styles.appName}>AuraPet</Text>
          <Text style={styles.subtitle}>Your Financial Companion</Text>
        </LinearGradient>

        {/* Pet Image and Info */}
        <View style={styles.petSection}>
          <Image
            source={{ uri: "https://media.craiyon.com/2025-04-11/AoaBEBW7QbuyjluUUpnbnQ.webp" }}
            style={styles.petImage}
          />
          <Text style={styles.petName}>Aura</Text>
          <Text style={styles.petLevel}>Level 5 Financial Mentor</Text>
          <Text style={styles.petMessage}>You're building wonderful habits! ❤️</Text>
        </View>

        {/* Pet Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pet Status</Text>
          <Text style={styles.statusLabel}>Happiness</Text>
          <ProgressBar progress={0.7} color="#FF6384" style={styles.progressBar} />
          <Text style={styles.statusValue}>70%</Text>

          <Text style={styles.statusLabel}>Growth</Text>
          <ProgressBar progress={0.7} color="#36A2EB" style={styles.progressBar} />
          <Text style={styles.statusValue}>70/100 GP</Text>

          <View style={styles.streakRow}>
            <Text style={styles.streakLabel}>Daily Streak</Text>
            <Text style={styles.streakValue}>7 Days</Text>
          </View>
          <View style={styles.streakRow}>
            <Text style={styles.streakLabel}>Last fed:</Text>
            <Text style={styles.streakValue}>7 hours ago</Text>
          </View>
        </View>

        {/* Feed Button */}
        <TouchableOpacity style={styles.feedButton}>
          <Text style={styles.feedButtonText}>Feed Pet</Text>
          <Text style={styles.feedSubtitle}>Come back in 4 hours to keep your pet happy!</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 20, borderRadius: 16, margin: 16, alignItems: "center" },
  appName: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#fff" },
  petSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  petImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  petName: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
  },
  petLevel: {
    fontSize: 16,
    color: "#888",
  },
  petMessage: {
    fontSize: 16,
    color: "#FF6384",
    marginTop: 5,
  },
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 12,
    color: "#888",
    textAlign: "right",
    marginBottom: 12,
  },
  streakRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 14,
    color: "#888",
  },
  streakValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  feedButton: {
    backgroundColor: "#7F00FF",
    padding: 16,
    borderRadius: 50,
    alignItems: "center",
    marginHorizontal: 100,
    marginBottom: 20,
  },
  feedButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  feedSubtitle: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
});