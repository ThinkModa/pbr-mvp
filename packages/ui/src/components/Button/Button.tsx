import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import { colorTokens, textStyles, borderRadius, spacing } from '../../design-system';

export interface ButtonProps {
  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  
  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Button content
   */
  children: React.ReactNode;
  
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether the button is in loading state
   */
  loading?: boolean;
  
  /**
   * Button press handler
   */
  onPress?: () => void;
  
  /**
   * Additional styles
   */
  style?: ViewStyle;
  
  /**
   * Test ID for testing
   */
  testID?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  disabled = false,
  loading = false,
  onPress,
  style,
  testID,
}) => {
  // Base button styles
  const baseStyles: ViewStyle = {
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  };

  // Size-specific styles
  const sizeStyles: Record<string, ViewStyle> = {
    sm: {
      paddingHorizontal: spacing[4], // 16px
      paddingVertical: spacing[2],   // 8px
      minHeight: 32,
    },
    md: {
      paddingHorizontal: spacing[20], // 80px (from Figma: px-[155px] ≈ 80px)
      paddingVertical: spacing[4],    // 16px
      minHeight: 48,
    },
    lg: {
      paddingHorizontal: spacing[24], // 96px
      paddingVertical: spacing[5],    // 20px
      minHeight: 56,
    },
  };

  // Variant-specific styles
  const variantStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: colorTokens.interactive.primary, // #040404
      borderColor: colorTokens.interactive.primary,
    },
    secondary: {
      backgroundColor: colorTokens.interactive.secondary, // #D29507
      borderColor: colorTokens.interactive.secondary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: colorTokens.interactive.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
  };

  // Text styles
  const textStyles_variant: Record<string, TextStyle> = {
    primary: {
      color: colorTokens.ui.text.inverse, // White text
    },
    secondary: {
      color: colorTokens.ui.text.inverse, // White text
    },
    outline: {
      color: colorTokens.interactive.primary, // Black text
    },
    ghost: {
      color: colorTokens.interactive.primary, // Black text
    },
  };

  // Disabled styles
  const disabledStyles: ViewStyle = {
    opacity: 0.5,
  };

  const buttonStyle: ViewStyle = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...(disabled || loading ? disabledStyles : {}),
    ...style,
  };

  const textStyle: TextStyle = {
    ...textStyles.button,
    ...textStyles_variant[variant],
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      activeOpacity={0.8}
    >
      <Text style={textStyle}>
        {loading ? 'Loading...' : children}
      </Text>
    </TouchableOpacity>
  );
};

export default Button;
