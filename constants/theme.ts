/**
 * AuraPet Theme Colors - Purple/Blue gradient branding
 */

import { Platform } from 'react-native';

export const Colors = {
  // Brand colors
  primary: '#8B5CF6', // Purple
  primaryDark: '#7C3AED',
  secondary: '#3B82F6', // Blue
  secondaryLight: '#60A5FA',
  
  // Gradient colors
  gradientStart: '#7C3AED',
  gradientEnd: '#3B82F6',
  
  // Status colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Chart colors
  chartPurple: '#8B5CF6',
  chartBlue: '#3B82F6',
  chartGreen: '#10B981',
  chartOrange: '#F97316',
  chartRed: '#EF4444',
  chartCyan: '#06B6D4',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Text colors
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textLight: '#FFFFFF',
  
  // Background colors
  background: '#F9FAFB',
  cardBackground: '#FFFFFF',
  
  // Tab bar
  tabIconDefault: '#9CA3AF',
  tabIconSelected: '#8B5CF6',
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
