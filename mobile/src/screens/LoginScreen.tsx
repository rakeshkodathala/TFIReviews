import React, { useState } from "react";
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
} from "react-native";
import { AppText, AppTextInput } from "../components/Typography";
import { useAuth } from "../context/AuthContext";
import { typography } from "../constants/typography";
import { Ionicons } from "@expo/vector-icons";

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, continueAsGuest } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (error: any) {
      Alert.alert(
        "Login Failed",
        error.response?.data?.error || "Invalid credentials"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <AppText style={styles.title}>Welcome Back</AppText>
            <AppText style={styles.subtitle}>Sign in to continue</AppText>

            <View style={styles.form}>
              <AppTextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <AppTextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => navigation.navigate("ForgotPassword")}
              >
                <AppText style={styles.forgotPasswordText}>
                  Forgot Password?
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <AppText style={styles.buttonText}>Login</AppText>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => navigation.navigate("Register")}
              >
                <AppText style={styles.linkText}>
                  Don't have an account?{" "}
                  <AppText style={styles.linkBold}>Sign Up</AppText>
                </AppText>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <AppText style={styles.dividerText}>OR</AppText>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.guestButton}
                onPress={continueAsGuest}
              >
                <Ionicons name="person-outline" size={20} color="#007AFF" />
                <AppText style={styles.guestButtonText}>
                  Continue as Guest
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
    backgroundColor: "#1a1a1a",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  content: {
    width: "100%",
  },
  title: {
    ...typography.styles.h1,
    fontSize: 32,
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    ...typography.styles.body,
    color: "#999",
    marginBottom: 32,
  },
  form: {
    width: "100%",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 16,
    ...typography.styles.body,
    marginBottom: 16,
    backgroundColor: "#2a2a2a",
    color: "#fff",
  },
  button: {
    height: 50,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.styles.button,
    color: "#fff",
  },
  linkButton: {
    marginTop: 24,
    alignItems: "center",
  },
  linkText: {
    ...typography.styles.bodySmall,
    color: "#999",
  },
  linkBold: {
    ...typography.styles.buttonSmall,
    color: "#007AFF",
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: 8,
  },
  forgotPasswordText: {
    ...typography.styles.bodySmall,
    color: "#007AFF",
    fontSize: 14,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#333",
  },
  dividerText: {
    ...typography.styles.bodySmall,
    color: "#666",
    fontSize: 12,
  },
  guestButton: {
    height: 50,
    backgroundColor: "transparent",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  guestButtonText: {
    ...typography.styles.button,
    color: "#007AFF",
  },
});

export default LoginScreen;
