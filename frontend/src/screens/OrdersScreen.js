import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import useAuthStore from '../stores/authStore';
import { ordersAPI } from '../services/api';

const OrdersScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const [selectedTab, setSelectedTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const tabs = [
    { id: 'all', name: 'All Orders' },
    { id: 'pending', name: 'Pending' },
    { id: 'confirmed', name: 'Confirmed' },
    { id: 'delivered', name: 'Delivered' }
  ];

  useEffect(() => {
    fetchOrders();
  }, [selectedTab]);

  // Convert USD to INR
  const convertToINR = (usdPrice) => {
    return Math.round(usdPrice * 83);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = selectedTab === 'all' ? {} : { status: selectedTab };
      const response = await ordersAPI.getOrders(params);
      
      if (response.data.success) {
        setOrders(response.data.data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#F59E0B';
      case 'confirmed':
        return '#3B82F6';
      case 'preparing':
        return '#8B5CF6';
      case 'ready':
        return '#10B981';
      case 'delivered':
        return '#059669';
      case 'cancelled':
        return '#EF4444';
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Order Placed';
      case 'confirmed': return 'Confirmed';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready for Pickup';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const handleOrderPress = (order) => {
    Alert.alert(
      `Order ${order.formattedOrderNumber}`,
      `Product: ${order.product?.name}\nQuantity: ${order.quantity}\nTotal: ₹${convertToINR(order.totalAmount)}\nStatus: ${getStatusText(order.status)}\nVendor: ${order.seller?.businessInfo?.businessName || order.seller?.firstName}\n\nPayment: ${order.paymentMethod?.toUpperCase()} - ${order.paymentStatus}\nDelivery: ${order.deliveryType}${order.estimatedDeliveryTime ? `\nEstimated: ${new Date(order.estimatedDeliveryTime).toLocaleString()}` : ''}`,
      [
        { text: 'Close' },
        order.status === 'pending' && {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: () => handleCancelOrder(order._id)
        }
      ].filter(Boolean)
    );
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await ordersAPI.cancelOrder(orderId, 'Cancelled by user');
      Alert.alert('Success', 'Order cancelled successfully');
      fetchOrders();
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel order');
    }
  };

  const renderTabItem = (tab) => (
    <TouchableOpacity
      key={tab.id}
      style={[
        styles.tabItem,
        selectedTab === tab.id && styles.selectedTab
      ]}
      onPress={() => setSelectedTab(tab.id)}
    >
      <Text style={[
        styles.tabText,
        selectedTab === tab.id && styles.selectedTabText
      ]}>
        {tab.name}
      </Text>
    </TouchableOpacity>
  );

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => handleOrderPress(item)}
    >
      <View style={styles.orderHeader}>
        <Image 
          source={item.product?.images && item.product.images.length > 0
            ? { uri: item.product.images[0].url }
            : require('../../assets/Logo.png')
          } 
          style={styles.productImage} 
        />
        <View style={styles.orderInfo}>
          <Text style={styles.productName}>{item.product?.name || 'Product'}</Text>
          <Text style={styles.orderNumber}>{item.formattedOrderNumber}</Text>
          <Text style={styles.vendorName}>
            by {item.seller?.businessInfo?.businessName || item.seller?.firstName || 'Vendor'}
          </Text>
          <Text style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleDateString('en-IN')}
          </Text>
        </View>
        <View style={styles.orderMeta}>
          <Text style={styles.orderTotal}>₹{convertToINR(item.totalAmount)}</Text>
          <Text style={styles.orderQuantity}>Qty: {item.quantity}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.orderFooter}>
        <View style={styles.paymentInfo}>
          <View style={styles.paymentMethodContainer}>
            <Image source={require('../../assets/credit-card.png')} style={styles.paymentIcon} />
            <Text style={styles.paymentMethod}>
              {item.paymentMethod?.toUpperCase()} - {item.paymentStatus}
            </Text>
          </View>
          <View style={styles.deliveryTypeContainer}>
            <Image 
              source={item.deliveryType === 'pickup' ? require('../../assets/Home.png') : require('../../assets/Car.png')} 
              style={styles.deliveryIcon} 
            />
            <Text style={styles.deliveryType}>
              {item.deliveryType === 'pickup' ? 'Pickup' : 'Delivery'}
            </Text>
          </View>
        </View>
        {item.estimatedDeliveryTime && (
          <Text style={styles.estimatedTime}>
            Expected: {new Date(item.estimatedDeliveryTime).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map(renderTabItem)}
      </View>

      {/* Orders List */}
      <View style={styles.ordersContainer}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={orders.length === 0 ? styles.emptyContentContainer : styles.ordersList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyTitle}>
                  No {selectedTab === 'all' ? '' : selectedTab} orders found
                </Text>
                <Text style={styles.emptySubtitle}>
                  {selectedTab === 'all' 
                    ? 'Your orders will appear here when you place them'
                    : `No ${selectedTab} orders at the moment`
                  }
                </Text>
                <TouchableOpacity 
                  style={styles.shopNowButton}
                  onPress={() => navigation.navigate('Home')}
                >
                  <Text style={styles.shopNowButtonText}>Start Shopping</Text>
                </TouchableOpacity>
              </View>
            }
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  selectedTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  selectedTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  ordersContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  ordersList: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  restaurantImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  orderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  orderItems: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  estimatedTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  orderDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  trackButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trackButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  reorderButton: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  reorderButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    marginBottom: 16,
    alignSelf: 'center',
    tintColor: colors.textSecondary,
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  vendorName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  orderQuantity: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 12,
    height: 12,
    marginRight: 4,
    tintColor: colors.textSecondary,
  },
  deliveryIcon: {
    width: 12,
    height: 12,
    marginRight: 4,
    tintColor: colors.textSecondary,
  },
  paymentMethod: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deliveryType: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  estimatedTime: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyContentContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  shopNowButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopNowButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrdersScreen;