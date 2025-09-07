import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import useAuthStore from '../stores/authStore';
import { colors } from '../constants/colors';

// Import screens
import LoadingScreen from '../screens/LoadingScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SellerDashboardScreen from '../screens/SellerDashboardScreen';
import SellerProductsScreen from '../screens/SellerProductsScreen';
import SellerLocationScreen from '../screens/SellerLocationScreen';
import BuyerLocationScreen from '../screens/BuyerLocationScreen';
import AddProductScreen from '../screens/AddProductScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import LocalVendorsScreen from '../screens/LocalVendorsScreen';
import PaymentScreen from '../screens/PaymentScreen';

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Icon Component
const TabIcon = ({ name, focused }) => {
  const iconMap = {
    Home: require('../../assets/Home.png'),
    Search: require('../../assets/Search.png'),
    LocalVendors: require('../../assets/Vector.png'),
    Orders: require('../../assets/Car.png'),
    Profile: require('../../assets/User.png'),
    Dashboard: require('../../assets/Home.png'),
    Products: require('../../assets/Tag.png'),
    Locations: require('../../assets/Vector.png'),
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={iconMap[name]}
        style={{
          width: 24,
          height: 24,
          tintColor: focused ? colors.primary : colors.textSecondary,
        }}
      />
    </View>
  );
};

// Auth Stack Navigator
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

// Tab Navigator for buyers
const BuyerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{
            tabBarLabel: 'Search',
            tabBarIcon: ({ focused }) => <TabIcon name="Search" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="LocalVendors"
          component={LocalVendorsScreen}
          options={{
            tabBarLabel: 'Local Vendors',
            tabBarIcon: ({ focused }) => <TabIcon name="LocalVendors" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Orders"
          component={OrdersScreen}
          options={{
            tabBarLabel: 'Orders',
            tabBarIcon: ({ focused }) => <TabIcon name="Orders" focused={focused} />,
          }}
        />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

// Tab Navigator for sellers
const SellerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={SellerDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon name="Dashboard" focused={focused} />,
        }}
      />
       <Tab.Screen
        name="Products"
        component={SellerProductsScreen}
        options={{
          tabBarLabel: 'Products',
          tabBarIcon: ({ focused }) => <TabIcon name="Products" focused={focused} />,
        }}
      />
        <Tab.Screen
        name="Locations"
        component={SellerLocationScreen}
        options={{
          tabBarLabel: 'Locations',
          tabBarIcon: ({ focused }) => <TabIcon name="Locations" focused={focused} />,
        }}
      />
        <Tab.Screen
          name="Orders"
          component={OrdersScreen}
          options={{
            tabBarLabel: 'Orders',
            tabBarIcon: ({ focused }) => <TabIcon name="Orders" focused={focused} />,
          }}
        />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

// Main Tab Navigator that switches based on user role
const MainTabs = () => {
  const { user } = useAuthStore();
  
  return user?.role === 'seller' ? <SellerTabs /> : <BuyerTabs />;
};

// Main Stack Navigator for authenticated users
const MainStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="BuyerLocation" 
        component={BuyerLocationScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="AddProduct" 
        component={AddProductScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};



// Placeholder Screen Component
const PlaceholderScreen = ({ route }) => {
  const { name } = route;
  
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 48, marginBottom: 16 }}>🚧</Text>
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: colors.textPrimary,
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        {name} Screen
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
        }}
      >
        This screen is coming soon!
      </Text>
    </View>
  );
};

// Use the imported LoadingScreen component

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading, checkAuthState } = useAuthStore();

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;