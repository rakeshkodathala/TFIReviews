import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const NotificationsScreen: React.FC = () => {
  const [reviewNotifications, setReviewNotifications] = useState(true);
  const [newMovieNotifications, setNewMovieNotifications] = useState(true);
  const [watchlistNotifications, setWatchlistNotifications] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Notification Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
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
                  <Text style={styles.listItemLabel}>Review Updates</Text>
                  <Text style={styles.listItemSubtext}>
                    Get notified when someone comments on your reviews
                  </Text>
                </View>
              </View>
              <Switch
                value={reviewNotifications}
                onValueChange={setReviewNotifications}
                trackColor={{ false: "#333", true: "#007AFF" }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <View style={styles.listIconContainer}>
                  <Ionicons name="film-outline" size={18} color="#007AFF" />
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemLabel}>New Movies</Text>
                  <Text style={styles.listItemSubtext}>
                    Notifications about new movie releases
                  </Text>
                </View>
              </View>
              <Switch
                value={newMovieNotifications}
                onValueChange={setNewMovieNotifications}
                trackColor={{ false: "#333", true: "#007AFF" }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <View style={styles.listIconContainer}>
                  <Ionicons name="bookmark-outline" size={18} color="#007AFF" />
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemLabel}>Watchlist Updates</Text>
                  <Text style={styles.listItemSubtext}>
                    When movies in your watchlist are available
                  </Text>
                </View>
              </View>
              <Switch
                value={watchlistNotifications}
                onValueChange={setWatchlistNotifications}
                trackColor={{ false: "#333", true: "#007AFF" }}
                thumbColor="#fff"
              />
            </View>

            <View style={[styles.listItem, styles.listItemLast]}>
              <View style={styles.listItemLeft}>
                <View style={styles.listIconContainer}>
                  <Ionicons name="mail-outline" size={18} color="#007AFF" />
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemLabel}>Weekly Digest</Text>
                  <Text style={styles.listItemSubtext}>
                    Weekly summary of your activity
                  </Text>
                </View>
              </View>
              <Switch
                value={weeklyDigest}
                onValueChange={setWeeklyDigest}
                trackColor={{ false: "#333", true: "#007AFF" }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color="#999" />
          <Text style={styles.infoText}>
            Notification preferences are saved automatically. You can change
            these settings at any time.
          </Text>
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
});

export default NotificationsScreen;
