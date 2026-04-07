import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import {
  BROWN,
  MUTED_GREEN,
  PAPER_BEIGE,
  TERRACOTTA,
  WARM_BG,
} from '../../constants/colors';
import { useSettingsStore } from '../../store/settingsStore';
import { getThemeColors } from '../../utils/themeHelpers';

const AuthScreen = () => {
  const theme = useSettingsStore((s) => s.theme);
  const colors = getThemeColors(theme);
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const handleAuth = async (mode) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      setError('Enter email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    if (mode === 'signup') {
      const { data, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
      });
      if (authError) {
        setError(authError.message);
      } else if (data?.user && !data?.session) {
        setInfo('Check your email to confirm your account.');
      }
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });
      if (authError) setError(authError.message);
    }
    setLoading(false);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <KeyboardAvoidingView
        style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={[styles.title, { color: colors.accent }]}>PinNest</Text>
        <Text style={[styles.tagline, { color: colors.text }]}>Your goals. Always in sight.</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.mutedText}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.mutedText}
          secureTextEntry
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <Pressable
          onPress={() => handleAuth('signin')}
          style={[styles.button, styles.primary, { backgroundColor: colors.accent }]}
          disabled={loading}
        >
          <Text style={styles.primaryText}>Sign In</Text>
        </Pressable>
        <Pressable
          onPress={() => handleAuth('signup')}
          style={[styles.button, styles.secondary, { borderColor: colors.accent }]}
          disabled={loading}
        >
          <Text style={styles.secondaryText}>Sign Up</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WARM_BG,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: PAPER_BEIGE,
    borderRadius: 16,
    padding: 20,
    shadowColor: BROWN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: TERRACOTTA,
  },
  tagline: {
    marginTop: 6,
    marginBottom: 16,
    color: BROWN,
    fontSize: 14,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    color: BROWN,
    marginBottom: 10,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  primary: {
    backgroundColor: TERRACOTTA,
  },
  secondary: {
    borderWidth: 1,
    borderColor: TERRACOTTA,
  },
  primaryText: {
    color: PAPER_BEIGE,
    fontWeight: '700',
  },
  secondaryText: {
    color: TERRACOTTA,
    fontWeight: '700',
  },
  error: {
    color: TERRACOTTA,
    fontSize: 12,
    marginBottom: 6,
  },
  info: {
    color: MUTED_GREEN,
    fontSize: 12,
    marginBottom: 6,
  },
});

export default AuthScreen;
