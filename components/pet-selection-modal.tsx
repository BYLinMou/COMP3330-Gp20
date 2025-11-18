import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients } from '../constants/theme';

const { width } = Dimensions.get('window');

export interface PetOption {
  id: string;
  name: string;
  emoji: string;
  type: 'dog' | 'cat';
  breed: string;
}

const PET_OPTIONS: PetOption[] = [
  { id: 'dog_labrador', name: 'Labrador', emoji: '🐕', type: 'dog', breed: 'Labrador Retriever' },
  { id: 'dog_golden', name: 'Golden', emoji: '🦮', type: 'dog', breed: 'Golden Retriever' },
  { id: 'cat_persian', name: 'Persian', emoji: '😺', type: 'cat', breed: 'Persian' },
  { id: 'cat_siamese', name: 'Siamese', emoji: '😸', type: 'cat', breed: 'Siamese' },
];

interface PetSelectionModalProps {
  visible: boolean;
  onSelect: (pet: PetOption) => void;
  onSkip?: () => void;
}

export default function PetSelectionModal({ visible, onSelect, onSkip }: PetSelectionModalProps) {
  const [selectedPet, setSelectedPet] = useState<PetOption | null>(null);

  const handleSelect = (pet: PetOption) => {
    setSelectedPet(pet);
  };

  const handleConfirm = () => {
    if (selectedPet) {
      onSelect(selectedPet);
      setSelectedPet(null);
    }
  };

  const handleSkip = () => {
    setSelectedPet(null);
    onSkip?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <LinearGradient
            colors={Gradients.primary.colors}
            start={Gradients.primary.start}
            end={Gradients.primary.end}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Choose Your First Pet! 🎉</Text>
            <Text style={styles.headerSubtitle}>
              Your pet will help you build better financial habits
            </Text>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Dogs Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="paw" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Dogs</Text>
              </View>
              <View style={styles.petGrid}>
                {PET_OPTIONS.filter(p => p.type === 'dog').map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    style={[
                      styles.petCard,
                      selectedPet?.id === pet.id && styles.petCardSelected,
                    ]}
                    onPress={() => handleSelect(pet)}
                  >
                    <Text style={styles.petEmoji}>{pet.emoji}</Text>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petBreed}>{pet.breed}</Text>
                    {selectedPet?.id === pet.id && (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Cats Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="paw" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Cats</Text>
              </View>
              <View style={styles.petGrid}>
                {PET_OPTIONS.filter(p => p.type === 'cat').map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    style={[
                      styles.petCard,
                      selectedPet?.id === pet.id && styles.petCardSelected,
                    ]}
                    onPress={() => handleSelect(pet)}
                  >
                    <Text style={styles.petEmoji}>{pet.emoji}</Text>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petBreed}>{pet.breed}</Text>
                    {selectedPet?.id === pet.id && (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton, !selectedPet && styles.buttonDisabled]}
              onPress={handleConfirm}
              disabled={!selectedPet}
            >
              <Text style={styles.confirmButtonText}>
                {selectedPet ? `Adopt ${selectedPet.name}` : 'Select a Pet'}
              </Text>
            </TouchableOpacity>
            {onSkip && (
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip for Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  petGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  petCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray200,
    position: 'relative',
  },
  petCardSelected: {
    borderColor: Colors.success,
    backgroundColor: '#f0fdf4',
  },
  petEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  petName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
