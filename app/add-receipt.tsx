// app/add-receipt.tsx
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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { addTransaction, getCategories, type Category } from '../src/services/transactions';
import { useAuth } from '../src/providers/AuthProvider';

export default function AddReceipt() {
  const router = useRouter();
  const { session } = useAuth();

  // Form state
  const [amount, setAmount] = useState('');
  const [occurredAt, setOccurredAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [merchant, setMerchant] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState(''); // Changed from source to description
  const [note, setNote] = useState('');

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
      Alert.alert('错误', '无法加载分类列表');
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
      
      await addTransaction({
        amount: numericAmount,
        occurred_at: occurredAt.toISOString(),
        merchant: merchant.trim(),
        category_id: categoryId || null,
        source: description.trim() || null, // description stored in source field
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

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>请先登录</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>添加交易记录</Text>

        {/* Amount Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>金额 (负数为支出,正数为收入)</Text>
          <TextInput
            style={styles.input}
            placeholder="例如: -50.00 或 1000.00"
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

        {/* Source Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>描述/来源</Text>
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
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});