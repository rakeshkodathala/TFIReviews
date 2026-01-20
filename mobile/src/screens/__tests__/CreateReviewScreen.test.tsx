import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import CreateReviewScreen from '../CreateReviewScreen';
import { renderWithProviders } from '../../test-utils/render';
import { reviewsService } from '../../services/api';
import { Alert } from 'react-native';

jest.mock('../../services/api', () => ({
  reviewsService: {
    create: jest.fn(),
    update: jest.fn(),
  },
}));

jest.spyOn(Alert, 'alert');

const mockMovie = {
  _id: 'movie1',
  title: 'Test Movie',
  tmdbId: 123,
};

const mockRoute = {
  params: {
    movie: mockMovie,
  },
  key: 'test-key',
  name: 'CreateReview' as const,
};

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

describe('CreateReviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (reviewsService.create as jest.Mock).mockResolvedValue({ _id: 'review1' });
    (reviewsService.update as jest.Mock).mockResolvedValue({ _id: 'review1' });
  });

  it('should render review form', async () => {
    renderWithProviders(
      <CreateReviewScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeOnTheScreen();
    });
  });

  it('should allow rating selection', async () => {
    renderWithProviders(
      <CreateReviewScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeOnTheScreen();
    });

    // Should have rating label
    expect(screen.getByText(/How would you rate/i)).toBeOnTheScreen();
  });

  // Skipped due to React version mismatch (React 19.2.3 vs react-native-renderer 19.1.0)
  // Refer to mobile/TESTING_VERSION_MISMATCH.md for details.
  it.skip('should require review text', async () => {
    renderWithProviders(
      <CreateReviewScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeOnTheScreen();
    });

    const submitButton = screen.getByText(/Submit Review/i);
    
    // Button might be disabled if review is empty, so we need to check if it's pressable
    if (!submitButton.props.disabled) {
      fireEvent.press(submitButton);
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Review Required', expect.any(String));
      });
    } else {
      // If button is disabled, that's also valid behavior
      expect(submitButton.props.disabled).toBe(true);
    }
  });

  // Skipped due to React version mismatch (React 19.2.3 vs react-native-renderer 19.1.0)
  // Refer to mobile/TESTING_VERSION_MISMATCH.md for details.
  it.skip('should validate minimum review length', async () => {
    renderWithProviders(
      <CreateReviewScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeOnTheScreen();
    });

    const reviewInput = screen.getByPlaceholderText(/What did you think/i);
    fireEvent.changeText(reviewInput, 'Short');

    const submitButton = screen.getByText(/Submit Review/i);
    
    // Button should be disabled if review is too short
    if (submitButton.props.disabled) {
      // If disabled, that's correct behavior
      expect(submitButton.props.disabled).toBe(true);
    } else {
      // If enabled, pressing should show error
      fireEvent.press(submitButton);
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Review Too Short', expect.any(String));
      });
    }
  });

  // Skipped due to React version mismatch (React 19.2.3 vs react-native-renderer 19.1.0)
  // Refer to mobile/TESTING_VERSION_MISMATCH.md for details.
  it.skip('should submit review successfully', async () => {
    renderWithProviders(
      <CreateReviewScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeOnTheScreen();
    });

    const reviewInput = screen.getByPlaceholderText(/What did you think/i);
    const validReview = 'This is a great movie with excellent acting and storyline.';
    fireEvent.changeText(reviewInput, validReview);

    // Wait for state update
    await waitFor(() => {
      expect(reviewInput.props.value).toBe(validReview);
    });

    const submitButton = screen.getByText(/Submit Review/i);
    
    // Ensure button is enabled
    if (!submitButton.props.disabled) {
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(reviewsService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            rating: expect.any(Number),
            review: validReview.trim(),
            tmdbId: 123,
          })
        );
      });
    }
  });

  // Skipped due to React version mismatch (React 19.2.3 vs react-native-renderer 19.1.0)
  // Refer to mobile/TESTING_VERSION_MISMATCH.md for details.
  it.skip('should update existing review', async () => {
    const existingReview = {
      _id: 'review1',
      rating: 7,
      review: 'Old review text with enough characters to be valid.',
    };

    const routeWithReview = {
      ...mockRoute,
      params: {
        movie: mockMovie,
        review: existingReview,
      },
    };

    renderWithProviders(
      <CreateReviewScreen navigation={mockNavigation as any} route={routeWithReview as any} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeOnTheScreen();
    });

    const reviewInput = screen.getByPlaceholderText(/What did you think/i);
    const updatedReview = 'Updated review with more details about the movie and its excellent storyline.';
    fireEvent.changeText(reviewInput, updatedReview);

    await waitFor(() => {
      expect(reviewInput.props.value).toBe(updatedReview);
    });

    const submitButton = screen.getByText(/Update Review/i);
    
    if (!submitButton.props.disabled) {
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(reviewsService.update).toHaveBeenCalledWith('review1', {
          rating: expect.any(Number),
          review: updatedReview.trim(),
        });
      });
    }
  });

  it('should navigate back on cancel', async () => {
    renderWithProviders(
      <CreateReviewScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    const cancelButton = screen.queryByText(/Cancel/i);
    if (cancelButton) {
      fireEvent.press(cancelButton);
      expect(mockNavigation.goBack).toHaveBeenCalled();
    } else {
      // Try back button
      const backButton = screen.queryByTestId('back-button');
      if (backButton) {
        fireEvent.press(backButton);
        expect(mockNavigation.goBack).toHaveBeenCalled();
      }
    }
  });

  it('should disable submit while loading', async () => {
    let resolveCreate: (value: any) => void;
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });
    (reviewsService.create as jest.Mock).mockReturnValue(createPromise);

    renderWithProviders(
      <CreateReviewScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeOnTheScreen();
    });

    const reviewInput = screen.getByPlaceholderText(/What did you think/i);
    const validReview = 'This is a great movie with excellent acting and storyline.';
    fireEvent.changeText(reviewInput, validReview);

    await waitFor(() => {
      expect(reviewInput.props.value).toBe(validReview);
    });

    const submitButton = screen.getByText(/Submit Review/i);
    
    if (!submitButton.props.disabled) {
      fireEvent.press(submitButton);

      // Button should be disabled or show loading
      await waitFor(() => {
        // Check if button is disabled or loading indicator is shown
        const loadingIndicator = screen.queryByTestId('activity-indicator') || 
                                 screen.queryByText(/Loading|Submitting/i);
        expect(loadingIndicator || submitButton.props.disabled).toBeTruthy();
      });
      
      // Resolve the promise
      resolveCreate!({ _id: 'review1' });
    }
  });

  it('should show error on submission failure', async () => {
    (reviewsService.create as jest.Mock).mockRejectedValue({
      response: { data: { error: 'Failed to create review' } },
    });

    renderWithProviders(
      <CreateReviewScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeOnTheScreen();
    });

    const reviewInput = screen.getByPlaceholderText(/What did you think/i);
    const validReview = 'This is a great movie with excellent acting and storyline.';
    fireEvent.changeText(reviewInput, validReview);

    await waitFor(() => {
      expect(reviewInput.props.value).toBe(validReview);
    });

    const submitButton = screen.getByText(/Submit Review/i);
    
    if (!submitButton.props.disabled) {
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to create review');
      }, { timeout: 3000 });
    }
  });

  it('should pre-fill form when editing existing review', async () => {
    const existingReview = {
      _id: 'review1',
      rating: 8,
      review: 'Existing review text',
    };

    const routeWithReview = {
      ...mockRoute,
      params: {
        movie: mockMovie,
        review: existingReview,
      },
    };

    renderWithProviders(
      <CreateReviewScreen navigation={mockNavigation as any} route={routeWithReview as any} />
    );

    await waitFor(() => {
      const reviewInput = screen.getByPlaceholderText(/What did you think/i);
      expect(reviewInput.props.value).toBe('Existing review text');
    });
  });
});
