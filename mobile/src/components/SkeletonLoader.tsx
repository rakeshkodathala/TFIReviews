import React from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const MovieCardSkeleton: React.FC<{ width: number }> = ({ width }) => {
  return (
    <View style={[styles.movieCard, { width }]}>
      <SkeletonLoader
        width="100%"
        height={width / 0.75}
        borderRadius={12}
        style={styles.poster}
      />
      <View style={styles.movieInfo}>
        <SkeletonLoader
          width="80%"
          height={12}
          borderRadius={4}
          style={styles.title}
        />
        <View style={styles.meta}>
          <SkeletonLoader width={40} height={10} borderRadius={4} />
          <SkeletonLoader width={50} height={10} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#2a2a2a",
  },
  movieCard: {
    margin: 2,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#2a2a2a",
  },
  poster: {
    marginBottom: 4,
  },
  movieInfo: {
    padding: 4,
  },
  title: {
    marginBottom: 4,
  },
  meta: {
    flexDirection: "row",
    gap: 6,
  },
});

export default SkeletonLoader;
