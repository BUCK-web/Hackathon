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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../stores/authStore';
import { colors } from '../constants/colors';
import { productsAPI } from '../services/api';

const SellerProductsScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Convert USD to INR (approximate rate: 1 USD = 83 INR)
  const convertToINR = (usdPrice) => {
    return Math.round(usdPrice * 83);
  };

  const filters = ['All', 'Active', 'Inactive', 'Pending'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getSellerProducts(user._id);
      
      if (response.data.success) {
        setProducts(response.data.data.products || []);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching seller products:', error);
      Alert.alert('Error', 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    if (selectedFilter === 'All') return true;
    return product.status.toLowerCase() === selectedFilter.toLowerCase();
  });

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { product });
  };

  const handleDeleteProduct = (productId) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete functionality
            setProducts(prev => prev.filter(p => p._id !== productId));
            Alert.alert('Success', 'Product deleted successfully');
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return '#10B981';
      case 'inactive':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      default:
        return colors.textSecondary;
    }
  };

  const renderFilterItem = (filter) => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterItem,
        selectedFilter === filter && styles.selectedFilter
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[
        styles.filterText,
        selectedFilter === filter && styles.selectedFilterText
      ]}>
        {filter}
      </Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
    >
      <Image
        source={item.images && item.images.length > 0
          ? { uri: item.images[0].url }
          : require('../../assets/Logo.png')
        }
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.productDetails}>
          <Text style={styles.productPrice}>₹{convertToINR(item.price)}</Text>
          <Text style={styles.productStock}>Stock: {item.stock?.quantity || 0} {item.stock?.unit || 'pieces'}</Text>
          <Text style={styles.productCategory}>{item.category}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteProduct(item._id)}
      >
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Products</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={filters}
          renderItem={({ item }) => renderFilterItem(item)}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* Products List */}
      <View style={styles.productsContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : filteredProducts.length > 0 ? (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptyDescription}>
              {selectedFilter === 'All'
                ? 'You haven\'t added any products yet.'
                : `No ${selectedFilter.toLowerCase()} products found.`}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AddProduct')}
            >
              <Text style={styles.emptyButtonText}>Add Your First Product</Text>
            </TouchableOpacity>
          </View>
        )}
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: colors.white,
    paddingVertical: 12,
  },
  filtersList: {
    paddingHorizontal: 20,
  },
  filterItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    marginRight: 12,
  },
  selectedFilter: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  selectedFilterText: {
    color: colors.white,
  },
  productsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  loader: {
    marginTop: 50,
  },
  productsList: {
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.gray100,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  productDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 12,
  },
  productStock: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 12,
  },
  productCategory: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SellerProductsScreen;