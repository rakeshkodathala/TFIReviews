import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from './Typography';
import { Ionicons } from '@expo/vector-icons';

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
  retryText?: string;
}

const ErrorView: React.FC<ErrorViewProps> = ({
  message = 'Something went wrong',
  onRetry,
  retryText = 'Try Again',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF5350" />
      </View>
      <AppText style={styles.message}>{message}</AppText>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.7}>
          <Ionicons name="refresh" size={18} color="#007AFF" />
          <AppText style={styles.retryText}>{retryText}</AppText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default ErrorView;
