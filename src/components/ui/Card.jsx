import React from 'react';
import { useTheme } from '../../theme';

export const Card = ({ children, style }) => {
  const C = useTheme();
  return <div style={{background:C.white,borderRadius:12,border:`1px solid ${C.grey100}`,boxShadow:`0 1px 8px #0d5e5e08`,...style}}>{children}</div>;
};
