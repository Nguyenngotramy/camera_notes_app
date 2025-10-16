import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
// Để sử dụng icon, bạn cần cài đặt thư viện này: npx expo install @expo/vector-icons
import { Feather } from '@expo/vector-icons'; 
import { Photo } from '@/hooks/usePhotos';

interface GalleryItemProps {
  item: Photo;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (uri: string) => void; // Sửa lại: chỉ cần uri để share
}

// Gộp lại thành một component duy nhất và hoàn chỉnh
export default function GalleryItem({ item, onEdit, onDelete, onShare }: GalleryItemProps) {
  
  /**
   * Hiển thị hộp thoại xác nhận trước khi xóa.
   */
  const handleDelete = () => {
    Alert.alert(
      'Xóa ảnh', // Tiêu đề
      'Bạn có chắc chắn muốn xóa ảnh này không?', // Nội dung
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive', 
          // Gọi hàm onDelete đã được truyền từ component cha
          onPress: () => onDelete(item.id) 
        }
      ]
    );
  };

  /**
   * Gọi hàm onShare với URI của ảnh.
   */
  const handleShare = () => {
    onShare(item.uri);
  };

  return (
    <View style={styles.container}>
      {/* Sử dụng key cho Image để re-render khi URI thay đổi nếu cần */}
      <Image key={item.uri} source={{ uri: item.uri }} style={styles.image} />
      
      {item.caption ? (
        <View style={styles.captionContainer}>
          <Text style={styles.caption} numberOfLines={2}>
            {item.caption}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {/* Nút Sửa */}
        <TouchableOpacity 
          onPress={() => onEdit(item.id)} 
          style={styles.actionButton}
        >
          <Feather name="edit-2" size={18} color="#007AFF" />
          <Text style={styles.actionText}>Sửa</Text>
        </TouchableOpacity>
        
        {/* Nút Chia sẻ */}
        <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
          <Feather name="share-2" size={18} color="#007AFF" />
          <Text style={styles.actionText}>Chia sẻ</Text>
        </TouchableOpacity>

        {/* Nút Xóa */}
        <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
          <Feather name="trash-2" size={18} color="#FF3B30" />
          <Text style={[styles.actionText, { color: '#FF3B30' }]}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 5,
    backgroundColor: 'white',
    borderRadius: 10, // Tăng độ bo tròn
    overflow: 'hidden',
    // Thêm shadow cho iOS
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    // Thêm elevation cho Android
    elevation: 3,
  },
  image: {
    width: '100%',
    aspectRatio: 1, // Giữ tỷ lệ 1:1
    backgroundColor: '#e1e4e8' // Màu nền nhẹ nhàng hơn
  },
  captionContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 45, // Đảm bảo chiều cao tối thiểu để layout ổn định
    justifyContent: 'center',
  },
  caption: {
    fontSize: 14, // Tăng kích thước chữ cho dễ đọc
    color: '#333'
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0' // Màu đường kẻ nhạt hơn
  },
  actionButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row', // Sắp xếp icon và chữ theo hàng ngang
    gap: 5, // Khoảng cách giữa icon và chữ
  },
  actionText: {
    fontSize: 13, // Tăng kích thước chữ
    color: '#007AFF',
    fontWeight: '600'
  }
});