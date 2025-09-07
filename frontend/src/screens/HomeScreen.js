import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../stores/authStore';
import Button from '../components/Button';
import { colors } from '../constants/colors';
import { productsAPI } from '../services/api';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Convert USD to INR (approximate rate: 1 USD = 83 INR)
  const convertToINR = (usdPrice) => {
    return Math.round(usdPrice * 83);
  };

  // Fetch categories and products on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch data when category changes
  useEffect(() => {
    if (categories.length > 0) {
      fetchProducts();
    }
  }, [selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch products to get available categories
      const productsResponse = await productsAPI.getProducts({ limit: 20 });
      
      if (productsResponse.data.success) {
        const fetchedProducts = productsResponse.data.data.products || [];
        setProducts(fetchedProducts);
        
        // Extract unique categories from products
        const uniqueCategories = ['All', ...new Set(fetchedProducts.map(product => product.category))];
        const categoryData = uniqueCategories.map((cat, index) => ({
          id: index.toString(),
          name: cat,
          icon: getCategoryIcon(cat)
        }));
        setCategories(categoryData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const params = {
        limit: 20,
        ...(selectedCategory !== 'All' && { category: selectedCategory.toLowerCase() })
      };
      
      const response = await productsAPI.getProducts(params);
      
      if (response.data.success) {
        setProducts(response.data.data.products || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products.');
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'All': '🛒',
      'fruits': '🍎',
      'vegetables': '🥕',
      'dairy': '🥛',
      'meat': '🥩',
      'seafood': '🐟',
      'bakery': '🍞',
      'beverages': '🥤',
      'spices': '🌶️',
      'grains': '🌾',
      'nuts': '🥜',
      'herbs': '🌿',
      'honey': '🍯',
      'preserves': '🍯',
      'other': '📦'
    };
    return icons[category.toLowerCase()] || '📦';
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.name && styles.selectedCategory
      ]}
      onPress={() => setSelectedCategory(item.name)}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={[
        styles.categoryText,
        selectedCategory === item.name && styles.selectedCategoryText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      <Image 
        source={item.images && item.images.length > 0 
          ? { uri: item.images[0].url } 
          : require('../../assets/Logo.png')
        } 
        style={styles.productImage} 
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.productDetails}>
          <Text style={styles.price}>₹{convertToINR(item.price)}</Text>
          <Text style={styles.rating}>⭐ {item.averageRating || 'New'}</Text>
          <Text style={styles.seller}>by {item.seller?.businessInfo?.businessName || 'Seller'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.firstName || 'User'}! 👋</Text>
          <Text style={styles.subGreeting}>What would you like to eat today?</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.profileButtonText}>Profile</Text>
        </TouchableOpacity>
      </View>



      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TouchableOpacity 
          style={styles.searchInput}
          onPress={() => navigation.navigate('Search', { initialQuery: searchQuery })}
        >
          <Text style={[styles.searchInputText, !searchQuery && styles.placeholderText]}>
            {searchQuery || "Search for restaurants or dishes..."}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => navigation.navigate('Search', { initialQuery: searchQuery })}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Products */}
      <View style={styles.productsSection}>
        <Text style={styles.sectionTitle}>Fresh Products</Text>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
          />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subGreeting: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 20,
    color: colors.white,
  },
  profileIconImage: {
    width: 20,
    height: 20,
    tintColor: colors.white,
  },
  dashboardSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 10,
  },
  dashboardItem: {
    alignItems: 'center',
    flex: 1,
  },
  dashboardIcon: {
    width: 24,
    height: 24,
    tintColor: colors.primary,
    marginBottom: 4,
  },
  dashboardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInputText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  searchIcon: {
    fontSize: 20,
  },
  searchIconImage: {
    width: 18,
    height: 18,
    tintColor: colors.primary,
  },
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    minWidth: 80,
  },
  selectedCategory: {
    backgroundColor: colors.primary,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: colors.white,
  },
  productsSection: {
    flex: 1,
  },
  productsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  price: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  rating: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  seller: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    textAlign: 'center',
    color: colors.error,
    fontSize: 16,
    marginTop: 20,
  },
});

export default HomeScreen;