
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { productsAPI } from '../services/api';

const SearchScreen = ({ route, navigation }) => {
  const [searchQuery, setSearchQuery] = useState(route?.params?.initialQuery || '');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const filters = ['All', 'fruits', 'vegetables', 'dairy', 'meat', 'seafood', 'bakery'];

  // Perform search when query or filter changes
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, selectedFilter]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        search: searchQuery,
        limit: 20,
        ...(selectedFilter !== 'All' && { category: selectedFilter })
      };
      
      const response = await productsAPI.getProducts(params);
      
      if (response.data.success) {
        setSearchResults(response.data.data.products || []);
      } else {
        setError('Search failed. Please try again.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search products.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
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

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity style={styles.resultCard}>
      <Image 
        source={item.images && item.images.length > 0 
          ? { uri: item.images[0] } 
          : require('../../assets/Logo.png')
        } 
        style={styles.resultImage} 
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultName}>{item.name}</Text>
        <Text style={styles.resultRestaurant}>by {item.seller?.businessInfo?.businessName || 'Seller'}</Text>
        <Text style={styles.resultCategory}>{item.category}</Text>
        <View style={styles.resultDetails}>
          <Text style={styles.resultPrice}>${item.price}</Text>
          <Text style={styles.resultRating}>⭐ {item.averageRating || 'New'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for products..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity style={styles.filterButton}>
          <Image
            source={require('../../assets/Filter.png')}
            style={styles.filterIcon}
          />
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

      {/* Search Results */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>
          {searchQuery ? `Search Results for "${searchQuery}"` : 'Start typing to search...'}
        </Text>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsList}
          />
        ) : searchQuery.length > 0 ? (
          <Text style={styles.noResultsText}>No products found for "{searchQuery}"</Text>
        ) : null}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  filterButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    width: 20,
    height: 20,
    tintColor: colors.white,
  },
  filtersContainer: {
    paddingVertical: 8,
  },
  filtersList: {
    paddingHorizontal: 20,
  },
  filterItem: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
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
  },
  selectedFilterText: {
    color: colors.white,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  resultsList: {
    paddingBottom: 20,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  resultRestaurant: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  resultCuisine: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  resultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  resultDeliveryTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resultRating: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  resultCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  loader: {
    marginTop: 40,
  },
  errorText: {
    textAlign: 'center',
    color: colors.error,
    fontSize: 16,
    marginTop: 40,
  },
  noResultsText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 40,
  },
});

export default SearchScreen;