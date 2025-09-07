import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import useAuthStore from '../stores/authStore';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const { user } = useAuthStore();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Convert USD to INR (approximate rate: 1 USD = 83 INR)
  const convertToINR = (usdPrice) => {
    return Math.round(usdPrice * 83);
  };

  const handleVendorLocationPress = () => {
    const vendor = product.seller;
    if (vendor?.businessInfo?.businessName) {
      const addressParts = [
        vendor.address?.street,
        vendor.address?.city,
        vendor.address?.state,
        vendor.address?.pincode
      ].filter(Boolean);
      
      const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';
      
      Alert.alert(
        'Vendor Location',
        `${vendor.businessInfo.businessName}\n\nAddress: ${fullAddress}\n\nContact: ${vendor.phone || 'Phone not available'}`,
        [
          { text: 'Close' },
          ...(addressParts.length > 0 ? [{ 
            text: 'Get Directions', 
            onPress: () => {
              const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
              Linking.openURL(url).catch(() => {
                Alert.alert('Error', 'Could not open maps application');
              });
            }
          }] : [])
        ]
      );
    } else {
      Alert.alert('Location Info', 'Vendor location information is not available');
    }
  };

  const handleOrderNow = () => {
    navigation.navigate('Payment', { product, quantity: 1 });
  };

  const renderImageGallery = () => {
    if (!product.images || product.images.length === 0) {
      return (
        <Image
          source={require('../../assets/Logo.png')}
          style={styles.productImage}
        />
      );
    }

    return (
      <View style={styles.imageGallery}>
        <Image
          source={{ uri: product.images[selectedImageIndex]?.url }}
          style={styles.productImage}
        />
        {product.images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailContainer}
          >
            {product.images.map((image, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedImageIndex(index)}
                style={[
                  styles.thumbnail,
                  selectedImageIndex === index && styles.selectedThumbnail
                ]}
              >
                <Image
                  source={{ uri: image.url }}
                  style={styles.thumbnailImage}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
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
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderImageGallery()}

        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>⭐ {product.averageRating || 'New'}</Text>
              <Text style={styles.reviewCount}>({product.totalReviews || 0} reviews)</Text>
            </View>
          </View>

          <Text style={styles.price}>₹{convertToINR(product.price)}</Text>
          <Text style={styles.priceUnit}>per {product.unit?.replace('per_', '') || 'piece'}</Text>

          <View style={styles.stockInfo}>
            <Text style={styles.stockText}>
              Stock: {product.stock?.quantity || 0} {product.stock?.unit || 'pieces'}
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: product.status === 'active' ? '#10B981' : '#EF4444' }
            ]}>
              <Text style={styles.statusText}>
                {product.status === 'active' ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <Text style={styles.categoryText}>
              {product.category?.charAt(0).toUpperCase() + product.category?.slice(1)}
            </Text>
          </View>

          {product.details && Object.keys(product.details).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Product Details</Text>
              {product.details.organic && (
                <Text style={styles.detailItem}>🌱 Organic</Text>
              )}
              {product.details.locallyGrown && (
                <Text style={styles.detailItem}>🏠 Locally Grown</Text>
              )}
            </View>
          )}

          <View style={styles.vendorSection}>
            <Text style={styles.sectionTitle}>Vendor Information</Text>
            <TouchableOpacity
              style={styles.vendorCard}
              onPress={handleVendorLocationPress}
            >
              <View style={styles.vendorInfo}>
                <Text style={styles.vendorName}>
                  {product.seller?.businessInfo?.businessName || 'Unknown Vendor'}
                </Text>
                <Text style={styles.vendorDetails}>
                  {product.seller?.firstName} {product.seller?.lastName}
                </Text>
                <Text style={styles.vendorRating}>
                  ⭐ {product.seller?.rating?.average || 'New'} 
                  ({product.seller?.rating?.count || 0} ratings)
                </Text>
              </View>
              <View style={styles.locationButton}>
                <Image source={require('../../assets/Home.png')} style={styles.locationIcon} />
                <Text style={styles.locationButtonText}>Location</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.orderButton}
          onPress={handleOrderNow}
        >
          <View style={styles.orderButtonContent}>
            <Image source={require('../../assets/Car.png')} style={styles.orderButtonIcon} />
            <Text style={styles.orderButtonText}>Order Now - ₹{convertToINR(product.price)}</Text>
          </View>
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  imageGallery: {
    backgroundColor: colors.white,
    paddingBottom: 16,
  },
  productImage: {
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  thumbnailContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  thumbnail: {
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedThumbnail: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  thumbnailImage: {
    width: 60,
    height: 60,
    resizeMode: 'cover',
  },
  productInfo: {
    backgroundColor: colors.white,
    marginTop: 8,
    padding: 20,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 16,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  rating: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  priceUnit: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  stockText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  categoryText: {
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  detailItem: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  vendorSection: {
    marginTop: 8,
  },
  vendorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  vendorDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  vendorRating: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  locationButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 14,
    height: 14,
    tintColor: colors.white,
    marginRight: 6,
  },
  locationButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: colors.white,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  orderButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderButtonIcon: {
    width: 18,
    height: 18,
    tintColor: colors.white,
    marginRight: 8,
  },
  orderButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProductDetailScreen;