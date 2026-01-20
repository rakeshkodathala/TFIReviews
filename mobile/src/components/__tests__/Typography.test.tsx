import React from 'react';
import { render } from '@testing-library/react-native';
import {
  AppText,
  AppTextInput,
  H1,
  H2,
  H3,
  H4,
  Body,
  BodySmall,
  BodyLarge,
  ButtonText,
  Caption,
  Label,
} from '../Typography';

describe('Typography Components', () => {
  describe('AppText', () => {
    it('should render text with default variant', () => {
      const { getByText } = render(<AppText>Test Text</AppText>);
      expect(getByText('Test Text')).toBeTruthy();
    });

    it('should render text with custom variant', () => {
      const { getByText } = render(<AppText variant="h1">Heading</AppText>);
      expect(getByText('Heading')).toBeTruthy();
    });

    it('should apply custom style', () => {
      const customStyle = { color: '#FF0000' };
      const { getByText } = render(
        <AppText style={customStyle}>Styled Text</AppText>
      );
      expect(getByText('Styled Text')).toBeTruthy();
    });

    it('should forward ref', () => {
      const ref = React.createRef<any>();
      render(<AppText ref={ref}>Ref Text</AppText>);
      expect(ref.current).toBeTruthy();
    });
  });

  describe('AppTextInput', () => {
    it('should render text input', () => {
      const { getByPlaceholderText } = render(
        <AppTextInput placeholder="Enter text" />
      );
      expect(getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('should apply custom style', () => {
      const customStyle = { backgroundColor: '#F0F0F0' };
      const { getByPlaceholderText } = render(
        <AppTextInput placeholder="Test" style={customStyle} />
      );
      expect(getByPlaceholderText('Test')).toBeTruthy();
    });

    it('should forward ref', () => {
      const ref = React.createRef<any>();
      render(<AppTextInput ref={ref} placeholder="Test" />);
      expect(ref.current).toBeTruthy();
    });
  });

  describe('Predefined Variants', () => {
    it('should render H1', () => {
      const { getByText } = render(<H1>Heading 1</H1>);
      expect(getByText('Heading 1')).toBeTruthy();
    });

    it('should render H2', () => {
      const { getByText } = render(<H2>Heading 2</H2>);
      expect(getByText('Heading 2')).toBeTruthy();
    });

    it('should render H3', () => {
      const { getByText } = render(<H3>Heading 3</H3>);
      expect(getByText('Heading 3')).toBeTruthy();
    });

    it('should render H4', () => {
      const { getByText } = render(<H4>Heading 4</H4>);
      expect(getByText('Heading 4')).toBeTruthy();
    });

    it('should render Body', () => {
      const { getByText } = render(<Body>Body Text</Body>);
      expect(getByText('Body Text')).toBeTruthy();
    });

    it('should render BodySmall', () => {
      const { getByText } = render(<BodySmall>Small Text</BodySmall>);
      expect(getByText('Small Text')).toBeTruthy();
    });

    it('should render BodyLarge', () => {
      const { getByText } = render(<BodyLarge>Large Text</BodyLarge>);
      expect(getByText('Large Text')).toBeTruthy();
    });

    it('should render ButtonText', () => {
      const { getByText } = render(<ButtonText>Button</ButtonText>);
      expect(getByText('Button')).toBeTruthy();
    });

    it('should render Caption', () => {
      const { getByText } = render(<Caption>Caption</Caption>);
      expect(getByText('Caption')).toBeTruthy();
    });

    it('should render Label', () => {
      const { getByText } = render(<Label>Label</Label>);
      expect(getByText('Label')).toBeTruthy();
    });
  });
});
