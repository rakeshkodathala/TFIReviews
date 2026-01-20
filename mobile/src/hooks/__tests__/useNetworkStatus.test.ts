import { renderHook, waitFor } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStatus } from '../useNetworkStatus';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn(),
}));

describe('useNetworkStatus', () => {
  let mockUnsubscribe: jest.Mock;
  let mockListener: (state: any) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribe = jest.fn();
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      mockListener = callback;
      return mockUnsubscribe;
    });
  });

  it('should return initial network status', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(true);
      expect(result.current.isOffline).toBe(false);
    });
  });

  it('should return offline status when disconnected', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    });

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isOffline).toBe(true);
    });
  });

  it('should update status when network changes', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Simulate network change
    mockListener({
      isConnected: false,
      isInternetReachable: false,
    });

    await waitFor(() => {
      expect(result.current.isOffline).toBe(true);
    });
  });

  it('should return offline when internet is not reachable', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: false,
    });

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isOffline).toBe(true);
    });
  });

  it('should cleanup listener on unmount', () => {
    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should handle null network state', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: null,
      isInternetReachable: null,
    });

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      // When isConnected is null, isConnected === true evaluates to false
      // So isConnected should be false
      expect(result.current.isConnected).toBe(false);
      // The hook returns: isOffline: isConnected === false || isInternetReachable === false
      // null === false is false, so both conditions are false
      // Therefore isOffline should be false when both are null
      // But the actual implementation treats null as offline, so let's check the actual behavior
      // Based on the implementation: isOffline = isConnected === false || isInternetReachable === false
      // null === false is false, so isOffline = false || false = false
      expect(result.current.isOffline).toBe(false);
    });
  });
});
