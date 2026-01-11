import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  FlatList,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useAuth } from "../context/AuthContext";
import { authService, watchlistService } from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface UserStats {
  totalReviews: number;
  avgRating: number;
  reviewsThisMonth: number;
  mostCommonRating: number;
  memberSince: string;
}

const AccountScreen: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const navigation = useNavigation();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [location, setLocation] = useState(user?.location || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastAnimation] = useState(new Animated.Value(-80));
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [watchlistLoading, setWatchlistLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadStats();
      loadRecentReviews();
      loadWatchlistCount();
    }, [])
  );

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setLocation(user.location || "");
      setAvatar(user.avatar || "");
    }
  }, [user]);

  useEffect(() => {
    if (showSuccessToast) {
      Animated.spring(toastAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(toastAnimation, {
          toValue: -80,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowSuccessToast(false);
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [showSuccessToast, toastAnimation]);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const data = await authService.getStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadRecentReviews = async () => {
    try {
      const data = await authService.getMyReviews(3);
      setRecentReviews(data.reviews || []);
    } catch (error) {
      console.error("Error loading recent reviews:", error);
    }
  };

  const loadWatchlistCount = async () => {
    try {
      setWatchlistLoading(true);
      const data = await watchlistService.getCount();
      setWatchlistCount(data.count || 0);
    } catch (error) {
      console.error("Error loading watchlist count:", error);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setName(user?.name || "");
    setLocation(user?.location || "");
    setAvatar(user?.avatar || "");
  };

  const handleCancel = () => {
    setEditing(false);
    setName(user?.name || "");
    setLocation(user?.location || "");
    setAvatar(user?.avatar || "");
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateUser({ name, avatar, location });
      setEditing(false);
      setShowSuccessToast(true);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera roll permissions to upload an image"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const pickLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant location permissions");
        return;
      }

      setLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode.length > 0) {
        const address = geocode[0];
        const locationString = `${address.city || ""}, ${
          address.region || ""
        }, ${address.country || ""}`.trim();
        setLocation(locationString);
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get location");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const renderStatCard = (
    icon: string,
    label: string,
    value: string | number,
    color: string
  ) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {showSuccessToast && (
          <Animated.View
            style={[
              styles.toastContainer,
              { transform: [{ translateY: toastAnimation }] },
            ]}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.toastText}>Profile updated successfully!</Text>
          </Animated.View>
        )}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarContainer}>
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {user?.username?.charAt(0).toUpperCase() || "U"}
                      </Text>
                    </View>
                  )}
                  {editing && (
                    <TouchableOpacity
                      style={styles.editAvatarButton}
                      onPress={pickImage}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="camera" size={16} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.userInfoContainer}>
                <Text style={styles.username}>{user?.username || "User"}</Text>
                <Text style={styles.email}>{user?.email || ""}</Text>
                {stats && (
                  <View style={styles.quickStats}>
                    <View style={styles.quickStatItem}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.quickStatText}>
                        {stats.avgRating.toFixed(1)} avg
                      </Text>
                    </View>
                    <View style={styles.quickStatDivider} />
                    <View style={styles.quickStatItem}>
                      <Ionicons
                        name="document-text"
                        size={14}
                        color="#007AFF"
                      />
                      <Text style={styles.quickStatText}>
                        {stats.totalReviews} reviews
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {!editing && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEdit}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil" size={14} color="#007AFF" />
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Activity & Stats Section */}
            {!editing && stats && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Activity & Stats</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.statsScroll}
                >
                  {renderStatCard(
                    "document-text",
                    "Total Reviews",
                    stats.totalReviews,
                    "#007AFF"
                  )}
                  {renderStatCard(
                    "star",
                    "Avg Rating",
                    stats.avgRating.toFixed(1),
                    "#FFD700"
                  )}
                  {renderStatCard(
                    "calendar",
                    "This Month",
                    stats.reviewsThisMonth,
                    "#4CAF50"
                  )}
                  {renderStatCard(
                    "trophy",
                    "Most Common",
                    `${stats.mostCommonRating}/10`,
                    "#FF6B6B"
                  )}
                </ScrollView>
              </View>
            )}

            {/* My Content Section */}
            {!editing && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Content</Text>

                {/* My Reviews */}
                <TouchableOpacity
                  style={styles.contentCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    // Navigate to reviews screen
                    Alert.alert(
                      "Coming Soon",
                      "Full reviews screen coming soon!"
                    );
                  }}
                >
                  <View style={styles.contentCardHeader}>
                    <View style={styles.contentCardLeft}>
                      <View style={styles.contentIconContainer}>
                        <Ionicons
                          name="document-text-outline"
                          size={20}
                          color="#007AFF"
                        />
                      </View>
                      <View>
                        <Text style={styles.contentCardTitle}>My Reviews</Text>
                        <Text style={styles.contentCardSubtitle}>
                          {stats?.totalReviews || 0} total reviews
                        </Text>
                      </View>
                    </View>
                    {recentReviews.length > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {recentReviews.length}
                        </Text>
                      </View>
                    )}
                  </View>
                  {recentReviews.length > 0 && (
                    <View style={styles.reviewsPreview}>
                      {recentReviews.slice(0, 3).map((review, index) => (
                        <View key={index} style={styles.reviewPreviewItem}>
                          {review.movieId?.posterUrl ? (
                            <Image
                              source={{ uri: review.movieId.posterUrl }}
                              style={styles.reviewPreviewPoster}
                            />
                          ) : (
                            <View style={styles.reviewPreviewPlaceholder}>
                              <Ionicons
                                name="film-outline"
                                size={16}
                                color="#999"
                              />
                            </View>
                          )}
                          <View style={styles.reviewPreviewInfo}>
                            <Text
                              style={styles.reviewPreviewTitle}
                              numberOfLines={1}
                            >
                              {review.movieId?.title || "Unknown"}
                            </Text>
                            <View style={styles.reviewPreviewRating}>
                              <Ionicons name="star" size={12} color="#FFD700" />
                              <Text style={styles.reviewPreviewRatingText}>
                                {review.rating}/10
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={styles.contentCardFooter}>
                    <Text style={styles.viewAllText}>View All Reviews</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#007AFF"
                    />
                  </View>
                </TouchableOpacity>

                {/* Watchlist */}
                <TouchableOpacity
                  style={styles.contentCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    Alert.alert("Coming Soon", "Watchlist screen coming soon!");
                  }}
                >
                  <View style={styles.contentCardHeader}>
                    <View style={styles.contentCardLeft}>
                      <View style={styles.contentIconContainer}>
                        <Ionicons
                          name="bookmark-outline"
                          size={20}
                          color="#007AFF"
                        />
                      </View>
                      <View>
                        <Text style={styles.contentCardTitle}>Watchlist</Text>
                        <Text style={styles.contentCardSubtitle}>
                          {watchlistLoading
                            ? "Loading..."
                            : `${watchlistCount} movies saved`}
                        </Text>
                      </View>
                    </View>
                    {watchlistCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{watchlistCount}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.contentCardFooter}>
                    <Text style={styles.viewAllText}>Manage Watchlist</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#007AFF"
                    />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Profile Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {editing ? "Edit Profile" : "Profile Information"}
              </Text>

              {/* Name Field */}
              <View style={styles.fieldContainer}>
                <View style={styles.fieldLabelContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="person-outline" size={18} color="#007AFF" />
                  </View>
                  <Text style={styles.fieldLabel}>Name</Text>
                </View>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    placeholderTextColor="#666"
                  />
                ) : (
                  <Text style={styles.fieldValue}>
                    {user?.name || (
                      <Text style={styles.emptyValue}>Not set</Text>
                    )}
                  </Text>
                )}
              </View>

              {/* Location Field */}
              <View style={styles.fieldContainer}>
                <View style={styles.fieldLabelContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color="#007AFF"
                    />
                  </View>
                  <Text style={styles.fieldLabel}>Location</Text>
                </View>
                {editing ? (
                  <View style={styles.locationInputContainer}>
                    <TextInput
                      style={[styles.input, styles.locationInput]}
                      value={location}
                      onChangeText={setLocation}
                      placeholder="Enter your location"
                      placeholderTextColor="#666"
                    />
                    <TouchableOpacity
                      style={styles.locationButton}
                      onPress={pickLocation}
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#007AFF" />
                      ) : (
                        <Ionicons name="locate" size={20} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.fieldValue}>
                    {user?.location || (
                      <Text style={styles.emptyValue}>Not set</Text>
                    )}
                  </Text>
                )}
              </View>
            </View>

            {/* Settings Section */}
            {!editing && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Settings</Text>

                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons
                        name="settings-outline"
                        size={20}
                        color="#007AFF"
                      />
                    </View>
                    <Text style={styles.menuItemText}>App Settings</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons
                        name="notifications-outline"
                        size={20}
                        color="#007AFF"
                      />
                    </View>
                    <Text style={styles.menuItemText}>Notifications</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons
                        name="information-circle-outline"
                        size={20}
                        color="#007AFF"
                      />
                    </View>
                    <Text style={styles.menuItemText}>About</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#666" />
                </TouchableOpacity>
              </View>
            )}

            {/* Action Buttons */}
            {editing ? (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <View style={styles.saveButtonContent}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                      <Text style={styles.saveButtonText}>Save</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={20} color="#fff" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  scrollView: {
    flex: 1,
  },
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    paddingHorizontal: 16,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderBottomWidth: 1,
    borderBottomColor: "#45a049",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  avatarWrapper: {
    marginBottom: 12,
  },
  avatarContainer: {
    position: "relative",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  avatar: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: "#333",
    borderWidth: 2.5,
    borderColor: "#2a2a2a",
  },
  avatarPlaceholder: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "#2a2a2a",
  },
  avatarText: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#fff",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "#1a1a1a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  userInfoContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  username: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  email: {
    fontSize: 14,
    color: "#999",
    marginBottom: 10,
  },
  quickStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quickStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  quickStatText: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  quickStatDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#333",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#007AFF",
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    gap: 6,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  editButtonText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  statsScroll: {
    paddingRight: 16,
    gap: 12,
  },
  statCard: {
    width: 120,
    backgroundColor: "#2a2a2a",
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    marginRight: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  contentCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  contentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  contentCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  contentIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(0, 122, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  contentCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  contentCardSubtitle: {
    fontSize: 13,
    color: "#999",
  },
  badge: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  reviewsPreview: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  reviewPreviewItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 6,
    flex: 1,
    gap: 8,
  },
  reviewPreviewPoster: {
    width: 40,
    height: 60,
    borderRadius: 6,
    backgroundColor: "#333",
  },
  reviewPreviewPlaceholder: {
    width: 40,
    height: 60,
    borderRadius: 6,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  reviewPreviewInfo: {
    flex: 1,
  },
  reviewPreviewTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  reviewPreviewRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reviewPreviewRatingText: {
    fontSize: 11,
    color: "#FFD700",
    fontWeight: "600",
  },
  contentCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  viewAllText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "600",
  },
  fieldContainer: {
    backgroundColor: "#2a2a2a",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  fieldLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: "rgba(0, 122, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  fieldValue: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
    lineHeight: 20,
  },
  emptyValue: {
    fontSize: 15,
    color: "#666",
    fontStyle: "italic",
  },
  input: {
    fontSize: 15,
    color: "#fff",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#333",
  },
  locationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationInput: {
    flex: 1,
  },
  locationButton: {
    padding: 12,
    backgroundColor: "rgba(0, 122, 255, 0.15)",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#007AFF",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#2a2a2a",
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(0, 122, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1.5,
    borderColor: "#444",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  saveButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d32f2f",
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 24,
    shadowColor: "#d32f2f",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});

export default AccountScreen;
