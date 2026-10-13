import React from 'react';
import { useTheme } from '../../theme';
import { Icon } from './Icon';
import { Card } from './Card';

export const StatCard = ({ label, value, icon, color, onClick }) => {
  const C = useTheme();
  const col = color || C.teal;
  const content = (
    <Card style={{padding:"20px 24px",display:"flex",alignItems:"center",gap:16,height:"100%",transition:"border-color .15s, box-shadow .15s"}}>
      <div style={{width:48,height:48,borderRadius:12,background:col+"18",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Icon name={icon} size={22} color={col}/>
      </div>
      <div>
        <div style={{fontSize:26,fontWeight:700,color:C.grey800,lineHeight:1}}>{value}</div>
        <div style={{fontSize:13,color:C.grey400,marginTop:4}}>{label}</div>
      </div>
    </Card>
  );
  if (!onClick) return content;
  return (
    <button onClick={onClick} className="rbo-statcard"
      style={{all:"unset",display:"block",cursor:"pointer",borderRadius:12,textAlign:"left","--col":col}}>
      <style>{`.rbo-statcard:hover>div,.rbo-statcard:focus-visible>div{border-color:var(--col)!important;box-shadow:0 0 0 1px var(--col)!important}`}</style>
      {content}
    </button>
  );
};
