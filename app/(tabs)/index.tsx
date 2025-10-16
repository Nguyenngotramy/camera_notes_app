import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator, // Thêm component này để báo loading
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons'; // Import icon
import CameraView from '@/components/Camera/CameraView';
import GalleryItem from '@/components/Gallery/GalleryItem';
import { usePhotos } from '@/hooks/usePhotos';

export default function HomeScreen() {
  // Lấy thêm `sharePhoto` và `loading` từ hook
  const { photos, addPhoto, updatePhoto, deletePhoto, sharePhoto, loading } = usePhotos();
  
  const [showCamera, setShowCamera] = useState(false);
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [tempUri, setTempUri] = useState<string | null>(null);
  const [tempCaption, setTempCaption] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCapture = (uri: string) => {
    setTempUri(uri);
    setTempCaption('');
    setEditingId(null);
    setShowCamera(false);
    setShowCaptionInput(true);
  };

  const handleEdit = (id: string) => {
    const photo = photos.find(p => p.id === id);
    if (photo) {
      setEditingId(id);
      setTempCaption(photo.caption);
      // Không cần set tempUri vì chúng ta không hiển thị lại ảnh trong modal sửa caption
      setShowCaptionInput(true);
    }
  };
  
  const handleShare = (uri: string) => {
    sharePhoto(uri);
  };

  const handleSaveCaption = () => {
    // Chỉ cần trim() một lần và lưu vào biến
    const captionToSave = tempCaption.trim();

    if (!captionToSave) {
      Alert.alert('Chưa có chú thích', 'Vui lòng nhập chú thích cho ảnh.');
      return;
    }

    if (editingId) {
      updatePhoto(editingId, { caption: captionToSave });
    } else if (tempUri) {
      addPhoto(tempUri, captionToSave);
    }
    
    // Reset state sau khi lưu
    handleCancelCaption();
  };

  const handleCancelCaption = () => {
    setShowCaptionInput(false);
    setTempUri(null);
    setEditingId(null);
    setTempCaption('');
  };

  // --- Render Functions ---

  // 1. Hiển thị màn hình loading khi đang tải ảnh từ storage
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // 2. Hiển thị Camera khi cần
  if (showCamera) {
    return (
      <CameraView
        onCapture={handleCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  // 3. Render giao diện chính
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Camera Notes</Text>
        <Text style={styles.subtitle}>{photos.length} ảnh</Text>
      </View>

      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="camera" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có ảnh nào</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowCamera(true)}
          >
            <Text style={styles.buttonText}>Chụp ảnh đầu tiên</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <GalleryItem
              item={item}
              onEdit={handleEdit}
              onDelete={deletePhoto}
              onShare={handleShare} // Thêm prop onShare
            />
          )}
          numColumns={2}
          contentContainerStyle={styles.grid}
        />
      )}

      {/* Modal nhập/sửa caption */}
      <Modal
        visible={showCaptionInput}
        animationType="slide"
        onRequestClose={handleCancelCaption}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancelCaption} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingId ? 'Sửa chú thích' : 'Thêm chú thích'}
            </Text>
            <TouchableOpacity onPress={handleSaveCaption} style={styles.headerButton}>
              <Text style={[styles.headerButtonText, styles.saveText]}>Lưu</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.textInput}
            multiline
            value={tempCaption}
            onChangeText={setTempCaption}
            placeholder="Nhập chú thích của bạn..."
            textAlignVertical="top"
            autoFocus={true} // Tự động focus vào ô input
          />
        </SafeAreaView>
      </Modal>

      {/* Nút FAB chỉ hiển thị khi không ở màn hình camera và không có modal */}
      {!showCamera && !showCaptionInput && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCamera(true)}
        >
          <Feather name="plus" size={28} color="white" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  grid: {
    padding: 5,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  // Styles cho Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'white'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButton: {
    padding: 10
  },
  headerButtonText: {
    fontSize: 17,
    color: '#007AFF'
  },
  saveText: {
    fontWeight: '600'
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  textInput: {
    flex: 1,
    padding: 20,
    fontSize: 18,
    lineHeight: 25,
  }
});