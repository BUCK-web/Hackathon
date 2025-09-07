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

const SellerLocationScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const [locations, setLocations] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
  });

  const handleAddLocation = () => {
    setEditingLocation(null);
    setFormData({ name: '', address: '', phone: '' });
    setModalVisible(true);
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      phone: location.phone,
    });
    setModalVisible(true);
  };

  const handleSaveLocation = () => {
    if (!formData.name || !formData.address || !formData.phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (editingLocation) {
      // Update existing location
      setLocations(locations.map(loc => 
        loc.id === editingLocation.id 
          ? { ...loc, ...formData }
          : loc
      ));
    } else {
      // Add new location
      const newLocation = {
        id: Date.now(),
        ...formData,
        isActive: true,
      };
      setLocations([...locations, newLocation]);
    }

    setModalVisible(false);
    setFormData({ name: '', address: '', phone: '' });
  };

  const handleDeleteLocation = (locationId) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setLocations(locations.filter(loc => loc.id !== locationId));
          },
        },
      ]
    );
  };

  const toggleLocationStatus = (locationId) => {
    setLocations(locations.map(loc => 
      loc.id === locationId 
        ? { ...loc, isActive: !loc.isActive }
        : loc
    ));
  };

  const LocationCard = ({ location }) => (
    <View style={styles.locationCard}>
      <View style={styles.locationHeader}>
        <Text style={styles.locationName}>{location.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: location.isActive ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.statusText}>{location.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>
      <Text style={styles.locationAddress}>{location.address}</Text>
      <Text style={styles.locationPhone}>{location.phone}</Text>
      
      <View style={styles.locationActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditLocation(location)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, location.isActive ? styles.deactivateButton : styles.activateButton]}
          onPress={() => toggleLocationStatus(location.id)}
        >
          <Text style={styles.actionButtonText}>
            {location.isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteLocation(location.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Locations</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddLocation}>
          <Text style={styles.addButtonText}>+ Add Location</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {locations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No locations added yet</Text>
            <Text style={styles.emptySubtext}>Add your first location to get started</Text>
          </View>
        ) : (
          locations.map(location => (
            <LocationCard key={location.id} location={location} />
          ))
        )}
      </ScrollView>

      {/* Add/Edit Location Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Location Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Full Address"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              multiline
              numberOfLines={3}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
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
                onPress={handleSaveLocation}
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
  locationCard: {
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
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  locationActions: {
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
  activateButton: {
    backgroundColor: '#4CAF50',
  },
  deactivateButton: {
    backgroundColor: '#FF9800',
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
    height: 80,
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

export default SellerLocationScreen;