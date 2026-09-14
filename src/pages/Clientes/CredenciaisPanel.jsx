import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../../theme';
import { sb } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { Btn } from '../../components/ui/Btn';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { CopyBtn } from '../../components/ui/CopyBtn';

export const CredenciaisPanel = ({ clienteId }) => {
  const C = useTheme();
  const [creds,      setCreds]      = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [showPwd,    setShowPwd]    = useState({});
  const [dragging,   setDragging]   = useState(null);
  const [dragOver,   setDragOver]   = useState(null);
  const [search,     setSearch]     = useState("");
  const touchRef = useRef(null);
  const empty = {categoria:"",url_ip:"",utilizador:"",password:"",notas:""};
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    setLoading(true);
    const [credsRes, catsRes] = await Promise.all([
      sb.from("rbo_client_credentials").select("*").eq("cliente_id", clienteId).order("ordem").order("id"),
      sb.from("rbo_credential_categories").select("nome").order("nome"),
    ]);
    setCreds(credsRes.data || []);
    setCategories((catsRes.data || []).map(c => c.nome));
    setLoading(false);
  }, [clienteId]);

  useEffect(() => { load(); }, [load]);

  const openNew  = ()  => { setForm(empty); setEditId(null); setModal(true); };
  const openEdit = c   => { setForm({...c}); setEditId(c.id); setModal(true); };

  const save = async () => {
    setSaving(true);
    const { id: _id, created_at: _ca, ...rest } = form;
    if (form.categoria && !categories.includes(form.categoria)) {
      await sb.from("rbo_credential_categories").insert([{nome: form.categoria}]);
    }
    let err;
    if (!editId) {
      const payload = { ...rest, cliente_id: clienteId, ordem: creds.length };
      ({ error: err } = await sb.from("rbo_client_credentials").insert([payload]));
    } else {
      const currentOrdem = creds.find(c => c.id === editId)?.ordem ?? rest.ordem ?? 0;
      ({ error: err } = await sb.from("rbo_client_credentials")
        .update({ ...rest, ordem: currentOrdem })
        .eq("id", editId));
    }
    if (err) alert("Erro: " + err.message);
    else { await load(); setModal(false); }
    setSaving(false);
  };

  const del = async id => {
    if (!confirm("Eliminar credencial?")) return;
    await sb.from("rbo_client_credentials").delete().eq("id", id);
    await load();
  };

  const togglePwd = id => setShowPwd(s => ({...s, [id]: !s[id]}));

  const reorderList = (fromId, toId) => {
    const from = creds.find(c => c.id === fromId);
    const rest  = creds.filter(c => c.id !== fromId);
    const toIdx = rest.findIndex(c => c.id === toId);
    const next  = [...rest];
    next.splice(toIdx >= 0 ? toIdx : rest.length, 0, from);
    return next;
  };

  const saveOrder = async (newList) => {
    setCreds(newList); // optimistic
    await Promise.all(newList.map((c, i) =>
      sb.from("rbo_client_credentials").update({ ordem: i }).eq("id", c.id)
    ));
  };

  const sameGroup = (idA, idB) => {
    const a = creds.find(c => c.id === idA);
    const b = creds.find(c => c.id === idB);
    return (a?.categoria || "") === (b?.categoria || "");
  };

  // Desktop DnD
  const onDragStart = (e, id) => { setDragging(id); e.dataTransfer.effectAllowed = "move"; };
  const onDragOver  = (e, id) => { e.preventDefault(); if (id !== dragging && sameGroup(dragging, id)) setDragOver(id); };
  const onDragEnd   = ()      => { setDragging(null); setDragOver(null); };
  const onDrop      = async (e, id) => {
    e.preventDefault();
    if (dragging && dragging !== id && sameGroup(dragging, id)) await saveOrder(reorderList(dragging, id));
    setDragging(null); setDragOver(null);
  };

  // Mobile touch DnD
  const onTouchStart = (e, id) => { touchRef.current = id; setDragging(id); };
  const onTouchMove  = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const credEl = el?.closest("[data-cred-id]");
    const overId = credEl ? Number(credEl.getAttribute("data-cred-id")) : null;
    if (overId && overId !== touchRef.current && sameGroup(touchRef.current, overId)) setDragOver(overId);
  };
  const onTouchEnd = async () => {
    if (touchRef.current && dragOver && touchRef.current !== dragOver && sameGroup(touchRef.current, dragOver)) {
      await saveOrder(reorderList(touchRef.current, dragOver));
    }
    setDragging(null); setDragOver(null); touchRef.current = null;
  };

  const q = search.trim().toLowerCase();
  const filteredCreds = q === "" ? creds : creds.filter(c =>
    (c.categoria || "").toLowerCase().includes(q) ||
    (c.url_ip || "").toLowerCase().includes(q) ||
    (c.utilizador || "").toLowerCase().includes(q)
  );

  const groups = (() => {
    const map = new Map();
    filteredCreds.forEach(c => {
      const key = c.categoria || "";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(c);
    });
    return Array.from(map.entries()).sort((a, b) => (a[0] === "" ? 1 : 0) - (b[0] === "" ? 1 : 0));
  })();

  return (
    <Card style={{padding:0,overflow:"hidden",marginTop:16}}>
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.grey100}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Icon name="key" size={15} color={C.teal}/>
          <h3 style={{fontSize:15,fontWeight:600,color:C.grey800}}>Credenciais e Acessos</h3>
        </div>
        <Btn size="sm" icon="plus" onClick={openNew}>Nova</Btn>
      </div>

      {creds.length > 0 && (
        <div style={{padding:"12px 20px",borderBottom:`1px solid ${C.grey100}`}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar por categoria, URL/IP ou utilizador..."
            style={{width:"100%",maxWidth:320,border:`1.5px solid ${C.grey200}`,borderRadius:8,padding:"7px 12px",fontSize:13,outline:"none",background:C.white,color:C.grey800}}/>
        </div>
      )}

      {loading ? <Loading/> : creds.length === 0 ? (
        <div style={{padding:"24px 20px",textAlign:"center",color:C.grey400,fontSize:13}}>
          Sem credenciais registadas
        </div>
      ) : groups.length === 0 ? (
        <div style={{padding:"24px 20px",textAlign:"center",color:C.grey400,fontSize:13}}>
          Sem resultados para "{search}"
        </div>
      ) : (
        <div>
          {groups.map(([catName, items], gi) => (
            <div key={catName || "__sem_categoria__"}>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:gi===0?"14px 20px 8px":"30px 20px 8px"}}>
                <span style={{fontSize:12,fontWeight:800,color:C.teal,textTransform:"uppercase",letterSpacing:".7px",whiteSpace:"nowrap"}}>
                  {catName || "Sem categoria"}
                </span>
                <div style={{flex:1,height:1,background:C.grey200}}/>
              </div>
              {items.map((c, i) => (
                <div
                  key={c.id}
                  data-cred-id={c.id}
                  onDragOver={e=>onDragOver(e,c.id)}
                  onDrop={e=>onDrop(e,c.id)}
                  style={{
                    borderBottom:i<items.length-1?`1px solid ${C.grey100}`:"none",
                    opacity: dragging===c.id ? 0.35 : 1,
                    background: dragOver===c.id ? C.teal+"12" : "transparent",
                    borderLeft: dragOver===c.id ? `3px solid ${C.teal}` : "3px solid transparent",
                    transition:"opacity .15s, background .1s, border .1s",
                  }}>
                  {/* URL/IP — discreet subtitle, kept out of the data line */}
                  {c.url_ip && (
                    <div style={{padding:"6px 20px 0",fontSize:11,color:C.grey400,fontFamily:"'DM Mono',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {c.url_ip}
                    </div>
                  )}
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"4px 20px"}}>
                    {/* Grip handle — the only draggable area */}
                    <div
                      title="Arrastar para reordenar"
                      draggable
                      onDragStart={e=>onDragStart(e,c.id)}
                      onDragEnd={onDragEnd}
                      onTouchStart={e=>onTouchStart(e,c.id)}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}
                      style={{cursor:"grab",padding:"6px 2px",color:C.grey400,flexShrink:0,touchAction:"none",display:"flex",alignItems:"center"}}>
                      <Icon name="grip" size={14} color={C.grey400}/>
                    </div>

                    {/* Fixed 50/50 grid — password column always starts at the same x */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:4,minWidth:0}}>
                        {c.utilizador && (
                          <>
                            <span style={{fontSize:13,color:C.grey800,fontFamily:"'DM Mono',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.utilizador}</span>
                            <CopyBtn value={c.utilizador} isPassword={false}/>
                          </>
                        )}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:4,minWidth:0}}>
                        {c.password && (
                          <>
                            <span style={{fontSize:13,color:C.grey800,fontFamily:"'DM Mono',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                              {showPwd[c.id] ? c.password : "••••••••"}
                            </span>
                            <button onClick={()=>togglePwd(c.id)} title={showPwd[c.id]?"Ocultar":"Mostrar"}
                              style={{background:"none",border:"none",cursor:"pointer",padding:"3px",borderRadius:5,display:"flex",alignItems:"center",flexShrink:0}}
                              onMouseEnter={e=>e.currentTarget.style.background=C.grey100}
                              onMouseLeave={e=>e.currentTarget.style.background="none"}>
                              <Icon name={showPwd[c.id]?"eyeOff":"eye"} size={13} color={C.grey400}/>
                            </button>
                            <CopyBtn value={c.password} isPassword={true}/>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Notas indicator — fixed-width slot so it never shifts the actions column */}
                    <div style={{width:16,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {c.notas && (
                        <span title={c.notas} style={{display:"flex"}}>
                          <Icon name="note" size={13} color={C.grey300}/>
                        </span>
                      )}
                    </div>

                    <div style={{display:"flex",gap:0,flexShrink:0}}>
                      <Btn variant="ghost" size="sm" icon="edit"  onClick={()=>openEdit(c)}/>
                      <Btn variant="ghost" size="sm" icon="trash" onClick={()=>del(c.id)}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={editId ? "Editar credencial" : "Nova credencial"} onClose={()=>setModal(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <label style={{fontSize:13,fontWeight:500,color:C.grey600}}>Categoria / Serviço</label>
                <input
                  list="cred-categories"
                  value={form.categoria}
                  onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}
                  placeholder="Escolhe ou escreve uma nova..."
                  style={{border:`1.5px solid ${C.grey200}`,borderRadius:8,padding:"8px 12px",fontSize:14,outline:"none",height:38,background:C.white,color:C.grey800,width:"100%"}}
                />
                <datalist id="cred-categories">
                  {categories.map(c=><option key={c} value={c}/>)}
                </datalist>
                {form.categoria && !categories.includes(form.categoria) && (
                  <div style={{fontSize:11,color:C.amber,display:"flex",alignItems:"center",gap:4}}>
                    <Icon name="plus" size={11} color={C.amber}/> Nova categoria — será adicionada automaticamente
                  </div>
                )}
              </div>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <Input label="URL / IP" value={form.url_ip} onChange={v=>setForm(f=>({...f,url_ip:v}))} placeholder="ex: 192.168.1.1 ou https://..."/>
            </div>
            <Input label="Utilizador" value={form.utilizador} onChange={v=>setForm(f=>({...f,utilizador:v}))} placeholder="email ou username"/>
            <Input label="Password" value={form.password} onChange={v=>setForm(f=>({...f,password:v}))} type="password" placeholder="••••••••"/>
            <div style={{gridColumn:"1/-1"}}>
              <Input label="Notas" value={form.notas} onChange={v=>setForm(f=>({...f,notas:v}))} textarea rows={3} placeholder="Informações adicionais..."/>
            </div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
            <Btn variant="secondary" onClick={()=>setModal(false)}>Cancelar</Btn>
            <Btn onClick={save} disabled={saving}>{saving?"A guardar...":"Guardar"}</Btn>
          </div>
        </Modal>
      )}
    </Card>
  );
};
