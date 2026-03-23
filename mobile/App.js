import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import * as Location from 'expo-location';

const API_URL = 'http://10.0.2.2:8000'; // Adjust for proper host

export default function App() {
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [user, setUser] = useState({ name: 'Driver' });

  // Authenticate driver (Mock token for simplicity)
  const headers = { Authorization: `Bearer SIMULATED_TOKEN` }; 

  useEffect(() => {
    setupLocationTracking();
    setLoading(false);
  }, []);

  const setupLocationTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationError('Permission to access location was denied');
      return;
    }
    await Location.watchPositionAsync({
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
    }, (location) => {
      // Background location tracking
      axios.post(`${API_URL}/driver/update-location`, {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      }, { headers }).catch(e => console.log('Location update failed', e));
    });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#eab308" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Driver Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, {user.name}</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status: Active</Text>
        <Text style={styles.cardText}>Location tracking is running in the background.</Text>
        {locationError && <Text style={styles.error}>{locationError}</Text>}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Please use the Web Dashboard for detailed shipment management and history.</Text>
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={() => {}}>
        <Text style={styles.btnText}>Refresh Status</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 4 },
  card: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 12, 
    marginBottom: 20, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 10,
    elevation: 2 
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  cardText: { fontSize: 14, color: '#475569' },
  infoBox: { 
    padding: 16, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 8, 
    borderLeftWidth: 4, 
    borderLeftColor: '#eab308' 
  },
  infoText: { fontSize: 14, color: '#334155', fontStyle: 'italic' },
  refreshBtn: { 
    backgroundColor: '#eab308', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  error: { color: '#ef4444', marginTop: 10, fontSize: 12 }
});
