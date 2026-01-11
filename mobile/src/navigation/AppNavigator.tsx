import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

// Screens
import SplashScreen from '../SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MoviesScreen from '../screens/MoviesScreen';
import MovieDetailsScreen from '../screens/MovieDetailsScreen';
import CreateReviewScreen from '../screens/CreateReviewScreen';

// Navigation types
export type RootStackParamList = {
  MoviesTab: undefined;
  MovieDetails: { movie: any };
  CreateReview: { movie: any };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();

// Constants for boolean values - ensure they're primitives
const HEADER_HIDDEN = false;
const HEADER_SHOWN = true;

// Auth Stack
const AuthStack = () => {
  return (
    <AuthStackNav.Navigator 
      screenOptions={() => ({ headerShown: false })}
    >
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Register" component={RegisterScreen} />
    </AuthStackNav.Navigator>
  );
};

// Main Stack
const MainStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MoviesTab"
        component={MoviesTab}
        options={() => ({ headerShown: false })}
      />
      <Stack.Screen
        name="MovieDetails"
        component={MovieDetailsScreen}
        options={{ title: 'Movie Details' }}
      />
      <Stack.Screen
        name="CreateReview"
        component={CreateReviewScreen}
        options={{ title: 'Write a Review' }}
      />
    </Stack.Navigator>
  );
};

// Movies Tab
const MoviesTab = () => {
  return (
    <Tab.Navigator
      screenOptions={() => ({
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        headerShown: true,
      })}
    >
      <Tab.Screen
        name="Movies"
        component={MoviesScreen}
        options={{
          title: 'TFI Reviews',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
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

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
