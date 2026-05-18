import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { Icon } from './Icon';

export const CopyBtn = ({ value, isPassword }) => {
  const C = useTheme();
  const [state, setState] = useState("idle"); // idle | copied | clearing

  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
      if (isPassword) {
        // Clear clipboard after 15s
        setTimeout(async () => {
          setState("clearing");
          try { await navigator.clipboard.writeText(""); } catch(_) {}
          setTimeout(() => setState("idle"), 800);
        }, 15000);
      } else {
        setTimeout(() => setState("idle"), 2000);
      }
    } catch(_) { setState("idle"); }
  };

  const col = state === "copied" ? C.green : state === "clearing" ? C.amber : C.grey400;
  const ic  = state === "copied" ? "check" : state === "clearing" ? "close" : "copy";
  const tip = state === "copied"
    ? (isPassword ? "Copiado — apaga em 15s" : "Copiado!")
    : state === "clearing" ? "A limpar clipboard..."
    : (isPassword ? "Copiar password (15s)" : "Copiar");

  return (
    <button onClick={copy} title={tip}
      style={{background:"none",border:"none",cursor:value?"pointer":"default",padding:"3px 5px",borderRadius:5,display:"flex",alignItems:"center",opacity:value?1:0.3,transition:"all .15s"}}
      onMouseEnter={e=>{if(value)e.currentTarget.style.background=C.grey100;}}
      onMouseLeave={e=>e.currentTarget.style.background="none"}>
      <Icon name={ic} size={13} color={col}/>
    </button>
  );
};
