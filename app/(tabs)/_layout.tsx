import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/constants/ThemeContext';
import { Shadows } from '@/constants/theme';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface + 'F0',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 90 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          ...Shadows.card,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        tabBarItemStyle: {
          gap: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? [styles.activeIconBg, { backgroundColor: colors.primary + '20' }] : undefined}>
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
            <View style={focused ? [styles.activeIconBg, { backgroundColor: colors.primary + '20' }] : undefined}>
              <Ionicons name={focused ? 'shield' : 'shield-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="performance"
        options={{
          title: 'Boost',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.centerBtnActive : styles.centerBtn}>
              <View style={[styles.centerBtnInner, { backgroundColor: focused ? colors.primary : colors.surface, borderColor: colors.primary }]}>
                <Ionicons name={focused ? 'flash' : 'flash-outline'} size={24} color={focused ? '#fff' : colors.primary} />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="media"
        options={{
          title: 'Media',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? [styles.activeIconBg, { backgroundColor: colors.primary + '20' }] : undefined}>
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
            <View style={focused ? [styles.activeIconBg, { backgroundColor: colors.primary + '20' }] : undefined}>
              <Ionicons name={focused ? 'camera' : 'camera-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconBg: {
    borderRadius: 12,
    padding: 6,
    marginBottom: -4,
  },
  centerBtn: {
    marginTop: -20,
  },
  centerBtnActive: {
    marginTop: -20,
  },
  centerBtnInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    ...Shadows.glow,
  },
});
