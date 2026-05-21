import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { Btn } from './Btn';

const SortChevrons = ({ active, dir, hovered, teal, grey }) => (
  <span style={{ display:'inline-flex', flexDirection:'column', gap:1.5, marginLeft:5, verticalAlign:'middle', flexShrink:0, lineHeight:1 }}>
    <svg width="7" height="4" viewBox="0 0 7 4" fill="none">
      <path d="M3.5 0L7 4H0L3.5 0Z" fill={
        active && dir === 'asc' ? teal
        : hovered ? grey
        : 'transparent'
      }/>
    </svg>
    <svg width="7" height="4" viewBox="0 0 7 4" fill="none">
      <path d="M3.5 4L0 0H7L3.5 4Z" fill={
        active && dir === 'desc' ? teal
        : hovered ? grey
        : 'transparent'
      }/>
    </svg>
  </span>
);

export const Table = ({
  cols, data, onEdit, onDelete, onView, viewIcon = "eye",
  extraActions, emptyMsg = "Sem registos",
  sortKey, sortDir, onSort,
}) => {
  const C = useTheme();
  const [hoveredCol, setHoveredCol] = useState(null);

  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
        <thead>
          <tr style={{ borderBottom:`2px solid ${C.grey100}` }}>
            {cols.map(c => {
              const sk       = c.sortKey || c.key;
              const sortable = !!c.sortable && !!onSort;
              const isActive = sortable && sortKey === sk;
              const isHov    = hoveredCol === sk;
              return (
                <th key={c.key + c.label}
                  onClick={sortable ? () => onSort(sk) : undefined}
                  onMouseEnter={sortable ? () => setHoveredCol(sk) : undefined}
                  onMouseLeave={sortable ? () => setHoveredCol(null) : undefined}
                  style={{
                    padding:"12px 16px", textAlign:"left",
                    fontSize:12, fontWeight:600, letterSpacing:".5px",
                    textTransform:"uppercase", whiteSpace:"nowrap",
                    color: isActive ? C.teal : C.grey400,
                    background: isHov ? C.grey50 : C.white,
                    cursor: sortable ? "pointer" : "default",
                    userSelect:"none",
                    transition:"background .15s, color .15s",
                  }}>
                  <span style={{ display:'inline-flex', alignItems:'center' }}>
                    {c.label}
                    {sortable && (
                      <SortChevrons
                        active={isActive} dir={sortDir} hovered={isHov}
                        teal={C.teal} grey={C.grey400}
                      />
                    )}
                  </span>
                </th>
              );
            })}
            {(onEdit || onDelete || onView || extraActions) && (
              <th style={{ padding:"12px 16px", width:150, background:C.white }}/>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={cols.length + 1} style={{ padding:"32px 16px", textAlign:"center", color:C.grey400, fontSize:13 }}>
                {emptyMsg}
              </td>
            </tr>
          )}
          {data.map((row, i) => (
            <tr key={row.id ?? i}
              style={{ borderBottom:`1px solid ${C.grey100}`, transition:"background .1s" }}
              onMouseEnter={e => e.currentTarget.style.background = C.grey50}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {cols.map(c => (
                <td key={c.key + c.label} style={{ padding:"13px 16px", color:C.grey800, verticalAlign:"middle" }}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key] ?? "—")}
                </td>
              ))}
              {(onEdit || onDelete || onView || extraActions) && (
                <td style={{ padding:"8px 16px" }}>
                  <div style={{ display:"flex", gap:4, justifyContent:"flex-end", alignItems:"center" }}>
                    {extraActions && extraActions(row)}
                    {onView   && <Btn variant="ghost" size="sm" icon={viewIcon} onClick={() => onView(row)}/>}
                    {onEdit   && <Btn variant="ghost" size="sm" icon="edit"    onClick={() => onEdit(row)}/>}
                    {onDelete && <Btn variant="ghost" size="sm" icon="trash"   onClick={() => onDelete(row.id)}/>}
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
