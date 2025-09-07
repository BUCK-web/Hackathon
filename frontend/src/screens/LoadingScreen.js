import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';

const LoadingScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Radial Pattern Background */}
        <View style={styles.patternContainer}>
          <View style={styles.radialPattern} />
        </View>
        
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/Logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* Loading Text */}
        <Text style={styles.loadingText}>Food</Text>
        <Text style={styles.subtitle}>Delicious food delivered to your door</Text>
        
        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingLabel}>Loading...</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    overflow: 'hidden',
  },
  radialPattern: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    height: 400,
    backgroundColor: colors.primary,
    borderRadius: 200,
    opacity: 0.1,
    transform: [{ scaleX: 2 }],
  },
  logoContainer: {
    marginBottom: 32,
    zIndex: 1,
  },
  logo: {
    width: 120,
    height: 120,
  },
  loadingText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    zIndex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 60,
    lineHeight: 24,
    zIndex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    zIndex: 1,
  },
  loadingLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
});

export default LoadingScreen;