
/**
 * Colors for ZimCommute
 * 
 * Zimbabwe-inspired color palette with dark mode support.
 */

export const zincColors = {
  50: '#fafafa',
  100: '#f4f4f5',
  200: '#e4e4e7',
  300: '#d4d4d8',
  400: '#a1a1aa',
  500: '#71717a',
  600: '#52525b',
  700: '#3f3f46',
  800: '#27272a',
  900: '#18181b',
  950: '#09090b',
};

export const appleBlue = '#007AFF';

// Zimbabwe flag colors
export const zimbabweColors = {
  green: '#006B3F',
  yellow: '#FFD700',
  red: '#DC143C',
  black: '#000000',
  white: '#FFFFFF',
};

const tintColorLight = zimbabweColors.green;
const tintColorDark = zimbabweColors.yellow;

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    card: '#fff',
    border: '#e4e4e7',
    notification: zimbabweColors.red,
    primary: zimbabweColors.green,
    secondary: zimbabweColors.yellow,
    success: '#10b981',
    warning: '#f59e0b',
    error: zimbabweColors.red,
    textSecondary: '#71717a',
    backgroundAlt: '#f4f4f5',
    danger: '#ff3b30',
  },
  dark: {
    text: '#fff',
    background: '#09090b',
    tint: tintColorDark,
    tabIconDefault: '#52525b',
    tabIconSelected: tintColorDark,
    card: '#18181b',
    border: '#27272a',
    notification: zimbabweColors.red,
    primary: zimbabweColors.yellow,
    secondary: zimbabweColors.green,
    success: '#10b981',
    warning: '#f59e0b',
    error: zimbabweColors.red,
    textSecondary: '#a1a1aa',
    backgroundAlt: '#18181b',
    danger: '#ff3b30',
  },
};

export { tintColorLight, tintColorDark };
