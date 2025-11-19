import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients } from '../../constants/theme';
import { RefreshableScrollView } from '../../components/refreshable-scroll-view';
import FlippablePetCard from '../../components/flippable-pet-card';
import { 
  getPetState, 
  getActivePet, 
  purchasePet,
  AVAILABLE_PETS,
  UserPet,
  PetState,
} from '../../src/services/pet';


export default function PetScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [petState, setPetState] = useState<PetState | null>(null);
  const [activePet, setActivePet] = useState<UserPet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPetData();
  }, []);

  const loadPetData = async () => {
    try {
      const [state, active] = await Promise.all([
        getPetState(),
        getActivePet(),
      ]);
      
      setPetState(state);
      setActivePet(active);
    } catch (error: any) {
      console.error('Error loading pet data:', error);
      // Show error to user if needed
      Alert.alert('Error', 'Failed to load pet data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  async function onRefresh() {
    setRefreshing(true);
    await loadPetData();
    setRefreshing(false);
  }

  const handlePurchasePet = async (petId: string) => {
    try {
      const availablePet = AVAILABLE_PETS.find(p => p.id === petId);
      if (!availablePet) return;

      // Check if user has enough XP
      if (petState && petState.xp < availablePet.xp_cost) {
        Alert.alert(
          'Not Enough XP',
          `You need ${availablePet.xp_cost} XP but only have ${petState.xp} XP. Keep logging expenses to earn more!`
        );
        return;
      }

      Alert.alert(
        'Purchase Pet',
        `Do you want to purchase ${availablePet.breed} for ${availablePet.xp_cost} XP?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Purchase',
            onPress: async () => {
              try {
                await purchasePet(petId);
                Alert.alert('Success!', `${availablePet.breed} has been added to your collection!`);
                await loadPetData();
              } catch (error: any) {
                console.error('Error purchasing pet:', error);
                Alert.alert('Error', error.message || 'Failed to purchase pet');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error purchasing pet:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your pet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const happiness = petState?.mood || 0;
  const energy = petState?.hunger || 0;
  const levelProgress = petState?.xp || 0;
  const levelMax = ((petState?.level || 1) * 100);
  const dailyStreak = 7; // TODO: Calculate from transaction history
  const lastFed = petState?.last_feed_at 
    ? `${Math.floor((Date.now() - new Date(petState.last_feed_at).getTime()) / (1000 * 60 * 60))}h ago`
    : 'Never';

  const outfits = [
    { id: 1, name: 'Casual', xp: 0, unlocked: true, wearing: true },
    { id: 2, name: 'Business Suit', xp: 100, unlocked: false },
    { id: 3, name: 'Party Hat', xp: 50, unlocked: false },
    { id: 4, name: 'Cape & Mask', xp: 150, unlocked: false },
    { id: 5, name: 'Cozy Sweater', xp: 75, unlocked: false },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <RefreshableScrollView 
        style={styles.content}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        {/* Pet Speech Bubble */}
        <View style={styles.speechBubbleContainer}>
          <LinearGradient
            colors={Gradients.primary.colors}
            start={Gradients.primary.start}
            end={Gradients.primary.end}
            style={styles.speechBubble}
          >
            <Text style={styles.speechText}>You're building wonderful money habits! 💖</Text>
          </LinearGradient>
          <View style={styles.bubblePointer} />
        </View>

        {/* Flippable Pet Card */}
        <View style={styles.petCardContainer}>
          <FlippablePetCard 
            petState={petState} 
            activePet={activePet} 
            size="large"
            onPetChanged={loadPetData}
          />
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

        {/* Choose Your Pets Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="storefront" size={24} color={Colors.primary} />
            <Text style={styles.cardTitle}>Choose Your Pets</Text>
          </View>
          <Text style={styles.shopSubtitle}>
            Purchase new pets with your XP! Current XP: {petState?.xp || 0}
          </Text>

          {/* Available Pets for Purchase */}
          {AVAILABLE_PETS.map((pet) => {
            const owned = false; // TODO: Check ownership when needed
            return (
              <View key={pet.id} style={styles.petShopItem}>
                <View style={styles.petShopLeft}>
                  <Text style={styles.petShopEmoji}>{pet.emoji}</Text>
                  <View style={styles.petShopInfo}>
                    <Text style={styles.petShopName}>{pet.breed}</Text>
                    <Text style={styles.petShopDescription}>{pet.description}</Text>
                    {!owned && <Text style={styles.petShopCost}>{pet.xp_cost} XP</Text>}
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.petShopButton,
                    owned && styles.petShopButtonOwned,
                  ]}
                  onPress={() => !owned && handlePurchasePet(pet.id)}
                  disabled={owned}
                >
                  <Text
                    style={[
                      styles.petShopButtonText,
                      owned && styles.petShopButtonTextOwned,
                    ]}
                  >
                    {owned ? 'Owned' : 'Buy'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

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
      </RefreshableScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
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
    borderTopColor: Colors.gradientStart,
  },
  petCardContainer: {
    marginBottom: 16,
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
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  shopSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  petShopItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  petShopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  petShopEmoji: {
    fontSize: 36,
  },
  petShopInfo: {
    flex: 1,
  },
  petShopName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  petShopDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  petShopCost: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  petShopButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  petShopButtonOwned: {
    backgroundColor: Colors.gray300,
  },
  petShopButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  petShopButtonTextOwned: {
    color: Colors.gray600 || Colors.textSecondary,
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

