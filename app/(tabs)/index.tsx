import { Button, Text, View } from 'react-native';
import { supabase } from '../../src/services/supabase';

export default function Home() {
  return (
    <View style={{ flex: 1, padding: 16, gap: 12, justifyContent: 'center' }}>
      <Text>Welcome to AuraSpend 🎉</Text>
      <Button title="Sign out" onPress={() => supabase.auth.signOut()} />
    </View>
  );
}
