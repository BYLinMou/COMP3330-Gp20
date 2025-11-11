import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { supabase } from '../../src/services/supabase';

export default function SettingsScreen() {
  const [fullName, setFullName] = useState('Alex Johnson');
  const [email, setEmail] = useState('alex.johnson@email.com');
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

  const categories = ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare'];

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
        <Text style={styles.appName}>AuraPet</Text>
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
            />
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

        {/* Custom Categories */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Custom Categories</Text>
          <Text style={styles.sectionDescription}>Personalize your expense categories</Text>

          <View style={styles.addCategoryContainer}>
            <TextInput
              style={styles.addCategoryInput}
              placeholder="Add new category..."
            />
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryTags}>
            {categories.map((category, index) => (
              <View key={index} style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{category}</Text>
                <TouchableOpacity>
                  <Ionicons name="close" size={16} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
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

        <Text style={styles.version}>AuraSpend v2.1.0</Text>

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
});
