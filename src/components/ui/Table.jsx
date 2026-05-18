import React from 'react';
import { useTheme } from '../../theme';
import { Btn } from './Btn';

export const Table = ({ cols, data, onEdit, onDelete, onView, viewIcon="eye", extraActions, emptyMsg="Sem registos" }) => {
  const C = useTheme();
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
        <thead>
          <tr style={{borderBottom:`2px solid ${C.grey100}`}}>
            {cols.map(c=><th key={c.key+c.label} style={{padding:"12px 16px",textAlign:"left",fontSize:12,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px",whiteSpace:"nowrap",background:C.white}}>{c.label}</th>)}
            {(onEdit||onDelete||onView||extraActions)&&<th style={{padding:"12px 16px",width:150,background:C.white}}/>}
          </tr>
        </thead>
        <tbody>
          {data.length===0&&<tr><td colSpan={cols.length+1} style={{padding:"32px 16px",textAlign:"center",color:C.grey400,fontSize:13}}>{emptyMsg}</td></tr>}
          {data.map((row,i)=>(
            <tr key={row.id||i} style={{borderBottom:`1px solid ${C.grey100}`,transition:"background .1s"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.grey50}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {cols.map(c=><td key={c.key+c.label} style={{padding:"13px 16px",color:C.grey800,verticalAlign:"middle"}}>{c.render?c.render(row[c.key],row):(row[c.key]??"—")}</td>)}
              {(onEdit||onDelete||onView||extraActions)&&(
                <td style={{padding:"8px 16px"}}>
                  <div style={{display:"flex",gap:4,justifyContent:"flex-end",alignItems:"center"}}>
                    {extraActions&&extraActions(row)}
                    {onView   &&<Btn variant="ghost" size="sm" icon={viewIcon} onClick={()=>onView(row)}/>}
                    {onEdit   &&<Btn variant="ghost" size="sm" icon="edit"  onClick={()=>onEdit(row)}/>}
                    {onDelete &&<Btn variant="ghost" size="sm" icon="trash" onClick={()=>onDelete(row.id)}/>}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
