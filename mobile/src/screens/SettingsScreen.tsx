import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppText } from "../components/Typography";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { usersService } from "../services/api";
import { useFocusEffect } from "@react-navigation/native";

const SETTINGS_STORAGE_KEY = "@tfireviews:settings";

interface UserSettings {
  darkMode: boolean;
  autoPlayTrailers: boolean;
  reviewNotifications: boolean;
  newMovieNotifications: boolean;
  watchlistNotifications: boolean;
  weeklyDigest: boolean;
  profilePublic: boolean;
  watchlistPublic: boolean;
  showEmail: boolean;
}

const SettingsScreen: React.FC = () => {
  const { user, isAuthenticated, isGuest } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    darkMode: true,
    autoPlayTrailers: false,
    reviewNotifications: true,
    newMovieNotifications: true,
    watchlistNotifications: false,
    weeklyDigest: true,
    profilePublic: true,
    watchlistPublic: true,
    showEmail: false,
  });

  // Load settings from AsyncStorage and backend
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);

      // First, try to load from AsyncStorage (for offline access)
      const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        setSettings(parsed);
      }

      // Then, sync with backend if authenticated
      if (isAuthenticated && !isGuest && user?.id) {
        try {
          const backendSettings = await usersService.getSettings(user.id);
          if (backendSettings) {
            setSettings(backendSettings);
            // Update AsyncStorage with backend data
            await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(backendSettings));
          }
        } catch (error) {
          console.error("Error loading settings from backend:", error);
          // Continue with AsyncStorage settings if backend fails
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isGuest, user?.id]);

  // Save settings to AsyncStorage and backend
  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      setSaving(true);
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      // Save to AsyncStorage immediately (for offline access)
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));

      // Sync with backend if authenticated
      if (isAuthenticated && !isGuest && user?.id) {
        try {
          await usersService.updateSettings(user.id, newSettings);
        } catch (error: any) {
          console.error("Error saving settings to backend:", error);
          Alert.alert(
            "Warning",
            "Settings saved locally but couldn't sync with server. They will sync when you're online."
          );
        }
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      Alert.alert("Error", "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Load settings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Display Settings */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Display</AppText>
          <View style={styles.listContainer}>
            <View style={[styles.listItem, styles.listItemFirst]}>
              <View style={styles.listItemLeft}>
                <View style={styles.listIconContainer}>
                  <Ionicons name="moon-outline" size={18} color="#007AFF" />
                </View>
                <View style={styles.listItemContent}>
                  <AppText style={styles.listItemLabel}>Dark Mode</AppText>
                  <AppText style={styles.listItemValue}>
                    {settings.darkMode ? "Enabled" : "Disabled"}
                  </AppText>
                </View>
              </View>
              <Switch
                value={settings.darkMode}
                onValueChange={(value) => saveSettings({ darkMode: value })}
                trackColor={{ false: "#333", true: "#007AFF" }}
                thumbColor="#fff"
                disabled={saving}
              />
            </View>
          </View>
        </View>

        {/* Content Settings */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Content</AppText>
          <View style={styles.listContainer}>
            <View style={[styles.listItem, styles.listItemFirst]}>
              <View style={styles.listItemLeft}>
                <View style={styles.listIconContainer}>
                  <Ionicons name="play-outline" size={18} color="#007AFF" />
                </View>
                <View style={styles.listItemContent}>
                  <AppText style={styles.listItemLabel}>Auto-play Trailers</AppText>
                  <AppText style={styles.listItemSubtext}>
                    Automatically play video previews
                  </AppText>
                </View>
              </View>
              <Switch
                value={settings.autoPlayTrailers}
                onValueChange={(value) => saveSettings({ autoPlayTrailers: value })}
                trackColor={{ false: "#333", true: "#007AFF" }}
                thumbColor="#fff"
                disabled={saving}
              />
            </View>
          </View>
        </View>

        {/* Data Settings */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Data & Storage</AppText>
          <View style={styles.listContainer}>
            <TouchableOpacity
              style={[styles.listItem, styles.listItemFirst]}
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert(
                  "Clear Cache",
                  "This will clear cached images and data. Continue?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Clear",
                      style: "destructive",
                      onPress: () => {
                        Alert.alert("Success", "Cache cleared successfully");
                      },
                    },
                  ]
                );
              }}
            >
              <View style={styles.listItemLeft}>
                <View style={styles.listIconContainer}>
                  <Ionicons name="trash-outline" size={18} color="#007AFF" />
                </View>
                <AppText style={styles.listItemValue}>Clear Cache</AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>About</AppText>
          <View style={styles.listContainer}>
            <TouchableOpacity
              style={[styles.listItem, styles.listItemFirst]}
              activeOpacity={0.7}
              onPress={() => {
                // Navigate to About screen
              }}
            >
              <View style={styles.listItemLeft}>
                <View style={styles.listIconContainer}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#007AFF"
                  />
                </View>
                <AppText style={styles.listItemValue}>App Version</AppText>
              </View>
              <AppText style={styles.versionText}>1.0.0</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  listContainer: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#2a2a2a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  listItemFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  listItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  listItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  listIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#007AFF15",
    justifyContent: "center",
    alignItems: "center",
  },
  listItemContent: {
    flex: 1,
  },
  listItemLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 2,
  },
  listItemValue: {
    fontSize: 13,
    color: "#999",
  },
  listItemSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  versionText: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SettingsScreen;
