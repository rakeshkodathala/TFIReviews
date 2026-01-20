import React from "react";
import { Platform, StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

// Screens
import SplashScreen from "../SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import MoviesScreen from "../screens/MoviesScreen";
import SearchScreen from "../screens/SearchScreen";
import ActivityScreen from "../screens/ActivityScreen";
import AccountScreen from "../screens/AccountScreen";
import MovieDetailsScreen from "../screens/MovieDetailsScreen";
import CreateReviewScreen from "../screens/CreateReviewScreen";
import CastDetailsScreen from "../screens/CastDetailsScreen";
import MyReviewsScreen from "../screens/MyReviewsScreen";
import WatchlistScreen from "../screens/WatchlistScreen";
import SettingsScreen from "../screens/SettingsScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import NotificationFeedScreen from "../screens/NotificationFeedScreen";
import AboutScreen from "../screens/AboutScreen";
import UserProfileScreen from "../screens/UserProfileScreen";
import FollowersListScreen from "../screens/FollowersListScreen";
import FollowingListScreen from "../screens/FollowingListScreen";

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  HomeStack: undefined;
  SearchStack: undefined;
  ActivityStack: undefined;
  AccountStack: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  MovieDetails: { movie: any };
  CreateReview: { movie: any; review?: any };
  CastDetails: { personId: number; personName: string };
  UserProfile: { userId: string };
  FollowersList: { userId: string };
  FollowingList: { userId: string };
};

export type SearchStackParamList = {
  Search: undefined;
  MovieDetails: { movie: any };
  CreateReview: { movie: any; review?: any };
  CastDetails: { personId: number; personName: string };
  UserProfile: { userId: string };
  FollowersList: { userId: string };
  FollowingList: { userId: string };
};

export type ActivityStackParamList = {
  Activity: undefined;
  MovieDetails: { movie: any };
  CreateReview: { movie: any; review?: any };
  CastDetails: { personId: number; personName: string };
  UserProfile: { userId: string };
  FollowersList: { userId: string };
  FollowingList: { userId: string };
};

export type AccountStackParamList = {
  Account: undefined;
  MovieDetails: { movie: any };
  CreateReview: { movie: any; review?: any };
  CastDetails: { personId: number; personName: string };
  UserProfile: { userId: string };
  FollowersList: { userId: string };
  FollowingList: { userId: string };
  MyReviews: undefined;
  Watchlist: undefined;
  Settings: undefined;
  Notifications: undefined;
  NotificationFeed: undefined;
  About: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const HomeStackNav = createNativeStackNavigator<HomeStackParamList>();
const SearchStackNav = createNativeStackNavigator<SearchStackParamList>();
const ActivityStackNav = createNativeStackNavigator<ActivityStackParamList>();
const AccountStackNav = createNativeStackNavigator<AccountStackParamList>();

// Auth Stack
const AuthStack = () => {
  return (
    <AuthStackNav.Navigator
      screenOptions={() => ({
        headerShown: false,
        contentStyle: { backgroundColor: "#1a1a1a" },
      })}
    >
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Register" component={RegisterScreen} />
      <AuthStackNav.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStackNav.Navigator>
  );
};

// Home Stack Navigator
const HomeStack = () => {
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  
  return (
    <HomeStackNav.Navigator
      screenOptions={{
        headerStyle: { 
          backgroundColor: "#1a1a1a",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "#fff",
        headerTitleStyle: { 
          color: "#fff",
        },
        headerTitleAlign: "center",
        contentStyle: { 
          backgroundColor: "#1a1a1a",
        },
        headerBackTitle: "",
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <HomeStackNav.Screen
        name="Home"
        component={MoviesScreen}
        options={{
          title: "TFI Reviews",
          headerTitleStyle: {
            fontWeight: "bold",
            color: "#007AFF",
            fontSize: 24,
          },
        }}
      />
      <HomeStackNav.Screen
        name="MovieDetails"
        component={MovieDetailsScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <HomeStackNav.Screen
        name="CreateReview"
        component={CreateReviewScreen}
        options={{
          title: "Write a Review",
          headerStyle: { backgroundColor: "#1a1a1a" },
          headerTintColor: "#fff",
          headerBackTitle: "",
          headerBackTitleVisible: false,
          gestureEnabled: true,
        }}
      />
      <HomeStackNav.Screen
        name="CastDetails"
        component={CastDetailsScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <HomeStackNav.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          title: "Profile",
          gestureEnabled: true,
        }}
      />
      <HomeStackNav.Screen
        name="FollowersList"
        component={FollowersListScreen}
        options={{
          title: "Followers",
          gestureEnabled: true,
        }}
      />
      <HomeStackNav.Screen
        name="FollowingList"
        component={FollowingListScreen}
        options={{
          title: "Following",
          gestureEnabled: true,
        }}
      />
    </HomeStackNav.Navigator>
  );
};

// Search Stack Navigator
const SearchStack = () => {
  return (
    <SearchStackNav.Navigator
      screenOptions={{
        headerStyle: { 
          backgroundColor: "#1a1a1a",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "#fff",
        headerTitleStyle: { color: "#fff" },
        headerTitleAlign: "center",
        contentStyle: { backgroundColor: "#1a1a1a" },
        headerBackTitle: "",
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <SearchStackNav.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: "Search",
        }}
      />
      <SearchStackNav.Screen
        name="MovieDetails"
        component={MovieDetailsScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <SearchStackNav.Screen
        name="CreateReview"
        component={CreateReviewScreen}
        options={{
          title: "Write a Review",
          headerStyle: { backgroundColor: "#1a1a1a" },
          headerTintColor: "#fff",
          headerBackTitle: "",
          headerBackTitleVisible: false,
          gestureEnabled: true,
        }}
      />
      <SearchStackNav.Screen
        name="CastDetails"
        component={CastDetailsScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <SearchStackNav.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          title: "Profile",
          gestureEnabled: true,
        }}
      />
      <SearchStackNav.Screen
        name="FollowersList"
        component={FollowersListScreen}
        options={{
          title: "Followers",
          gestureEnabled: true,
        }}
      />
      <SearchStackNav.Screen
        name="FollowingList"
        component={FollowingListScreen}
        options={{
          title: "Following",
          gestureEnabled: true,
        }}
      />
    </SearchStackNav.Navigator>
  );
};

// Activity Stack Navigator
const ActivityStack = () => {
  return (
    <ActivityStackNav.Navigator
      screenOptions={{
        headerStyle: { 
          backgroundColor: "#1a1a1a",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "#fff",
        headerTitleStyle: { color: "#fff" },
        headerTitleAlign: "center",
        contentStyle: { backgroundColor: "#1a1a1a" },
        headerBackTitle: "",
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <ActivityStackNav.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          title: "Activity",
        }}
      />
      <ActivityStackNav.Screen
        name="MovieDetails"
        component={MovieDetailsScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <ActivityStackNav.Screen
        name="CreateReview"
        component={CreateReviewScreen}
        options={{
          title: "Write a Review",
          headerStyle: { backgroundColor: "#1a1a1a" },
          headerTintColor: "#fff",
          headerBackTitle: "",
          headerBackTitleVisible: false,
          gestureEnabled: true,
        }}
      />
      <ActivityStackNav.Screen
        name="CastDetails"
        component={CastDetailsScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <ActivityStackNav.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          title: "Profile",
          gestureEnabled: true,
        }}
      />
      <ActivityStackNav.Screen
        name="FollowersList"
        component={FollowersListScreen}
        options={{
          title: "Followers",
          gestureEnabled: true,
        }}
      />
      <ActivityStackNav.Screen
        name="FollowingList"
        component={FollowingListScreen}
        options={{
          title: "Following",
          gestureEnabled: true,
        }}
      />
    </ActivityStackNav.Navigator>
  );
};

// Account Stack Navigator
const AccountStack = () => {
  return (
    <AccountStackNav.Navigator
      screenOptions={{
        headerStyle: { 
          backgroundColor: "#1a1a1a",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "#fff",
        headerTitleStyle: { color: "#fff" },
        headerTitleAlign: "center",
        contentStyle: { backgroundColor: "#1a1a1a" },
        headerBackTitle: "",
        gestureEnabled: true,
      }}
    >
      <AccountStackNav.Screen
        name="Account"
        component={AccountScreen}
        options={{
          title: "Account",
        }}
      />
      <AccountStackNav.Screen
        name="MovieDetails"
        component={MovieDetailsScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <AccountStackNav.Screen
        name="CreateReview"
        component={CreateReviewScreen}
        options={{
          title: "Write a Review",
          headerStyle: { backgroundColor: "#1a1a1a" },
          headerTintColor: "#fff",
          headerBackTitle: "",
          headerBackTitleVisible: false,
          gestureEnabled: true,
        }}
      />
      <AccountStackNav.Screen
        name="CastDetails"
        component={CastDetailsScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <AccountStackNav.Screen
        name="MyReviews"
        component={MyReviewsScreen}
        options={{
          title: "My Reviews",
        }}
      />
      <AccountStackNav.Screen
        name="Watchlist"
        component={WatchlistScreen}
        options={{
          title: "Watchlist",
        }}
      />
      <AccountStackNav.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
        }}
      />
      <AccountStackNav.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: "Notifications",
        }}
      />
      <AccountStackNav.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: "About",
        }}
      />
      <AccountStackNav.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          title: "Profile",
          gestureEnabled: true,
        }}
      />
      <AccountStackNav.Screen
        name="FollowersList"
        component={FollowersListScreen}
        options={{
          title: "Followers",
          gestureEnabled: true,
        }}
      />
      <AccountStackNav.Screen
        name="FollowingList"
        component={FollowingListScreen}
        options={{
          title: "Following",
          gestureEnabled: true,
        }}
      />
    </AccountStackNav.Navigator>
  );
};

// Main Stack
const MainStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#1a1a1a" },
        headerTintColor: "#fff",
        headerTitleStyle: { color: "#fff" },
        contentStyle: { backgroundColor: "#1a1a1a" },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={() => ({ headerShown: false })}
      />
    </Stack.Navigator>
  );
};

// Main Tabs (Bottom Navigation)
const MainTabs = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "HomeStack") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "SearchStack") {
            iconName = focused ? "search" : "search-outline";
          } else if (route.name === "ActivityStack") {
            iconName = focused ? "heart" : "heart-outline";
          } else if (route.name === "AccountStack") {
            iconName = focused ? "person" : "person-outline";
          } else {
            iconName = "ellipse-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#999",
        headerShown: false, // Headers are handled by individual stacks
        tabBarStyle: {
          backgroundColor: "#1a1a1a",
          borderTopColor: "#333",
          borderTopWidth: 1,
          height: Platform.OS === "android" ? 60 + insets.bottom : 60 + insets.bottom,
          paddingBottom: Platform.OS === "android" ? insets.bottom : 5,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStack}
        options={{
          title: "Home",
        }}
      />
      <Tab.Screen
        name="SearchStack"
        component={SearchStack}
        options={{
          title: "Search",
        }}
      />
      <Tab.Screen
        name="ActivityStack"
        component={ActivityStack}
        options={{
          title: "Activity",
        }}
      />
      <Tab.Screen
        name="AccountStack"
        component={AccountStack}
        options={{
          title: "Account",
        }}
      />
    </Tab.Navigator>
  );
};

// Main Navigator
const AppNavigator: React.FC = () => {
  const auth = useAuth();

  // Ensure primitive booleans
  const isLoading: boolean = !!auth.isLoading;
  const isAuthenticated: boolean = !!auth.isAuthenticated;
  const isGuest: boolean = !!auth.isGuest;

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated || isGuest ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
