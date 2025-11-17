import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import FloatingChatButton from '../../components/floating-chat-button';

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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pet Speech Bubble */}
        <View style={styles.speechBubbleContainer}>
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>You're building wonderful money habits! 💖</Text>
            <View style={styles.bubblePointer} />
          </View>
        </View>

        {/* Pet Character Card */}
        <View style={styles.petCard}>
          {/* Pet Avatar */}
          <View style={styles.petAvatarContainer}>
            <View style={styles.petAvatar}>
              <Text style={styles.petEmoji}>🐶</Text>
            </View>
          </View>

          {/* Pet Info */}
          <View style={{ flex: 1 }}>
            <Text style={styles.petName}>Aura</Text>
            <Text style={styles.petLevel}>Level 3 Financial Mentor</Text>
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
  speechBubbleContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
    paddingRight: 40,
  },
  speechBubble: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  speechText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    lineHeight: 20,
  },
  bubblePointer: {
    position: 'absolute',
    bottom: -8,
    left: 16,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 0,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.primary,
  },
  petCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  petAvatarContainer: {
    marginBottom: 0,
  },
  petAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  petEmoji: {
    fontSize: 44,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 2,
  },
  petLevel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 0,
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    marginTop: 8,
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
    marginTop: 8,
    paddingTop: 8,
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
    padding: 12,
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
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  shopSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  outfitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  outfitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  outfitInfo: {
    flex: 1,
  },
  outfitName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 1,
  },
  outfitXP: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  outfitButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
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
});

