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
import { authService } from "../services/api";
import { typography } from "../constants/typography";
import { Ionicons } from "@expo/vector-icons";

interface ForgotPasswordScreenProps {
  navigation: any;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  navigation,
}) => {
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      await authService.forgotPassword(email);
      Alert.alert(
        "Code Sent",
        "A verification code has been sent to your email. Please check your inbox.",
        [{ text: "OK", onPress: () => setStep("otp") }]
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to send verification code"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit verification code");
      return;
    }

    try {
      setLoading(true);
      await authService.verifyOTP(email, otp);
      setStep("reset");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Invalid or expired verification code"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(email, otp, newPassword, confirmPassword);
      Alert.alert(
        "Success",
        "Your password has been reset successfully. You can now login with your new password.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to reset password"
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (step === "email") {
                  navigation.goBack();
                } else if (step === "otp") {
                  setStep("email");
                } else {
                  setStep("otp");
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <AppText style={styles.title}>Reset Password</AppText>
            <AppText style={styles.subtitle}>
              {step === "email" &&
                "Enter your email address to receive a verification code"}
              {step === "otp" &&
                "Enter the 6-digit code sent to your email"}
              {step === "reset" && "Enter your new password"}
            </AppText>

            <View style={styles.form}>
              {step === "email" && (
                <>
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

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSendOTP}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <AppText style={styles.buttonText}>Send Code</AppText>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {step === "otp" && (
                <>
                  <AppTextInput
                    style={styles.input}
                    placeholder="6-digit code"
                    placeholderTextColor="#999"
                    value={otp}
                    onChangeText={(text) => {
                      // Only allow numbers and limit to 6 digits
                      const numericValue = text.replace(/[^0-9]/g, "").slice(0, 6);
                      setOtp(numericValue);
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                  />

                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleSendOTP}
                    disabled={loading}
                  >
                    <AppText style={styles.resendText}>
                      Didn't receive code?{" "}
                      <AppText style={styles.resendBold}>Resend</AppText>
                    </AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleVerifyOTP}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <AppText style={styles.buttonText}>Verify Code</AppText>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {step === "reset" && (
                <>
                  <AppTextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor="#999"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={true}
                    autoCapitalize="none"
                  />

                  <AppTextInput
                    style={styles.input}
                    placeholder="Confirm New Password"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={true}
                    autoCapitalize="none"
                  />

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleResetPassword}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <AppText style={styles.buttonText}>Reset Password</AppText>
                    )}
                  </TouchableOpacity>
                </>
              )}
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
    padding: 20,
  },
  content: {
    width: "100%",
    marginTop: 20,
  },
  backButton: {
    marginBottom: 20,
    padding: 8,
    alignSelf: "flex-start",
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
    lineHeight: 20,
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
  resendButton: {
    marginTop: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  resendText: {
    ...typography.styles.bodySmall,
    color: "#999",
  },
  resendBold: {
    ...typography.styles.buttonSmall,
    color: "#007AFF",
  },
});

export default ForgotPasswordScreen;
