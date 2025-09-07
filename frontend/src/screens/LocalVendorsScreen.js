import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import useAuthStore from '../stores/authStore';
import { productsAPI } from '../services/api';

const LocalVendorsScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('All');

  const [availableCities, setAvailableCities] = useState(['All']);

  useEffect(() => {
    fetchLocalVendors();
  }, []);

  const fetchLocalVendors = async () => {
    try {
      setLoading(true);
      // Fetch products to get unique vendors
      const response = await productsAPI.getProducts({ limit: 50 });
      
      if (response.data.success) {
        const products = response.data.data.products || [];
        
        // Extract unique vendors from products
        const uniqueVendors = [];
        const vendorIds = new Set();
        
        products.forEach(product => {
          if (product.seller && !vendorIds.has(product.seller._id)) {
            vendorIds.add(product.seller._id);
            
            const vendor = product.seller;
            const city = vendor.address?.city || 'Unknown';
            const state = vendor.address?.state || 'Unknown';
            
            uniqueVendors.push({
              ...vendor,
              location: {
                city: city,
                state: state,
                address: vendor.address
              },
              productCount: products.filter(p => p.seller._id === vendor._id).length,
              categories: [...new Set(products.filter(p => p.seller._id === vendor._id).map(p => p.category))],
            });
          }
        });
        
        // Extract unique cities for filtering
        const cities = ['All', ...new Set(uniqueVendors.map(v => v.location.city).filter(city => city !== 'Unknown'))];
        setAvailableCities(cities);
        
        // Sort by business name
        uniqueVendors.sort((a, b) => {
          const nameA = a.businessInfo?.businessName || a.firstName || '';
          const nameB = b.businessInfo?.businessName || b.firstName || '';
          return nameA.localeCompare(nameB);
        });
        setVendors(uniqueVendors);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      Alert.alert('Error', 'Failed to load local vendors');
    } finally {
      setLoading(false);
    }
  };



  const filteredVendors = vendors.filter(vendor => {
    if (selectedCity === 'All') return true;
    return vendor.location.city === selectedCity;
  });

  const handleVendorPress = (vendor) => {
    const addressParts = [
      vendor.location.address?.street,
      vendor.location.city,
      vendor.location.state,
      vendor.location.address?.pincode
    ].filter(Boolean);
    
    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';
    
    Alert.alert(
      vendor.businessInfo?.businessName || 'Vendor Details',
      `Location: ${fullAddress}\n\nProducts: ${vendor.productCount} items\nCategories: ${vendor.categories.join(', ')}\n\nContact: ${vendor.phone || 'Not available'}\n\nRating: ⭐ ${vendor.rating?.average || 'New'} (${vendor.rating?.count || 0} reviews)`,
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
        }] : []),
        {
          text: 'View Products',
          onPress: () => {
            // Navigate back to home with vendor filter
            navigation.navigate('Home', { vendorFilter: vendor._id });
          }
        }
      ]
    );
  };

  const renderCityFilter = () => (
    <View style={styles.filterContainer}>
      <FlatList
        data={availableCities}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterItem,
              selectedCity === item && styles.selectedFilter
            ]}
            onPress={() => setSelectedCity(item)}
          >
            <Text style={[
              styles.filterText,
              selectedCity === item && styles.selectedFilterText
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filterList}
      />
    </View>
  );

  const renderVendorItem = ({ item }) => (
    <TouchableOpacity
      style={styles.vendorCard}
      onPress={() => handleVendorPress(item)}
    >
      <View style={styles.vendorHeader}>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>
            {item.businessInfo?.businessName || 'Local Vendor'}
          </Text>
          <Text style={styles.vendorOwner}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.vendorLocation}>
            📍 {item.location.city}, {item.location.state}
          </Text>
          <Text style={styles.vendorDistance}>
            🚗 {item.location.distance} km away
          </Text>
        </View>
        <View style={styles.vendorStats}>
          <Text style={styles.vendorRating}>
            ⭐ {item.rating?.average || 'New'}
          </Text>
          <Text style={styles.vendorReviews}>
            ({item.rating?.count || 0})
          </Text>
        </View>
      </View>
      
      <View style={styles.vendorDetails}>
        <Text style={styles.productCount}>
          {item.productCount} products available
        </Text>
        <View style={styles.categoriesContainer}>
          {item.categories.slice(0, 3).map((category, index) => (
            <View key={index} style={styles.categoryTag}>
              <Text style={styles.categoryText}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </View>
          ))}
          {item.categories.length > 3 && (
            <Text style={styles.moreCategories}>
              +{item.categories.length - 3} more
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.vendorActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>View Products</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.locationButton]}>
          <Text style={styles.locationButtonText}>📍 Location</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Local Vendors</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Finding local vendors...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Local Vendors</Text>
        <View style={styles.placeholder} />
      </View>

      {renderCityFilter()}

      <View style={styles.content}>
        <Text style={styles.resultsText}>
          {filteredVendors.length} vendors found {selectedCity !== 'All' ? `in ${selectedCity}` : 'nearby'}
        </Text>
        
        <FlatList
          data={filteredVendors}
          renderItem={renderVendorItem}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.vendorsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏪</Text>
              <Text style={styles.emptyTitle}>No Vendors Found</Text>
              <Text style={styles.emptyDescription}>
                No local vendors found in {selectedCity}. Try selecting a different city.
              </Text>
            </View>
          }
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
  filterContainer: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterList: {
    paddingHorizontal: 20,
  },
  filterItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedFilter: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  selectedFilterText: {
    color: colors.white,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  resultsText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  vendorsList: {
    paddingBottom: 20,
  },
  vendorCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  vendorOwner: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  vendorLocation: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  vendorDistance: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  vendorStats: {
    alignItems: 'flex-end',
  },
  vendorRating: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  vendorReviews: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  vendorDetails: {
    marginBottom: 16,
  },
  productCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  categoryTag: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  moreCategories: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  vendorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    marginRight: 8,
    alignItems: 'center',
  },
  locationButton: {
    backgroundColor: colors.primary,
    marginRight: 0,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  locationButtonText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default LocalVendorsScreen;