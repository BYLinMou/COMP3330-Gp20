import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/services/supabase';
import { Colors } from '../../constants/theme';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  async function onSignUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert('Sign up error', error.message);
    else Alert.alert('Registered');
  }

  async function onSignIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Sign in error', error.message);
    // Login success will be handled by AuthProvider
  }

  function skipToDemo() {
    // Navigate directly to tabs for demo mode
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        style={styles.header}
      >
        <Text style={styles.appName}>AuraPet</Text>
        <Text style={styles.subtitle}>Smart Budgeting Companion</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Demo Mode Notice */}
        <View style={styles.demoNotice}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <Text style={styles.demoText}>
            Running in demo mode. Supabase not configured.
          </Text>
        </View>

        {/* Skip to Demo Button */}
        <TouchableOpacity style={styles.demoButton} onPress={skipToDemo}>
          <Text style={styles.demoButtonText}>Continue to Demo</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or configure authentication</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Sign In Button */}
        <TouchableOpacity style={styles.signInButton} onPress={onSignIn}>
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>

        {/* Sign Up Button */}
        <TouchableOpacity style={styles.signUpButton} onPress={onSignUp}>
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>

        {/* Setup Instructions */}
        <View style={styles.setupInfo}>
          <Text style={styles.setupTitle}>To enable authentication:</Text>
          <Text style={styles.setupText}>1. Create a Supabase project</Text>
          <Text style={styles.setupText}>2. Update .env with your credentials</Text>
          <Text style={styles.setupText}>3. Restart the app</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
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
    flex: 1,
    padding: 24,
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  demoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  demoButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray300,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.textSecondary,
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
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  signInButton: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  signUpButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.textPrimary,
    marginBottom: 24,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  setupInfo: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
  },
  setupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  setupText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
});
