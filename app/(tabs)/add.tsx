import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AddScreen() {
  const [mode, setMode] = useState("manual");

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Add Transaction</Text>

      {/* Mode Selector */}
      <View style={styles.selector}>
        <TouchableOpacity
          style={[styles.option, mode === "manual" && styles.active]}
          onPress={() => setMode("manual")}
        >
          <Ionicons name="cash-outline" size={20} color={mode === "manual" ? "#fff" : "#000"} />
          <Text style={[styles.optionText, mode === "manual" && { color: "#fff" }]}>Manual</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, mode === "receipt" && styles.active]}
          onPress={() => setMode("receipt")}
        >
          <Ionicons name="camera-outline" size={20} color={mode === "receipt" ? "#fff" : "#000"} />
          <Text style={[styles.optionText, mode === "receipt" && { color: "#fff" }]}>Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, mode === "voice" && styles.active]}
          onPress={() => setMode("voice")}
        >
          <Ionicons name="mic-outline" size={20} color={mode === "voice" ? "#fff" : "#000"} />
          <Text style={[styles.optionText, mode === "voice" && { color: "#fff" }]}>Voice</Text>
        </TouchableOpacity>
      </View>

      {/* Content 根据 mode 渲染 */}
      {mode === "manual" && <ManualForm />}
      {mode === "receipt" && <Text>📸 Receipt Scan Coming Soon...</Text>}
      {mode === "voice" && <Text>🎙️ Voice Input Coming Soon...</Text>}
    </View>
  );
}

function ManualForm() {
  return (
    <View style={{ marginTop: 20 }}>
      <Text>Transaction Details</Text>
      {/* 这里放金额、描述、类别等输入框 */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  selector: { flexDirection: "row", justifyContent: "space-between" },
  option: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
  },
  active: {
    backgroundColor: "#000",
  },
  optionText: { marginTop: 4, fontSize: 12 },
});
