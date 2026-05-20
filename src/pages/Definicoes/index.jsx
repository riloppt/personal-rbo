import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { PageHeader } from '../../components/ui/PageHeader';
import { Icon } from '../../components/ui/Icon';
import { CrudPage } from '../../components/shared/CrudPage';
import { UtilizadoresPanel } from './UtilizadoresPanel';
import { CategoriasCredenciaisPanel } from './CategoriasCredenciaisPanel';

export const Definicoes = ({ currentUserId }) => {
  const C = useTheme();
  const [tab, setTab] = useState("tipologias");

  const tabs = [
    {id:"tipologias",   label:"Tipologias",            icon:"types"},
    {id:"locais",       label:"Locais de Assistência", icon:"locations"},
    {id:"categorias",   label:"Categorias",            icon:"key"},
    {id:"equipamentos", label:"Tipos de Equipamento",  icon:"wrench"},
    {id:"utilizadores", label:"Utilizadores",           icon:"user"},
  ];

  return (
    <div>
      <PageHeader title="Definições" subtitle="Listas de suporte e configuração"/>
      {/* Tab bar */}
      <div style={{display:"flex",gap:4,marginBottom:24,background:C.white,borderRadius:12,padding:6,border:`1px solid ${C.grey100}`,flexWrap:"wrap"}}>
        {tabs.map(t=>{
          const active = tab===t.id;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{display:"flex",alignItems:"center",gap:8,padding:"9px 16px",borderRadius:8,border:"none",cursor:"pointer",background:active?C.teal:"transparent",color:active?"#ffffff":C.grey600,fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:active?600:400,transition:"all .15s"}}>
              <Icon name={t.icon} size={15} color={active?"#ffffff":C.grey400}/>
              {t.label}
            </button>
          );
        })}
      </div>
      {/* Content */}
      {tab==="tipologias"&&(
        <CrudPage key="tipologias" compact hasAtivo title="Tipologias" table="rbo_tipologias"
          cols={[{key:"nome",label:"Nome"}]}
          emptyForm={{nome:"",ativo:true}}
          formFields={[{k:"nome",label:"Nome da Tipologia",required:true}]}/>
      )}
      {tab==="locais"&&(
        <CrudPage key="locais" compact hasAtivo title="Locais de Assistência" table="rbo_locais"
          cols={[{key:"nome",label:"Local"}]}
          emptyForm={{nome:"",ativo:true}}
          formFields={[{k:"nome",label:"Nome do Local",required:true}]}/>
      )}
      {tab==="categorias"&&(
        <CategoriasCredenciaisPanel/>
      )}
      {tab==="equipamentos"&&(
        <CrudPage key="equipamentos" compact title="Tipos de Equipamento" table="rbo_equipment_types"
          cols={[{key:"nome",label:"Nome"}]}
          emptyForm={{nome:""}}
          formFields={[{k:"nome",label:"Nome do Tipo",required:true}]}/>
      )}
      {tab==="utilizadores"&&(
        <UtilizadoresPanel currentUserId={currentUserId}/>
      )}
    </div>
  );
};
