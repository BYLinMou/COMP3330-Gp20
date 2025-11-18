// app/add-receipt.tsx
// ⚠️ LEGACY FILE - NOT IN USE
// This file is deprecated. Use app/(tabs)/add.tsx instead.

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { getCategories, type Category } from '../src/services/transactions';
import { useAuth } from '../src/providers/AuthProvider';
// Legacy imports - replaced by receipt-processor.ts
// import { analyzeReceiptImage, type ReceiptAnalysisResult } from '../src/services/receipt';

// Placeholder types for legacy compatibility
type ReceiptAnalysisResult = {
  success?: boolean;
  error?: string;
  merchant?: string;
  amount?: number;
  date?: string;
  items?: string[];
  data?: {
    merchant?: string;
    amount?: number;
    date?: Date;
    description?: string;
  };
};

export default function AddReceipt() {
  const router = useRouter();
  const { session } = useAuth();

  // Form state
  const [amount, setAmount] = useState('');
  const [occurredAt, setOccurredAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [merchant, setMerchant] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');

  // Image and OCR state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ReceiptAnalysisResult | null>(null);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await getCategories();
      setCategories(data);
      if (data.length > 0) {
        setCategoryId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      Alert.alert('Error', 'Failed to load category list');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setOccurredAt(selectedDate);
    }
  };

  /**
   * Select image and auto analyze
   */
  const handlePickImage = async () => {
    try {
      // Request media library permissions
      const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!result.granted) {
        Alert.alert('Permission Error', 'Media library access permission is required');
        return;
      }

      // Open image picker
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (pickerResult.canceled) return;

      const imageUri = pickerResult.assets[0].uri;
      setSelectedImage(imageUri);
      console.log('Image selected:', imageUri);

      // Auto analyze receipt
      await analyzeReceipt(imageUri);
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  /**
   * Analyze receipt image (placeholder function - Legacy)
   */
  const analyzeReceipt = async (imagePath: string) => {
    try {
      setIsAnalyzing(true);
      console.log('⚠️ Legacy function called - This feature is moved to add.tsx');
      
      // Placeholder implementation - actual functionality has been migrated to app/(tabs)/add.tsx
      Alert.alert(
        'Feature Migrated',
        'This page is deprecated. Please use the Add feature on the main page (Receipt mode)',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go', onPress: () => router.replace('/(tabs)/add') }
        ]
      );
    } catch (error) {
      console.error('Legacy function error:', error);
      Alert.alert('Error', 'This feature has been migrated. Please use the new add page');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert('验证错误', '请输入有效的金额');
      return;
    }

    if (!merchant.trim()) {
      Alert.alert('验证错误', '请输入商家名称');
      return;
    }

    try {
      setSubmitting(true);

      // Convert amount to negative for expenses (positive for income)
      const numericAmount = parseFloat(amount);
      
      // 导入 addTransaction
      const { addTransaction } = await import('../src/services/transactions');

      await addTransaction({
        amount: numericAmount,
        occurred_at: occurredAt.toISOString(),
        merchant: merchant.trim(),
        category_id: categoryId || null,
        payment_method: '现金', // 默认值，可根据实际需求调整
        source: selectedImage ? 'ocr' : 'manual',
        note: note.trim() || null,
      });

      Alert.alert('成功', '交易记录已添加', [
        {
          text: '确定',
          onPress: () => {
            // Reset form
            setAmount('');
            setMerchant('');
            setDescription('');
            setNote('');
            setOccurredAt(new Date());
            setSelectedImage(null);
            setAnalysisResult(null);
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error('Failed to add transaction:', error);
      Alert.alert('错误', '添加交易记录失败,请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {!session ? (
        <View style={styles.container}>
          <View style={styles.form}>
            <Text style={styles.title}>请先登录</Text>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => router.push('/(auth)/sign-in')}
            >
              <Text style={styles.submitButtonText}>返回登录</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>添加交易记录</Text>

        {/* Image Picker Section */}
        <View style={styles.imageSection}>
          {selectedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={handlePickImage}
                disabled={isAnalyzing || submitting}
              >
                <Text style={styles.changeImageButtonText}>更换图片</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.pickImageButton}
              onPress={handlePickImage}
              disabled={isAnalyzing || submitting}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#007AFF" size="large" />
              ) : (
                <View style={styles.pickImageButtonContent}>
                  <Text style={styles.pickImageButtonText}>📸</Text>
                  <Text style={styles.pickImageButtonLabel}>选择收据图片</Text>
                  <Text style={styles.pickImageButtonHint}>自动识别金额、商家等信息</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Analysis Result Display */}
        {analysisResult && !analysisResult.success && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>识别失败: {analysisResult.error}</Text>
          </View>
        )}

        {/* Amount Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>金额 (负数为支出,正数为收入)</Text>
          <TextInput
            style={styles.input}
            placeholder="例如: 50.00 或 1000.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            editable={!submitting}
          />
        </View>

        {/* Date Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>日期</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            disabled={submitting}
          >
            <Text style={styles.dateButtonText}>
              {occurredAt.toLocaleDateString('zh-CN')}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={occurredAt}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        {/* Merchant Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>商家名称</Text>
          <TextInput
            style={styles.input}
            placeholder="例如: 星巴克"
            value={merchant}
            onChangeText={setMerchant}
            editable={!submitting}
          />
        </View>

        {/* Category Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>分类</Text>
          {loadingCategories ? (
            <ActivityIndicator />
          ) : categories.length === 0 ? (
            <Text style={styles.emptyText}>暂无分类,请先创建分类</Text>
          ) : (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={categoryId}
                onValueChange={(itemValue) => setCategoryId(itemValue)}
                enabled={!submitting}
                style={styles.picker}
              >
                {categories.map((category) => (
                  <Picker.Item
                    key={category.id}
                    label={category.name}
                    value={category.id}
                  />
                ))}
              </Picker>
            </View>
          )}
        </View>

        {/* Description Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>描述 (可选)</Text>
          <TextInput
            style={styles.input}
            placeholder="例如: 工作午餐、超市购物"
            value={description}
            onChangeText={setDescription}
            editable={!submitting}
          />
        </View>

        {/* Note Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>备注 (可选)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="添加备注..."
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            editable={!submitting}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>添加交易</Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={submitting}
        >
          <Text style={styles.cancelButtonText}>取消</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  // Image section styles
  imageSection: {
    marginBottom: 20,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  pickImageButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  pickImageButtonContent: {
    alignItems: 'center',
  },
  pickImageButtonText: {
    fontSize: 48,
    marginBottom: 10,
  },
  pickImageButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 5,
  },
  pickImageButtonHint: {
    fontSize: 13,
    color: '#999',
    marginTop: 5,
  },
  changeImageButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  changeImageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#fee',
    borderWidth: 1,
    borderColor: '#f88',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#d00',
    fontSize: 14,
  },
  // Form input styles
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  // Button styles
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});