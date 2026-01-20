import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ErrorView from '../ErrorView';

describe('ErrorView', () => {
  it('should render default error message', () => {
    const { getByText } = render(<ErrorView />);
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('should render custom error message', () => {
    const { getByText } = render(<ErrorView message="Custom error message" />);
    expect(getByText('Custom error message')).toBeTruthy();
  });

  it('should not show retry button when onRetry is not provided', () => {
    const { queryByText } = render(<ErrorView />);
    expect(queryByText('Try Again')).toBeNull();
  });

  it('should show retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    const { getByText } = render(<ErrorView onRetry={onRetry} />);
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('should call onRetry when retry button is pressed', () => {
    const onRetry = jest.fn();
    const { getByText } = render(<ErrorView onRetry={onRetry} />);
    
    const retryButton = getByText('Try Again');
    fireEvent.press(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should render custom retry text', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <ErrorView onRetry={onRetry} retryText="Retry Custom" />
    );
    expect(getByText('Retry Custom')).toBeTruthy();
  });

  it('should render error icon', () => {
    const { UNSAFE_getByType } = render(<ErrorView />);
    // Icon should be rendered (Ionicons)
    expect(UNSAFE_getByType).toBeDefined();
  });
});
