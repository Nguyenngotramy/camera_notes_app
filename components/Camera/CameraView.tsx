import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { CameraView as ExpoCameraView, useCameraPermissions } from 'expo-camera';

interface CameraViewProps {
  onCapture: (uri: string) => void;
  onClose: () => void;
}

export default function CameraView({ onCapture, onClose }: CameraViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<ExpoCameraView>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need camera permission</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo?.uri) {
          onCapture(photo.uri);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  return (
    <View style={styles.container}>
      <ExpoCameraView style={styles.camera} ref={cameraRef} facing="back">
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </ExpoCameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    fontSize: 16
  },
  camera: {
    flex: 1,
    width: '100%'
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40
  },
  button: {
    padding: 15,
    backgroundColor: '#007AFF',
    borderRadius: 8
  },
  buttonText: {
    color: 'white',
    fontSize: 16
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center'
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: 'black'
  },
  closeButton: {
    marginTop: 20,
    padding: 10
  },
  closeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});