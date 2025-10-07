import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import { colorTokens, textStyles, borderRadius, spacing } from '../../design-system';

export interface CategoryButtonProps {
  /**
   * Button content
   */
  children: React.ReactNode;
  
  /**
   * Whether the button is selected/active
   */
  selected?: boolean;
  
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  
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

const CategoryButton: React.FC<CategoryButtonProps> = ({
  children,
  selected = false,
  disabled = false,
  onPress,
  style,
  testID,
}) => {
  // Base button styles (from Figma category buttons)
  const baseStyles: ViewStyle = {
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: spacing[5], // 20px
    paddingVertical: spacing[2],   // 8px
    minHeight: 37, // From Figma
  };

  // Selected/unselected styles
  const selectedStyles: ViewStyle = {
    backgroundColor: colorTokens.interactive.primary, // #040404
    borderColor: colorTokens.interactive.primary,
  };

  const unselectedStyles: ViewStyle = {
    backgroundColor: 'transparent',
    borderColor: colorTokens.ui.border, // #CCCCCC
  };

  // Disabled styles
  const disabledStyles: ViewStyle = {
    opacity: 0.5,
  };

  // Text styles
  const selectedTextStyles: TextStyle = {
    ...textStyles.button,
    color: colorTokens.ui.text.inverse, // White
  };

  const unselectedTextStyles: TextStyle = {
    ...textStyles.button,
    color: colorTokens.ui.text.primary, // Black
  };

  const buttonStyle: ViewStyle = {
    ...baseStyles,
    ...(selected ? selectedStyles : unselectedStyles),
    ...(disabled ? disabledStyles : {}),
    ...style,
  };

  const textStyle: TextStyle = selected ? selectedTextStyles : unselectedTextStyles;

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      activeOpacity={0.8}
    >
      <Text style={textStyle}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

export default CategoryButton;
