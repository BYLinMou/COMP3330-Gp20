import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/theme';
import { addTransaction } from '../../src/services/transactions';
import { getCategories, subscribeToCategoryChanges, type Category } from '../../src/services/categories';
import { processReceiptImage, type ReceiptData, type ProcessingProgress } from '../../src/services/receipt-processor';
import { useAuth } from '../../src/providers/AuthProvider';

type InputMethod = 'manual' | 'receipt' | 'voice';

export default function AddScreen() {
  const { session } = useAuth();
  const [inputMethod, setInputMethod] = useState<InputMethod>('receipt');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [merchant, setMerchant] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  
  // Categories and loading states
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [processingReceipt, setProcessingReceipt] = useState(false);
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  


  const quickAddItems = [
    { label: '$4.5 Coffee', amount: 4.5 },
    { label: '$12 Lunch', amount: 12 },
    { label: '$35 Gas', amount: 35 },
    { label: '$45 Groceries', amount: 45 },
  ];

  // Load categories on mount and subscribe to realtime changes
  useEffect(() => {
    loadCategories();
  }, []);

  // Subscribe to category changes for realtime updates
  useEffect(() => {
    if (!session) return;
    let unsub: undefined | (() => Promise<void>);
    (async () => {
      try {
        unsub = await subscribeToCategoryChanges((change) => {
          // If a category is deleted and it's currently selected, clear the selection
          if (change.eventType === 'DELETE' && change.old?.id === categoryId) {
            setCategoryId('');
          }
          // Reload categories for any event (INSERT, UPDATE, DELETE)
          loadCategories();
        });
      } catch (e) {
        console.warn('Category realtime subscription failed:', e);
      }
    })();
    return () => {
      if (unsub) unsub().catch(() => {});
    };
  }, [categoryId, session]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await getCategories();
      setCategories(data);
      // Don't auto-select a category - let user explicitly choose
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const handleImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload receipts.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        await handleReceiptImageProcessing(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const handleCameraPick = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow camera access to take receipt photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        await handleReceiptImageProcessing(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  /**
   * 处理收据图片：调用独立的收据处理器
   * @param imageUri - 图片的本地 URI
   */
  const handleReceiptImageProcessing = async (imageUri: string) => {
    try {
      setProcessingReceipt(true);
      
      // 显示处理进度
      let progressMessage = 'Starting receipt processing...';
      Alert.alert('Processing Receipt', progressMessage);

      // 调用独立的收据处理器（来自 receipt-processor.ts）
      const receiptData = await processReceiptImage(imageUri, (progress: ProcessingProgress) => {
        progressMessage = `${progress.message} (${progress.progress}%)`;
        console.log('[Add Screen]', progressMessage);
      });

      console.log('[Add Screen] Receipt data received:', receiptData);

      // 自动填充表单
      setMerchant(receiptData.merchant);
      setAmount(receiptData.amount.toString());
      setDescription(receiptData.items?.join(', ') || receiptData.description || '');
      
      if (receiptData.date) {
        setSelectedDate(new Date(receiptData.date));
      }

      // 尝试匹配分类
      if (receiptData.category && categories.length > 0) {
        const matchedCategory = categories.find(
          cat => cat.name.toLowerCase().includes(receiptData.category!.toLowerCase())
        );
        if (matchedCategory) {
          setCategoryId(matchedCategory.id);
        }
      }

      Alert.alert(
        '✅ Success', 
        'Receipt information extracted! Please review the details and save.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('[Add Screen] Receipt processing error:', error);
      Alert.alert(
        '❌ Processing Failed',
        error?.message || 'Failed to process receipt. Please enter details manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setProcessingReceipt(false);
    }
  };

  const handleSaveTransaction = async () => {
    // Check authentication first
    if (!session) {
      console.warn('[Save Transaction] Blocked: no active session');
      Alert.alert('Authentication Required', 'Please sign in to save transactions');
      return;
    }

    // Validation
    if (!amount || isNaN(parseFloat(amount))) {
      console.warn('[Save Transaction] Blocked: invalid amount value=', amount);
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    if (!description.trim()) {
      console.warn('[Save Transaction] Blocked: empty description');
      Alert.alert('Validation Error', 'Please enter a description');
      return;
    }

    try {
      setSubmitting(true);

      // Convert amount to negative for expenses
      const numericAmount = -Math.abs(parseFloat(amount));

      // Determine source based on input method
      let source: 'manual' | 'ocr' | 'ai' = 'manual';
      if (inputMethod === 'receipt') {
        source = 'ocr';
      } else if (inputMethod === 'voice') {
        source = 'ai';
      }

      const transactionData = {
        amount: numericAmount,
        occurred_at: selectedDate.toISOString(),
        merchant: merchant.trim() || description.trim(), // Use merchant or description as fallback
        category_id: categoryId || null,
        source,
        note: description.trim() + (notes.trim() ? ' | ' + notes.trim() : ''), // Combine description and notes
      };

      console.log('Saving transaction:', transactionData);
      const result = await addTransaction(transactionData);
      console.log('Transaction saved successfully:', result);

      Alert.alert('Success', 'Transaction saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setAmount('');
            setDescription('');
            setMerchant('');
            setNotes('');
            setSelectedDate(new Date());
          },
        },
      ]);
    } catch (error: any) {
      console.error('Failed to save transaction:', error);
      const errorMessage = error?.message || 'Failed to save transaction. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      console.log('[Save Transaction] Submit flow finished');
      setSubmitting(false);
    }
  };

  const handleQuickAdd = async (item: { label: string; amount: number }) => {
    try {
      setSubmitting(true);

      await addTransaction({
        amount: -item.amount, // Negative for expense
        occurred_at: new Date().toISOString(),
        merchant: item.label,
        category_id: categoryId || null,
        source: 'manual',
        note: 'Quick Add: ' + item.label,
      });

      Alert.alert('Success', `${item.label} added successfully!`);
    } catch (error) {
      console.error('Failed to add quick transaction:', error);
      Alert.alert('Error', 'Failed to add transaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        style={styles.header}
      >
        <Text style={styles.appName}>AuraPet</Text>
        <Text style={styles.subtitle}>Smart Budgeting Companion</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Debug Info - Remove in production */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              Auth Status: {session ? '✅ Logged In' : '❌ Not Logged In'}
            </Text>
            {session && (
              <Text style={styles.debugText}>
                User: {session.user?.email}
              </Text>
            )}
          </View>
        )}

        {/* Add Transaction Title */}
        <Text style={styles.pageTitle}>Add Transaction</Text>

        {/* Input Method Selector */}
        <View style={styles.methodSelector}>
          <TouchableOpacity
            style={[
              styles.methodButton,
              inputMethod === 'manual' && styles.methodButtonActive,
            ]}
            onPress={() => setInputMethod('manual')}
          >
            <Ionicons
              name="cash-outline"
              size={32}
              color={inputMethod === 'manual' ? Colors.white : Colors.textSecondary}
            />
            <Text
              style={[
                styles.methodLabel,
                inputMethod === 'manual' && styles.methodLabelActive,
              ]}
            >
              Manual
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodButton,
              inputMethod === 'receipt' && styles.methodButtonActive,
            ]}
            onPress={() => setInputMethod('receipt')}
          >
            <Ionicons
              name="camera-outline"
              size={32}
              color={inputMethod === 'receipt' ? Colors.white : Colors.textSecondary}
            />
            <Text
              style={[
                styles.methodLabel,
                inputMethod === 'receipt' && styles.methodLabelActive,
              ]}
            >
              Receipt
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodButton,
              inputMethod === 'voice' && styles.methodButtonActive,
            ]}
            onPress={() => setInputMethod('voice')}
          >
            <Ionicons
              name="mic-outline"
              size={32}
              color={inputMethod === 'voice' ? Colors.white : Colors.textSecondary}
            />
            <Text
              style={[
                styles.methodLabel,
                inputMethod === 'voice' && styles.methodLabelActive,
              ]}
            >
              Voice
            </Text>
          </TouchableOpacity>
        </View>

        {/* Receipt Upload Area */}
        {inputMethod === 'receipt' && (
          <View style={styles.uploadArea}>
            <View style={styles.uploadIcon}>
              <Ionicons name="cloud-upload-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.uploadText}>Upload a receipt or take a photo</Text>
            <View style={styles.uploadButtonRow}>
              <TouchableOpacity 
                style={[styles.uploadButton, processingReceipt && styles.uploadButtonDisabled]} 
                onPress={handleImagePick}
                disabled={processingReceipt}
              >
                <Ionicons name="images-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.uploadButtonText}>Choose File</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.uploadButton, processingReceipt && styles.uploadButtonDisabled]} 
                onPress={handleCameraPick}
                disabled={processingReceipt}
              >
                <Ionicons name="camera-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.uploadButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
            {processingReceipt && (
              <View style={styles.processingIndicator}>
                <ActivityIndicator color={Colors.primary} size="small" />
                <Text style={styles.processingText}>Processing receipt...</Text>
              </View>
            )}
          </View>
        )}

        {/* Transaction Details Form */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Transaction Details</Text>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Amount <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.amountInput}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountField}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
              <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="What did you buy?"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <TouchableOpacity 
              style={styles.selectInput}
              onPress={() => setShowCategoryModal(true)}
              disabled={loadingCategories}
            >
              <Text style={categoryId ? styles.selectValue : styles.selectPlaceholder}>
                {categoryId 
                  ? categories.find(c => c.id === categoryId)?.name || 'No Category'
                  : 'No Category'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Merchant */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Merchant (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter merchant name (or use description)"
              value={merchant}
              onChangeText={setMerchant}
            />
          </View>

          {/* Date (occurred_at) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date (Occurred At)</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                max={new Date().toISOString().split('T')[0]}
                style={{
                  backgroundColor: Colors.gray100,
                  borderRadius: 8,
                  padding: 14,
                  fontSize: 15,
                  color: Colors.textPrimary,
                  border: 'none',
                  fontFamily: 'system-ui',
                }}
              />
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.dateInputContainer}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View style={styles.dateTextInput}>
                    <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                    <Text style={styles.dateValueText}>
                      {selectedDate.toLocaleDateString('en-US', { 
                        month: '2-digit', 
                        day: '2-digit', 
                        year: 'numeric' 
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </>
            )}
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              placeholder="Add any additional notes..."
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, submitting && styles.saveButtonDisabled]} 
            onPress={handleSaveTransaction}
            disabled={submitting || !session}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Transaction</Text>
            )}
          </TouchableOpacity>
          {!session && (
            <Text style={styles.warningText}>Please sign in to save transactions</Text>
          )}
        </View>

        {/* Quick Add */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.quickAddGrid}>
            {quickAddItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.quickAddButton}
                onPress={() => handleQuickAdd(item)}
                disabled={submitting || !session}
              >
                <Text style={styles.quickAddText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalList}>
              {loadingCategories ? (
                <ActivityIndicator style={styles.modalLoading} />
              ) : (
                <>
                  {/* No Category Option */}
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      !categoryId && styles.modalItemSelected
                    ]}
                    onPress={() => {
                      setCategoryId('');
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text style={[
                      styles.modalItemText,
                      !categoryId && styles.modalItemTextSelected
                    ]}>
                      No Category
                    </Text>
                    {!categoryId && (
                      <Ionicons name="checkmark" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                  
                  {/* User Categories */}
                  {categories.length === 0 ? (
                    <Text style={styles.emptyText}>No custom categories. Create one in Settings!</Text>
                  ) : (
                    categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.modalItem,
                          categoryId === category.id && styles.modalItemSelected
                        ]}
                        onPress={() => {
                          setCategoryId(category.id);
                          setShowCategoryModal(false);
                        }}
                      >
                        <Text style={[
                          styles.modalItemText,
                          categoryId === category.id && styles.modalItemTextSelected
                        ]}>
                          {category.name}
                        </Text>
                        {categoryId === category.id && (
                          <Ionicons name="checkmark" size={20} color={Colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  methodButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.gray200,
  },
  methodButtonActive: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  methodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  methodLabelActive: {
    color: Colors.white,
  },
  uploadArea: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  uploadIcon: {
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  uploadButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.gray100,
    borderRadius: 8,
  },
  processingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: Colors.error,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginRight: 8,
  },
  amountField: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  textInput: {
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectPlaceholder: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  selectValue: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTextInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateValueText: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  saveButton: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.gray300,
  },
  warningText: {
    fontSize: 12,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 8,
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAddButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  quickAddText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  modalItemSelected: {
    backgroundColor: Colors.gray50,
  },
  modalItemText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  modalItemTextSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },
  modalLoading: {
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  customInputContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  customInput: {
    flex: 1,
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  customInputButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  customInputButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  commonMerchantsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  debugInfo: {
    backgroundColor: Colors.gray100,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  debugText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
});
