import React, { useMemo } from 'react';
import { View, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import FloatingChatButton from '../../components/floating-chat-button';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.tabIconSelected,
          tabBarInactiveTintColor: Colors.tabIconDefault,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: Colors.white,
            borderTopWidth: 1,
            borderTopColor: Colors.gray200,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
            height: Platform.OS === 'ios' ? 52 + insets.bottom : 52,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: 'Add',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="pet"
          options={{
            title: 'Pet',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="paw" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      
      {/* Floating Chat Button - Shared across all tabs, never unmounts */}
      {useMemo(() => <FloatingChatButton />, [])}
    </View>
  );
}
