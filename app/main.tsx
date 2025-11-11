// app/main.tsx
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

// Temporarily render a lightweight placeholder pet view to avoid requiring
// `three` and `@react-three/*` packages in this repo. If you want to enable
// a 3D pet later, add the proper packages and replace this component with a
// web-only implementation.
function Pet() {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}>
        <Text>Pet Placeholder</Text>
      </View>
    </View>
  );
}
export default function Main() {
  const router = useRouter();
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX < -100) {
        router.push("/analysis");
      }
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <Pet />
        <TouchableOpacity style={styles.settings} onPress={() => router.push('/settigns')}>
          <Text>Settings</Text>
        </TouchableOpacity>
        <Animated.View style={styles.bottomButtons}>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/add-receipt')}>
            <Text>Add New Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/ask-anything')}>
            <Text>Ask Anything</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settings: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
});