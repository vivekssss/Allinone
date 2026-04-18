import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors, Shadows } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconBg : undefined}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="security"
        options={{
          title: 'Security',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconBg : undefined}>
              <Ionicons name={focused ? 'rocket' : 'rocket-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="performance"
        options={{
          title: 'Boost',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconBg : undefined}>
              <Ionicons name={focused ? 'speedometer' : 'speedometer-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="media"
        options={{
          title: 'Media',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconBg : undefined}>
              <Ionicons name={focused ? 'musical-notes' : 'musical-notes-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconBg : undefined}>
              <Ionicons name={focused ? 'camera' : 'camera-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
    height: Platform.OS === 'ios' ? 88 : 65,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
    ...Shadows.card,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabItem: {
    gap: 2,
  },
  activeIconBg: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 12,
    padding: 6,
    marginBottom: -4,
  },
});
