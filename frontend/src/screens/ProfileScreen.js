import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../stores/authStore';
import Button from '../components/Button';
// import Input from '../components/Input';
import { colors } from '../constants/colors';

const ProfileScreen = ({ navigation }) => {
  const { user, updateUser, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await updateUser(formData);
      if (result.success) {
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const ProfileItem = ({ label, value, icon }) => (
    <View style={styles.profileItem}>
      <View style={styles.profileItemLeft}>
        {icon && <Text style={styles.profileItemIcon}>{icon}</Text>}
        <View>
          <Text style={styles.profileItemLabel}>{label}</Text>
          <Text style={styles.profileItemValue}>{value}</Text>
        </View>
      </View>
    </View>
  );

  const ActionButton = ({ title, icon, onPress, color = colors.primary, variant = 'outline' }) => (
    <TouchableOpacity
      style={[
        styles.actionButton,
        variant === 'filled' && { backgroundColor: color },
        variant === 'outline' && { borderColor: color, borderWidth: 2 },
      ]}
      onPress={onPress}
    >
      {icon && <Text style={styles.actionButtonIcon}>{icon}</Text>}
      <Text
        style={[
          styles.actionButtonText,
          variant === 'filled' && { color: colors.white },
          variant === 'outline' && { color },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Text style={styles.editButtonText}>
              {isEditing ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName && user?.lastName 
                ? `${user.firstName.charAt(0).toUpperCase()}${user.lastName.charAt(0).toUpperCase()}` 
                : 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>
            {user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : 'Full name not provided'}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {user?.role === 'seller' ? 'Seller' : 'Buyer'}
            </Text>
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          {isEditing ? (
            <View style={styles.editForm}>
              <TextInput
                placeholder="First Name"
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
                autoCapitalize="words"
                style={styles.textInput}
              />
              
              <TextInput
                placeholder="Last Name"
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
                autoCapitalize="words"
                style={styles.textInput}
              />
              
              <TextInput
                placeholder="Email Address"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.textInput}
              />
              
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.editActionButton, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editActionButton, styles.saveButton, isLoading && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  <Text style={styles.saveButtonText}>
                    {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <ProfileItem
                label="Full Name"
                value={user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : 'Not provided'}
                icon="👤"
              />
              <ProfileItem
                label="Email Address"
                value={user?.email || 'Not provided'}
                icon="📧"
              />
              <ProfileItem
                label="Account Type"
                value={user?.role === 'seller' ? 'Seller Account' : 'Buyer Account'}
                icon="🏷️"
              />
              <ProfileItem
                label="Member Since"
                value={new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                icon="📅"
              />
            </View>
          )}
        </View>

        {/* Quick Actions */}
        {!isEditing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <ActionButton
                title="My Addresses"
                icon="📍"
                onPress={() => {
                  if (user?.role === 'seller') {
                    // Sellers navigate to their location tab
                    navigation.navigate('MainTabs', { screen: 'Locations' });
                  } else {
                    // Buyers navigate to address management screen
                    navigation.navigate('BuyerLocation');
                  }
                }}
              />
              <ActionButton
                title="Settings"
                icon="⚙️"
                onPress={() => console.log('Settings')}
              />
              <ActionButton
                title="Help & Support"
                icon="❓"
                onPress={() => console.log('Help')}
              />
              <ActionButton
                title="Privacy Policy"
                icon="🔒"
                onPress={() => console.log('Privacy')}
              />
            </View>
          </View>
        )}

        {/* Logout Button */}
        {!isEditing && (
          <View style={styles.logoutContainer}>
            <TouchableOpacity
              style={[styles.logoutButton, { borderColor: colors.error }]}
              onPress={handleLogout}
            >
              <Text style={[styles.logoutButtonText, { color: colors.error }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.white,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: colors.primaryLight + '20',
    borderRadius: 20,
  },
  roleBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  profileInfo: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  profileItemIconImage: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: colors.primary,
  },
  profileItemLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  profileItemValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  editForm: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
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
    marginBottom: 16,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  editActionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  actionButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  actionButtonIconImage: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  logoutButton: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;