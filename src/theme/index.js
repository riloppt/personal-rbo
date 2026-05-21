import { createContext, useContext } from 'react';

const BASE_LIGHT = {
  white:"#ffffff", grey50:"#f8fafb", grey100:"#eef2f3", grey200:"#d4dde0",
  grey400:"#8fa6ab", grey600:"#4a6468", grey800:"#1e3236",
  red:"#e05a5a", green:"#2db87d", amber:"#e8a83a", isDark:false,
};

const BASE_DARK = {
  white:"#122424", grey50:"#0a1818", grey100:"#162424", grey200:"#1e3535",
  grey400:"#4d7878", grey600:"#7aa0a0", grey800:"#cee4e4",
  red:"#e07878", green:"#3acc8d", amber:"#e8b858", isDark:true,
};

const ACCENT_THEMES = {
  teal: {
    light: { teal:"#1a7a7a", tealD:"#0d5e5e", tealL:"#2a9b9b", tealXL:"#e6f5f5", tealM:"#b3e0e0", sidebarFg:"#4d8e8e" },
    dark:  { teal:"#2a9d9d", tealD:"#0d5e5e", tealL:"#3abcbc", tealXL:"#0d2828", tealM:"#4d8e8e", sidebarFg:"#4d8e8e" },
  },
  azul: {
    light: { teal:"#1a5f9a", tealD:"#0d3d6e", tealL:"#2a7bbf", tealXL:"#e6f0f9", tealM:"#b3ccec", sidebarFg:"#5a88b0" },
    dark:  { teal:"#3a88c8", tealD:"#0d3d6e", tealL:"#5aa0d8", tealXL:"#0d1828", tealM:"#3a6090", sidebarFg:"#5a88b0" },
  },
  indigo: {
    light: { teal:"#5252a0", tealD:"#30307a", tealL:"#7070c0", tealXL:"#eeeff9", tealM:"#ccccee", sidebarFg:"#6868a8" },
    dark:  { teal:"#7878d0", tealD:"#30307a", tealL:"#9898e0", tealXL:"#0d0d28", tealM:"#4040a0", sidebarFg:"#6868a8" },
  },
  verde: {
    light: { teal:"#1a7a40", tealD:"#0d5e2c", tealL:"#2a9b58", tealXL:"#e6f5ee", tealM:"#b3e0c8", sidebarFg:"#4d8e6a" },
    dark:  { teal:"#2ab868", tealD:"#0d5e2c", tealL:"#3ad880", tealXL:"#0d2818", tealM:"#4d8e6a", sidebarFg:"#4d8e6a" },
  },
  roxo: {
    light: { teal:"#7a3a9a", tealD:"#5e1e7a", tealL:"#9a5abc", tealXL:"#f5eefc", tealM:"#d8b8ee", sidebarFg:"#8e5aaa" },
    dark:  { teal:"#a060d0", tealD:"#5e1e7a", tealL:"#c080f0", tealXL:"#1a0828", tealM:"#7838b0", sidebarFg:"#8e5aaa" },
  },
  grafite: {
    light: { teal:"#3a607a", tealD:"#24445a", tealL:"#5a7a96", tealXL:"#edf1f5", tealM:"#b8cad8", sidebarFg:"#5a7890" },
    dark:  { teal:"#5a8aac", tealD:"#24445a", tealL:"#7aaac8", tealXL:"#0d1828", tealM:"#486880", sidebarFg:"#5a7890" },
  },
};

export const buildTheme = (accent = 'teal', dark = false) => {
  const base = dark ? BASE_DARK : BASE_LIGHT;
  const accentTokens = (ACCENT_THEMES[accent] || ACCENT_THEMES.teal)[dark ? 'dark' : 'light'];
  return { ...base, ...accentTokens };
};

export const ACCENTS = [
  { id: 'teal',    label: 'Teal',    color: '#1a7a7a' },
  { id: 'azul',    label: 'Azul',    color: '#1a5f9a' },
  { id: 'indigo',  label: 'Índigo',  color: '#5252a0' },
  { id: 'verde',   label: 'Verde',   color: '#1a7a40' },
  { id: 'roxo',    label: 'Roxo',    color: '#7a3a9a' },
  { id: 'grafite', label: 'Grafite', color: '#3a607a' },
];

// Backwards compat
export const LIGHT = buildTheme('teal', false);
export const DARK  = buildTheme('teal', true);

export const ThemeCtx = createContext(LIGHT);
export const useTheme = () => useContext(ThemeCtx);
