import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../stores/authStore';
// import Button from '../components/Button';
// import Input from '../components/Input';
import { colors } from '../constants/colors';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer', // Default to buyer
    businessName: '',
    businessType: 'farm', // Default business type
  });
  const [errors, setErrors] = useState({});
  const { register, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    if (error) {
      Alert.alert('Registration Error', error);
      clearError();
    }
  }, [error]);

  const validateForm = () => {
    const newErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Business info validation for sellers
    if (formData.role === 'seller') {
      if (!formData.businessName.trim()) {
        newErrors.businessName = 'Business name is required for sellers';
      } else if (formData.businessName.trim().length < 2) {
        newErrors.businessName = 'Business name must be at least 2 characters';
      }

      if (!formData.businessType) {
        newErrors.businessType = 'Please select a business type';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRoleSelect = (role) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    console.log('=== REGISTRATION DEBUG START ===');
    console.log('Form validation passed');
    console.log('Form data:', JSON.stringify(formData, null, 2));
    
    const { confirmPassword, businessName, businessType, ...registrationData } = formData;
    
    // Add business info for sellers
    if (formData.role === 'seller') {
      registrationData.businessInfo = {
        businessName: businessName,
        businessType: businessType
      };
    }
    
    console.log('Registration data to send:', JSON.stringify(registrationData, null, 2));
    
    const result = await register(registrationData);
    console.log('Registration result:', JSON.stringify(result, null, 2));
    console.log('=== REGISTRATION DEBUG END ===');
    
    if (result.success) {
      // Navigation will be handled by the auth state change
      console.log('Registration successful');
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  const RoleSelector = () => (
    <View style={styles.roleContainer}>
      <Text style={styles.roleLabel}>I want to:</Text>
      <View style={styles.roleOptions}>
        <TouchableOpacity
          style={[
            styles.roleOption,
            formData.role === 'buyer' && styles.roleOptionSelected,
          ]}
          onPress={() => handleRoleSelect('buyer')}
        >
          <View style={styles.roleIconContainer}>
            <Image
              source={require('../../assets/Heart.png')}
              style={styles.roleIconImage}
            />
          </View>
          <Text style={[
            styles.roleOptionText,
            formData.role === 'buyer' && styles.roleOptionTextSelected,
          ]}>
            Buy Products
          </Text>
          <Text style={[
            styles.roleDescription,
            formData.role === 'buyer' && styles.roleDescriptionSelected,
          ]}>
            Browse and purchase items
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleOption,
            formData.role === 'seller' && styles.roleOptionSelected,
          ]}
          onPress={() => handleRoleSelect('seller')}
        >
          <View style={styles.roleIconContainer}>
            <Image
              source={require('../../assets/Home.png')}
              style={styles.roleIconImage}
            />
          </View>
          <Text style={[
            styles.roleOptionText,
            formData.role === 'seller' && styles.roleOptionTextSelected,
          ]}>
            Sell Products
          </Text>
          <Text style={[
            styles.roleDescription,
            formData.role === 'seller' && styles.roleDescriptionSelected,
          ]}>
            List and manage your items
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Dark Header Section with Pattern */}
      <View style={styles.headerSection}>
        <View style={styles.radialPattern} />
        <View style={styles.headerContent}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join OCandel and start your journey</Text>
        </View>
      </View>

      {/* White Form Section */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formSection}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Registration Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>FIRST NAME</Text>
              <TextInput
                placeholder="Enter your first name"
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
                autoCapitalize="words"
                style={styles.textInput}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>LAST NAME</Text>
              <TextInput
                placeholder="Enter your last name"
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
                autoCapitalize="words"
                style={styles.textInput}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <TextInput
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.textInput}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput
                placeholder="Create a password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry
                style={styles.textInput}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <TextInput
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry
                style={styles.textInput}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

            <RoleSelector />

            {/* Business Information for Sellers */}
            {formData.role === 'seller' && (
              <View style={styles.businessInfoContainer}>
                <Text style={styles.businessInfoTitle}>Business Information</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>BUSINESS NAME</Text>
                  <TextInput
                    placeholder="Enter your business name"
                    value={formData.businessName}
                    onChangeText={(value) => handleInputChange('businessName', value)}
                    autoCapitalize="words"
                    style={styles.textInput}
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}

                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Business Type</Text>
                  <View style={styles.pickerWrapper}>
                    <TouchableOpacity
                      style={styles.picker}
                      onPress={() => {
                        // For now, we'll use a simple alert to show options
                        // In a real app, you'd use a proper picker component
                        Alert.alert(
                          'Select Business Type',
                          'Choose your business type',
                          [
                            { text: 'Farm', onPress: () => handleInputChange('businessType', 'farm') },
                            { text: 'Bakery', onPress: () => handleInputChange('businessType', 'bakery') },
                            { text: 'Restaurant', onPress: () => handleInputChange('businessType', 'restaurant') },
                            { text: 'Grocery', onPress: () => handleInputChange('businessType', 'grocery') },
                            { text: 'Artisan', onPress: () => handleInputChange('businessType', 'artisan') },
                            { text: 'Other', onPress: () => handleInputChange('businessType', 'other') },
                            { text: 'Cancel', style: 'cancel' }
                          ]
                        );
                      }}
                    >
                      <Text style={styles.pickerText}>
                        {formData.businessType.charAt(0).toUpperCase() + formData.businessType.slice(1)}
                      </Text>
                      <Text style={styles.pickerArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>
                  {errors.businessType && <Text style={styles.errorText}>{errors.businessType}</Text>}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <View style={styles.registerButtonContent}>
                <Text style={styles.registerButtonText}>
                  {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                </Text>
                <Image
                  source={require('../../assets/Arrow.png')}
                  style={styles.registerButtonIcon}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  headerSection: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  radialPattern: {
    position: 'absolute',
    top: -150,
    right: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ rotate: '45deg' }],
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formSection: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 24,
  },
  form: {
    flex: 1,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  textInput: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorText: {
    color: colors.error || '#FF3B30',
    fontSize: 14,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
  },
  roleContainer: {
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  roleOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '10',
  },
  roleIconContainer: {
    marginBottom: 8,
  },
  roleIconImage: {
    width: 32,
    height: 32,
    tintColor: colors.primary,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  roleOptionTextSelected: {
    color: colors.primary,
  },
  roleDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  roleDescriptionSelected: {
    color: colors.primary,
  },
  registerButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonIcon: {
    width: 16,
    height: 16,
    tintColor: colors.white,
    marginRight: 8,
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  signInText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  businessInfoContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  businessInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  pickerText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  pickerArrow: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default RegisterScreen;