import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

export default function PetScreen() {
  const happiness = 85;
  const energy = 70;
  const levelProgress = 245;
  const levelMax = 300;
  const dailyStreak = 7;
  const lastFed = '8h ago';

  const outfits = [
    { id: 1, name: 'Casual', xp: 0, unlocked: true, wearing: true },
    { id: 2, name: 'Business Suit', xp: 100, unlocked: false },
    { id: 3, name: 'Party Hat', xp: 50, unlocked: false },
    { id: 4, name: 'Cape & Mask', xp: 150, unlocked: false },
    { id: 5, name: 'Cozy Sweater', xp: 75, unlocked: false },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        style={styles.header}
      >
        <Text style={styles.appName}>AuraSpend</Text>
        <Text style={styles.subtitle}>Smart Budgeting Companion</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pet Character Card */}
        <View style={styles.petCard}>
          {/* Pet Avatar */}
          <View style={styles.petAvatarContainer}>
            <View style={styles.petAvatar}>
              <Text style={styles.petEmoji}>🐶</Text>
            </View>
          </View>

          {/* Pet Info */}
          <Text style={styles.petName}>Aura</Text>
          <Text style={styles.petLevel}>Level 3 Financial Mentor</Text>

          {/* Encouragement Message */}
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>You're building wonderful money habits! 💖</Text>
            <TouchableOpacity style={styles.dismissButton}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pet Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="heart" size={24} color={Colors.error} />
            <Text style={styles.cardTitle}>Pet Status</Text>
          </View>

          {/* Happiness */}
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Happiness</Text>
            <Text style={styles.statusValue}>{happiness}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, styles.happinessFill, { width: `${happiness}%` }]} />
          </View>

          {/* Energy */}
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Energy</Text>
            <Text style={styles.statusValue}>{energy}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, styles.energyFill, { width: `${energy}%` }]} />
          </View>

          {/* Level Progress */}
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Level Progress</Text>
            <Text style={styles.statusValue}>{levelProgress}/{levelMax} XP</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                styles.levelFill,
                { width: `${(levelProgress / levelMax) * 100}%` },
              ]}
            />
          </View>

          {/* Daily Streak */}
          <View style={styles.streakContainer}>
            <View style={styles.streakLeft}>
              <Ionicons name="flash" size={20} color={Colors.warning} />
              <Text style={styles.streakText}>Daily Streak: {dailyStreak} days</Text>
            </View>
            <Text style={styles.streakTime}>Last fed: {lastFed}</Text>
          </View>
        </View>

        {/* Come Back Timer */}
        <View style={styles.timerCard}>
          <Ionicons name="time-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.timerText}>Come back in 4 hours</Text>
        </View>
        <Text style={styles.timerSubtext}>
          Feed your pet by logging expenses regularly to keep them happy!
        </Text>

        {/* Outfit Shop */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="gift" size={24} color={Colors.success} />
            <Text style={styles.cardTitle}>Outfit Shop</Text>
          </View>
          <Text style={styles.shopSubtitle}>
            Earn XP by achieving financial goals to unlock new outfits!
          </Text>

          {/* Outfits List */}
          {outfits.map((outfit) => (
            <View key={outfit.id} style={styles.outfitItem}>
              <View style={styles.outfitLeft}>
                <Ionicons
                  name={outfit.unlocked ? 'star' : 'star-outline'}
                  size={24}
                  color={outfit.unlocked ? Colors.warning : Colors.gray400}
                />
                <View style={styles.outfitInfo}>
                  <Text style={styles.outfitName}>{outfit.name}</Text>
                  {!outfit.unlocked && <Text style={styles.outfitXP}>{outfit.xp} XP</Text>}
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.outfitButton,
                  outfit.wearing && styles.outfitButtonWearing,
                  !outfit.unlocked && styles.outfitButtonLocked,
                ]}
                disabled={!outfit.unlocked}
              >
                <Text
                  style={[
                    styles.outfitButtonText,
                    outfit.wearing && styles.outfitButtonTextWearing,
                    !outfit.unlocked && styles.outfitButtonTextLocked,
                  ]}
                >
                  {outfit.wearing ? 'Wearing' : outfit.unlocked ? 'Wear' : 'Buy'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="chatbubble-ellipses" size={28} color={Colors.white} />
      </TouchableOpacity>
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
  petCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  petAvatarContainer: {
    marginBottom: 16,
  },
  petAvatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  petEmoji: {
    fontSize: 80,
  },
  petName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  petLevel: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  messageBox: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  messageText: {
    fontSize: 15,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  dismissButton: {
    alignSelf: 'center',
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
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
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 12,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  progressBar: {
    height: 10,
    backgroundColor: Colors.gray200,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  happinessFill: {
    backgroundColor: Colors.textPrimary,
  },
  energyFill: {
    backgroundColor: Colors.textPrimary,
  },
  levelFill: {
    backgroundColor: Colors.textPrimary,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  streakTime: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  timerCard: {
    backgroundColor: Colors.gray200,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  timerSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  shopSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  outfitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  outfitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  outfitInfo: {
    flex: 1,
  },
  outfitName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  outfitXP: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  outfitButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.textPrimary,
  },
  outfitButtonWearing: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  outfitButtonLocked: {
    backgroundColor: Colors.white,
    borderColor: Colors.gray300,
  },
  outfitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  outfitButtonTextWearing: {
    color: Colors.white,
  },
  outfitButtonTextLocked: {
    color: Colors.gray400,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
