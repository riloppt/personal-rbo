import { createContext, useContext } from 'react';

export const LIGHT = {
  teal:"#1a7a7a",tealD:"#0d5e5e",tealL:"#2a9b9b",tealXL:"#e6f5f5",tealM:"#b3e0e0",
  white:"#ffffff",grey50:"#f8fafb",grey100:"#eef2f3",grey200:"#d4dde0",
  grey400:"#8fa6ab",grey600:"#4a6468",grey800:"#1e3236",
  red:"#e05a5a",green:"#2db87d",amber:"#e8a83a",isDark:false,
};

export const DARK = {
  teal:"#2a9d9d",tealD:"#0d5e5e",tealL:"#3abcbc",tealXL:"#0d2828",tealM:"#4d8e8e",
  white:"#122424",grey50:"#0a1818",grey100:"#162424",grey200:"#1e3535",
  grey400:"#4d7878",grey600:"#7aa0a0",grey800:"#cee4e4",
  red:"#e07878",green:"#3acc8d",amber:"#e8b858",isDark:true,
};

export const ThemeCtx = createContext(LIGHT);
export const useTheme = () => useContext(ThemeCtx);
