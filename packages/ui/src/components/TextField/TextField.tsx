import React, { useState } from 'react';
import { 
  TextInput, 
  View, 
  Text, 
  ViewStyle, 
  TextStyle, 
  TextInputProps 
} from 'react-native';
import { colorTokens, textStyles, borderRadius, spacing } from '../../design-system';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  /**
   * Label for the input field
   */
  label?: string;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Error message to display
   */
  error?: string;
  
  /**
   * Helper text to display below the input
   */
  helperText?: string;
  
  /**
   * Whether the field is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Input state
   */
  state?: 'default' | 'focused' | 'error' | 'disabled';
  
  /**
   * Additional container styles
   */
  containerStyle?: ViewStyle;
  
  /**
   * Additional input styles
   */
  inputStyle?: TextStyle;
  
  /**
   * Test ID for testing
   */
  testID?: string;
}

const TextField: React.FC<TextFieldProps> = ({
  label,
  placeholder,
  error,
  helperText,
  disabled = false,
  required = false,
  state = 'default',
  containerStyle,
  inputStyle,
  testID,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Determine the current state
  const currentState = error ? 'error' : disabled ? 'disabled' : isFocused ? 'focused' : 'default';

  // Container styles
  const containerStyles: ViewStyle = {
    marginBottom: spacing[4], // 16px
    ...containerStyle,
  };

  // Label styles
  const labelStyles: TextStyle = {
    ...textStyles.label,
    color: colorTokens.ui.text.secondary,
    marginBottom: spacing[1], // 4px
  };

  // Input container styles
  const inputContainerStyles: ViewStyle = {
    borderWidth: 1,
    borderRadius: borderRadius.md, // 10px from Figma
    backgroundColor: colorTokens.ui.background,
    paddingHorizontal: spacing[4], // 16px
    paddingVertical: spacing[3],   // 12px
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
  };

  // State-specific border colors
  const borderColors: Record<string, string> = {
    default: colorTokens.ui.border, // #CCCCCC
    focused: colorTokens.interactive.primary, // #040404
    error: colorTokens.error[500], // #EF4444
    disabled: colorTokens.ui.border,
  };

  // Input styles
  const inputStyles: TextStyle = {
    ...textStyles.body,
    color: colorTokens.ui.text.primary,
    flex: 1,
    padding: 0,
    margin: 0,
  };

  // Disabled input styles
  const disabledInputStyles: TextStyle = {
    color: colorTokens.ui.text.tertiary,
  };

  // Helper text styles
  const helperTextStyles: TextStyle = {
    ...textStyles.caption,
    color: colorTokens.ui.text.tertiary,
    marginTop: spacing[1], // 4px
  };

  // Error text styles
  const errorTextStyles: TextStyle = {
    ...textStyles.caption,
    color: colorTokens.error[500],
    marginTop: spacing[1], // 4px
  };

  const finalInputContainerStyles: ViewStyle = {
    ...inputContainerStyles,
    borderColor: borderColors[currentState],
    ...(disabled ? { backgroundColor: colorTokens.neutral[100] } : {}),
  };

  const finalInputStyles: TextStyle = {
    ...inputStyles,
    ...(disabled ? disabledInputStyles : {}),
    ...inputStyle,
  };

  return (
    <View style={containerStyles} testID={testID}>
      {label && (
        <Text style={labelStyles}>
          {label}
          {required && <Text style={{ color: colorTokens.error[500] }}> *</Text>}
        </Text>
      )}
      
      <View style={finalInputContainerStyles}>
        <TextInput
          style={finalInputStyles}
          placeholder={placeholder}
          placeholderTextColor={colorTokens.ui.text.tertiary}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...textInputProps}
        />
      </View>
      
      {(error || helperText) && (
        <Text style={error ? errorTextStyles : helperTextStyles}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

export default TextField;
