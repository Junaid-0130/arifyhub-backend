import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

// Backend API URL - adjust for your server
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000'  // Development
  : 'https://your-server.com'; // Production

export default function UploadScreen({ navigation }) {
  const [modelUrl, setModelUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    // Validate URL
    if (!modelUrl.trim()) {
      Alert.alert('Error', 'Please enter a model URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(modelUrl);
    } catch (e) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    setLoading(true);

    try {
      // Send model URL to backend
      const response = await fetch(`${API_BASE_URL}/uploadResult`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: modelUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload model');
      }

      // Navigate to ResultScreen with model ID
      navigation.navigate('Result', { modelId: data.id });

    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload model');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Upload Model</Text>
        <Text style={styles.subtitle}>
          Enter a model URL to generate a QR code
        </Text>

        <TextInput
          style={styles.input}
          placeholder="https://example.com/model.glb"
          placeholderTextColor="#999"
          value={modelUrl}
          onChangeText={setModelUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleUpload}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Upload & Generate QR</Text>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 For testing, you can use a mock URL like:
          </Text>
          <Text style={styles.infoCode}>
            https://example.com/model.glb
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 8,
  },
  infoCode: {
    fontSize: 12,
    color: '#1976d2',
    fontFamily: 'monospace',
  },
});



