import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../stores/authStore';
import { colors } from '../constants/colors';
import { productsAPI } from '../services/api';

const SellerDashboardScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Use the products API to get seller's products and calculate stats
        const productsResponse = await productsAPI.getSellerProducts(user?._id);
        
        if (productsResponse.data.success) {
          const products = productsResponse.data.data.products || [];
          const activeProducts = products.filter(p => p.status === 'active').length;
          
          // Calculate basic stats from products
          setStats({
            totalProducts: products.length,
            activeProducts: activeProducts,
            totalOrders: 0, // TODO: Implement orders API
            pendingOrders: 0, // TODO: Implement orders API
            totalRevenue: 0, // TODO: Implement orders API
            monthlyRevenue: 0 // TODO: Implement orders API
          });
        }
        
        // Set some sample recent activity
        setRecentActivity([
          {
            message: 'Welcome to your seller dashboard!',
            timeAgo: 'Just now'
          }
        ]);
        
      } catch (error) {
        console.log('Error fetching dashboard data:', error);
        // Fallback to default values
        setStats({
          totalProducts: 0,
          activeProducts: 0,
          totalOrders: 0,
          pendingOrders: 0,
          totalRevenue: 0,
          monthlyRevenue: 0
        });
        setRecentActivity([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?._id) {
      fetchDashboardData();
    }
  }, [user]);

  const StatCard = ({ title, value, icon, color = colors.primary }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const QuickAction = ({ title, icon, onPress, color = colors.primary }) => (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: color + '10' }]}
      onPress={onPress}
    >
      <Text style={styles.quickActionIcon}>{icon}</Text>
      <Text style={[styles.quickActionText, { color }]}>{title}</Text>
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
          <View>
            <Text style={styles.greeting}>
              Welcome back, {user?.firstName || 'Seller'}! 👋
            </Text>
            <Text style={styles.subGreeting}>
              {user?.businessInfo?.businessName || 'Your Business'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => Alert.alert('Notifications', 'Coming soon!')}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <TouchableOpacity style={styles.chartButton}>
              <Image source={require('../../assets/Group 3161.png')} style={styles.chartIcon} />
            </TouchableOpacity>
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Products"
              value={stats.totalProducts}
              icon="●"
              color={colors.primary}
            />
            <StatCard
              title="Active Products"
              value={stats.activeProducts}
              icon="●"
              color="#10B981"
            />
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              icon="●"
              color="#F59E0B"
            />
            <StatCard
              title="Pending Orders"
              value={stats.pendingOrders}
              icon="●"
              color="#EF4444"
            />
            <StatCard
              title="Total Revenue"
              value={`$${stats.totalRevenue.toFixed(2)}`}
              icon="●"
              color="#8B5CF6"
            />
            <StatCard
              title="Monthly Revenue"
              value={`$${stats.monthlyRevenue.toFixed(2)}`}
              icon="●"
              color="#06B6D4"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              title="Add Product"
              icon="+"
              onPress={() => navigation.navigate('AddProduct')}
              color={colors.primary}
            />
            <QuickAction
              title="Manage Products"
              icon="📝"
              onPress={() => navigation.navigate('Products')}
              color="#10B981"
            />
            <QuickAction
              title="View Orders"
              icon="📋"
              onPress={() => navigation.navigate('Orders')}
              color="#F59E0B"
            />
            <QuickAction
              title="Business Info"
              icon="🏪"
              onPress={() => navigation.navigate('BusinessInfo')}
              color="#8B5CF6"
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading activity...</Text>
            </View>
          ) : recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <View key={index} style={styles.activityCard}>
                <Text style={styles.activityText}>{activity.message}</Text>
                <Text style={styles.activityTime}>{activity.timeAgo}</Text>
              </View>
            ))
          ) : (
            <View style={styles.activityCard}>
              <Text style={styles.activityText}>No recent activity</Text>
              <Text style={styles.activityTime}>Check back later</Text>
            </View>
          )}
        </View>
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
    paddingVertical: 20,
    backgroundColor: colors.white,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    fontSize: 20,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
  },
  chartIcon: {
    width: 24,
    height: 24,
    tintColor: colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  activityTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default SellerDashboardScreen;