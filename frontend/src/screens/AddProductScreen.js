import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../constants/colors';
import useAuthStore from '../stores/authStore';
import Button from '../components/Button';
import { apiInstance, API_BASE_URL } from '../utils/apiConfig';

const AddProductScreen = ({ navigation }) => {
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'vegetables',
    stock: {
      quantity: '',
      unit: 'pieces'
    },
    unit: 'per_piece'
  });

  const categories = [
    'fruits', 'vegetables', 'dairy', 'meat', 'seafood',
    'bakery', 'beverages', 'spices', 'grains', 'nuts',
    'herbs', 'honey', 'preserves', 'other'
  ];

  const units = [
    { value: 'per_piece', label: 'Per Piece' },
    { value: 'per_pound', label: 'Per Pound' },
    { value: 'per_kg', label: 'Per Kg' },
    { value: 'per_dozen', label: 'Per Dozen' },
    { value: 'per_liter', label: 'Per Liter' },
    { value: 'per_gallon', label: 'Per Gallon' },
    { value: 'per_pack', label: 'Per Pack' }
  ];

  const stockUnits = [
    'pieces', 'pounds', 'kg', 'dozens', 'liters', 'gallons', 'packs'
  ];

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.log('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Product name is required');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Product description is required');
      return false;
    }
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return false;
    }
    if (!formData.stock.quantity || isNaN(formData.stock.quantity) || parseInt(formData.stock.quantity) < 0) {
      Alert.alert('Error', 'Please enter a valid stock quantity');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('unit', formData.unit);
      formDataToSend.append('stock.quantity', parseInt(formData.stock.quantity).toString());
      formDataToSend.append('stock.unit', formData.stock.unit);
      
      // Add image if selected
      if (selectedImage) {
        const imageUri = selectedImage.uri;
        const filename = imageUri.split('/').pop();
        const match = /\.([\w\d_-]+)(\?|$)/i.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formDataToSend.append('images', {
          uri: imageUri,
          name: filename,
          type: type
        });
      } else {
        // If no image selected, we'll skip the upload and let backend handle the error
        Alert.alert('Image Required', 'Please select an image for your product.');
        setLoading(false);
        return;
      }

      console.log('Sending request to:', `${API_BASE_URL}/products`);
      console.log('Token exists:', !!token);
      console.log('FormData keys:', Array.from(formDataToSend.keys()));
      
      const response = await apiInstance.post('/products', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Response received:', response.status);

      // Success response from apiInstance
      Alert.alert('Success', 'Product added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.log('Add product error:', error);
      console.log('Error response:', error.response?.data);
      console.log('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add product';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add New Product</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter product name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your product"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={4}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Price *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={formData.price}
                onChangeText={(value) => handleInputChange('price', value)}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerText}>
                  {units.find(u => u.value === formData.unit)?.label || 'Per Piece'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryItem,
                    formData.category === category && styles.selectedCategory
                  ]}
                  onPress={() => handleInputChange('category', category)}
                >
                  <Text style={[
                    styles.categoryText,
                    formData.category === category && styles.selectedCategoryText
                  ]}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Stock Quantity *</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={formData.stock.quantity}
                onChangeText={(value) => handleInputChange('stock.quantity', value)}
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Stock Unit</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerText}>
                  {formData.stock.unit.charAt(0).toUpperCase() + formData.stock.unit.slice(1)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.imageSection}>
            <Text style={styles.label}>Product Image</Text>
            <TouchableOpacity 
              style={styles.imagePlaceholder}
              onPress={showImageOptions}
            >
              {selectedImage ? (
                <>
                  <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                  <Text style={styles.changeImageText}>Tap to change image</Text>
                </>
              ) : (
                <>
                  <Image source={require('../../assets/Cemara.png')} style={styles.cameraIcon} />
                  <Text style={styles.imageSubtext}>Tap to add product image</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={loading ? 'Adding Product...' : 'Add Product'}
          onPress={handleSubmit}
          disabled={loading}
          loading={loading}
          style={styles.submitButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  pickerText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.white,
  },
  selectedCategory: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  selectedCategoryText: {
    color: colors.white,
    fontWeight: '600',
  },
  imageSection: {
    marginTop: 10,
  },
  imagePlaceholder: {
    height: 120,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    position: 'absolute',
  },
  changeImageText: {
    fontSize: 12,
    color: colors.white,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    position: 'absolute',
    bottom: 8,
  },
  cameraIcon: {
    width: 32,
    height: 32,
    marginBottom: 8,
    tintColor: colors.textSecondary,
  },
  imageSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footer: {
    padding: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    marginTop: 0,
  },
});

export default AddProductScreen;