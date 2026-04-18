import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GradientButton from '@/components/GradientButton';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // For demo purposes, simulate auth
      await new Promise((r) => setTimeout(r, 1500));

      // Save a dummy token
      await AsyncStorage.setItem('auth_token', 'demo-token-123');
      await AsyncStorage.setItem(
        'user_info',
        JSON.stringify({ name: name || 'User', email })
      );

      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Error', 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const skipLogin = async () => {
    await AsyncStorage.setItem('auth_token', 'guest-token');
    await AsyncStorage.setItem(
      'user_info',
      JSON.stringify({ name: 'Guest', email: 'guest@closingall.app' })
    );
    router.replace('/(tabs)');
  };

  return (
    <LinearGradient
      colors={[Colors.primary + '20', Colors.background, Colors.background]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="rocket" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>ClosingAll</Text>
          <Text style={styles.tagline}>Optimize. Secure. Enjoy.</Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Text>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color={Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={Colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={Colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <GradientButton
            title={isLogin ? 'Sign In' : 'Create Account'}
            onPress={handleSubmit}
            loading={loading}
            size="lg"
            style={{ marginTop: Spacing.md }}
          />

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.switchTextBold}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skip */}
        <TouchableOpacity style={styles.skipBtn} onPress={skipLogin}>
          <Text style={styles.skipText}>Continue as Guest</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary + '40',
    ...Shadows.glow,
  },
  appName: {
    color: Colors.textPrimary,
    fontSize: FontSize.hero,
    fontWeight: '900',
    marginTop: Spacing.md,
    letterSpacing: -1,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: 4,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  formCard: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.xl,
    ...Shadows.card,
  },
  formTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    paddingVertical: Spacing.md,
  },
  switchBtn: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  switchText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  switchTextBold: {
    color: Colors.primary,
    fontWeight: '700',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xl,
  },
  skipText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
});
