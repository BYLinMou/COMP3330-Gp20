import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { getUserPets, switchPet, type UserPet, type PetState } from '../src/services/pet';

interface FlippablePetCardProps {
  petState: PetState | null;
  activePet: UserPet | null;
  size?: 'small' | 'large';
  onPetChanged?: () => void;
}

export default function FlippablePetCard({ 
  petState, 
  activePet, 
  size = 'small',
  onPetChanged 
}: FlippablePetCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [userPets, setUserPets] = useState<UserPet[]>([]);
  const [loading, setLoading] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;
  
  // Animation refs for pet movement
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isLarge = size === 'large';
  const petSize = isLarge ? 180 : 120;
  const cardHeight = isLarge ? 280 : 200;

  useEffect(() => {
    startPetAnimations();
    const animationLoop = setInterval(() => {
      startPetAnimations();
    }, 5000);
    return () => clearInterval(animationLoop);
  }, []);

  const startPetAnimations = () => {
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: -10,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: -1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadUserPets = async () => {
    try {
      const pets = await getUserPets();
      setUserPets(pets);
    } catch (error: any) {
      console.error('Error loading user pets:', error);
    }
  };

  const handleFlip = async () => {
    if (!isFlipped) {
      // Load pets when flipping to back
      await loadUserPets();
    }

    Animated.spring(flipAnimation, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();

    setIsFlipped(!isFlipped);
  };

  const handleSelectPet = async (pet: UserPet) => {
    if (pet.id === activePet?.id) {
      // Already active, just flip back
      handleFlip();
      return;
    }

    try {
      setLoading(true);
      await switchPet(pet.id);
      Alert.alert('Success', `Switched to ${pet.pet_name}!`);
      handleFlip();
      if (onPetChanged) {
        onPetChanged();
      }
    } catch (error: any) {
      console.error('Error switching pet:', error);
      Alert.alert('Error', 'Failed to switch pet');
    } finally {
      setLoading(false);
    }
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [0, 90, 180],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [0, 90, 180],
    outputRange: [0, 0, 1],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-8deg', '8deg'],
  });

  return (
    <TouchableOpacity 
      style={[styles.cardContainer, { height: cardHeight }]} 
      onPress={handleFlip}
      activeOpacity={0.9}
    >
      {/* Front - Active Pet */}
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ rotateY: frontInterpolate }],
            opacity: frontOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={['#ffffff', '#f5f5f5']}
          style={styles.gradientCard}
        >
          <Animated.View 
            style={[
              styles.petContainer,
              {
                transform: [
                  { translateY: bounceAnim },
                  { rotate: rotate },
                  { scale: scaleAnim },
                ],
              }
            ]}
          >
            <View style={[styles.petAvatar, { width: petSize, height: petSize, borderRadius: petSize / 2 }]}>
              <Text style={[styles.petEmoji, { fontSize: petSize * 0.53 }]}>
                {activePet?.pet_emoji || '🐶'}
              </Text>
            </View>
          </Animated.View>
          <Text style={[styles.petName, isLarge && styles.petNameLarge]}>
            {activePet?.pet_name || 'Aura'}
          </Text>
          <Text style={styles.petLevel}>
            Level {petState?.level || 1} • {petState?.xp || 0} XP
          </Text>
          <View style={styles.tapHint}>
            <Ionicons name="sync-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.tapHintText}>Tap to switch pets</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Back - Pet Selection */}
      <Animated.View
        style={[
          styles.card,
          styles.cardBack,
          {
            transform: [{ rotateY: backInterpolate }],
            opacity: backOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={['#ffffff', '#f0f0f0']}
          style={styles.gradientCard}
        >
          <Text style={styles.backTitle}>Choose Your Pet</Text>
          <View style={styles.petGrid}>
            {userPets.length > 0 ? (
              userPets.map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={[
                    styles.petOption,
                    pet.id === activePet?.id && styles.petOptionActive,
                  ]}
                  onPress={() => handleSelectPet(pet)}
                  disabled={loading}
                >
                  <Text style={styles.petOptionEmoji}>{pet.pet_emoji}</Text>
                  <Text style={styles.petOptionName} numberOfLines={1}>
                    {pet.pet_name}
                  </Text>
                  {pet.id === activePet?.id && (
                    <View style={styles.activeIndicator}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noPetsText}>No pets available</Text>
            )}
          </View>
          <View style={styles.tapHint}>
            <Ionicons name="arrow-back-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.tapHintText}>Tap to go back</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    marginBottom: 16,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    transform: [{ rotateY: '180deg' }],
  },
  gradientCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  petContainer: {
    marginBottom: 12,
  },
  petAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  petEmoji: {
    lineHeight: undefined,
  },
  petName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  petNameLarge: {
    fontSize: 28,
  },
  petLevel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  tapHintText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  backTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  petGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  petOption: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray200,
  },
  petOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  petOptionEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  petOptionName: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  noPetsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
