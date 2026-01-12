import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { AppText } from "../components/Typography";
import { Ionicons } from "@expo/vector-icons";

const AboutScreen: React.FC = () => {
  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err)
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* App Info */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="film" size={48} color="#007AFF" />
          </View>
          <AppText style={styles.appName}>TFI Reviews</AppText>
          <AppText style={styles.version}>Version 1.0.0</AppText>
          <AppText style={styles.description}>
            Your ultimate destination for Telugu movie reviews and ratings.
            Discover, review, and share your favorite films with the community.
          </AppText>
        </View>

        {/* Links Section */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Links</AppText>
          <View style={styles.listContainer}>
            <TouchableOpacity
              style={[styles.listItem, styles.listItemFirst]}
              activeOpacity={0.7}
              onPress={() => openLink("https://github.com")}
            >
              <View style={styles.listItemLeft}>
                <View style={styles.listIconContainer}>
                  <Ionicons name="logo-github" size={18} color="#007AFF" />
                </View>
                <AppText style={styles.listItemValue}>GitHub</AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.listItem}
              activeOpacity={0.7}
              onPress={() => openLink("mailto:support@tfireviews.com")}
            >
              <View style={styles.listItemLeft}>
                <View style={styles.listIconContainer}>
                  <Ionicons name="mail-outline" size={18} color="#007AFF" />
                </View>
                <AppText style={styles.listItemValue}>Contact Support</AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.listItem, styles.listItemLast]}
              activeOpacity={0.7}
              onPress={() => openLink("https://example.com/privacy")}
            >
              <View style={styles.listItemLeft}>
                <View style={styles.listIconContainer}>
                  <Ionicons name="shield-outline" size={18} color="#007AFF" />
                </View>
                <AppText style={styles.listItemValue}>Privacy Policy</AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Credits */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Credits</AppText>
          <View style={styles.creditsContainer}>
            <AppText style={styles.creditsText}>
              Movie data provided by{" "}
              <AppText
                style={styles.linkText}
                onPress={() => openLink("https://www.themoviedb.org/")}
              >
                TMDB
              </AppText>
            </AppText>
            <AppText style={styles.creditsText}>
              Built with React Native and Expo
            </AppText>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <AppText style={styles.footerText}>
            © 2024 TFI Reviews. All rights reserved.
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
  header: {
    alignItems: "center",
    paddingVertical: 32,
    marginBottom: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#007AFF15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#007AFF30",
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  version: {
    fontSize: 14,
    color: "#999",
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
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
  listItemValue: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
  },
  creditsContainer: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  creditsText: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 22,
    marginBottom: 8,
  },
  linkText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});

export default AboutScreen;
