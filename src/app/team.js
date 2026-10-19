/* Attendance, coach notes, wellness, notices, end-of-cycle profile */
/* ---------- attendance ---------- */
const attKey = (date,g,kind) => date+'|'+g+(kind?'|'+kind:'');
const ATT_ST = [['p','Presente'],['a','Assente'],['r','Ritardo'],['w','Pioggia']];
const ATT_KIND = {'':'Tennis', fit:'Preparazione atletica', mind:'Preparazione mentale'};
const attKindOf = () => S.session.role==='fit' ? 'fit' : S.session.role==='mind' ? 'mind' : '';
const attIcon = v => v==='p'?'✓':v==='r'?'R':v==='w'?'☂':'✗';
const attCls = v => v==='g' ? 'a' : v;
const attPresent = v => v==='p' || v==='r';
function attView(){
  const kind = U.attKind ?? attKindOf();
  const g = grp(U.attGroup) || teamGroups()[0]; const date = U.attDate || todayISO();
  const rec = (S.att||{})[attKey(date,g.id,kind)] || {};
  const as = S.athletes.filter(a=>a.groupId===g.id), np = as.filter(a=>attPresent(rec[a.id])).length;
  return `<button class="btn ghost" data-a="homeback" style="align-self:flex-start">‹ Home</button>
    <section class="card"><span class="eyebrow">Presenze · ${esc(ATT_KIND[kind])} · ${esc(g.name)}</span><h1>${np} su ${as.length}</h1>
      <input id="f-attdate" class="input" type="date" value="${date}" data-c="attdate">
      <div class="row"><button class="btn ghost" data-a="attall" data-k="p" style="flex:1">Tutti presenti</button><button class="btn ghost" data-a="attall" data-k="w" style="flex:1">Pioggia per tutti</button></div></section>
    <section class="card" style="padding:4px 16px"><div class="list">${as.map(a=>`<div style="display:flex;flex-direction:column;gap:6px;padding:10px 0"><b>${esc(a.name)}</b>
      <div class="seg att" role="group" aria-label="Presenza di ${esc(a.name)}">${ATT_ST.map(([k,l])=>`<button data-a="attset" data-k="${a.id}" data-v="${k}" aria-pressed="${attCls(rec[a.id])===k}">${l}</button>`).join('')}</div></div>`).join('')}</div></section>
    <p class="muted small">Si salva da solo a ogni tocco. Ritardo conta come presente; con la pioggia la seduta non si conta.</p>`;
}
function attStats(id, kind=''){
  const a = ath(id), m = todayISO().slice(0,7), suf = '|'+a.groupId+(kind?'|'+kind:'');
  const rows = Object.entries(S.att||{}).filter(([k])=>k.endsWith(suf) && k.split('|').length===(kind?3:2)).map(([k,v])=>({date:k.split('|')[0], v:v[id]})).filter(x=>x.v).sort((x,y)=>x.date<y.date?-1:1);
  const month = rows.filter(x=>x.date.startsWith(m) && x.v!=='w'), p = month.filter(x=>attPresent(x.v)).length;
  return {rows, month, p};
}
function attCard(id){
  const parts = ['', 'fit', 'mind'].map(k=>({k, st:attStats(id,k)})).filter(x=>x.st.rows.length); if(!parts.length) return '';
  return `<section class="card"><h3>Presenze</h3>${parts.map(({k,st})=>`<div style="display:flex;flex-direction:column;gap:6px">${parts.length>1||k?`<span class="eyebrow">${ATT_KIND[k]}</span>`:''}<p><b>${st.p} su ${st.month.length}</b> sedute questo mese</p>
    <div class="row">${st.rows.slice(-14).map(x=>`<span class="attdot ${attCls(x.v)}" title="${dLabel(x.date)}">${attIcon(x.v)}</span>`).join('')}</div></div>`).join('')}
    <p class="small muted">✓ presente · R ritardo · ✗ assente · ☂ pioggia</p></section>`;
}

/* ---------- coach notes, wellness, notices ---------- */
function notesCard(id){
  if(S.session.role!=='coach') return '';
  const ns = (S.notes||[]).filter(n=>n.athleteId===id).sort((a,b)=>a.date<b.date?1:-1);
  return `<section class="card"><h3>Note del maestro</h3>
    <div class="row"><input id="f-note" class="input" placeholder="Es. oggi rovescio molto meglio" style="flex:1;min-width:0"><button class="btn" data-a="noteadd" data-k="${id}">Aggiungi</button></div>
    ${ns.length?`<div class="list small">${ns.slice(0,12).map(n=>`<div class="row between" style="flex-wrap:nowrap;align-items:flex-start"><span><span class="muted">${fdate(n.date)}</span> · ${esc(n.text)}</span><button class="chip" data-a="notedel" data-k="${n.id}" aria-label="Togli nota">✕</button></div>`).join('')}</div>`:'<p class="small muted">Solo tu le vedi.</p>'}</section>`;
}
function wellToday(){
  const a = me(), d = todayISO(), w = (S.well||[]).find(x=>x.athleteId===a.id && x.date===d) || {};
  const W0 = U.wellDraft = U.wellDraft && U.wellDraft.date===d ? U.wellDraft : {date:d, fat:w.fat, pain:w.pain, where:w.where||''};
  return `<section class="card"><span class="eyebrow">Dopo l'allenamento</span><h3>Come stai?</h3>
    <div class="field"><label>Quanto è stato faticoso (1 poco, 5 moltissimo)</label><div class="seg" role="group">${[1,2,3,4,5].map(n=>`<button data-a="wfat" data-k="${n}" aria-pressed="${W0.fat===n}">${n}</button>`).join('')}</div></div>
    <div class="field"><label>Hai dolore da qualche parte?</label><div class="seg" role="group"><button data-a="wpain" data-k="0" aria-pressed="${W0.pain===false}">No</button><button data-a="wpain" data-k="1" aria-pressed="${W0.pain===true}">Sì</button></div></div>
    ${W0.pain?`<input id="f-where" class="input" data-c="wwhere" value="${esc(W0.where)}" placeholder="Dove? Es. polso destro">`:''}
    <button class="btn" data-a="wsave">${w.date?'Aggiorna':'Invia al maestro'}</button></section>`;
}
function wellCard(id){
  const ws = (S.well||[]).filter(x=>x.athleteId===id).sort((a,b)=>a.date<b.date?1:-1).slice(0,8);
  if(!ws.length) return '';
  return `<section class="card"><h3>Fatica e dolori</h3><div class="list small">${ws.map(w=>`<div class="row between"><span>${dLabel(w.date)}</span><span>Fatica <b>${w.fat||'–'}/5</b>${w.pain?` · <span style="color:var(--ko);font-weight:700">dolore${w.where?': '+esc(w.where):''}</span>`:''}</span></div>`).join('')}</div></section>`;
}
function noticesFor(role, gid){
  const lim = new Date(Date.now()-21*864e5).toISOString();
  const ns = (S.notices||[]).filter(n=>n.date>lim && (n.to==='all'||n.to===role) && (!n.groupId||n.groupId===gid)).sort((a,b)=>a.date<b.date?1:-1).slice(0,3);
  return ns.length ? `<section class="card notice"><span class="eyebrow">Avvisi</span>${ns.map(n=>`<div><p>${esc(n.text)}</p><p class="small muted">${fdate(n.date)}</p></div>`).join('')}</section>` : '';
}

/* ---------- final profile (end of cycle) ---------- */
function finalProfile(id){
  const a = ath(id), tipo = formsOf(id,'tipo'), arma = formsOf(id,'arma'), pr = (S.profiles||{})[id] || {};
  const first = tipo[0], last = tipo[tipo.length-1], la = arma[arma.length-1];
  const ms = S.matches.filter(m=>m.done && m.a.id===id && m.mode!=='task'), cs = mergeStats(ms).filter(r=>r.n>=3).sort((x,y)=>pct(y.won,y.n)-pct(x.won,x.n));
  const st = attStats(id), goals = privOf(id).goals, done = goals.filter(g=>g.st==='done').length;
  return `<button class="btn ghost" data-a="finalclose" style="align-self:flex-start">‹ ${esc(a.name)}</button>
    <section class="hero"><div class="lines" aria-hidden="true"></div><span class="eyebrow" style="color:var(--clay)">Profilo di fine ciclo · ${esc(grp(a.groupId).name)}</span><h1>${esc(a.name)}</h1><p>${fdate(new Date().toISOString())}</p></section>
    <section class="card"><h3>Come gioca</h3>
      ${last?`<p>Tipologia più vicina: <b style="color:${tcol(tipoOf(last).first)}">${tname(tipoOf(last).first)}</b>, poi ${tname(tipoOf(last).second)}.</p>${first&&first!==last?`<p class="small muted">All'inizio: ${tname(tipoOf(first).first)}.</p>`:''}`:'<p class="muted">Questionario non compilato.</p>'}
      ${la?`<p>La sua arma: <b>${esc(la.ans.arma||'–')}</b>${la.ans.evito?` · evita: ${esc(la.ans.evito)}`:''}</p>`:''}</section>
    <section class="card"><h3>Punti di forza e da migliorare</h3>${PAREAS.some(([k])=>pr[k+'f']||pr[k+'m'])?`<div class="list">${PAREAS.map(([k,l])=>`<div><span class="tag pri">${l}</span><p class="small" style="margin-top:4px"><b style="color:var(--ok)">+</b> ${esc(pr[k+'f']||'–')}</p><p class="small"><b style="color:var(--clay)">→</b> ${esc(pr[k+'m']||'–')}</p></div>`).join('')}</div>`:'<p class="muted">Scheda atleta da compilare.</p>'}</section>
    <section class="card"><h3>Test</h3>${testTable(id)}</section>
    <section class="card"><h3>In partita</h3>${cs.length?`<p class="small muted">Le scelte che hanno funzionato di più (almeno 3 volte).</p>${choiceBars(cs.slice(0,4))}`:'<p class="muted">Poche partite analizzate.</p>'}</section>
    <section class="card"><div class="kpis"><div class="kpi"><b>${st.month.length?pct(st.p,st.month.length)+'%':'–'}</b><span>presenze questo mese</span></div><div class="kpi"><b>${goals.length?done+'/'+goals.length:'–'}</b><span>obiettivi raggiunti</span></div><div class="kpi"><b>${ms.length}</b><span>partite analizzate</span></div></div></section>
    <div class="note"><b>Da usare all'incontro individuale:</b> prima quello che va bene, poi una sola cosa da migliorare.</div>`;
}

