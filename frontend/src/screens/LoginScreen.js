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
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../stores/authStore';
import { colors } from '../constants/colors';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, error, clearError,isLoading } = useAuthStore();

  useEffect(() => {
    if (error) {
      Alert.alert('Login Error', error);
      clearError();
    }
  }, [error]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const result = await login(email, password);
    
    if (result.success) {
      console.log('Login successful');
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  const handleSocialLogin = (provider) => {
    Alert.alert('Social Login', `${provider} login will be implemented soon`);
  };

  return (
    <View style={styles.container}>
      {/* Dark Header Section with Pattern */}
      <View style={styles.headerSection}>
        <View style={styles.radialPattern} />
        <View style={styles.headerContent}>
          <Text style={styles.title}>Log In</Text>
          <Text style={styles.subtitle}>Please sign in to your existing account</Text>
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
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[styles.textInput, styles.textInputWithIcon]}
                placeholder="example@gmail.com"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.textInput, styles.passwordInput]}
                placeholder="Enter your password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Image
               source={require('../../assets/eye.png')}
               style={styles.eyeIcon}
             />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me and Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkedBox]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.forgotPasswordText}>Forgot Password</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'LOGGING IN...' : 'LOG IN'}
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text style={styles.signUpLink}>SIGN UP</Text>
            </TouchableOpacity>
          </View>

          {/* Or Divider */}
          <Text style={styles.orText}>Or</Text>

          {/* Social Login Buttons */}
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              style={[styles.socialButton, styles.facebookButton]}
              onPress={() => handleSocialLogin('Facebook')}
            >
              <Text style={styles.socialButtonText}>f</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, styles.twitterButton]}
              onPress={() => handleSocialLogin('Twitter')}
            >
              <Text style={styles.socialButtonText}>t</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton]}
              onPress={() => handleSocialLogin('Apple')}
            >
              <Text style={styles.socialButtonText}>🍎</Text>
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
    backgroundColor: colors.white,
  },
  headerSection: {
    height: '40%',
    backgroundColor: '#2C3E50',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
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
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  inputIcon: {
    width: 20,
    height: 20,
    tintColor: colors.textSecondary,
    marginRight: 12,
  },
  textInputWithIcon: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  eyeIcon: {
    width: 20,
    height: 20,
    tintColor: colors.textSecondary,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonIcon: {
    width: 16,
    height: 16,
    tintColor: colors.white,
    marginRight: 8,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  signUpText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  signUpLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  orText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  facebookButton: {
    backgroundColor: '#4267B2',
  },
  twitterButton: {
    backgroundColor: '#1DA1F2',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  socialButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default LoginScreen;