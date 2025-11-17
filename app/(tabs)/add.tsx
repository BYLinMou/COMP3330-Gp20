import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/theme';
import { addTransaction } from '../../src/services/transactions';
import { getCategories, addCategory, subscribeToCategoryChanges, type Category } from '../../src/services/categories';
import { getCurrencies, type Currency } from '../../src/services/currencies';
import { processReceiptImage, type ReceiptData, type ProcessingProgress } from '../../src/services/receipt-processor';
import { useAuth } from '../../src/providers/AuthProvider';

type InputMethod = 'manual' | 'receipt';

interface ReceiptItem {
  name: string;
  amount: number;  // quantity
  price: number;   // unit price
}

export default function AddScreen() {
  const { session } = useAuth();
  const [inputMethod, setInputMethod] = useState<InputMethod>('receipt');
  const [amount, setAmount] = useState('');
  const [itemlist, setItemlist] = useState<ReceiptItem[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [merchant, setMerchant] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('');
  
  // Categories and loading states
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencyOptions, setCurrencyOptions] = useState<Currency[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [processingReceipt, setProcessingReceipt] = useState(false);
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string>('');
  const [pendingReceiptData, setPendingReceiptData] = useState<ReceiptData | null>(null);
  


  const quickAddItems = [
    { label: '$4.5 Coffee', amount: 4.5 },
    { label: '$12 Lunch', amount: 12 },
    { label: '$35 Gas', amount: 35 },
    { label: '$45 Groceries', amount: 45 },
  ];

  // Auto-calculate amount from itemlist
  useEffect(() => {
    if (itemlist.length > 0) {
      const total = itemlist.reduce((sum, item) => sum + (item.price * item.amount), 0);
      setAmount(total.toFixed(2));
    }
  }, [itemlist]);

  // Load categories on mount and subscribe to realtime changes
  useEffect(() => {
    loadCategories();
    loadCurrencies();
  }, []);

  // Subscribe to category changes for realtime updates
  useEffect(() => {
    if (!session) return;
    let unsub: undefined | (() => Promise<void>);
    (async () => {
      try {
        console.log('[Add] Subscribing to category changes...');
        unsub = await subscribeToCategoryChanges((change) => {
          console.log('[Add] Category change received:', {
            eventType: change.eventType,
            newCategory: change.new?.name,
            oldCategory: change.old?.name,
            currentlySelected: categoryId,
          });
          
          // If a category is deleted and it's currently selected, clear the selection
          if (change.eventType === 'DELETE' && change.old?.id === categoryId) {
            console.log('[Add] Currently selected category was deleted, clearing selection');
            setCategoryId('');
          }
          // Reload categories for any event (INSERT, UPDATE, DELETE)
          console.log('[Add] Reloading categories after', change.eventType);
          loadCategories();
        });
        console.log('[Add] Successfully subscribed to category changes');
      } catch (e) {
        console.warn('[Add] Category realtime subscription failed:', e);
      }
    })();
    return () => {
      if (unsub) {
        console.log('[Add] Unsubscribing from category changes');
        unsub().catch(() => {});
      }
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

  const loadCurrencies = async () => {
    try {
      const data = await getCurrencies();
      setCurrencyOptions(data);
      console.log('[Add] Loaded currencies:', data);
    } catch (error) {
      console.error('Failed to load currencies:', error);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    console.log('[DatePicker] Event:', event);
    console.log('[DatePicker] Selected Date:', date);
    
    try {
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
        
        if (event.type === 'dismissed') {
          console.log('[DatePicker] User cancelled');
          return;
        }
        
        if (date && !isNaN(date.getTime())) {
          // On Android: first select date, then show time picker
          setSelectedDate(date);
          console.log('[DatePicker] Date selected, now showing time picker');
          // Show time picker after a short delay
          setTimeout(() => setShowTimePicker(true), 100);
        }
      } else {
        // iOS: datetime mode works fine
        if (date && !isNaN(date.getTime())) {
          setSelectedDate(date);
        }
      }
    } catch (e) {
      console.error('[DatePicker] Error:', e);
      setShowDatePicker(false);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    console.log('[TimePicker] Event:', event);
    console.log('[TimePicker] Selected Time:', time);
    
    try {
      setShowTimePicker(false);
      
      if (event.type === 'dismissed') {
        console.log('[TimePicker] User cancelled');
        return;
      }
      
      if (time && !isNaN(time.getTime())) {
        // Combine the selected date with the selected time
        const newDateTime = new Date(selectedDate);
        newDateTime.setHours(time.getHours());
        newDateTime.setMinutes(time.getMinutes());
        newDateTime.setSeconds(0);
        newDateTime.setMilliseconds(0);
        
        console.log('[TimePicker] Final datetime:', newDateTime);
        setSelectedDate(newDateTime);
      }
    } catch (e) {
      console.error('[TimePicker] Error:', e);
      setShowTimePicker(false);
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

      // 调用独立的收据处理器（来自 receipt-processor.ts）
      const receiptData = await processReceiptImage(imageUri, (progress: ProcessingProgress) => {
        console.log('[Add Screen]', `${progress.message} (${progress.progress}%)`);
      });

      console.log('[Add Screen] Receipt data received:', receiptData);
      console.log('[Add Screen] isNewCategory:', receiptData.isNewCategory);
      console.log('[Add Screen] category:', receiptData.category);

      // 自动填充表单
      setMerchant(receiptData.merchant);
      setAmount(receiptData.amount.toString());
      
      // 设置货币（如果 AI 检测到）
      if (receiptData.currency) {
        setSelectedCurrency(receiptData.currency);
        console.log('[Add Screen] Currency detected:', receiptData.currency);
      }
      
      // 如果是字符串数组（旧格式），转换为 ReceiptItem 数组
      if (receiptData.items && Array.isArray(receiptData.items) && receiptData.items.length > 0) {
        const firstItem = receiptData.items[0];
        if (typeof firstItem === 'object' && firstItem !== null && 'name' in firstItem) {
          // 已经是 ReceiptItem 格式
          setItemlist(receiptData.items as unknown as ReceiptItem[]);
        } else if (typeof firstItem === 'string') {
          // 字符串数组，转换为 ReceiptItem 格式
          const convertedItems: ReceiptItem[] = (receiptData.items as unknown as string[]).map(name => ({
            name,
            amount: 1,
            price: 0,
          }));
          setItemlist(convertedItems);
        }
      }
      
      // 合并 description 到 notes
      if (receiptData.description) {
        setNotes(receiptData.description);
      }
      
      if (receiptData.date) {
        // Parse the datetime string (YYYY-MM-DDTHH:MM format) into Date object
        setSelectedDate(new Date(receiptData.date));
      }

      // 处理分类建议
      if (receiptData.category) {
        if (receiptData.isNewCategory) {
          // AI 建议了新分类，显示确认对话框（Web 兼容）
          console.log('[Add Screen] Showing new category confirmation modal');
          setSuggestedCategory(receiptData.category);
          setPendingReceiptData(receiptData);
          setShowNewCategoryModal(true);
        } else {
          // 使用现有分类
          const matchedCategory = categories.find(
            cat => cat.name.toLowerCase() === receiptData.category!.toLowerCase()
          );
          if (matchedCategory) {
            setCategoryId(matchedCategory.id);
          }
          if (Platform.OS === 'web') {
            alert('✅ Receipt information extracted! Please review the details and save.');
          } else {
            Alert.alert(
              '✅ Success', 
              'Receipt information extracted! Please review the details and save.',
              [{ text: 'OK' }]
            );
          }
        }
      } else {
        if (Platform.OS === 'web') {
          alert('✅ Receipt information extracted! Please select a category and save.');
        } else {
          Alert.alert(
            '✅ Success', 
            'Receipt information extracted! Please select a category and save.',
            [{ text: 'OK' }]
          );
        }
      }
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
    if (itemlist.length === 0 && (!amount || isNaN(parseFloat(amount)))) {
      console.warn('[Save Transaction] Blocked: no items or invalid amount');
      Alert.alert('Validation Error', 'Please enter an amount or add items');
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
      }

      // 构建商家名称
      let merchantName = merchant.trim();
      if (!merchantName && itemlist.length > 0) {
        // 如果没有商家，用第一个项目名称作为 fallback
        merchantName = itemlist[0].name || 'Transaction';
      }
      if (!merchantName) {
        merchantName = 'Transaction';
      }

      const transactionData = {
        amount: numericAmount,
        occurred_at: selectedDate.toISOString(),
        merchant: merchantName,
        category_id: categoryId || null,
        source,
        note: notes.trim(),
        items: itemlist.length > 0 ? itemlist : undefined, // 只有在有项目时才保存
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
            setItemlist([]);
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

  const handleCreateNewCategory = async () => {
    try {
      console.log('[Add Screen] Creating new category:', suggestedCategory);
      const newCategory = await addCategory(suggestedCategory);
      setCategoryId(newCategory.id);
      await loadCategories(); // 重新加载分类列表
      setShowNewCategoryModal(false);
      
      if (Platform.OS === 'web') {
        alert(`✅ Category "${suggestedCategory}" created and selected!\n\nReceipt information extracted! Please review the details and save.`);
      } else {
        Alert.alert(
          '✅ Success', 
          `Category "${suggestedCategory}" created and selected!\n\nReceipt information extracted! Please review the details and save.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Failed to create category:', error);
      setShowNewCategoryModal(false);
      
      if (Platform.OS === 'web') {
        alert(`⚠️ Category Creation Failed\n\n${error?.message || 'Failed to create the suggested category. Please create it manually in Settings.'}`);
      } else {
        Alert.alert(
          '⚠️ Category Creation Failed',
          error?.message || 'Failed to create the suggested category. Please create it manually in Settings.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleSkipNewCategory = () => {
    console.log('[Add Screen] User skipped creating new category');
    setShowNewCategoryModal(false);
    
    if (Platform.OS === 'web') {
      alert('✅ Receipt information extracted! Please select a category and save.');
    } else {
      Alert.alert(
        '✅ Success', 
        'Receipt information extracted! Please select a category and save.',
        [{ text: 'OK' }]
      );
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

          {/* Amount with Inline Currency Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Amount <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.amountInput}>
              <TouchableOpacity
                style={styles.currencySelector}
                onPress={() => setShowCurrencyModal(true)}
              >
                <Text style={styles.currencySymbol}>
                  {selectedCurrency ? currencyOptions.find(c => c.code === selectedCurrency)?.symbol : '$'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TextInput
                style={styles.amountField}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                editable={itemlist.length === 0} // Read-only if items present
              />
            </View>
            <Text style={styles.currencySubtext}>
              Amount is automatically calculated from item list. If you enter a value manually, it will override the auto-calculation (useful for discounts or custom totals).
            </Text>
          </View>

          {/* Date & Time (occurred_at) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date & Time <Text style={styles.required}>*</Text></Text>
            {Platform.OS === 'web' ? (
              <input
                type="datetime-local"
                value={(() => {
                  try {
                    return selectedDate.toISOString().slice(0, 16);
                  } catch (e) {
                    console.error('Date formatting error:', e);
                    return new Date().toISOString().slice(0, 16);
                  }
                })()}
                onChange={(e) => {
                  try {
                    const newDate = new Date(e.target.value);
                    if (!isNaN(newDate.getTime())) {
                      setSelectedDate(newDate);
                    }
                  } catch (e) {
                    console.error('Date parsing error:', e);
                  }
                }}
                max={new Date().toISOString().slice(0, 16)}
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
                      {(() => {
                        try {
                          return selectedDate.toLocaleString('en-US', { 
                            month: '2-digit', 
                            day: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          });
                        } catch (e) {
                          console.error('Date formatting error:', e);
                          return 'Invalid date';
                        }
                      })()}
                    </Text>
                  </View>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate instanceof Date && !isNaN(selectedDate.getTime()) ? selectedDate : new Date()}
                    mode={Platform.OS === 'android' ? 'date' : 'datetime'}
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}
                {showTimePicker && Platform.OS === 'android' && (
                  <DateTimePicker
                    value={selectedDate instanceof Date && !isNaN(selectedDate.getTime()) ? selectedDate : new Date()}
                    mode="time"
                    display="default"
                    onChange={handleTimeChange}
                  />
                )}
              </>
            )}
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

          {/* Item List */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Item List</Text>
            {itemlist.length > 0 && (
              <View style={styles.itemListHeader}>
                <Text style={[styles.itemHeaderText, { flex: 1 }]}>Item</Text>
                <Text style={[styles.itemHeaderText, { width: 60 }]}>Qty</Text>
                <Text style={[styles.itemHeaderText, { width: 70 }]}>Price</Text>
                <Text style={[styles.itemHeaderText, { width: 50 }]}>Total</Text>
              </View>
            )}
            {itemlist.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <TextInput
                  style={[styles.itemInput, { flex: 1 }]}
                  placeholder="Item name"
                  value={item.name}
                  onChangeText={(text) => {
                    const newList = [...itemlist];
                    newList[index].name = text;
                    setItemlist(newList);
                  }}
                />
                <TextInput
                  style={styles.itemInputSmall}
                  placeholder="Qty"
                  keyboardType="decimal-pad"
                  value={item.amount.toString()}
                  onChangeText={(text) => {
                    const newList = [...itemlist];
                    newList[index].amount = parseFloat(text) || 1;
                    setItemlist(newList);
                  }}
                />
                <TextInput
                  style={styles.itemInputSmall}
                  placeholder="Price"
                  keyboardType="decimal-pad"
                  value={item.price.toFixed(2)}
                  onChangeText={(text) => {
                    const newList = [...itemlist];
                    newList[index].price = parseFloat(text) || 0;
                    setItemlist(newList);
                  }}
                />
                <View style={[styles.itemInputSmall, styles.itemTotal]}>
                  <Text style={styles.itemTotalText}>
                    ${(item.amount * item.price).toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.itemDeleteButton}
                  onPress={() => setItemlist(itemlist.filter((_, i) => i !== index))}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addItemButton}
              onPress={() => setItemlist([...itemlist, { name: '', amount: 1, price: 0 }])}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.addItemText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {/* Merchant */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Merchant (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter merchant name"
              value={merchant}
              onChangeText={setMerchant}
            />
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

      {/* Currency Selection Modal */}
      <Modal
        visible={showCurrencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalList}>
              {currencyOptions.map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  style={[
                    styles.modalItem,
                    selectedCurrency === currency.code && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setSelectedCurrency(currency.code);
                    setShowCurrencyModal(false);
                  }}
                >
                  <View>
                    <Text style={[
                      styles.modalItemText,
                      selectedCurrency === currency.code && styles.modalItemTextSelected
                    ]}>
                      {currency.symbol} {currency.code}
                    </Text>
                    <Text style={styles.currencySubtext}>{currency.name}</Text>
                  </View>
                  {selectedCurrency === currency.code && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* New Category Confirmation Modal */}
      <Modal
        visible={showNewCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmModalIcon}>
              <Ionicons name="sparkles" size={48} color={Colors.primary} />
            </View>
            
            <Text style={styles.confirmModalTitle}>🤖 AI Suggestion</Text>
            
            <Text style={styles.confirmModalMessage}>
              AI suggests creating a new category:{'\n'}
              <Text style={styles.confirmModalCategory}>"{suggestedCategory}"</Text>
              {'\n\n'}Would you like to create this category?
            </Text>
            
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.confirmModalButtonSecondary]}
                onPress={handleSkipNewCategory}
              >
                <Text style={styles.confirmModalButtonTextSecondary}>No, Skip</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.confirmModalButtonPrimary]}
                onPress={handleCreateNewCategory}
              >
                <Text style={styles.confirmModalButtonTextPrimary}>Yes, Create</Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginRight: 4,
    borderRadius: 6,
    gap: 4,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  amountField: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingHorizontal: 4,
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
  itemListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  itemHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  itemInput: {
    backgroundColor: Colors.gray100,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  itemInputSmall: {
    backgroundColor: Colors.gray100,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  itemTotal: {
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
  },
  itemTotalText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  itemDeleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    marginTop: 8,
    paddingTop: 12,
  },
  addItemText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  confirmModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 20,
    alignItems: 'center',
    maxWidth: 400,
    alignSelf: 'center',
  },
  confirmModalIcon: {
    marginBottom: 20,
  },
  confirmModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmModalMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  confirmModalCategory: {
    fontWeight: '700',
    color: Colors.primary,
    fontSize: 18,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmModalButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  confirmModalButtonSecondary: {
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  confirmModalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  confirmModalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  currencySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    marginLeft: 4,
  },
});
