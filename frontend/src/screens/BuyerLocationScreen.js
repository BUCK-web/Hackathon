import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import useAuthStore from '../stores/authStore';

const BuyerLocationScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    address: '',
  });

  const handleAddAddress = () => {
    setEditingAddress(null);
    setFormData({ label: '', address: '' });
    setModalVisible(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      address: address.address,
    });
    setModalVisible(true);
  };

  const handleSaveAddress = () => {
    if (!formData.label || !formData.address) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (editingAddress) {
      // Update existing address
      setAddresses(addresses.map(addr => 
        addr.id === editingAddress.id 
          ? { ...addr, ...formData }
          : addr
      ));
    } else {
      // Add new address
      const newAddress = {
        id: Date.now(),
        ...formData,
        isDefault: addresses.length === 0, // First address is default
      };
      setAddresses([...addresses, newAddress]);
    }

    setModalVisible(false);
    setFormData({ label: '', address: '' });
  };

  const handleDeleteAddress = (addressId) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
            // If deleted address was default, make first remaining address default
            if (addresses.find(addr => addr.id === addressId)?.isDefault && updatedAddresses.length > 0) {
              updatedAddresses[0].isDefault = true;
            }
            setAddresses(updatedAddresses);
          },
        },
      ]
    );
  };

  const setDefaultAddress = (addressId) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId,
    })));
  };

  const AddressCard = ({ address }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <Text style={styles.addressLabel}>{address.label}</Text>
        {address.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
      </View>
      <Text style={styles.addressText}>{address.address}</Text>
      
      <View style={styles.addressActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditAddress(address)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        {!address.isDefault && (
          <TouchableOpacity
            style={[styles.actionButton, styles.defaultButton]}
            onPress={() => setDefaultAddress(address.id)}
          >
            <Text style={styles.actionButtonText}>Set Default</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteAddress(address.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Addresses</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddAddress}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No addresses added yet</Text>
            <Text style={styles.emptySubtext}>Add your first address for faster checkout</Text>
          </View>
        ) : (
          addresses.map(address => (
            <AddressCard key={address.id} address={address} />
          ))
        )}
      </ScrollView>

      {/* Add/Edit Address Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Address Label (e.g., Home, Work)"
              value={formData.label}
              onChangeText={(text) => setFormData({ ...formData, label: text })}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Full Address"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveAddress}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  addressActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  defaultButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
  },
  cancelButtonText: {
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default BuyerLocationScreen;