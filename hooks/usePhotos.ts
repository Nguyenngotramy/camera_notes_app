import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

// Key để lưu trữ dữ liệu trong AsyncStorage
const STORAGE_KEY = '@camera_notes_photos_v2';
// Tên album sẽ được tạo trong thư viện ảnh của người dùng
const ALBUM_NAME = 'Camera Notes';

/**
 * Định nghĩa cấu trúc của một đối tượng Photo.
 * @property {string} id - ID duy nhất của ảnh trong ứng dụng.
 * @property {string} assetId - ID của ảnh trong MediaLibrary của thiết bị.
 * @property {string} uri - URI (đường dẫn) lâu dài của ảnh trong MediaLibrary.
 * @property {string} caption - Chú thích cho ảnh.
 * @property {string} timestamp - Dấu thời gian (ISO string) khi ảnh được tạo.
 */
export interface Photo {
  id: string;
  assetId: string;
  uri: string;
  caption: string;
  timestamp: string;
}

/**
 * Custom hook để quản lý việc lưu, tải, cập nhật và xóa ảnh.
 */
export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  // Effect để tải danh sách ảnh từ AsyncStorage khi component được mount
  useEffect(() => {
    loadPhotos();
  }, []);

  // Effect để tự động lưu lại danh sách ảnh vào AsyncStorage mỗi khi nó thay đổi
  useEffect(() => {
    // Chỉ lưu sau khi đã tải xong dữ liệu ban đầu
    if (!loading) {
      savePhotosToStorage();
    }
  }, [photos, loading]);

  /**
   * Tải danh sách ảnh từ AsyncStorage.
   */
  const loadPhotos = async () => {
    try {
      const storedPhotos = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedPhotos) {
        const parsedPhotos = JSON.parse(storedPhotos) as Photo[];
        // TODO: Cân nhắc việc kiểm tra xem các asset có còn tồn tại trong MediaLibrary không
        setPhotos(Array.isArray(parsedPhotos) ? parsedPhotos : []);
      }
    } catch (error) {
      console.error('Lỗi khi tải ảnh từ AsyncStorage:', error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lưu danh sách ảnh hiện tại vào AsyncStorage.
   */
  const savePhotosToStorage = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
    } catch (error) {
      console.error('Lỗi khi lưu ảnh vào AsyncStorage:', error);
    }
  };

  /**
   * Thêm một ảnh mới vào danh sách và lưu vào MediaLibrary của thiết bị.
   * @param {string} tempUri - URI tạm thời của ảnh (thường từ camera).
   * @param {string} caption - Chú thích cho ảnh.
   */
  const addPhoto = async (tempUri: string, caption: string = '') => {
    try {
      // 1. Xin quyền truy cập MediaLibrary
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Cần cấp quyền truy cập thư viện ảnh để lưu ảnh.');
        return;
      }

      // 2. Tạo một asset trong MediaLibrary từ URI tạm thời
      const asset = await MediaLibrary.createAssetAsync(tempUri);

      // 3. (Tùy chọn) Thêm asset vào một album cụ thể
      const album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset, false);
      }
      
      // 4. Tạo đối tượng Photo mới với thông tin từ asset đã lưu
      const newPhoto: Photo = {
        id: Date.now().toString(), // ID nội bộ của ứng dụng
        assetId: asset.id,         // ID trong MediaLibrary để xóa sau này
        uri: asset.uri,            // URI lâu dài
        caption,
        timestamp: new Date().toISOString(),
      };

      // 5. Cập nhật state của ứng dụng
      setPhotos(prev => [newPhoto, ...prev]);

    } catch (error) {
      console.error('Lỗi khi lưu ảnh vào MediaLibrary:', error);
      alert('Đã xảy ra lỗi khi lưu ảnh. Vui lòng thử lại.');
    }
  };

  /**
   * Cập nhật thông tin của một ảnh (ví dụ: chú thích).
   * @param {string} id - ID của ảnh cần cập nhật.
   * @param {Partial<Photo>} updates - Các thuộc tính cần cập nhật.
   */
  const updatePhoto = (id: string, updates: Partial<Pick<Photo, 'caption'>>) => {
    setPhotos(prev =>
      prev.map(photo =>
        photo.id === id ? { ...photo, ...updates } : photo
      )
    );
  };

  /**
   * Xóa một ảnh khỏi danh sách, AsyncStorage và cả MediaLibrary của thiết bị.
   * @param {string} id - ID của ảnh cần xóa.
   */
  const deletePhoto = async (id: string) => {
    const photoToDelete = photos.find(p => p.id === id);
    if (!photoToDelete) return;

    try {
      // 1. Xóa asset khỏi MediaLibrary của thiết bị
      await MediaLibrary.deleteAssetsAsync([photoToDelete.assetId]);
      
      // 2. Xóa ảnh khỏi state của ứng dụng
      setPhotos(prev => prev.filter(photo => photo.id !== id));
    } catch (error) {
      console.error('Lỗi khi xóa ảnh khỏi MediaLibrary:', error);
      alert('Không thể xóa ảnh. Nó có thể đã bị xóa khỏi thư viện của bạn.');
      // Vẫn xóa khỏi state để giao diện được đồng bộ
      setPhotos(prev => prev.filter(photo => photo.id !== id));
    }
  };

  /**
   * Mở dialog chia sẻ của hệ điều hành cho một ảnh.
   * @param {string} uri - URI của ảnh cần chia sẻ.
   */
  const sharePhoto = async (uri: string) => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        alert('Chức năng chia sẻ không khả dụng trên thiết bị này.');
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/jpeg' });
    } catch (error) {
      console.error('Lỗi khi chia sẻ ảnh:', error);
    }
  };

  return {
    photos,
    loading,
    addPhoto,
    updatePhoto,
    deletePhoto,
    sharePhoto,
  };
}