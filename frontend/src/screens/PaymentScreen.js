import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import useAuthStore from '../stores/authStore';
import { ordersAPI } from '../services/api';

const PaymentScreen = ({ route, navigation }) => {
  const { product, quantity = 1 } = route.params;
  const { user } = useAuthStore();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');
  const [loading, setLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    upiId: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: '',
  });
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  });
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [notes, setNotes] = useState('');

  // Convert USD to INR
  const convertToINR = (usdPrice) => {
    return Math.round(usdPrice * 83);
  };

  const totalAmount = convertToINR(product.price) * quantity;

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      icon: require('../../assets/Call.png'),
      description: 'Pay using UPI ID (GPay, PhonePe, Paytm)',
      popular: true
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: require('../../assets/credit-card.png'),
      description: 'Visa, Mastercard, RuPay'
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      icon: require('../../assets/Tag.png'),
      description: 'Paytm, PhonePe, Amazon Pay'
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: require('../../assets/Home.png'),
      description: 'All major banks supported'
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      icon: require('../../assets/Car.png'),
      description: 'Pay when you receive'
    }
  ];

  const handlePaymentMethodSelect = (methodId) => {
    setSelectedPaymentMethod(methodId);
  };

  const validatePaymentDetails = () => {
    if (selectedPaymentMethod === 'upi') {
      if (!paymentDetails.upiId || !paymentDetails.upiId.includes('@')) {
        Alert.alert('Error', 'Please enter a valid UPI ID');
        return false;
      }
    } else if (selectedPaymentMethod === 'card') {
      if (!paymentDetails.cardNumber || paymentDetails.cardNumber.length < 16) {
        Alert.alert('Error', 'Please enter a valid card number');
        return false;
      }
      if (!paymentDetails.cardExpiry || !paymentDetails.cardCvv || !paymentDetails.cardName) {
        Alert.alert('Error', 'Please fill all card details');
        return false;
      }
    }

    if (deliveryType === 'delivery') {
      if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.pincode) {
        Alert.alert('Error', 'Please fill all delivery address fields');
        return false;
      }
      if (!/^[1-9][0-9]{5}$/.test(deliveryAddress.pincode)) {
        Alert.alert('Error', 'Please enter a valid Indian pincode');
        return false;
      }
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validatePaymentDetails()) return;

    try {
      setLoading(true);

      // Create order
      const orderData = {
        productId: product._id,
        quantity,
        paymentMethod: selectedPaymentMethod,
        deliveryType,
        notes,
      };

      if (deliveryType === 'delivery') {
        orderData.deliveryAddress = deliveryAddress;
      }

      const orderResponse = await ordersAPI.createOrder(orderData);

      if (orderResponse.data.success) {
        const order = orderResponse.data.data.order;

        // Simulate payment processing
        if (selectedPaymentMethod !== 'cod') {
          const paymentData = {
            transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
            paymentGateway: getPaymentGateway(selectedPaymentMethod),
          };

          if (selectedPaymentMethod === 'upi') {
            paymentData.upiId = paymentDetails.upiId;
          } else if (selectedPaymentMethod === 'card') {
            paymentData.cardLast4 = paymentDetails.cardNumber.slice(-4);
          }

          // Process payment
          await ordersAPI.processPayment(order._id, paymentData);
        }

        Alert.alert(
          'Order Placed Successfully! 🎉',
          `Order #${order.orderNumber}\n\nTotal: ₹${totalAmount}\nPayment: ${paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}\n\nYou will receive updates about your order.`,
          [
            {
              text: 'View Orders',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' }],
                });
                navigation.navigate('Orders');
              }
            },
            {
              text: 'Continue Shopping',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' }],
                });
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Order placement error:', error);
      Alert.alert(
        'Order Failed',
        error.response?.data?.message || 'Failed to place order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getPaymentGateway = (method) => {
    switch (method) {
      case 'upi': return 'UPI Gateway';
      case 'card': return 'Card Gateway';
      case 'wallet': return 'Wallet Gateway';
      case 'netbanking': return 'NetBanking Gateway';
      default: return 'Payment Gateway';
    }
  };

  const renderPaymentMethodForm = () => {
    switch (selectedPaymentMethod) {
      case 'upi':
        return (
          <View style={styles.paymentForm}>
            <Text style={styles.formLabel}>UPI ID</Text>
            <TextInput
              style={styles.input}
              placeholder="yourname@paytm / yourname@phonepe"
              value={paymentDetails.upiId}
              onChangeText={(text) => setPaymentDetails(prev => ({ ...prev, upiId: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.helpText}>Enter your UPI ID to pay instantly</Text>
          </View>
        );

      case 'card':
        return (
          <View style={styles.paymentForm}>
            <Text style={styles.formLabel}>Card Number</Text>
            <TextInput
              style={styles.input}
              placeholder="1234 5678 9012 3456"
              value={paymentDetails.cardNumber}
              onChangeText={(text) => setPaymentDetails(prev => ({ ...prev, cardNumber: text.replace(/\s/g, '') }))}
              keyboardType="numeric"
              maxLength={16}
            />
            
            <View style={styles.cardRow}>
              <View style={styles.cardHalf}>
                <Text style={styles.formLabel}>Expiry</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  value={paymentDetails.cardExpiry}
                  onChangeText={(text) => setPaymentDetails(prev => ({ ...prev, cardExpiry: text }))}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View style={styles.cardHalf}>
                <Text style={styles.formLabel}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  value={paymentDetails.cardCvv}
                  onChangeText={(text) => setPaymentDetails(prev => ({ ...prev, cardCvv: text }))}
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                />
              </View>
            </View>
            
            <Text style={styles.formLabel}>Cardholder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Name on card"
              value={paymentDetails.cardName}
              onChangeText={(text) => setPaymentDetails(prev => ({ ...prev, cardName: text }))}
              autoCapitalize="words"
            />
          </View>
        );

      case 'wallet':
      case 'netbanking':
        return (
          <View style={styles.paymentForm}>
            <Text style={styles.infoText}>
              You will be redirected to complete the payment securely.
            </Text>
          </View>
        );

      case 'cod':
        return (
          <View style={styles.paymentForm}>
            <Text style={styles.infoText}>
              Pay ₹{totalAmount} in cash when you receive your order.
            </Text>
            <Text style={styles.helpText}>
              Please keep exact change ready for faster delivery.
            </Text>
          </View>
        );

      default:
        return null;
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
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.orderSummary}>
            <View style={styles.productRow}>
              <Image
                source={product.images && product.images.length > 0
                  ? { uri: product.images[0].url }
                  : require('../../assets/Logo.png')
                }
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>₹{convertToINR(product.price)} × {quantity}</Text>
                <Text style={styles.productVendor}>
                  by {product.seller?.businessInfo?.businessName || 'Vendor'}
                </Text>
              </View>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>₹{totalAmount}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Option</Text>
          <View style={styles.deliveryOptions}>
            <TouchableOpacity
              style={[styles.deliveryOption, deliveryType === 'pickup' && styles.selectedDeliveryOption]}
              onPress={() => setDeliveryType('pickup')}
            >
              <Text style={styles.deliveryIcon}>🏪</Text>
              <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryTitle}>Pickup</Text>
                <Text style={styles.deliveryDesc}>Collect from vendor (30 mins)</Text>
              </View>
              <View style={[styles.radio, deliveryType === 'pickup' && styles.radioSelected]} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.deliveryOption, deliveryType === 'delivery' && styles.selectedDeliveryOption]}
              onPress={() => setDeliveryType('delivery')}
            >
              <Text style={styles.deliveryIcon}>🚚</Text>
              <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryTitle}>Home Delivery</Text>
                <Text style={styles.deliveryDesc}>Delivered to your address (2 hours)</Text>
              </View>
              <View style={[styles.radio, deliveryType === 'delivery' && styles.radioSelected]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Address */}
        {deliveryType === 'delivery' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.addressForm}>
              <TextInput
                style={styles.input}
                placeholder="Street Address"
                value={deliveryAddress.street}
                onChangeText={(text) => setDeliveryAddress(prev => ({ ...prev, street: text }))}
              />
              <View style={styles.addressRow}>
                <TextInput
                  style={[styles.input, styles.addressHalf]}
                  placeholder="City"
                  value={deliveryAddress.city}
                  onChangeText={(text) => setDeliveryAddress(prev => ({ ...prev, city: text }))}
                />
                <TextInput
                  style={[styles.input, styles.addressHalf]}
                  placeholder="State"
                  value={deliveryAddress.state}
                  onChangeText={(text) => setDeliveryAddress(prev => ({ ...prev, state: text }))}
                />
              </View>
              <View style={styles.addressRow}>
                <TextInput
                  style={[styles.input, styles.addressHalf]}
                  placeholder="Pincode"
                  value={deliveryAddress.pincode}
                  onChangeText={(text) => setDeliveryAddress(prev => ({ ...prev, pincode: text }))}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <TextInput
                  style={[styles.input, styles.addressHalf]}
                  placeholder="Landmark (Optional)"
                  value={deliveryAddress.landmark}
                  onChangeText={(text) => setDeliveryAddress(prev => ({ ...prev, landmark: text }))}
                />
              </View>
            </View>
          </View>
        )}

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethods}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  selectedPaymentMethod === method.id && styles.selectedPaymentMethod
                ]}
                onPress={() => handlePaymentMethodSelect(method.id)}
              >
                <View style={styles.paymentMethodLeft}>
                  <Image
                    source={method.icon}
                    style={styles.paymentIconImage}
                  />
                  <View style={styles.paymentMethodInfo}>
                    <View style={styles.paymentMethodHeader}>
                      <Text style={styles.paymentMethodName}>{method.name}</Text>
                      {method.popular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularText}>Popular</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.paymentMethodDesc}>{method.description}</Text>
                  </View>
                </View>
                <View style={[styles.radio, selectedPaymentMethod === method.id && styles.radioSelected]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Form */}
        {renderPaymentMethodForm()}

        {/* Order Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Any special instructions for the vendor..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.disabledButton]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.placeOrderButtonText}>
              {selectedPaymentMethod === 'cod' ? 'Place Order' : `Pay ₹${totalAmount}`}
            </Text>
          )}
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
  section: {
    backgroundColor: colors.white,
    marginBottom: 8,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  orderSummary: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
  },
  productRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  productVendor: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  deliveryOptions: {
    gap: 12,
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
  },
  selectedDeliveryOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  deliveryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  deliveryDesc: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  addressForm: {
    gap: 12,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addressHalf: {
    flex: 1,
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
  },
  selectedPaymentMethod: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  paymentIconImage: {
    width: 24,
    height: 24,
    marginRight: 12,
    tintColor: colors.primary,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: 8,
  },
  popularBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  popularText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '600',
  },
  paymentMethodDesc: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  paymentForm: {
    backgroundColor: colors.white,
    marginBottom: 8,
    padding: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardHalf: {
    flex: 1,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  infoText: {
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
    marginVertical: 20,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: -8,
    marginBottom: 12,
  },
  footer: {
    backgroundColor: colors.white,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  placeOrderButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  placeOrderButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PaymentScreen;