import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

// Base URL for viewer - adjust for your deployment
// Note: viewer.html should be served from the same origin as your backend or web server
const VIEWER_BASE_URL = __DEV__
  ? 'http://localhost:3000/viewer.html'  // Development - adjust port if needed
  : 'https://your-domain.com/viewer.html'; // Production - replace with your domain

export default function ResultScreen({ route, navigation }) {
  const { modelId } = route.params;
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (modelId) {
      // Generate viewer URL with model ID
      const url = `${VIEWER_BASE_URL}?id=${modelId}`;
      setQrUrl(url);
    }
  }, [modelId]);

  const handleShare = async () => {
    if (!qrUrl) return;

    try {
      await Share.share({
        message: `Scan this QR code to view the AR model: ${qrUrl}`,
        url: qrUrl,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share');
    }
  };

  const handleCopyUrl = () => {
    // Note: You may need to install @react-native-clipboard/clipboard for copy functionality
    Alert.alert('URL', qrUrl);
  };

  if (!modelId || !qrUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>No model ID provided</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>QR Code Generated</Text>
        <Text style={styles.subtitle}>
          Scan this code to view your model in AR
        </Text>

        <View style={styles.qrContainer}>
          <QRCode
            value={qrUrl}
            size={250}
            backgroundColor="#fff"
            color="#000"
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.label}>Model ID:</Text>
          <Text style={styles.modelId}>{modelId}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.label}>Viewer URL:</Text>
          <Text style={styles.url} numberOfLines={2}>
            {qrUrl}
          </Text>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Upload Another</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  modelId: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
  url: {
    fontSize: 12,
    color: '#667eea',
  },
  shareButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 40,
  },
});

