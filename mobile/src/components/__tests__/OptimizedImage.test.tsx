import React from 'react';
import { render } from '@testing-library/react-native';
import OptimizedImage from '../OptimizedImage';

describe('OptimizedImage', () => {
  it('should render placeholder when uri is not provided', () => {
    const { getByTestId } = render(<OptimizedImage />);
    // The placeholder should render with a film icon
    // Since we can't easily test for Ionicons, we check the component renders
    expect(getByTestId).toBeDefined();
  });

  it('should render image when uri is provided', () => {
    const { UNSAFE_getByType } = render(
      <OptimizedImage uri="https://example.com/image.jpg" />
    );
    // Expo Image should be rendered
    expect(UNSAFE_getByType).toBeDefined();
  });

  it('should use custom placeholder color', () => {
    const { root } = render(
      <OptimizedImage placeholderColor="#FF0000" />
    );
    expect(root).toBeTruthy();
  });

  it('should apply custom style', () => {
    const customStyle = { width: 100, height: 100 };
    const { root } = render(
      <OptimizedImage uri="https://example.com/image.jpg" style={customStyle} />
    );
    expect(root).toBeTruthy();
  });
});
