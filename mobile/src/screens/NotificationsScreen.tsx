import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, Switch, ActivityIndicator, Alert } from "react-native";
import { AppText } from "../components/Typography";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { notificationsService } from "../services/api";
import { useFocusEffect } from "@react-navigation/native";

const NotificationsScreen: React.FC = () => {
  const { isAuthenticated, isGuest } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviewNotifications, setReviewNotifications] = useState(true);
  const [newMovieNotifications, setNewMovieNotifications] = useState(true);
  const [watchlistNotifications, setWatchlistNotifications] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  // Load preferences from backend
  const loadPreferences = useCallback(async () => {
    if (!isAuthenticated || isGuest) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const preferences = await notificationsService.getPreferences();
      setReviewNotifications(preferences.reviewNotifications ?? true);
      setNewMovieNotifications(preferences.newMovieNotifications ?? true);
      setWatchlistNotifications(preferences.watchlistNotifications ?? false);
      setWeeklyDigest(preferences.weeklyDigest ?? true);
    } catch (error: any) {
      console.error("Error loading notification preferences:", error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isGuest]);

  // Save preferences to backend
  const savePreferences = async (updates: {
    reviewNotifications?: boolean;
    newMovieNotifications?: boolean;
    watchlistNotifications?: boolean;
    weeklyDigest?: boolean;
  }) => {
    if (!isAuthenticated || isGuest) {
      Alert.alert("Login Required", "Please login to save notification preferences");
      return;
    }

    try {
      setSaving(true);
      await notificationsService.updatePreferences(updates);
    } catch (error: any) {
      console.error("Error saving notification preferences:", error);
      Alert.alert("Error", "Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Load preferences when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPreferences();
    }, [loadPreferences])
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
        {/* Notification Preferences */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>
            Notification Preferences
          </AppText>
          <View style={styles.listContainer}>
            <View style={[styles.listItem, styles.listItemFirst]}>
              <View style={styles.listItemLeft}>
                <View style={styles.listIconContainer}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={18}
                    color="#007AFF"
                  />
                </View>
                <View style={styles.listItemContent}>
                  <AppText style={styles.listItemLabel}>Review Updates</AppText>
                  <AppText style={styles.listItemSubtext}>
                    Get notified when someone comments on your reviews
                  </AppText>
                </View>
              </View>
              <Switch
                value={reviewNotifications}
                onValueChange={(value) => {
                  setReviewNotifications(value);
                  savePreferences({ reviewNotifications: value });
                }}
                trackColor={{ false: "#333", true: "#007AFF" }}
                thumbColor="#fff"
                disabled={saving || !isAuthenticated || isGuest}
              />
            </View>

            <View style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <View style={styles.listIconContainer}>
                  <Ionicons name="film-outline" size={18} color="#007AFF" />
                </View>
                <View style={styles.listItemContent}>
                  <AppText style={styles.listItemLabel}>New Movies</AppText>
                  <AppText style={styles.listItemSubtext}>
                    Notifications about new movie releases
                  </AppText>
                </View>
              </View>
              <Switch
                value={newMovieNotifications}
                onValueChange={(value) => {
                  setNewMovieNotifications(value);
                  savePreferences({ newMovieNotifications: value });
                }}
                trackColor={{ false: "#333", true: "#007AFF" }}
                thumbColor="#fff"
                disabled={saving || !isAuthenticated || isGuest}
              />
            </View>

            <View style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <View style={styles.listIconContainer}>
                  <Ionicons name="bookmark-outline" size={18} color="#007AFF" />
                </View>
                <View style={styles.listItemContent}>
                  <AppText style={styles.listItemLabel}>
                    Watchlist Updates
                  </AppText>
                  <AppText style={styles.listItemSubtext}>
                    When movies in your watchlist are available
                  </AppText>
                </View>
              </View>
              <Switch
                value={watchlistNotifications}
                onValueChange={(value) => {
                  setWatchlistNotifications(value);
                  savePreferences({ watchlistNotifications: value });
                }}
                trackColor={{ false: "#333", true: "#007AFF" }}
                thumbColor="#fff"
                disabled={saving || !isAuthenticated || isGuest}
              />
            </View>

            <View style={[styles.listItem, styles.listItemLast]}>
              <View style={styles.listItemLeft}>
                <View style={styles.listIconContainer}>
                  <Ionicons name="mail-outline" size={18} color="#007AFF" />
                </View>
                <View style={styles.listItemContent}>
                  <AppText style={styles.listItemLabel}>Weekly Digest</AppText>
                  <AppText style={styles.listItemSubtext}>
                    Weekly summary of your activity
                  </AppText>
                </View>
              </View>
              <Switch
                value={weeklyDigest}
                onValueChange={(value) => {
                  setWeeklyDigest(value);
                  savePreferences({ weeklyDigest: value });
                }}
                trackColor={{ false: "#333", true: "#007AFF" }}
                thumbColor="#fff"
                disabled={saving || !isAuthenticated || isGuest}
              />
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color="#999" />
          <AppText style={styles.infoText}>
            Notification preferences are saved automatically. You can change
            these settings at any time.
          </AppText>
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
  listItemSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    lineHeight: 16,
  },
  infoSection: {
    flexDirection: "row",
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#999",
    lineHeight: 18,
  },
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default NotificationsScreen;
