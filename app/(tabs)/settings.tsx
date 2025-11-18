import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Switch, Alert, ActivityIndicator, Modal, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/theme';
import { RefreshableScrollView } from '../../components/refreshable-scroll-view';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/providers/AuthProvider';
import { 
  saveOpenAIConfig, 
  getOpenAIConfig, 
  fetchOpenAIModels, 
  type OpenAIConfig,
  type OpenAIModel 
} from '../../src/services/openai-config';
import FloatingChatButton from '../../components/floating-chat-button';
import {
  getCategories,
  addCategory,
  deleteCategory,
  subscribeToCategoryChanges,
  type Category,
} from '../../src/services/categories';
import { getCurrencies, type Currency } from '../../src/services/currencies';

export default function SettingsScreen() {
  const { session } = useAuth();
  
  console.log('SettingsScreen mounted, session:', !!session);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('USD ($)');
  const [language, setLanguage] = useState('English');
  const [monthlyBudget, setMonthlyBudget] = useState('2000');
  const [refreshing, setRefreshing] = useState(false);

  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const [darkMode, setDarkMode] = useState(false);
  const [biometricLogin, setBiometricLogin] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  // OpenAI Configuration States
  const [openaiUrl, setOpenaiUrl] = useState('https://api.openai.com/v1');
  const [openaiKey, setOpenaiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [availableModels, setAvailableModels] = useState<OpenAIModel[]>([]);
  const [receiptModel, setReceiptModel] = useState('');
  const [chatModel, setChatModel] = useState('');
  const [fallbackModel, setFallbackModel] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [showModelSelection, setShowModelSelection] = useState(false);
  const [showReceiptModelModal, setShowReceiptModelModal] = useState(false);
  const [showChatModelModal, setShowChatModelModal] = useState(false);
  const [showFallbackModelModal, setShowFallbackModelModal] = useState(false);
  const [receiptModelSearch, setReceiptModelSearch] = useState('');
  const [chatModelSearch, setChatModelSearch] = useState('');
  const [fallbackModelSearch, setFallbackModelSearch] = useState('');
  const [receiptSearchFocused, setReceiptSearchFocused] = useState(false);
  const [chatSearchFocused, setChatSearchFocused] = useState(false);
  const [fallbackSearchFocused, setFallbackSearchFocused] = useState(false);
  const [fetchedModelsCount, setFetchedModelsCount] = useState(0);

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Currency state
  const [currencyOptions, setCurrencyOptions] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  // Collapsible section state - tracks which section is expanded, all collapsed by default
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Handler to toggle section expansion
  const toggleSection = (sectionName: string) => {
    if (expandedSection === sectionName) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionName);
    }
  };

  // Handler to toggle model selection with alert if no models available
  const toggleModelSelection = () => {
    if (showModelSelection) {
      setShowModelSelection(false);
    } else {
      // Check if models are empty and no previously selected models
      if (availableModels.length === 0 && !receiptModel && !chatModel && !fallbackModel) {
        console.log('[Settings] No models available, prompting user to fetch');
        setShowModelSelection(true);
        /*
        Alert.alert(
          'No Models Available',
          'You need to fetch the available models first. Would you like to fetch them now?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Fetch Models',
              onPress: async () => {
                if (!openaiUrl.trim() || !openaiKey.trim()) {
                  Alert.alert('Validation Error', 'Please enter both API URL and API Key first');
                  return;
                }
                try {
                  setLoadingModels(true);
                  const models = await fetchOpenAIModels(openaiUrl, openaiKey);
                  setAvailableModels(models);
                  setShowModelSelection(true);
                  console.log('[Settings] Models fetched successfully:', models.length);
                  Alert.alert('Success', `Found ${models.length} available models`);
                } catch (error: any) {
                  Alert.alert('Connection Failed', error.message || 'Failed to fetch models');
                  setAvailableModels([]);
                } finally {
                  setLoadingModels(false);
                }
              },
            },
          ]
        );*/
      } else {
        setShowModelSelection(true);
      }
    }
  };

  // Load OpenAI config on mount
  useEffect(() => {
    loadOpenAIConfig();
    loadCurrencies();
  }, []);

  // Focus effect: reload categories when navigating back to this screen
  useFocusEffect(
    React.useCallback(() => {
      console.log('[Settings] Screen focused, reloading categories');
      if (session) {
        loadCategories();
      }
    }, [session])
  );

  // Load categories and subscribe to realtime
  useEffect(() => {
    if (!session) return;
    
    let mounted = true;
    let unsub: undefined | (() => Promise<void>);

    (async () => {
      try {
        // Initial load
        await loadCategories();
        
        // Subscribe to realtime changes
        console.log('[Settings] Subscribing to category changes...');
        unsub = await subscribeToCategoryChanges((change) => {
          console.log('[Settings] Category change received:', {
            eventType: change.eventType,
            newCategory: change.new?.name,
            oldCategory: change.old?.name,
          });
          // Reload categories for any event (INSERT, UPDATE, DELETE)
          if (mounted) {
            console.log('[Settings] Reloading categories after', change.eventType);
            loadCategories();
          }
        });
        console.log('[Settings] Successfully subscribed to category changes');
      } catch (e) {
        console.warn('[Settings] Category realtime subscription failed:', e);
      }
    })();

    return () => {
      mounted = false;
      if (unsub) {
        console.log('[Settings] Unsubscribing from category changes');
        unsub().catch(() => {});
      }
    };
  }, [session]);

  useEffect(() => {
    // Load user's actual login email from session
    if (session?.user?.email) {
      setEmail(session.user.email);
      // Also set full name from user metadata if available
      const displayName = session.user.user_metadata?.full_name || '';
      if (displayName) {
        setFullName(displayName);
      }
    }
  }, [session]);

  const loadOpenAIConfig = async () => {
    try {
      const config = await getOpenAIConfig();
      if (config) {
        setOpenaiUrl(config.apiUrl);
        setOpenaiKey(config.apiKey);
        setReceiptModel(config.receiptModel);
        setChatModel(config.chatModel);
        setFallbackModel(config.fallbackModel);
      }
    } catch (error) {
      console.error('Failed to load OpenAI config:', error);
    }
  };

  const loadCurrencies = async () => {
    try {
      const data = await getCurrencies();
      setCurrencyOptions(data);
      console.log('[Settings] Loaded currencies:', data);
    } catch (error) {
      console.error('Failed to load currencies:', error);
    }
  };

  const handleFetchModels = async () => {
    if (!openaiUrl.trim() || !openaiKey.trim()) {
      Alert.alert('Validation Error', 'Please enter both API URL and API Key');
      return;
    }

    try {
      setLoadingModels(true);
      const models = await fetchOpenAIModels(openaiUrl, openaiKey);
      
      // Display all models without filtering
      setAvailableModels(models);
      setFetchedModelsCount(models.length);
    } catch (error: any) {
      Alert.alert('Connection Failed', error.message || 'Failed to fetch models');
      setAvailableModels([]);
      setFetchedModelsCount(0);
    } finally {
      setLoadingModels(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      console.log('Loading categories...');
      const data = await getCategories();
      console.log('Categories loaded:', data.length, 'items');
      setCategories(data);
    } catch (e) {
      console.error('Failed to load categories:', e);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      Alert.alert('Validation Error', 'Please enter a category name');
      return;
    }
    try {
      await addCategory(name);
      setNewCategoryName('');
      Keyboard.dismiss();
      // realtime will refresh; fallback refresh now
      await loadCategories();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    console.log('Delete button clicked for category:', name, 'id:', id);
    console.log('Session status:', !!session);
    
    if (!session) {
      console.log('No session, showing error');
      Alert.alert('Error', 'You must be logged in to delete categories');
      return;
    }
    
    console.log('Showing confirmation dialog');

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Calling deleteCategory with id:', id);
              const result = await deleteCategory(id);
              console.log('deleteCategory returned:', result);
              console.log('Reloading categories...');
              // Immediately update the UI without waiting for realtime
              await loadCategories();
              console.log('Categories reloaded successfully');
            } catch (e: any) {
              console.error('Error during delete:', e);
              Alert.alert('Error', e?.message || 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const handleSaveOpenAIConfig = async () => {
    console.log('[Settings] Save button pressed');
    console.log('[Settings] Current values:', {
      openaiUrl,
      hasApiKey: !!openaiKey,
      receiptModel,
      chatModel,
      fallbackModel,
    });

    if (!openaiUrl.trim() || !openaiKey.trim()) {
      console.log('[Settings] Validation failed: Missing URL or Key');
      Alert.alert('Validation Error', 'Please enter both API URL and API Key');
      return;
    }

    if (!receiptModel) {
      console.log('[Settings] Validation failed: Missing receipt model');
      Alert.alert('Validation Error', 'Please select a receipt model');
      return;
    }

    if (!chatModel) {
      console.log('[Settings] Validation failed: Missing chat model');
      Alert.alert('Validation Error', 'Please select a chat model');
      return;
    }

    try {
      console.log('[Settings] Starting to save config...');
      const config: OpenAIConfig = {
        apiUrl: openaiUrl,
        apiKey: openaiKey,
        receiptModel: receiptModel,
        chatModel: chatModel,
        fallbackModel: fallbackModel,
      };

      console.log('[Settings] Config object created:', {
        ...config,
        apiKey: '***HIDDEN***'
      });

      console.log('[Settings] Calling saveOpenAIConfig...');
      await saveOpenAIConfig(config);
      console.log('[Settings] saveOpenAIConfig completed successfully');
      Alert.alert('Success', 'OpenAI configuration saved successfully!');
    } catch (error: any) {
      console.error('[Settings] Error saving config:', error);
      Alert.alert('Error', error.message || 'Failed to save configuration');
    }
  };

  function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('Info', 'Running in demo mode. To enable authentication, configure your Supabase credentials.');
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <RefreshableScrollView 
        style={styles.content} 
        keyboardShouldPersistTaps="handled"
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          try {
            // Reload settings data
            const config = await getOpenAIConfig();
            if (config) {
              setOpenaiUrl(config.apiUrl);
              setReceiptModel(config.receiptModel);
              setChatModel(config.chatModel);
              setFallbackModel(config.fallbackModel);
            }
            // Reload categories
            await loadCategories();
            // Reload currencies
            await loadCurrencies();
          } catch (error) {
            console.error('Error refreshing settings:', error);
          } finally {
            setRefreshing(false);
          }
        }}
      >
        {/* Profile Settings - Collapsible */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleSection('profile')}
          >
            <View style={styles.collapsibleHeaderLeft}>
              <Ionicons
                name={expandedSection === 'profile' ? 'chevron-down' : 'chevron-forward'}
                size={20}
                color={Colors.primary}
              />
              <Ionicons name="person-outline" size={24} color={Colors.textPrimary} />
              <Text style={styles.collapsibleHeaderTitle}>Profile Settings</Text>
            </View>
          </TouchableOpacity>

          {expandedSection === 'profile' && (
            <View style={styles.collapsibleContent}>
              <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>User Name</Text>
            <TextInput
              style={styles.textInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
            />
            <Text style={styles.helperText}>Your login email cannot be changed here. Contact support to update your email.</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Primary Currency</Text>
              <TouchableOpacity 
                style={styles.selectInput}
                onPress={() => setShowCurrencyModal(true)}
              >
                <Text style={selectedCurrency ? styles.selectText : styles.selectPlaceholder}>
                  {selectedCurrency 
                    ? `${currencyOptions.find(c => c.code === selectedCurrency)?.symbol} ${selectedCurrency}`
                    : 'Select currency'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Language</Text>
              <TouchableOpacity style={styles.selectInput}>
                <Text style={styles.selectText}>{language}</Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Monthly Budget</Text>
            <View style={styles.amountInput}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountField}
                value={monthlyBudget}
                onChangeText={setMonthlyBudget}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Profile Changes</Text>
          </TouchableOpacity>
            </View>
          )}
        </View>

        {/* OpenAI Configuration - Collapsible */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleSection('openai')}
          >
            <View style={styles.collapsibleHeaderLeft}>
              <Ionicons
                name={expandedSection === 'openai' ? 'chevron-down' : 'chevron-forward'}
                size={20}
                color={Colors.primary}
              />
              <Ionicons name="sparkles-outline" size={24} color={Colors.textPrimary} />
              <Text style={styles.collapsibleHeaderTitle}>OpenAI Configuration</Text>
            </View>
          </TouchableOpacity>

          {expandedSection === 'openai' && (
            <View style={styles.collapsibleContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>API Base URL</Text>
                <TextInput
                  style={styles.textInput}
                  value={openaiUrl}
                  onChangeText={setOpenaiUrl}
                  placeholder="https://api.openai.com/v1"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>API Key</Text>
                <View style={styles.keyInputContainer}>
                  <TextInput
                    style={styles.keyInput}
                    value={openaiKey}
                    onChangeText={setOpenaiKey}
                    placeholder="sk-..."
                    secureTextEntry={!showApiKey}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.keyVisibilityButton}
                    onPress={() => setShowApiKey(!showApiKey)}
                  >
                    <Ionicons 
                      name={showApiKey ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color={Colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

                {/* Model Selection Collapsible Section */}
              <View style={styles.collapsibleSection}>
                <TouchableOpacity 
                  style={styles.modelSelectionHeader}
                  onPress={toggleModelSelection}
                >
                  <View style={styles.collapsibleHeaderLeft}>
                    <Ionicons 
                      name={showModelSelection ? "chevron-down" : "chevron-forward"} 
                      size={20} 
                      color={Colors.primary} 
                    />
                    <Text style={styles.collapsibleHeaderTitle}>Primary & Fallback Models</Text>
                  </View>
                  {(receiptModel || chatModel || fallbackModel) && (
                    <View style={styles.modelIndicator}>
                      <Text style={styles.modelIndicatorText}>
                        {receiptModel ? '1' : ''}{chatModel ? '+1' : ''}{fallbackModel ? '+1' : ''}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>                {showModelSelection && (
                  <View style={{ marginTop: 6 }}>
                    {/* Fetch Models Button */}
                    <View style={{ alignItems: 'center' }}>
                      <TouchableOpacity 
                        style={[styles.signOutPill, { backgroundColor: Colors.primary }, loadingModels && styles.modelsPillDisabled]}
                        onPress={handleFetchModels}
                        disabled={loadingModels}
                      >
                        <Ionicons name="refresh-outline" size={16} color={Colors.white} />
                        <Text style={styles.signOutPillText}>Fetch Available Models</Text>
                        {loadingModels && <ActivityIndicator color={Colors.white} style={{ marginLeft: 8 }} />}
                      </TouchableOpacity>
                      {fetchedModelsCount > 0 && (
                        <View style={[styles.versionPill, { marginTop: 12 }]}>
                          <Text style={styles.versionPillText}>Found {fetchedModelsCount} models</Text>
                        </View>
                      )}
                    </View>

                    {/* Model Selection UI - Always show if we have models or previously selected models */}
                    {(availableModels.length > 0 || receiptModel || chatModel || fallbackModel) && (
                      <>
                        <View style={[styles.inputGroup, {paddingVertical: 8, paddingHorizontal: 10}]}> 
                          <Text style={styles.inputLabel}>
                            Receipt Model <Text style={styles.required}>*</Text>
                          </Text>
                          <TouchableOpacity 
                            style={styles.selectInput}
                            onPress={() => availableModels.length > 0 && setShowReceiptModelModal(true)}
                            disabled={availableModels.length === 0}
                          >
                            <Text style={receiptModel ? styles.selectText : styles.selectPlaceholder}>
                              {receiptModel || (availableModels.length === 0 ? 'Fetch models first' : 'Select receipt model')}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                          </TouchableOpacity>
                          <Text style={styles.helperText}>Primary model for receipt processing</Text>
                        </View>

                        <View style={[styles.inputGroup, {paddingVertical: 8, paddingHorizontal: 10}]}> 
                          <Text style={styles.inputLabel}>
                            Chat Model <Text style={styles.required}>*</Text>
                          </Text>
                          <TouchableOpacity 
                            style={styles.selectInput}
                            onPress={() => availableModels.length > 0 && setShowChatModelModal(true)}
                            disabled={availableModels.length === 0}
                          >
                            <Text style={chatModel ? styles.selectText : styles.selectPlaceholder}>
                              {chatModel || (availableModels.length === 0 ? 'Fetch models first' : 'Select chat model')}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                          </TouchableOpacity>
                          <Text style={styles.helperText}>Primary model for chat & AI features</Text>
                        </View>

                        <View style={[styles.inputGroup, {paddingVertical: 8, paddingHorizontal: 8}]}> 
                          <Text style={styles.inputLabel}>Fallback Model</Text>
                          <TouchableOpacity 
                            style={styles.selectInput}
                            onPress={() => availableModels.length > 0 && setShowFallbackModelModal(true)}
                            disabled={availableModels.length === 0}
                          >
                            <Text style={fallbackModel ? styles.selectText : styles.selectPlaceholder}>
                              {fallbackModel || (availableModels.length === 0 ? 'Fetch models first' : 'Select fallback model')}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                          </TouchableOpacity>
                          <Text style={styles.helperText}>Optional backup model for both features</Text>
                        </View>
                      </>
                    )}

                    {availableModels.length === 0 && !receiptModel && !chatModel && !fallbackModel && !loadingModels && (
                      <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
                        <Text style={styles.infoText}>
                          Enter your OpenAI credentials and fetch models to configure AI features.
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Save OpenAI Configuration Button - Outside collapsible section */}
              <TouchableOpacity 
                style={[styles.saveButton, styles.saveOpenaiButton]}
                onPress={handleSaveOpenAIConfig}
              >
                <Text style={styles.saveButtonText}>Save OpenAI Configuration</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Custom Categories - Collapsible */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleSection('categories')}
          >
            <View style={styles.collapsibleHeaderLeft}>
              <Ionicons
                name={expandedSection === 'categories' ? 'chevron-down' : 'chevron-forward'}
                size={20}
                color={Colors.primary}
              />
              <Ionicons name="pricetag-outline" size={24} color={Colors.textPrimary} />
              <Text style={styles.collapsibleHeaderTitle}>Custom Categories</Text>
            </View>
          </TouchableOpacity>

          {expandedSection === 'categories' && (
            <View style={styles.collapsibleContent}>
              <Text style={styles.sectionDescription}>Personalize your expense categories</Text>

              <View style={styles.addCategoryContainer}>
                <TextInput
                  style={styles.addCategoryInput}
                  placeholder="Add new category..."
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddCategory} disabled={!session}>
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {loadingCategories ? (
                <ActivityIndicator />
              ) : categories.length === 0 ? (
                <Text style={styles.helperText}>No categories yet. Add your first one!</Text>
              ) : (
                <View style={styles.categoryTags}>
                  {categories.map((category) => (
                    <View key={category.id} style={styles.categoryTag}>
                      <Text style={styles.categoryTagText}>{category.name}</Text>
                      <TouchableOpacity 
                        onPress={() => {
                          console.log('TouchableOpacity pressed for:', category.name);
                          handleDeleteCategory(category.id, category.name);
                        }}
                        disabled={!session}
                        style={styles.deleteButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.6}
                      >
                        <Ionicons 
                          name="close-circle" 
                          size={18} 
                          color={!session ? Colors.textSecondary : '#FF3B30'} 
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Data & Privacy - Collapsible */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleSection('privacy')}
          >
            <View style={styles.collapsibleHeaderLeft}>
              <Ionicons
                name={expandedSection === 'privacy' ? 'chevron-down' : 'chevron-forward'}
                size={20}
                color={Colors.primary}
              />
              <Ionicons name="shield-checkmark-outline" size={24} color={Colors.textPrimary} />
              <Text style={styles.collapsibleHeaderTitle}>Data & Privacy</Text>
            </View>
          </TouchableOpacity>

          {expandedSection === 'privacy' && (
            <View style={styles.collapsibleContent}>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="download-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.menuItemText}>Export My Data</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.menuItemText}>Privacy Settings</Text>
              </TouchableOpacity>

              <View style={styles.privacyInfo}>
                <Text style={styles.privacyText}>
                  Your data is encrypted and securely stored. We never share your personal financial information with third parties.
                </Text>
                {/* <Text style={styles.backupText}>Last backup: Today at 3:24 PM</Text> */}
              </View>
            </View>
          )}
        </View>

        {/* Notifications - Collapsible */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleSection('notifications')}
          >
            <View style={styles.collapsibleHeaderLeft}>
              <Ionicons
                name={expandedSection === 'notifications' ? 'chevron-down' : 'chevron-forward'}
                size={20}
                color={Colors.primary}
              />
              <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
              <Text style={styles.collapsibleHeaderTitle}>Notifications</Text>
            </View>
          </TouchableOpacity>

          {expandedSection === 'notifications' && (
            <View style={styles.collapsibleContent}>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingTitle}>Budget Alerts</Text>
                  <Text style={styles.settingDescription}>Get notified when approaching budget limits</Text>
                </View>
                <Switch
                  value={budgetAlerts}
                  onValueChange={setBudgetAlerts}
                  trackColor={{ false: Colors.gray300, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingTitle}>Daily Reminders</Text>
                  <Text style={styles.settingDescription}>Remind me to log expenses daily</Text>
                </View>
                <Switch
                  value={dailyReminders}
                  onValueChange={setDailyReminders}
                  trackColor={{ false: Colors.gray300, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingTitle}>Weekly Reports</Text>
                  <Text style={styles.settingDescription}>Receive weekly spending summaries</Text>
                </View>
                <Switch
                  value={weeklyReports}
                  onValueChange={setWeeklyReports}
                  trackColor={{ false: Colors.gray300, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingTitle}>Marketing Emails</Text>
                  <Text style={styles.settingDescription}>Tips and product updates</Text>
                </View>
                <Switch
                  value={marketingEmails}
                  onValueChange={setMarketingEmails}
                  trackColor={{ false: Colors.gray300, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
            </View>
          )}
        </View>

        {/* App Preferences - Collapsible */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleSection('preferences')}
          >
            <View style={styles.collapsibleHeaderLeft}>
              <Ionicons
                name={expandedSection === 'preferences' ? 'chevron-down' : 'chevron-forward'}
                size={20}
                color={Colors.primary}
              />
              <Ionicons name="settings-outline" size={24} color={Colors.textPrimary} />
              <Text style={styles.collapsibleHeaderTitle}>App Preferences</Text>
            </View>
          </TouchableOpacity>

          {expandedSection === 'preferences' && (
            <View style={styles.collapsibleContent}>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingTitle}>Dark Mode</Text>
                  <Text style={styles.settingDescription}>Switch to dark theme</Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: Colors.gray300, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingTitle}>Biometric Login</Text>
                  <Text style={styles.settingDescription}>Use fingerprint or face ID</Text>
                </View>
                <Switch
                  value={biometricLogin}
                  onValueChange={setBiometricLogin}
                  trackColor={{ false: Colors.gray300, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingTitle}>Auto-Sync</Text>
                  <Text style={styles.settingDescription}>Sync across all devices</Text>
                </View>
                <Switch
                  value={autoSync}
                  onValueChange={setAutoSync}
                  trackColor={{ false: Colors.gray300, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
            </View>
          )}
        </View>

        {/* Help & Support - Collapsible */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleSection('support')}
          >
            <View style={styles.collapsibleHeaderLeft}>
              <Ionicons
                name={expandedSection === 'support' ? 'chevron-down' : 'chevron-forward'}
                size={20}
                color={Colors.primary}
              />
              <Ionicons name="help-circle-outline" size={24} color={Colors.textPrimary} />
              <Text style={styles.collapsibleHeaderTitle}>Help & Support</Text>
            </View>
          </TouchableOpacity>

          {expandedSection === 'support' && (
            <View style={styles.collapsibleContent}>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuItemText}>FAQ & Help Center</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuItemText}>Contact Support</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuItemText}>App Tutorial</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuItemText}>Terms of Service</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]}>
                <Text style={styles.menuItemText}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sign Out - Small Oval Button */}
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <TouchableOpacity style={styles.signOutPill} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={16} color={Colors.white} />
            <Text style={styles.signOutPillText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Version - Small Gray Oval */}
        <View style={{ alignItems: 'center', marginTop: 12 }}>
          <View style={styles.versionPill}>
            <Text style={styles.versionPillText}>
              AuraSpend v{Constants.expoConfig?.extra?.appVersion || Constants.expoConfig?.version || '0.0.0'}
            </Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </RefreshableScrollView>

      {/* Receipt Model Selection Modal */}
      <Modal
        visible={showReceiptModelModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          // Only close if search input is not focused
          if (!receiptSearchFocused) {
            setShowReceiptModelModal(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modelSelectionModalHeader}>
              <Text style={styles.modalTitle}>Select Receipt Model</Text>
              <TouchableOpacity onPress={() => setShowReceiptModelModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {/* Search Input */}
            <View style={styles.modalSearchContainer}>
              <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search models..."
                value={receiptModelSearch}
                onChangeText={setReceiptModelSearch}
                onFocus={() => setReceiptSearchFocused(true)}
                onBlur={() => setReceiptSearchFocused(false)}
                placeholderTextColor={Colors.textSecondary}
              />
              {receiptModelSearch !== '' && (
                <TouchableOpacity onPress={() => setReceiptModelSearch('')}>
                  <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            
            <ScrollView style={styles.modalList}>
              {availableModels
                .filter(model => 
                  model.id.toLowerCase().includes(receiptModelSearch.toLowerCase()) ||
                  model.owned_by.toLowerCase().includes(receiptModelSearch.toLowerCase())
                )
                .map((model) => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.modalItem,
                    receiptModel === model.id && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setReceiptModel(model.id);
                    setShowReceiptModelModal(false);
                    setReceiptModelSearch('');
                  }}
                >
                  <View style={styles.modalItemLeft}>
                    <Text style={[
                      styles.modalItemText,
                      receiptModel === model.id && styles.modalItemTextSelected
                    ]}>
                      {model.id}
                    </Text>
                    <Text style={styles.modalItemSubtext}>
                      {model.owned_by}
                    </Text>
                  </View>
                  {receiptModel === model.id && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              {availableModels.filter(model => 
                model.id.toLowerCase().includes(receiptModelSearch.toLowerCase()) ||
                model.owned_by.toLowerCase().includes(receiptModelSearch.toLowerCase())
              ).length === 0 && (
                <View style={styles.emptySearchContainer}>
                  <Ionicons name="search-outline" size={32} color={Colors.textSecondary} />
                  <Text style={styles.emptySearchText}>No models found</Text>
                  <Text style={styles.emptySearchSubtext}>Try searching with different keywords</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Chat Model Selection Modal */}
      <Modal
        visible={showChatModelModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          // Only close if search input is not focused
          if (!chatSearchFocused) {
            setShowChatModelModal(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modelSelectionModalHeader}>
              <Text style={styles.modalTitle}>Select Chat Model</Text>
              <TouchableOpacity onPress={() => setShowChatModelModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {/* Search Input */}
            <View style={styles.modalSearchContainer}>
              <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search models..."
                value={chatModelSearch}
                onChangeText={setChatModelSearch}
                onFocus={() => setChatSearchFocused(true)}
                onBlur={() => setChatSearchFocused(false)}
                placeholderTextColor={Colors.textSecondary}
              />
              {chatModelSearch !== '' && (
                <TouchableOpacity onPress={() => setChatModelSearch('')}>
                  <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            
            <ScrollView style={styles.modalList}>
              {availableModels
                .filter(model => 
                  model.id.toLowerCase().includes(chatModelSearch.toLowerCase()) ||
                  model.owned_by.toLowerCase().includes(chatModelSearch.toLowerCase())
                )
                .map((model) => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.modalItem,
                    chatModel === model.id && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setChatModel(model.id);
                    setShowChatModelModal(false);
                    setChatModelSearch('');
                  }}
                >
                  <View style={styles.modalItemLeft}>
                    <Text style={[
                      styles.modalItemText,
                      chatModel === model.id && styles.modalItemTextSelected
                    ]}>
                      {model.id}
                    </Text>
                    <Text style={styles.modalItemSubtext}>
                      {model.owned_by}
                    </Text>
                  </View>
                  {chatModel === model.id && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              {availableModels.filter(model => 
                model.id.toLowerCase().includes(chatModelSearch.toLowerCase()) ||
                model.owned_by.toLowerCase().includes(chatModelSearch.toLowerCase())
              ).length === 0 && (
                <View style={styles.emptySearchContainer}>
                  <Ionicons name="search-outline" size={32} color={Colors.textSecondary} />
                  <Text style={styles.emptySearchText}>No models found</Text>
                  <Text style={styles.emptySearchSubtext}>Try searching with different keywords</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Fallback Model Selection Modal */}
      <Modal
        visible={showFallbackModelModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          // Only close if search input is not focused
          if (!fallbackSearchFocused) {
            setShowFallbackModelModal(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modelSelectionModalHeader}>
              <Text style={styles.modalTitle}>Select Fallback Model</Text>
              <TouchableOpacity onPress={() => setShowFallbackModelModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {/* Search Input */}
            <View style={styles.modalSearchContainer}>
              <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search models..."
                value={fallbackModelSearch}
                onChangeText={setFallbackModelSearch}
                onFocus={() => setFallbackSearchFocused(true)}
                onBlur={() => setFallbackSearchFocused(false)}
                placeholderTextColor={Colors.textSecondary}
              />
              {fallbackModelSearch !== '' && (
                <TouchableOpacity onPress={() => setFallbackModelSearch('')}>
                  <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            
            <ScrollView style={styles.modalList}>
              {(fallbackModelSearch === '' || !fallbackModelSearch) && (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    !fallbackModel && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setFallbackModel('');
                    setShowFallbackModelModal(false);
                    setFallbackModelSearch('');
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    !fallbackModel && styles.modalItemTextSelected
                  ]}>
                    None
                  </Text>
                  {!fallbackModel && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              
              {availableModels
                .filter(model => 
                  model.id !== receiptModel && model.id !== chatModel &&
                  (model.id.toLowerCase().includes(fallbackModelSearch.toLowerCase()) ||
                   model.owned_by.toLowerCase().includes(fallbackModelSearch.toLowerCase()))
                )
                .map((model) => (
                  <TouchableOpacity
                    key={model.id}
                    style={[
                      styles.modalItem,
                      fallbackModel === model.id && styles.modalItemSelected
                    ]}
                    onPress={() => {
                      setFallbackModel(model.id);
                      setShowFallbackModelModal(false);
                      setFallbackModelSearch('');
                    }}
                  >
                    <View style={styles.modalItemLeft}>
                      <Text style={[
                        styles.modalItemText,
                        fallbackModel === model.id && styles.modalItemTextSelected
                      ]}>
                        {model.id}
                      </Text>
                      <Text style={styles.modalItemSubtext}>
                        {model.owned_by}
                      </Text>
                    </View>
                    {fallbackModel === model.id && (
                      <Ionicons name="checkmark" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              {availableModels.filter(model => 
                model.id !== receiptModel && model.id !== chatModel &&
                (model.id.toLowerCase().includes(fallbackModelSearch.toLowerCase()) ||
                 model.owned_by.toLowerCase().includes(fallbackModelSearch.toLowerCase()))
              ).length === 0 && fallbackModelSearch !== '' && (
                <View style={styles.emptySearchContainer}>
                  <Ionicons name="search-outline" size={32} color={Colors.textSecondary} />
                  <Text style={styles.emptySearchText}>No models found</Text>
                  <Text style={styles.emptySearchSubtext}>Try searching with different keywords</Text>
                </View>
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
    </SafeAreaView>
  );
}

const INPUT_HEIGHT = 44;

const styles = StyleSheet.create({
    modelSelectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 48,
      backgroundColor: Colors.white,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 1,
    paddingHorizontal: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  textInput: {
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: INPUT_HEIGHT,
    fontSize: 15,
    color: Colors.textPrimary,
    textAlignVertical: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: INPUT_HEIGHT,
  },
  selectText: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: INPUT_HEIGHT,
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
    textAlignVertical: 'center',
  },
  saveButton: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveOpenaiButton: {
    marginTop: 16,
    marginBottom: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  addCategoryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 1,
    paddingHorizontal: 4,
  },
  addCategoryInput: {
    flex: 1,
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: INPUT_HEIGHT,
    fontSize: 15,
    textAlignVertical: 'center',
  },
  addButton: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  categoryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
    marginTop: 12,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 7,
    gap: -2,
  },
  categoryTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  deleteButton: {
    padding: 2,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'center',
    paddingVertical: 3.5,
    paddingHorizontal: 5,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  menuItemText: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  privacyInfo: {
    marginTop: 16,
    paddingTop: 4,
    paddingLeft: 4,
    paddingRight: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  privacyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  backupText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  signOutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 6,
    minHeight: 28,
    minWidth: 80,
    gap: 6,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  signOutPillText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    paddingLeft: 2,
    paddingRight: 2,
  },
  versionPill: {
    backgroundColor: Colors.gray200,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 22,
    minWidth: 80,
  },
  versionPillText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    paddingLeft: 2,
    paddingRight: 2,
  },
  // OpenAI Configuration Styles
  modelsPillDisabled: {
    backgroundColor: Colors.gray300,
  },
  required: {
    color: Colors.error,
  },
  selectPlaceholder: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.gray50,
    padding: 4,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    marginTop: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  // Modal Styles
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  modelSelectionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    height: 64,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalList: {
    maxHeight: 400,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: INPUT_HEIGHT,
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    textAlignVertical: 'center',
  },
  emptySearchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptySearchText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  modalItemSelected: {
    backgroundColor: Colors.gray50,
  },
  modalItemLeft: {
    flex: 1,
  },
  modalItemText: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalItemTextSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },
  modalItemSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  // API Key Input Styles
  keyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: INPUT_HEIGHT,
  },
  keyInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    textAlignVertical: 'center',
    // Remove padding here as it's on the container
  },
  keyVisibilityButton: {
    // The parent container handles alignment
    padding: 8, // Restore padding for touch area
    marginLeft: 4, // Slight margin
  },
  // Collapsible Section Styles
  collapsibleSection: {
    marginTop: 12,
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
    overflow: 'hidden',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 0.5,
    paddingHorizontal: 1,
    backgroundColor: Colors.white,
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  collapsibleHeaderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  collapsibleContent: {
    backgroundColor: Colors.gray50,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  modelIndicator: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modelIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  // Model Summary Styles
  modelSummary: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: Colors.gray50,
    borderRadius: 8,
    gap: 8,
  },
  modelSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modelSummaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modelSummaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  currencySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    marginLeft: 4,
  },
});
