/**
 * PBR App Color Palette
 * Based on the provided color palette and Figma design system
 */

export const colors = {
  // Primary Brand Colors (from your color palette)
  primary: {
    50: '#FBF6F1',   // Light cream/off-white
    100: '#F5E8DC',
    200: '#EBD1B8',
    300: '#D29507',  // Golden yellow/mustard
    400: '#B88206',
    500: '#9E6F05',
    600: '#845C04',
    700: '#6A4903',
    800: '#503602',
    900: '#362301',
  },
  
  // Secondary Colors
  secondary: {
    50: '#F0F7F6',
    100: '#D9E8E6',
    200: '#B3D1CD',
    300: '#8DBAB4',
    400: '#67A39B',
    500: '#265451',  // Dark teal
    600: '#1E433F',
    700: '#16322D',
    800: '#0E211B',
    900: '#061009',
  },
  
  // Accent Colors
  accent: {
    50: '#FDF2F1',
    100: '#FBE5E2',
    200: '#F7CBC5',
    300: '#F3B1A8',
    400: '#EF978B',
    500: '#933B25',  // Deep reddish-brown/terracotta
    600: '#752F1E',
    700: '#572317',
    800: '#391710',
    900: '#1B0B08',
  },
  
  // Neutral Colors (from Figma design)
  neutral: {
    0: '#FFFFFF',    // Main/White
    50: '#FBF6F1',   // Light cream
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#CCCCCC',  // Border color from TextField
    400: '#999999',
    500: '#666666',
    600: '#333333',
    700: '#1A1A1A',
    800: '#0D0D0D',
    900: '#040404',  // Main/Black
  },
  
  // Semantic Colors
  success: {
    50: '#F0FDF4',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
  },
  
  warning: {
    50: '#FFFBEB',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  
  error: {
    50: '#FEF2F2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  
  info: {
    50: '#EFF6FF',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
} as const;

// Color tokens for easy access
export const colorTokens = {
  // Brand colors
  brand: {
    primary: colors.primary[300],    // #D29507 - Golden yellow
    secondary: colors.secondary[500], // #265451 - Dark teal
    accent: colors.accent[500],      // #933B25 - Terracotta
    background: colors.neutral[50],  // #FBF6F1 - Light cream
  },
  
  // UI colors
  ui: {
    background: colors.neutral[0],   // #FFFFFF - White
    surface: colors.neutral[50],     // #FBF6F1 - Light cream
    border: colors.neutral[300],     // #CCCCCC - Light gray
    text: {
      primary: colors.neutral[900],  // #040404 - Black
      secondary: colors.neutral[600], // #333333 - Dark gray
      tertiary: colors.neutral[500], // #666666 - Medium gray
      inverse: colors.neutral[0],    // #FFFFFF - White
    },
  },
  
  // Interactive colors
  interactive: {
    primary: colors.neutral[900],    // #040404 - Black (for buttons)
    primaryHover: colors.neutral[800], // #0D0D0D
    secondary: colors.primary[300],  // #D29507 - Golden yellow
    secondaryHover: colors.primary[400], // #B88206
  },
} as const;

export type ColorToken = typeof colorTokens;
export type ColorScale = typeof colors;
