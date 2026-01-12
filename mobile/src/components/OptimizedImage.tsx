import React from "react";
import { Image as ExpoImage, ImageProps } from "expo-image";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface OptimizedImageProps extends Omit<ImageProps, "source"> {
  uri?: string;
  placeholderColor?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  uri,
  placeholderColor = "#333",
  style,
  ...props
}) => {
  if (!uri) {
    return (
      <View
        style={[
          styles.placeholder,
          { backgroundColor: placeholderColor },
          style,
        ]}
      >
        <Ionicons name="film-outline" size={24} color="#666" />
      </View>
    );
  }

  return (
    <ExpoImage
      source={{ uri }}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      placeholderContentFit="cover"
      style={[style, { backgroundColor: placeholderColor }]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default OptimizedImage;
