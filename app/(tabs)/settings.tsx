import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Switch, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Colors } from '../../constants/theme';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/providers/AuthProvider';
import { 
  saveOpenAIConfig, 
  getOpenAIConfig, 
  fetchOpenAIModels, 
  type OpenAIConfig,
  type OpenAIModel 
} from '../../src/services/openai-config';
import {
  getCategories,
  addCategory,
  deleteCategory,
  subscribeToCategoryChanges,
  type Category,
} from '../../src/services/categories';

export default function SettingsScreen() {
  const { session } = useAuth();
  
  console.log('SettingsScreen mounted, session:', !!session);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('USD ($)');
  const [language, setLanguage] = useState('English');
  const [monthlyBudget, setMonthlyBudget] = useState('2000');

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
  const [primaryModel, setPrimaryModel] = useState('');
  const [fallbackModel, setFallbackModel] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [showModelSelection, setShowModelSelection] = useState(false);
  const [showPrimaryModelModal, setShowPrimaryModelModal] = useState(false);
  const [showFallbackModelModal, setShowFallbackModelModal] = useState(false);

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Load OpenAI config on mount
  useEffect(() => {
    loadOpenAIConfig();
  }, []);

  // Load categories and subscribe to realtime
  useEffect(() => {
    if (!session) return;
    (async () => {
      await loadCategories();
    })();
    let unsub: undefined | (() => Promise<void>);
    (async () => {
      try {
        console.log('[Settings] Subscribing to category changes...');
        unsub = await subscribeToCategoryChanges((change) => {
          console.log('[Settings] Category change received:', {
            eventType: change.eventType,
            newCategory: change.new?.name,
            oldCategory: change.old?.name,
          });
          // Reload categories for any event (INSERT, UPDATE, DELETE)
          console.log('[Settings] Reloading categories after', change.eventType);
          loadCategories();
        });
        console.log('[Settings] Successfully subscribed to category changes');
      } catch (e) {
        console.warn('[Settings] Category realtime not active:', e);
      }
    })();
    return () => {
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
        setPrimaryModel(config.primaryModel);
        setFallbackModel(config.fallbackModel);
      }
    } catch (error) {
      console.error('Failed to load OpenAI config:', error);
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
      
      // 显示所有模型，不进行过滤
      setAvailableModels(models);
      Alert.alert('Success', `Found ${models.length} available models`);
    } catch (error: any) {
      Alert.alert('Connection Failed', error.message || 'Failed to fetch models');
      setAvailableModels([]);
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

    try {
      console.log('Calling deleteCategory with id:', id);
      const result = await deleteCategory(id);
      console.log('deleteCategory returned:', result);
      console.log('Reloading categories...');
      // Immediately update the UI without waiting for realtime
      await loadCategories();
      console.log('Categories reloaded successfully');
      Alert.alert('Success', `Category "${name}" deleted successfully`);
    } catch (e: any) {
      console.error('Error during delete:', e);
      Alert.alert('Error', e?.message || 'Failed to delete category');
    }
  };

  const handleSaveOpenAIConfig = async () => {
    if (!openaiUrl.trim() || !openaiKey.trim()) {
      Alert.alert('Validation Error', 'Please enter both API URL and API Key');
      return;
    }

    if (!primaryModel) {
      Alert.alert('Validation Error', 'Please select a primary model');
      return;
    }

    try {
      const config: OpenAIConfig = {
        apiUrl: openaiUrl,
        apiKey: openaiKey,
        primaryModel: primaryModel,
        fallbackModel: fallbackModel,
      };

      await saveOpenAIConfig(config);
      Alert.alert('Success', 'OpenAI configuration saved successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save configuration');
    }
  };

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Info', 'Running in demo mode. To enable authentication, configure your Supabase credentials.');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        style={styles.header}
      >
        <Text style={styles.appName}>AuraSpend</Text>
        <Text style={styles.subtitle}>Smart Budgeting Companion</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Settings */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={24} color={Colors.textPrimary} />
            <Text style={styles.sectionTitle}>Profile Settings</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
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
              <Text style={styles.inputLabel}>Currency</Text>
              <TouchableOpacity style={styles.selectInput}>
                <Text style={styles.selectText}>{currency}</Text>
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

        {/* Notifications */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

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

          <View style={styles.settingItem}>
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

        {/* OpenAI Configuration */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles-outline" size={24} color={Colors.textPrimary} />
            <Text style={styles.sectionTitle}>OpenAI Configuration</Text>
          </View>

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
              style={styles.collapsibleHeader}
              onPress={() => setShowModelSelection(!showModelSelection)}
            >
              <View style={styles.collapsibleHeaderLeft}>
                <Ionicons 
                  name={showModelSelection ? "chevron-down" : "chevron-forward"} 
                  size={20} 
                  color={Colors.primary} 
                />
                <Text style={styles.collapsibleHeaderTitle}>AI Model Selection</Text>
              </View>
              {(primaryModel || fallbackModel) && (
                <View style={styles.modelIndicator}>
                  <Text style={styles.modelIndicatorText}>
                    {primaryModel ? '1' : ''}{fallbackModel ? '+1' : ''}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {showModelSelection && (
              <View style={styles.collapsibleContent}>
                {/* Fetch Models Button */}
                <TouchableOpacity 
                  style={[styles.fetchModelsButton, loadingModels && styles.fetchModelsButtonDisabled]}
                  onPress={handleFetchModels}
                  disabled={loadingModels}
                >
                  {loadingModels ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="refresh-outline" size={20} color={Colors.white} />
                      <Text style={styles.fetchModelsButtonText}>Fetch Available Models</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Model Selection UI - Always show if we have models or previously selected models */}
                {(availableModels.length > 0 || primaryModel || fallbackModel) && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        Primary Model <Text style={styles.required}>*</Text>
                      </Text>
                      <TouchableOpacity 
                        style={styles.selectInput}
                        onPress={() => availableModels.length > 0 && setShowPrimaryModelModal(true)}
                        disabled={availableModels.length === 0}
                      >
                        <Text style={primaryModel ? styles.selectText : styles.selectPlaceholder}>
                          {primaryModel || (availableModels.length === 0 ? 'Fetch models first' : 'Select primary model')}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                      </TouchableOpacity>
                      {primaryModel && availableModels.length === 0 && (
                        <Text style={styles.helperText}>Currently selected: {primaryModel}</Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Fallback Model (Optional)</Text>
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
                      {fallbackModel && availableModels.length === 0 && (
                        <Text style={styles.helperText}>Currently selected: {fallbackModel}</Text>
                      )}
                    </View>
                  </>
                )}

                {availableModels.length === 0 && !primaryModel && !fallbackModel && !loadingModels && (
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

        {/* Custom Categories */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Custom Categories</Text>
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
                      size={20} 
                      color={!session ? Colors.textSecondary : '#FF3B30'} 
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Data & Privacy */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={24} color={Colors.textPrimary} />
            <Text style={styles.sectionTitle}>Data & Privacy</Text>
          </View>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="download-outline" size={20} color={Colors.textPrimary} />
            <Text style={styles.menuItemText}>Export My Data</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textPrimary} />
            <Text style={styles.menuItemText}>Privacy Settings</Text>
          </TouchableOpacity>

          <View style={styles.privacyInfo}>
            <Text style={styles.privacyText}>
              Your data is encrypted and securely stored. We never share your personal financial information with third parties.
            </Text>
            <Text style={styles.backupText}>Last backup: Today at 3:24 PM</Text>
          </View>
        </View>

        {/* App Preferences */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={24} color={Colors.textPrimary} />
            <Text style={styles.sectionTitle}>App Preferences</Text>
          </View>

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

          <View style={styles.settingItem}>
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

        {/* Help & Support */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle-outline" size={24} color={Colors.textPrimary} />
            <Text style={styles.sectionTitle}>Help & Support</Text>
          </View>

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

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={Colors.white} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>
          AuraSpend v{Constants.expoConfig?.version || '0.0.0'}
        </Text>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Primary Model Selection Modal */}
      <Modal
        visible={showPrimaryModelModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrimaryModelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Primary Model</Text>
              <TouchableOpacity onPress={() => setShowPrimaryModelModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalList}>
              {availableModels.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.modalItem,
                    primaryModel === model.id && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setPrimaryModel(model.id);
                    setShowPrimaryModelModal(false);
                  }}
                >
                  <View style={styles.modalItemLeft}>
                    <Text style={[
                      styles.modalItemText,
                      primaryModel === model.id && styles.modalItemTextSelected
                    ]}>
                      {model.id}
                    </Text>
                    <Text style={styles.modalItemSubtext}>
                      {model.owned_by}
                    </Text>
                  </View>
                  {primaryModel === model.id && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Fallback Model Selection Modal */}
      <Modal
        visible={showFallbackModelModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFallbackModelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Fallback Model</Text>
              <TouchableOpacity onPress={() => setShowFallbackModelModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalList}>
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  !fallbackModel && styles.modalItemSelected
                ]}
                onPress={() => {
                  setFallbackModel('');
                  setShowFallbackModelModal(false);
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
              
              {availableModels
                .filter(model => model.id !== primaryModel)
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
    marginBottom: 20,
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
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
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
    paddingVertical: 12,
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
    paddingVertical: 12,
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
    marginBottom: 16,
  },
  addCategoryInput: {
    flex: 1,
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
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
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  categoryTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  menuItemText: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  privacyInfo: {
    marginTop: 16,
    paddingTop: 16,
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
  signOutButton: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  version: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  // OpenAI Configuration Styles
  fetchModelsButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  fetchModelsButtonDisabled: {
    backgroundColor: Colors.gray300,
  },
  fetchModelsButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
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
    padding: 16,
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
    paddingVertical: 12,
  },
  keyInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  keyVisibilityButton: {
    padding: 8,
    marginLeft: 8,
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
    paddingVertical: 16,
    paddingHorizontal: 16,
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
  collapsibleContent: {
    backgroundColor: Colors.gray50,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  // Model Summary Styles
  modelSummary: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
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
});
