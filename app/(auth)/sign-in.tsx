import { useState } from 'react';
import { Alert, Button, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/services/supabase';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function onSignUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert('Sign up error', error.message);
    else Alert.alert('Registered');
  }

  async function onSignIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Sign in error', error.message);
    // 登录成功后，AuthProvider 会收到会话变化，Gate 会自动跳到 (main)
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ padding: 16, gap: 12 }}>
        <TextInput placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <Button title="Sign In" onPress={onSignIn} />
        <Button title="Sign Up" onPress={onSignUp} />
      </View>
    </SafeAreaView>
  );
}
