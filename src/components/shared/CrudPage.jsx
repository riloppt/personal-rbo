import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../theme';
import { sb } from '../../lib/supabase';
import { PageHeader } from '../ui/PageHeader';
import { Btn } from '../ui/Btn';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import { Loading } from '../ui/Loading';
import { ErrMsg } from '../ui/ErrMsg';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';

export const CrudPage = ({ title, table, cols, formFields, emptyForm, compact, hasAtivo, fieldOptions, onView, onNew, noInlineEdit, viewIcon, newLabel = 'Novo', preDeleteCheck }) => {
  const C = useTheme();
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [delErr,    setDelErr]    = useState(null); // FK delete error
  const [modal,     setModal]     = useState(false);
  const [form,      setForm]      = useState(emptyForm);
  const [editing,   setEditing]   = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [showInativos, setShowInativos] = useState(false);

  const load = useCallback(async()=>{
    setLoading(true); setError(null);
    const { data, error } = await sb.from(table).select("*").order("id");
    if (error) setError(error.message); else setRows(data||[]);
    setLoading(false);
  },[table]);

  useEffect(()=>{ load(); },[load]);

  const openNew  = ()  => { setForm(emptyForm); setEditing(null); setModal(true); };
  const openEdit = r   => { setForm({...r});    setEditing(r.id); setModal(true); };

  const save = async () => {
    setSaving(true);
    const { id: _id, created_at: _ca, ...rest } = form;
    let err;
    if (!editing) ({ error: err } = await sb.from(table).insert([rest]));
    else          ({ error: err } = await sb.from(table).update(rest).eq("id", editing));
    if (err) { alert("Erro: "+err.message); setSaving(false); return; }
    await load(); setSaving(false); setModal(false);
  };

  const del = async id => {
    setDelErr(null);
    if (preDeleteCheck) {
      const err = await preDeleteCheck(id);
      if (err) { setDelErr(err); return; }
    }
    if (!confirm("Eliminar registo permanentemente?")) return;
    const { error } = await sb.from(table).delete().eq("id", id);
    if (error) {
      // FK violation
      if (error.code === "23503") {
        setDelErr("Não é possível eliminar este registo porque está associado a movimentos existentes. Pode inativá-lo em alternativa.");
      } else {
        setDelErr("Erro ao eliminar: " + error.message);
      }
    } else {
      await load();
    }
  };

  const toggleAtivo = async row => {
    const { error } = await sb.from(table).update({ ativo: !row.ativo }).eq("id", row.id);
    if (error) alert("Erro: " + error.message); else await load();
  };

  const visibleRows = hasAtivo
    ? rows.filter(r => showInativos ? true : r.ativo !== false)
    : rows;

  const inativosCount = hasAtivo ? rows.filter(r => r.ativo === false).length : 0;

  return (
    <div>
      {!compact && <PageHeader title={title} subtitle={`${visibleRows.length} registos`} action={<Btn icon="plus" onClick={onNew||openNew}>{newLabel}</Btn>}/>}
      {compact && (
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <span style={{fontSize:13,color:C.grey400}}>{visibleRows.length} registos</span>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {hasAtivo && inativosCount > 0 && (
              <button onClick={()=>setShowInativos(s=>!s)}
                style={{fontSize:12,color:C.grey400,background:"none",border:`1px solid ${C.grey200}`,borderRadius:6,padding:"4px 10px",cursor:"pointer"}}>
                {showInativos ? "Ocultar inativos" : `Mostrar inativos (${inativosCount})`}
              </button>
            )}
            <Btn icon="plus" size="sm" onClick={onNew||openNew}>{newLabel}</Btn>
          </div>
        </div>
      )}
      {error&&<ErrMsg msg={error} onRetry={load}/>}
      {delErr&&(
        <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 16px",background:C.amber+"12",border:`1px solid ${C.amber}44`,borderRadius:10,marginBottom:16}}>
          <Icon name="alert" size={16} color={C.amber} style={{flexShrink:0,marginTop:1}}/>
          <span style={{fontSize:13,color:C.grey800,flex:1}}>{delErr}</span>
          <button onClick={()=>setDelErr(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.grey400,padding:2}}><Icon name="close" size={14}/></button>
        </div>
      )}
      <Card style={{padding:0,overflow:"hidden"}}>
        {loading?<Loading/>:<Table
          cols={[
            ...cols,
            ...(hasAtivo ? [{key:"ativo",label:"Estado",render:v=><Badge color={v===false?C.grey400:C.green}>{v===false?"Inativo":"Ativo"}</Badge>}] : []),
          ]}
          data={visibleRows}
          onView={onView}
          viewIcon={viewIcon}
          onEdit={noInlineEdit ? undefined : openEdit}
          onDelete={del}
          extraActions={hasAtivo ? row=>(
            <button onClick={()=>toggleAtivo(row)} title={row.ativo===false?"Ativar":"Inativar"}
              style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,display:"flex",alignItems:"center",transition:"background .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.grey100}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <Icon name={row.ativo===false?"eye":"close"} size={14} color={row.ativo===false?C.green:C.amber}/>
            </button>
          ) : null}
        />}
      </Card>
      {modal&&(
        <Modal title={editing?"Editar":"Novo registo"} onClose={()=>setModal(false)} wide={formFields.length>4}>
          <div style={{display:"grid",gridTemplateColumns:formFields.length>4?"1fr 1fr":"1fr",gap:14}}>
            {formFields.map(f=>(
              <div key={f.k} style={f.full?{gridColumn:"1/-1"}:{}}>
                {f.type==="select"
                  ? <Select label={f.label} value={form[f.k]||""} onChange={v=>setForm(p=>({...p,[f.k]:v}))}
                      options={fieldOptions?.[f.k]||[]} required={f.required}/>
                  : <Input label={f.label} value={form[f.k]||""} onChange={v=>setForm(p=>({...p,[f.k]:v}))}
                      type={f.type} textarea={f.textarea} rows={f.rows} placeholder={f.placeholder} required={f.required}/>
                }
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
            <Btn variant="secondary" onClick={()=>setModal(false)}>Cancelar</Btn>
            <Btn onClick={save} disabled={saving}>{saving?"A guardar...":"Guardar"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};
