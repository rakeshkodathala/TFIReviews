import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SettingsScreen: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Display Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>
          <View style={styles.listContainer}>
            <View style={[styles.listItem, styles.listItemFirst]}>
              <View style={styles.listItemLeft}>
                <View style={styles.listIconContainer}>
                  <Ionicons name="moon-outline" size={18} color="#007AFF" />
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemLabel}>Dark Mode</Text>
                  <Text style={styles.listItemValue}>Always on</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Content Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content</Text>
          <View style={styles.listContainer}>
            <View style={[styles.listItem, styles.listItemFirst]}>
              <View style={styles.listItemLeft}>
                <View style={styles.listIconContainer}>
                  <Ionicons name="play-outline" size={18} color="#007AFF" />
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemLabel}>Auto-play Trailers</Text>
                  <Text style={styles.listItemSubtext}>
                    Automatically play video previews
                  </Text>
                </View>
              </View>
              <Switch
                value={autoPlay}
                onValueChange={setAutoPlay}
                trackColor={{ false: "#333", true: "#007AFF" }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Data Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
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
                <Text style={styles.listItemValue}>Clear Cache</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
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
                <Text style={styles.listItemValue}>App Version</Text>
              </View>
              <Text style={styles.versionText}>1.0.0</Text>
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
});

export default SettingsScreen;
