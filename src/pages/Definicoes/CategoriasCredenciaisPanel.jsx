import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../../theme';
import { sb } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { Btn } from '../../components/ui/Btn';
import { Loading } from '../../components/ui/Loading';

export const CategoriasCredenciaisPanel = () => {
  const C = useTheme();
  const [cats,      setCats]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [adding,    setAdding]    = useState(false);
  const [newName,   setNewName]   = useState("");
  const [editId,    setEditId]    = useState(null);
  const [editName,  setEditName]  = useState("");
  const [saving,    setSaving]    = useState(false);
  const [erro,      setErro]      = useState(null);
  const newInputRef  = useRef(null);
  const editInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from("rbo_credential_categories").select("*").order("nome");
    setCats(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Focus input when it appears
  useEffect(() => { if (adding)       newInputRef.current?.focus();  }, [adding]);
  useEffect(() => { if (editId!=null) editInputRef.current?.focus(); }, [editId]);

  const startAdd = () => { setAdding(true); setNewName(""); setErro(null); setEditId(null); };
  const cancelAdd = () => { setAdding(false); setNewName(""); };

  const confirmAdd = async () => {
    const nome = newName.trim();
    if (!nome) return;
    setSaving(true);
    const { error } = await sb.from("rbo_credential_categories").insert([{ nome }]);
    if (error) setErro("Erro ao criar: " + error.message);
    else { await load(); setAdding(false); setNewName(""); }
    setSaving(false);
  };

  const startEdit = cat => { setEditId(cat.id); setEditName(cat.nome); setErro(null); setAdding(false); };
  const cancelEdit = () => { setEditId(null); setEditName(""); };

  const confirmEdit = async () => {
    const nome = editName.trim();
    if (!nome) return;
    setSaving(true);
    const { error } = await sb.from("rbo_credential_categories").update({ nome }).eq("id", editId);
    if (error) setErro("Erro ao guardar: " + error.message);
    else { await load(); setEditId(null); setEditName(""); }
    setSaving(false);
  };

  const del = async cat => {
    setErro(null);
    const { count } = await sb
      .from("rbo_client_credentials")
      .select("id", { count: "exact", head: true })
      .eq("categoria", cat.nome);
    if (count > 0) {
      setErro(`Esta categoria está em uso por ${count} credencial(is) e não pode ser eliminada.`);
      return;
    }
    if (!confirm(`Eliminar categoria "${cat.nome}"?`)) return;
    const { error } = await sb.from("rbo_credential_categories").delete().eq("id", cat.id);
    if (error) setErro("Erro ao eliminar: " + error.message);
    else await load();
  };

  const onNewKey  = e => { if (e.key==="Enter") confirmAdd();  if (e.key==="Escape") cancelAdd();  };
  const onEditKey = e => { if (e.key==="Enter") confirmEdit(); if (e.key==="Escape") cancelEdit(); };

  return (
    <div>
      {/* Toolbar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <span style={{fontSize:13,color:C.grey400}}>{cats.length} categorias</span>
        <Btn icon="plus" size="sm" onClick={startAdd} disabled={adding}>Nova Categoria</Btn>
      </div>

      {/* Error banner */}
      {erro && (
        <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 16px",background:C.amber+"12",border:`1px solid ${C.amber}44`,borderRadius:10,marginBottom:16}}>
          <Icon name="alert" size={16} color={C.amber} style={{flexShrink:0,marginTop:1}}/>
          <span style={{fontSize:13,color:C.grey800,flex:1}}>{erro}</span>
          <button onClick={()=>setErro(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.grey400,padding:2}}>
            <Icon name="close" size={14}/>
          </button>
        </div>
      )}

      <Card style={{padding:0,overflow:"hidden"}}>
        {loading ? <Loading/> : (
          <>
            {/* Inline add row */}
            {adding && (
              <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.grey100}`,display:"flex",alignItems:"center",gap:8,background:C.teal+"08"}}>
                <input
                  ref={newInputRef}
                  value={newName}
                  onChange={e=>setNewName(e.target.value)}
                  onKeyDown={onNewKey}
                  placeholder="Nome da categoria..."
                  style={{flex:1,border:`1.5px solid ${C.teal}`,borderRadius:8,padding:"6px 10px",fontSize:14,outline:"none",background:C.white,color:C.grey800,fontFamily:"inherit"}}
                />
                <button
                  onClick={confirmAdd}
                  disabled={saving || !newName.trim()}
                  title="Confirmar"
                  style={{background:C.teal,border:"none",borderRadius:7,padding:"5px 10px",cursor:"pointer",color:"#fff",display:"flex",alignItems:"center",opacity:(!newName.trim()||saving)?0.5:1}}>
                  <Icon name="check" size={14} color="#fff"/>
                </button>
                <button
                  onClick={cancelAdd}
                  title="Cancelar"
                  style={{background:"none",border:`1px solid ${C.grey200}`,borderRadius:7,padding:"5px 10px",cursor:"pointer",display:"flex",alignItems:"center"}}>
                  <Icon name="close" size={14} color={C.grey400}/>
                </button>
              </div>
            )}

            {cats.length === 0 && !adding ? (
              <div style={{padding:"24px 20px",textAlign:"center",color:C.grey400,fontSize:13}}>
                Sem categorias definidas
              </div>
            ) : (
              cats.map((cat, i) => (
                <div key={cat.id} style={{padding:"10px 16px",borderBottom:i<cats.length-1?`1px solid ${C.grey100}`:"none",display:"flex",alignItems:"center",gap:8}}>
                  {editId === cat.id ? (
                    <>
                      <input
                        ref={editInputRef}
                        value={editName}
                        onChange={e=>setEditName(e.target.value)}
                        onKeyDown={onEditKey}
                        style={{flex:1,border:`1.5px solid ${C.teal}`,borderRadius:8,padding:"5px 10px",fontSize:14,outline:"none",background:C.white,color:C.grey800,fontFamily:"inherit"}}
                      />
                      <button
                        onClick={confirmEdit}
                        disabled={saving || !editName.trim()}
                        title="Guardar"
                        style={{background:C.teal,border:"none",borderRadius:7,padding:"5px 10px",cursor:"pointer",display:"flex",alignItems:"center",opacity:(!editName.trim()||saving)?0.5:1}}>
                        <Icon name="check" size={14} color="#fff"/>
                      </button>
                      <button
                        onClick={cancelEdit}
                        title="Cancelar"
                        style={{background:"none",border:`1px solid ${C.grey200}`,borderRadius:7,padding:"5px 10px",cursor:"pointer",display:"flex",alignItems:"center"}}>
                        <Icon name="close" size={14} color={C.grey400}/>
                      </button>
                    </>
                  ) : (
                    <>
                      <span style={{flex:1,fontSize:14,color:C.grey800}}>{cat.nome}</span>
                      <button
                        onClick={()=>startEdit(cat)}
                        title="Editar"
                        style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,display:"flex",alignItems:"center",transition:"background .15s"}}
                        onMouseEnter={e=>e.currentTarget.style.background=C.grey100}
                        onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <Icon name="edit" size={14} color={C.grey400}/>
                      </button>
                      <button
                        onClick={()=>del(cat)}
                        title="Eliminar"
                        style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,display:"flex",alignItems:"center",transition:"background .15s"}}
                        onMouseEnter={e=>e.currentTarget.style.background=C.red+"18"}
                        onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <Icon name="trash" size={14} color={C.red||"#e53e3e"}/>
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </Card>
    </div>
  );
};
