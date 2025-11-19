import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/services/supabase';
import { initializeUserAccount } from '../../src/services/profiles';
import { Colors } from '../../constants/theme';
import PetSelectionModal, { PetOption } from '../../components/pet-selection-modal';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPetSelection, setShowPetSelection] = useState(false);
  const [selectedPet, setSelectedPet] = useState<PetOption | null>(null);
  const router = useRouter();

  async function onSignUp() {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // Show pet selection modal before creating account
    setShowPetSelection(true);
  }

  async function handlePetSelected(pet: PetOption) {
    setSelectedPet(pet);
    setShowPetSelection(false);
    await createAccount(pet);
  }

  async function handleSkipPetSelection() {
    setShowPetSelection(false);
    await createAccount(null);
  }

  async function createAccount(pet: PetOption | null) {
    setLoading(true);
    
    try {
      // Step 1: Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        throw signUpError;
      }

      // Step 2: Initialize user account (create profile, categories, pet, etc.)
      if (data.user) {
        try {
          // Pass the user ID and selected pet to ensure it's used even if session isn't fully initialized
          await initializeUserAccount(data.user.id, pet ? {
            petType: pet.type,
            petBreed: pet.breed,
            petName: pet.name,
            petEmoji: pet.emoji,
          } : undefined);
          console.log('✅ User account initialized successfully');
        } catch (initError: any) {
          console.error('❌ Error initializing user account:', initError);
          
          // Check if it's a missing table error (demo mode)
          if (initError?.code === 'PGRST205' || initError?.code === '23503') {
            console.log('Note: Some database tables not set up yet, continuing with basic setup');
            // Account can still be used with mock data
          } else {
            // Other errors - still allow account creation
            Alert.alert(
              'Partial Setup',
              'Your account was created but some initial data failed to load. This will be set up automatically on first use.',
              [{ text: 'Continue to Sign In', onPress: () => router.replace('/(auth)/sign-in') }]
            );
            setLoading(false);
            return;
          }
        }
      }

      Alert.alert(
        'Success!',
        `Welcome to AuraSpend${pet ? ' with your ' + pet.name : ''}! Please check your email to verify your account.`,
        [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
      );
    } catch (error: any) {
      Alert.alert('Sign Up Error', error.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  }

  const scrollContent = (
    <>
      {/* Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🐾</Text>
        </View>
        <Text style={styles.appName}>Create Account</Text>
        <Text style={styles.subtitle}>Join AuraSpend today</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>Get Started</Text>
        <Text style={styles.descriptionText}>Create your account to start managing your finances</Text>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Create a password (min. 6 characters)"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color={Colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons 
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color={Colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity 
          style={[styles.signUpButton, loading && styles.buttonDisabled]} 
          onPress={onSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.signUpButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Terms Text */}
        <Text style={styles.termsText}>
          By signing up, you agree to our Terms of Service and Privacy Policy
        </Text>

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity disabled={loading}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={{ height: 40 }} />
      </View>

      {/* Pet Selection Modal */}
      <PetSelectionModal
        visible={showPetSelection}
        onSelect={handlePetSelected}
        onSkip={handleSkipPetSelection}
      />
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'web' ? (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {scrollContent}
        </ScrollView>
      ) : (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {scrollContent}
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 20,
    zIndex: 1,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
  },
  content: {
    padding: 24,
  },
  scrollContent: {
    flexGrow: 1,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.gray200,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  signUpButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  termsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  signInLink: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
});
