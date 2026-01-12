import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { AppText } from './Typography';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const OfflineBanner: React.FC = () => {
  const { isOffline } = useNetworkStatus();
  const slideAnim = React.useRef(new Animated.Value(-50)).current;

  React.useEffect(() => {
    if (isOffline) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOffline, slideAnim]);

  if (!isOffline) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={18} color="#fff" />
      <AppText style={styles.text}>No internet connection</AppText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#EF5350',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 1000,
    elevation: 5,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default OfflineBanner;
