import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { AppText, AppTextInput } from '../components/Typography';
import { typography } from '../constants/typography';
import { useAuth } from '../context/AuthContext';

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await register(username, email, password, name || undefined);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
          <AppText style={styles.title}>Create Account</AppText>
          <AppText style={styles.subtitle}>Sign up to get started</AppText>

          <View style={styles.form}>
            <AppTextInput
              style={styles.input}
              placeholder="Username *"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <AppTextInput
              style={styles.input}
              placeholder="Email *"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <AppTextInput
              style={styles.input}
              placeholder="Full Name (optional)"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />

            <AppTextInput
              style={styles.input}
              placeholder="Password *"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <AppText style={styles.buttonText}>Sign Up</AppText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Login')}
            >
              <AppText style={styles.linkText}>
                Already have an account? <AppText style={styles.linkBold}>Sign In</AppText>
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
  },
  title: {
    ...typography.styles.h1,
    fontSize: 32,
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    ...typography.styles.body,
    color: '#999',
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    ...typography.styles.body,
    marginBottom: 16,
    backgroundColor: '#2a2a2a',
    color: '#fff',
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.styles.button,
    color: '#fff',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    ...typography.styles.bodySmall,
    color: '#999',
  },
  linkBold: {
    ...typography.styles.buttonSmall,
    color: '#007AFF',
  },
});

export default RegisterScreen;
