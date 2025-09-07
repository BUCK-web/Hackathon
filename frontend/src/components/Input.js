import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  multiline = false,
  numberOfLines = 1,
  editable = true,
  style,
  inputStyle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const getContainerStyle = () => {
    const baseStyle = [styles.container];
    
    if (isFocused) {
      baseStyle.push(styles.focused);
    }
    
    if (error) {
      baseStyle.push(styles.error);
    }
    
    if (!editable) {
      baseStyle.push(styles.disabled);
    }
    
    return baseStyle;
  };

  const getInputStyle = () => {
    const baseStyle = [styles.input];
    
    if (leftIcon) {
      baseStyle.push(styles.inputWithLeftIcon);
    }
    
    if (rightIcon || secureTextEntry) {
      baseStyle.push(styles.inputWithRightIcon);
    }
    
    if (multiline) {
      baseStyle.push(styles.multilineInput);
    }
    
    if (inputStyle) {
      baseStyle.push(inputStyle);
    }
    
    return baseStyle;
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={getContainerStyle()}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={getInputStyle()}
          placeholder={placeholder}
          placeholderTextColor={colors.gray400}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          {...props}
        />
        
        {(rightIcon || secureTextEntry) && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={secureTextEntry ? togglePasswordVisibility : onRightIconPress}
            activeOpacity={0.7}
          >
            {secureTextEntry ? (
              <Text style={styles.passwordToggle}>
                {isPasswordVisible ? '🙈' : '👁️'}
              </Text>
            ) : (
              rightIcon
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  focused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  error: {
    borderColor: colors.error,
  },
  disabled: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray200,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 12,
  },
  inputWithLeftIcon: {
    marginLeft: 12,
  },
  inputWithRightIcon: {
    marginRight: 12,
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: 12,
    paddingBottom: 12,
  },
  leftIconContainer: {
    marginRight: 8,
  },
  rightIconContainer: {
    marginLeft: 8,
    padding: 4,
  },
  passwordToggle: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
});

// export default Input;