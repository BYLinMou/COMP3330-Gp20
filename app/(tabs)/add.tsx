import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

type InputMethod = 'manual' | 'receipt' | 'voice';

export default function AddScreen() {
  const [inputMethod, setInputMethod] = useState<InputMethod>('receipt');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState('09/30/2025');
  const [notes, setNotes] = useState('');

  const quickAddItems = [
    { label: '$4.5 Coffee', amount: 4.5 },
    { label: '$12 Lunch', amount: 12 },
    { label: '$35 Gas', amount: 35 },
    { label: '$45 Groceries', amount: 45 },
  ];

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
        {/* Add Transaction Title */}
        <Text style={styles.pageTitle}>Add Transaction</Text>

        {/* Input Method Selector */}
        <View style={styles.methodSelector}>
          <TouchableOpacity
            style={[
              styles.methodButton,
              inputMethod === 'manual' && styles.methodButtonInactive,
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
              styles.methodButtonActive,
              inputMethod === 'receipt' && styles.methodButtonSelected,
            ]}
            onPress={() => setInputMethod('receipt')}
          >
            <Ionicons name="camera-outline" size={32} color={Colors.white} />
            <Text style={[styles.methodLabel, styles.methodLabelActive]}>
              Receipt
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodButton,
              inputMethod === 'voice' && styles.methodButtonInactive,
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
            <TouchableOpacity style={styles.uploadButton}>
              <Text style={styles.uploadButtonText}>Choose File</Text>
            </TouchableOpacity>
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
            <TouchableOpacity style={styles.selectInput}>
              <Text style={styles.selectPlaceholder}>Select category</Text>
              <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Merchant */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Merchant</Text>
            <TouchableOpacity style={styles.selectInput}>
              <Text style={styles.selectPlaceholder}>Select merchant</Text>
              <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <View style={styles.dateInput}>
              <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.dateText}>{date}</Text>
            </View>
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
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Transaction</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Add */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.quickAddGrid}>
            {quickAddItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.quickAddButton}>
                <Text style={styles.quickAddText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
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
  methodButtonSelected: {
    backgroundColor: Colors.textPrimary,
  },
  methodButtonInactive: {
    backgroundColor: Colors.white,
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
  uploadButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.textPrimary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
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
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dateText: {
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
});
