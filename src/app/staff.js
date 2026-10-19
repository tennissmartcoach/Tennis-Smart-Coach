/* Mental coach and fitness coach: forms, cycles, programmes */
/* ---------- mental coach: custom forms ---------- */
const mAssignOf = id => (S.massign||[]).filter(x=>x.athleteId===id);
const mFormById = id => (S.mforms||[]).find(f=>f.id===id);
/* who fills which form: built-in visibility (S.mforms entry {fvis}) + shared picker */
const fvisAll = () => ((S.mforms||[]).find(f=>f.fvis)||{}).fvis || {};
const fvisOf = k => { const v = fvisAll()[k]; return v ? {all:!!v.all, groups:v.groups||[], aths:v.aths||[]} : {all:true, groups:[], aths:[]}; };
const formFor = (k, a) => { const v = fvisOf(k); return v.all || v.groups.includes(a.groupId) || v.aths.includes(a.id); };
function setFvis(k, v){ S.mforms = S.mforms||[]; let e = S.mforms.find(f=>f.fvis); if(!e){ e = {id:'fvis', fvis:{}}; S.mforms.push(e); } e.fvis[k] = v; save(); }
const gName = g => g.id===PRIV_ID ? 'Lezioni private' : g.name;
const sortedGroups = () => S.groups.slice().sort((x,y)=>(x.id===PRIV_ID)-(y.id===PRIV_ID));
function whoPicker(sel, actG, actA){
  return sortedGroups().map(g=>{ const as = S.athletes.filter(a=>a.groupId===g.id); if(!as.length) return ''; const on = sel.groups.includes(g.id);
    return `<div style="display:flex;flex-direction:column;gap:6px;padding:10px 0;border-top:1px solid var(--line)"><button class="chip" data-a="${actG}" data-k="${g.id}" aria-pressed="${on}" style="align-self:flex-start"><b>${esc(gName(g))}</b> · tutto il gruppo</button>
      ${on?`<p class="small muted">Tutti i ${as.length} atleti del gruppo, anche quelli che aggiungerai.</p>`:`<div class="chips">${as.map(a=>`<button class="chip" data-a="${actA}" data-k="${a.id}" aria-pressed="${sel.aths.includes(a.id)}">${esc(a.name)}</button>`).join('')}</div>`}</div>`; }).join('');
}
function whoSummary(v){
  if(v.all) return 'Tutti';
  const gs = v.groups.map(id=>grp(id)).filter(Boolean).map(gName), as = v.aths.map(id=>ath(id)).filter(Boolean).map(a=>a.name);
  return [...gs, ...as].join(', ') || 'Nessuno';
}
/* ---------- mental coach programme: cycles by theme (S.mforms entries {mcycle:true}); private notes in S.mnotes ---------- */
const mCycles = () => (S.mforms||[]).filter(f=>f.mcycle);
const mCycle = id => mCycles().find(c=>c.id===id);
const cycleAths = c => [...new Set([...S.athletes.filter(a=>(c.who?.groups||[]).includes(a.groupId)).map(a=>a.id), ...(c.who?.aths||[]).filter(id=>ath(id))])];
const cycleFor = (c, a) => (c.who?.groups||[]).includes(a.groupId) || (c.who?.aths||[]).includes(a.id);
const meetSort = (x,y) => ((x.date||'9')+(x.time||'')) < ((y.date||'9')+(y.time||'')) ? -1 : 1;
const meetWhen = m => m.date ? `${WD[new Date(m.date+'T12:00').getDay()]} ${fdate(m.date+'T12:00')}${m.time?' · '+m.time:''}` : 'data da fissare';
function mprogView(){
  if(U.mcOpen && mCycle(U.mcOpen)) return mCycleView(mCycle(U.mcOpen));
  const today = todayISO(), cs = mCycles().filter(c=>!S.athletes.length || cycleAths(c).length || !(c.who?.groups||[]).length && !(c.who?.aths||[]).length);
  return `<h1>Programma mentale</h1><p class="small muted">Cicli per tema, ognuno con i suoi incontri. Atleti e genitori vedono il prossimo incontro e il compito per casa.</p>
    <button class="btn clay block" data-a="mcnew">+ Nuovo ciclo</button>
    ${cs.length?`<section class="card" style="padding:4px 16px"><div class="list">${cs.map(c=>{ const ms = (c.meets||[]).slice().sort(meetSort), nx = ms.find(m=>!m.done && (!m.date || m.date>=today)), dn = ms.filter(m=>m.done).length;
      return `<button class="item" data-a="mcopen" data-k="${c.id}"><span class="grow"><b style="font-size:17px">${esc(c.title||'Ciclo senza titolo')}</b><br><span class="small muted">${esc(whoSummary({all:false, groups:c.who?.groups||[], aths:c.who?.aths||[]}))} · ${ms.length} ${ms.length===1?'incontro':'incontri'}${ms.length?`, ${dn} fatti`:''}</span>${nx?`<br><span class="small">Prossimo: <b>${esc(meetWhen(nx))}</b></span>`:''}</span><span class="chev">›</span></button>`; }).join('')}</div></section>`
      :'<section class="card"><p class="muted">Nessun ciclo. Crea il primo: per esempio "Gestione dell’errore", 4 incontri con il gruppo AGO 1.</p></section>'}`;
}
function mCycleView(c){
  const ms = (c.meets||[]).slice().sort(meetSort), forms = (S.mforms||[]).filter(f=>!f.builtin && !f.fvis && !f.mcycle), notes = S.mnotes||{};
  const who = {all:false, groups:c.who?.groups||[], aths:c.who?.aths||[]}, n = cycleAths(c).length;
  return `<button class="btn ghost" data-a="mcclose" style="align-self:flex-start">‹ Programma mentale</button>
    <section class="card"><span class="eyebrow">Ciclo</span>
      <div class="field"><label for="mc-t">Tema</label><input id="mc-t" class="input inbig" data-c="mcf" data-k="title" value="${esc(c.title||'')}" placeholder="Es. Gestione dell’errore"></div>
      <div class="field"><label for="mc-g">Obiettivo del ciclo</label><textarea id="mc-g" class="input" rows="2" data-c="mcf" data-k="goal" placeholder="Es. Dopo un errore, tornare concentrati entro il punto successivo">${esc(c.goal||'')}</textarea></div></section>
    <section class="card"><h3>Per chi</h3><p class="small muted">Gruppi interi o atleti singoli.</p>${whoPicker(who,'mcg','mca')}<p class="small">Adesso: <b>${esc(whoSummary(who))}</b>${n?` · ${n} atleti`:''}</p></section>
    <h2 class="hsec">Incontri</h2>
    ${ms.map((m,i)=>`<section class="card" ${m.done?'style="opacity:.8"':''}>
      <div class="row between"><span class="eyebrow">Incontro ${i+1}${m.done?' · fatto ✓':''}</span><span class="row" style="gap:6px"><button class="chip" data-a="mmdone" data-k="${c.id}:${m.id}" aria-pressed="${!!m.done}">${m.done?'Fatto ✓':'Segna fatto'}</button>${U.confirm==='mm:'+m.id?`<button class="btn danger" data-a="mtgdel" data-k="${c.id}:${m.id}" style="min-height:40px;padding:0 12px">Togli</button><button class="chip" data-a="nodel">No</button>`:`<button class="chip" data-a="askdel" data-k="mm:${m.id}" aria-label="Togli incontro">✕</button>`}</span></div>
      <div class="row"><div class="field" style="flex:1;min-width:140px"><label for="mm-d-${m.id}">Giorno</label><input id="mm-d-${m.id}" class="input" type="date" data-c="mmf" data-k="${c.id}:${m.id}:date" value="${esc(m.date||'')}"></div><div class="field" style="flex:1;min-width:100px"><label for="mm-h-${m.id}">Ora</label><input id="mm-h-${m.id}" class="input" type="time" data-c="mmf" data-k="${c.id}:${m.id}:time" value="${esc(m.time||'')}"></div></div>
      <div class="field"><label for="mm-t-${m.id}">Titolo</label><input id="mm-t-${m.id}" class="input" data-c="mmf" data-k="${c.id}:${m.id}:title" value="${esc(m.title||'')}" placeholder="Es. Cosa mi dico dopo un errore"></div>
      <div class="field"><label for="mm-a-${m.id}">Attività</label><textarea id="mm-a-${m.id}" class="input" rows="3" data-c="mmf" data-k="${c.id}:${m.id}:act" placeholder="Es. Discussione di gruppo, poi la routine dei 15 secondi in campo">${esc(m.act||'')}</textarea></div>
      <div class="field"><label for="mm-h2-${m.id}">Compito per casa <span class="muted">(lo vedono atleti e genitori)</span></label><textarea id="mm-h2-${m.id}" class="input" rows="2" data-c="mmf" data-k="${c.id}:${m.id}:home" placeholder="Es. Scrivi la tua parola chiave e usala in partita">${esc(m.home||'')}</textarea></div>
      <div class="field"><label for="mm-f-${m.id}">Scheda collegata</label><select id="mm-f-${m.id}" class="input" data-c="mmform" data-k="${c.id}:${m.id}"><option value="">Nessuna</option>${forms.map(f=>`<option value="${f.id}" ${m.formId===f.id?'selected':''}>${esc(f.title)}</option>`).join('')}</select>
        ${m.formId && mFormById(m.formId) && n ? `<button class="chip" data-a="mmassign" data-k="${c.id}:${m.id}" style="align-self:flex-start">Assegna la scheda ai ${n} atleti del ciclo</button>` : forms.length?'':'<span class="small muted">Le schede si creano in Schede → Modifica e assegna.</span>'}</div>
      <div class="field"><label for="mm-n-${m.id}">Note riservate <span class="muted">(solo staff)</span></label><textarea id="mm-n-${m.id}" class="input" rows="2" data-c="mmnote" data-k="${m.id}" placeholder="Com’è andata, chi seguire di più">${esc(notes[m.id]||'')}</textarea></div>
    </section>`).join('')}
    <button class="btn ghost block" data-a="mtgadd" data-k="${c.id}">+ Aggiungi incontro</button>
    ${U.confirm==='mc:'+c.id?`<section class="card"><p>Togliere il ciclo "${esc(c.title||'')}" con tutti i suoi incontri?</p><div class="row"><button class="btn danger" data-a="mcdel" data-k="${c.id}">Sì, togli</button><button class="btn ghost" data-a="nodel">No</button></div></section>`:`<button class="chip" data-a="askdel" data-k="mc:${c.id}" style="align-self:center">Togli il ciclo</button>`}`;
}
function staffProgCards(id){
  const role = S.session.role; if(role!=='coach' && role!=='fit' && role!=='mind') return '';
  const a = ath(id); if(!a) return ''; const g = grp(a.groupId), today = todayISO(); let out = '';
  if(g && g.id!==PRIV_ID && role!=='fit'){ const o = fitProgOf(g.id), w = o.weeks[o.cur-1], pk = pickOf(g), m = sDone(g);
    const days = w ? pk.map((i,k)=>({k, i, d:w.days[i]||{}})).filter(x=>x.d.title||x.d.text) : [];
    out += `<section class="card" style="border-left:4px solid #F2994A"><span class="eyebrow" style="color:#F2994A">Preparazione atletica · ${esc(g.name)}</span>
      <h3>Settimana ${o.cur}${w&&w.name?' · '+esc(w.name):''}</h3>
      ${days.length?`<div class="list small">${days.map(x=>`<div><b>Allenamento ${x.k+1}${m[x.i]?' ✓':''}</b>${x.d.title?': '+esc(x.d.title):''}${x.d.text?`<br><span class="muted" style="white-space:pre-line">${esc(x.d.text)}</span>`:''}</div>`).join('')}</div>`:'<p class="small muted">Il preparatore atletico non ha ancora scritto le sedute di questa settimana.</p>'}</section>`; }
  if(role!=='mind'){ const cs = mCycles().filter(c=>cycleFor(c,a));
    if(cs.length) out += `<section class="card" style="border-left:4px solid #A77BF0"><span class="eyebrow" style="color:#A77BF0">Preparazione mentale</span>
      <div class="list">${cs.map(c=>{ const ms=(c.meets||[]).slice().sort(meetSort), dn=ms.filter(m=>m.done).length, nx=ms.find(m=>!m.done && m.date && m.date>=today), last=ms.filter(m=>m.done).pop();
        return `<div><b>${esc(c.title||'Ciclo')}</b> <span class="small muted">· ${dn} di ${ms.length} incontri fatti</span>${c.goal?`<br><span class="small">${esc(c.goal)}</span>`:''}
          ${nx?`<br><span class="small">Prossimo: <b>${esc(meetWhen(nx))}</b>${nx.title?' · '+esc(nx.title):''}</span>`:''}${last&&last.home?`<br><span class="small muted">Compito per casa: ${esc(last.home)}</span>`:''}</div>`; }).join('')}</div></section>`; }
  return out;
}
function groupStaffStrip(g){
  if(!g || g.id===PRIV_ID) return '';
  const today = todayISO(), di = todayIdx(g), fd = fitDay(g, di) || {};
  const gAth = new Set(S.athletes.filter(a=>a.groupId===g.id).map(a=>a.id));
  const cyc = mCycles().filter(c=>(c.who?.groups||[]).includes(g.id) || (c.who?.aths||[]).some(id=>gAth.has(id)));
  const nx = cyc.flatMap(c=>(c.meets||[]).filter(m=>!m.done && m.date && m.date>=today).map(m=>({c,m}))).sort((x,y)=>meetSort(x.m,y.m))[0];
  const row = (col, lab, body) => `<div style="display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border-radius:10px;background:${col}1F"><span style="font:700 11px var(--f-body);letter-spacing:.1em;text-transform:uppercase;color:${col};min-width:66px;padding-top:3px">${lab}</span><span class="small" style="flex:1;min-width:0">${body}</span></div>`;
  return `<div style="display:flex;flex-direction:column;gap:6px">
    ${row('#F2994A','Atletica', fd.title||fd.text ? `<b>${esc(fd.title||'Seduta')}</b>${fd.text?`<br><span class="muted" style="white-space:pre-line">${esc(fd.text)}</span>`:''}` : '<span class="muted">seduta di oggi non ancora scritta</span>')}
    ${row('#A77BF0','Mentale', nx ? `<b>${esc(nx.c.title||'')}</b>${nx.m.title?' · '+esc(nx.m.title):''}<br><span class="muted">${esc(meetWhen(nx.m))}${(nx.c.who?.groups||[]).includes(g.id)?'':' · solo alcuni atleti'}</span>` : `<span class="muted">${cyc.length?'nessun incontro in programma':'nessun ciclo per questo gruppo'}</span>`)}
  </div>`;
}
function mindNextCard(id){
  const a = ath(id); if(!a) return ''; const today = todayISO();
  const items = mCycles().filter(c=>cycleFor(c,a)).flatMap(c=>(c.meets||[]).map(m=>({c,m})));
  const next = items.filter(x=>!x.m.done && x.m.date && x.m.date>=today).sort((x,y)=>meetSort(x.m,y.m))[0];
  const last = items.filter(x=>x.m.done || (x.m.date && x.m.date<today)).sort((x,y)=>meetSort(y.m,x.m))[0];
  const hw = [next, last].find(x=>x && x.m.home);
  if(!next && !hw) return '';
  return `<section class="card" style="border-left:4px solid #A77BF0"><span class="eyebrow" style="color:#A77BF0">Preparazione mentale</span>
    ${next?`<h3>${esc(next.c.title||'')}${next.m.title?': '+esc(next.m.title):''}</h3><p class="small">Prossimo incontro: <b>${esc(meetWhen(next.m))}</b></p>`:''}
    ${hw?`<p class="small"><b>Compito per casa${hw===last&&next?' (dall’ultimo incontro)':''}:</b> ${esc(hw.m.home)}</p>`:''}</section>`;
}
function mindSchede(){
  if(U.biEd) return biEditView();
  if(U.mEd) return mEditView();
  if(U.biOpen) return biDetail(U.biOpen);
  if(U.mfOpen && mFormById(U.mfOpen)) return mFormDetail(mFormById(U.mfOpen));
  const mode = U.msMode || 'mine';
  const top = `<h1>Schede</h1><div class="seg" role="group"><button data-a="msmode" data-k="mine" aria-pressed="${mode==='mine'}">Modifica e assegna</button><button data-a="msmode" data-k="resp" aria-pressed="${mode==='resp'}">Risposte</button></div>`;
  if(mode==='mine'){
    const fs = (S.mforms || []).filter(f=>!f.builtin && !f.fvis && !f.mcycle);
    return top + `<section class="card" style="padding:4px 16px 12px"><h3 style="margin-top:12px">Schede dell'app</h3><p class="small muted">Tocca una scheda per cambiare le domande e scegliere chi la compila.</p><div class="list">${BUILTIN.map(k=>`<button class="item" data-a="bidopen" data-k="${k}"><span class="grow"><b style="font-size:17px">${esc(fname(k))}</b>${tplCustom(k)?' <span class="tag pri">modificata</span>':''}<br><span class="small muted">${BI_WHO[k]}</span><br><span class="small">${k==='gen'?'Famiglie':'La compilano'}: <b>${esc(whoSummary(fvisOf(k)))}</b></span></span><span class="chev">›</span></button>`).join('')}</div></section>
      <h2>Le mie schede</h2><p class="small muted">Schede nuove, create da te, da assegnare a gruppi o ad atleti singoli.</p>
      <button class="btn clay block" data-a="mednew">+ Nuova scheda</button>
      ${fs.length?`<section class="card" style="padding:4px 16px"><div class="list">${fs.map(f=>{ const as = (S.massign||[]).filter(x=>x.formId===f.id), dn = as.filter(x=>x.done).length; return `<button class="item" data-a="mfopen" data-k="${f.id}"><span class="grow"><b style="font-size:17px">${esc(f.title)}</b><br><span class="small muted">${f.qs.length} domande · assegnata a ${as.length}${as.length?`, ${dn} compilate`:''}</span></span><span class="chev">›</span></button>`; }).join('')}</div></section>`:'<section class="card"><p class="muted">Nessuna scheda creata. Crea la prima e assegnala agli atleti.</p></section>'}`;
  }
  // ---- answers: group -> names -> everything that athlete filled in
  const gs = sortedGroups();
  if(!U.mrGroup || !grp(U.mrGroup)) U.mrGroup = gs[0]?.id;
  if(U.mrAth && ath(U.mrAth)) return top + athAnswers(ath(U.mrAth));
  const as = S.athletes.filter(a=>a.groupId===U.mrGroup);
  return top + `<div class="field"><label for="f-mrgrp">Gruppo</label><select id="f-mrgrp" class="input" data-c="mrgrp">${gs.map(x=>`<option value="${x.id}" ${x.id===U.mrGroup?'selected':''}>${esc(gName(x))}</option>`).join('')}</select></div>
    ${as.length?`<section class="card" style="padding:4px 16px"><div class="list">${as.map(a=>{ const fs = S.forms.filter(f=>f.athleteId===a.id), ms = (S.massign||[]).filter(x=>x.athleteId===a.id && mFormById(x.formId)), done = fs.length + ms.filter(x=>x.done).length, todo = ms.filter(x=>!x.done).length;
      const last = [...fs.map(f=>f.date), ...ms.filter(x=>x.done).map(x=>x.doneDate)].sort().pop();
      return `<button class="item" data-a="mrathopen" data-k="${a.id}"><span class="grow"><b style="font-size:17px">${esc(a.name)}</b><br><span class="small muted">${done?`${done} ${done===1?'scheda':'schede'} · ultima il ${fdate(last)}`:'Nessuna scheda compilata'}</span>${todo?` <span class="tstat wait">${todo} da compilare</span>`:''}</span><span class="chev">›</span></button>`; }).join('')}</div></section>`:'<section class="card"><p class="muted">Nessun atleta in questo gruppo.</p></section>'}`;
}
function formAnsHtml(f){
  if(f.kind==='tipo'){ const r = tipoOf(f); return `<p class="small">Tipologia più vicina: <b style="color:${tcol(r.first)}">${tname(r.first)}</b>, poi ${tname(r.second)}</p>${tipoBars(f.ans, tplOf(f).tq)}`; }
  let h = '';
  if(f.kind==='arma'){ const rows = (tplOf(f).shots||[]).map(sh=>({x:esc(sh.n), f:f.ans['f'+sh.k], u:f.ans['u'+sh.k]})).filter(r=>r.f||r.u);
    if(rows.length) h += `<div class="scroll-x"><table class="grid"><thead><tr><th>Colpo</th><th>Fiducia</th><th>Uso nei punti importanti</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.x}${r.f&&r.u&&Math.abs(r.f-r.u)>=2?' <span class="tag">da parlarne</span>':''}</td><td>${r.f||'–'}</td><td>${r.u||'–'}</td></tr>`).join('')}</tbody></table></div>`; }
  h += ansLines(tplOf(f), f.ans);
  if(f.kind==='sett'){ const w = W(f.week||1), ch = i => esc(w?.choices?.[i]?.label || '');
    if(f.ans.used!==undefined) h += `<p class="small"><span class="muted">La scelta usata di più:</span> ${ch(f.ans.used)}</p>`;
    if(f.ans.best!==undefined) h += `<p class="small"><span class="muted">Quella che ha fatto vincere più punti:</span> ${ch(f.ans.best)}</p>`; }
  return h || '<p class="small muted">Nessuna risposta.</p>';
}
function athAnswers(a){
  const g = grp(a.groupId);
  const items = [
    ...S.forms.filter(f=>f.athleteId===a.id).map(f=>({id:f.id, date:f.date, title:fname(f.kind), fam:f.by==='parent', done:true, html:()=>formAnsHtml(f)})),
    ...(S.massign||[]).filter(x=>x.athleteId===a.id && mFormById(x.formId)).map(x=>{ const f = mFormById(x.formId); return {id:x.id, date:x.done?x.doneDate:x.date, title:f.title, mine:true, done:x.done,
      html:()=>`<div class="list small">${f.qs.map((q,i)=>`<div><p class="muted">${esc(q.t)}</p><p><b>${q.type==='scale'?(x.answers[i]?x.answers[i]+' su 5':'–'):esc(x.answers[i]||'–')}</b></p></div>`).join('')}</div>`}; })
  ].sort((x,y)=>(x.done===y.done ? (x.date<y.date?1:-1) : (x.done?1:-1)));
  return `<button class="btn ghost" data-a="mrathclose" style="align-self:flex-start">‹ ${esc(g?gName(g):'Atleti')}</button>
    <section class="card"><span class="eyebrow">${esc(g?gName(g):'')}</span><h1>${esc(a.name)}</h1><p class="small muted">${items.filter(x=>x.done).length} schede compilate. Tocca una scheda per leggere le risposte.</p>
      <button class="btn ghost" data-a="answath" data-k="${a.id}" style="align-self:flex-start">Apri la pagina dell'atleta</button></section>
    ${items.length?`<section class="card" style="padding:4px 16px"><div class="list">${items.map(it=>{ const open = U.maOpen===it.id;
      return `<div><button class="item" ${it.done?`data-a="maopen" data-k="${it.id}"`:''} style="width:100%"><span class="grow"><b>${esc(it.title)}</b>${it.fam?' <span class="tag teal">famiglia</span>':''}${it.mine?' <span class="tag pri">tua</span>':''}<br><span class="small">${it.done?`<span class="muted">${fdate(it.date)}</span>`:`<span class="tstat wait">Da compilare</span> <span class="muted">assegnata il ${fdate(it.date)}</span>`}</span></span>${it.done?`<span class="chev">${open?'⌃':'⌄'}</span>`:''}</button>
        ${open?`<div style="padding:4px 0 12px;display:flex;flex-direction:column;gap:6px">${it.html()}</div>`:''}</div>`; }).join('')}</div></section>`:'<section class="card"><p class="muted">Ancora nessuna scheda.</p></section>'}`;
}
function biDetail(k){
  const T = tplNow(k), v = fvisOf(k), fam = k==='gen';
  const n = k==='tipo' ? T.tq.length+' situazioni' : k==='arma' ? (T.shots||[]).length+' colpi e '+T.qs.length+' domande' : T.qs.length+' domande';
  return `<button class="btn ghost" data-a="bidclose" style="align-self:flex-start">‹ Schede</button>
    <section class="card"><span class="eyebrow">${BI_WHO[k]}</span><h1>${esc(T.title)}</h1>${tplCustom(k)?'<span class="tag pri" style="align-self:flex-start">modificata</span>':''}<p class="small muted">${n}</p>
      <button class="btn ghost" data-a="biopen" data-k="${k}" style="align-self:flex-start">Modifica le domande</button></section>
    <section class="card"><h3>${fam?'Quali famiglie la compilano':'Chi la compila'}</h3>
      <div class="seg" role="group"><button data-a="bivmode" data-k="all" aria-pressed="${v.all}">${fam?'Tutte le famiglie':'Tutti gli atleti'}</button><button data-a="bivmode" data-k="sel" aria-pressed="${!v.all}">Solo alcuni</button></div>
      ${v.all?`<p class="small muted">La trovano tutti tra le loro schede.</p>`:`<p class="small muted">Scegli gruppi interi o atleti singoli. Chi non è scelto non la vede.</p>${whoPicker(v,'bivg','biva')}<p class="small">Adesso: <b>${esc(whoSummary(v))}</b></p>`}</section>`;
}
const QT_LAB = [['text','Breve'],['area','Lunga'],['rate','Da 1 a 5'],['seg','Scelta']];
function biEditView(){
  const E = U.biEd, k = E.builtin, isCustom = !!tplCustom(k);
  const qEd = (q,i,n) => `<section class="card"><div class="row between"><span class="eyebrow">Domanda ${i+1}</span><span class="row" style="gap:6px">${i>0?`<button class="chip" data-a="biqup" data-k="${i}" aria-label="Sposta su">↑</button>`:''}<button class="chip" data-a="biqdel" data-k="${i}">Togli</button></span></div>
      <textarea class="input" rows="2" data-c="biq" data-k="${i}" placeholder="Scrivi la domanda">${esc(q.l)}</textarea>
      <div class="seg" role="group">${QT_LAB.map(([t,l])=>`<button data-a="biqt" data-k="${i}" data-v="${t}" aria-pressed="${q.t===t||(t==='seg'&&q.t==='pair')}">${l}</button>`).join('')}</div>
      ${q.t==='seg'||q.t==='pair'?`<div class="field"><label for="bio-${i}">Risposte possibili, separate da /</label><input id="bio-${i}" class="input" data-c="bio" data-k="${i}" value="${esc(q.os ?? (q.o||[]).join(' / '))}" placeholder="Es. Sì / In parte / No"></div>`:''}</section>`;
  let body = '';
  if(k==='tipo'){
    body = `<div class="note small">Ogni risposta corrisponde a una tipologia di gioco. Il risultato è la tipologia scelta più spesso.</div>
      ${E.tq.map((q,i)=>`<section class="card"><div class="row between"><span class="eyebrow">Situazione ${i+1}</span><span class="row" style="gap:6px">${i>0?`<button class="chip" data-a="btqup" data-k="${i}" aria-label="Sposta su">↑</button>`:''}<button class="chip" data-a="btqdel" data-k="${i}">Togli</button></span></div>
        <textarea class="input" rows="2" data-c="btq" data-k="${i}" placeholder="Es. Sei al servizio sul 30-30.">${esc(q.q)}</textarea>
        ${q.o.map((o,j)=>`<div style="display:flex;flex-direction:column;gap:6px;padding-top:10px;border-top:1px solid var(--line)"><textarea class="input" rows="2" data-c="bto" data-k="${i}:${j}" placeholder="Risposta ${j+1}" aria-label="Risposta ${j+1}">${esc(o.t)}</textarea><div class="row" style="gap:6px"><span class="small muted">Tipologia</span><select class="input" style="flex:1;min-width:0" data-c="bty" data-k="${i}:${j}" aria-label="Tipologia della risposta ${j+1}">${TYPES.map(([tk,tn])=>`<option value="${tk}" ${o.ty===tk?'selected':''}>${tn}</option>`).join('')}</select><button class="chip" data-a="btodel" data-k="${i}:${j}" aria-label="Togli risposta ${j+1}">Togli</button></div></div>`).join('')}
        <button class="chip" data-a="btoadd" data-k="${i}" style="align-self:flex-start">+ Risposta</button></section>`).join('')}
      <button class="btn ghost block" data-a="btqadd">+ Aggiungi situazione</button>`;
  } else {
    if(k==='arma') body += `<section class="card"><h3>Colpi da valutare</h3><p class="small muted">Per ogni colpo l'atleta indica quanto si fida e quanto lo usa nei punti importanti.</p>
      ${E.shots.map((sh,i)=>`<div class="row" style="gap:6px"><input class="input" style="flex:1;min-width:0" data-c="bis" data-k="${i}" value="${esc(sh.n)}" aria-label="Colpo ${i+1}"><button class="chip" data-a="bisdel" data-k="${i}" aria-label="Togli ${esc(sh.n)}">✕</button></div>`).join('')}
      <button class="chip" data-a="bisadd" style="align-self:flex-start">+ Colpo</button></section>`;
    body += E.qs.map((q,i)=>qEd(q,i)).join('') + `<button class="btn ghost block" data-a="biqadd">+ Aggiungi domanda</button>`;
    if(k==='sett') body += `<p class="small muted">La parte "Match Analysis" resta in fondo: è collegata alle scelte della settimana del programma.</p>`;
  }
  return `<button class="btn ghost" data-a="biclose" style="align-self:flex-start">‹ Schede</button>
    <h1>Modifica scheda</h1><p class="small muted">${BI_WHO[k]}. Le modifiche valgono per le prossime compilazioni: le schede già compilate restano come sono.</p>
    <section class="card"><div class="field"><label for="bi-t">Titolo</label><input id="bi-t" class="input inbig" data-c="bit" data-k="title" value="${esc(E.title)}"></div>
      <div class="field"><label for="bi-i">Introduzione</label><textarea id="bi-i" class="input" rows="2" data-c="bit" data-k="intro">${esc(E.intro||'')}</textarea></div></section>
    ${body}
    <button class="btn clay block" data-a="bisave">Salva la scheda</button>
    <button class="btn ghost block" data-a="biclose">Annulla</button>
    ${isCustom ? (U.confirm==='bireset' ? `<section class="card"><p>Tornare alla versione originale dell'app? Le tue modifiche a questa scheda si perdono.</p><div class="row"><button class="btn danger" data-a="bireset">Sì, torna all'originale</button><button class="btn ghost" data-a="nodel">No</button></div></section>` : `<button class="chip" data-a="biresetask" style="align-self:center">Torna alla versione originale</button>`) : ''}`;
}
function mEditView(){
  const E = U.mEd;
  return `<button class="btn ghost" data-a="medclose" style="align-self:flex-start">‹ Le mie schede</button>
    <h1>${E.id?'Modifica scheda':'Nuova scheda'}</h1>
    <section class="card"><div class="field"><label for="me-t">Titolo</label><input id="me-t" class="input inbig" data-c="med" data-k="title" value="${esc(E.title)}" placeholder="Es. Come gestisco l'errore"></div>
      <div class="field"><label for="me-i">Introduzione per l'atleta (facoltativa)</label><textarea id="me-i" class="input" rows="2" data-c="med" data-k="intro" placeholder="Es. Rispondi pensando all'ultima partita">${esc(E.intro)}</textarea></div></section>
    ${E.qs.map((q,i)=>`<section class="card"><div class="row between"><span class="eyebrow">Domanda ${i+1}</span><button class="chip" data-a="medqdel" data-k="${i}">Togli</button></div>
      <textarea class="input" rows="2" data-c="medq" data-k="${i}" placeholder="Es. Cosa ti dici dopo un doppio fallo?">${esc(q.t)}</textarea>
      <div class="seg" role="group"><button data-a="medqt" data-k="${i}" data-v="text" aria-pressed="${q.type==='text'}">Risposta scritta</button><button data-a="medqt" data-k="${i}" data-v="scale" aria-pressed="${q.type==='scale'}">Da 1 a 5</button></div></section>`).join('')}
    <button class="btn ghost block" data-a="medqadd">+ Aggiungi domanda</button>
    <button class="btn clay block" data-a="medsave">Salva la scheda</button>`;
}
function mFormDetail(f){
  const sel = U.mfSel = (U.mfSel && !Array.isArray(U.mfSel)) ? U.mfSel : {groups:[], aths:[]};
  const ids = [...new Set([...S.athletes.filter(a=>sel.groups.includes(a.groupId)).map(a=>a.id), ...sel.aths])];
  const asg = (S.massign||[]).filter(x=>x.formId===f.id);
  return `<button class="btn ghost" data-a="mfclose" style="align-self:flex-start">‹ Le mie schede</button>
    <section class="card"><span class="eyebrow">Scheda · ${f.qs.length} domande</span><h1>${esc(f.title)}</h1>${f.intro?`<p class="small">${esc(f.intro)}</p>`:''}
      <ol class="small" style="margin:0;padding-left:18px">${f.qs.map(q=>`<li>${esc(q.t)} <span class="muted">(${q.type==='scale'?'1–5':'scritta'})</span></li>`).join('')}</ol>
      <button class="btn ghost" data-a="mededit" data-k="${f.id}" style="align-self:flex-start">Modifica</button></section>
    <section class="card"><h3>Assegna</h3><p class="small muted">Scegli gruppi interi o atleti singoli.</p>
      ${whoPicker(sel,'mfselg','mfsel')}
      <button class="btn clay block" data-a="mfassign" ${ids.length?'':'disabled'}>Assegna a ${ids.length} ${ids.length===1?'atleta':'atleti'}</button>
      <p class="small muted">L'atleta la trova nella sua Home in "Schede da compilare".</p></section>
    ${asg.length?`<section class="card"><h3>Assegnata a</h3><div class="list small">${asg.map(x=>`<div class="row between"><span><b>${esc(ath(x.athleteId)?.name)}</b></span>${x.done?`<span class="tstat ok">Compilata ${fdate(x.doneDate)}</span>`:`<span class="row" style="gap:6px"><span class="tstat wait">Da compilare</span><button class="chip" data-a="maundo" data-k="${x.id}" aria-label="Togli l'assegnazione a ${esc(ath(x.athleteId)?.name)}">Togli</button></span>`}</div>`).join('')}</div><p class="small muted">Le risposte sono in "Risposte".</p></section>`:''}`;
}
function myMindForms(id){
  const xs = mAssignOf(id).filter(x=>mFormById(x.formId)); if(!xs.length) return '';
  const todo = xs.filter(x=>!x.done), done = xs.filter(x=>x.done);
  return `<section class="card" style="border-left:4px solid var(--pri)"><span class="eyebrow">Dal preparatore mentale</span>
    ${todo.length?`<div class="list">${todo.map(x=>`<button class="item" data-a="mfill" data-k="${x.id}"><span class="grow"><b>${esc(mFormById(x.formId).title)}</b><br><span class="small muted">Da compilare</span></span><span class="chev">›</span></button>`).join('')}</div>`:''}
    ${done.length?`<p class="small muted">Compilate: ${done.map(x=>esc(mFormById(x.formId).title)).join(', ')}</p>`:''}</section>`;
}
function mfillView(){
  const x = (S.massign||[]).find(z=>z.id===U.mfill), f = x && mFormById(x.formId); if(!f){ U.mfill=null; return ''; }
  const D = U.mfDraft = U.mfDraft && U.mfDraft.id===x.id ? U.mfDraft : {id:x.id, a:{...(x.answers||{})}};
  return `<button class="btn ghost" data-a="mfillclose" style="align-self:flex-start">‹ Indietro</button>
    <section class="card"><span class="eyebrow">Dal preparatore mentale</span><h1>${esc(f.title)}</h1>${f.intro?`<p>${esc(f.intro)}</p>`:''}</section>
    ${f.qs.map((q,i)=>`<section class="card"><p style="font-weight:700">${i+1}. ${esc(q.t)}</p>${q.type==='scale'?`<div class="seg" role="group">${[1,2,3,4,5].map(n=>`<button data-a="mfscale" data-k="${i}:${n}" aria-pressed="${D.a[i]===n}">${n}</button>`).join('')}</div><p class="small muted">1 per niente · 5 moltissimo</p>`:`<textarea class="input" rows="3" data-c="mfa" data-k="${i}">${esc(D.a[i]||'')}</textarea>`}</section>`).join('')}
    <button class="btn clay block" data-a="mfsend">Invia</button>`;
}
function mindForms(){
  const fs = S.forms.slice().sort((a,b)=>a.date<b.date?1:-1).slice(0,40);
  return `<h1>Schede</h1><p class="small muted">Le ultime schede compilate da atleti e famiglie. Tocca per aprire l'atleta.</p>
    ${fs.length?`<section class="card" style="padding:4px 16px"><div class="list">${fs.map(f=>`<button class="item" data-a="staffath" data-k="${f.athleteId}" data-t="${TAB_OF[f.kind]||'prof'}"><span class="grow"><b>${esc(ath(f.athleteId)?.name)}</b> · ${esc(fname(f.kind))}${f.by==='parent'?' <span class="tag teal">famiglia</span>':''}<br><span class="small muted">${fdate(f.date)}</span></span><span class="chev">›</span></button>`).join('')}</div></section>`:'<section class="card"><p class="muted">Nessuna scheda.</p></section>'}`;
}
function mindHome(){
  if(U.homeView==='notif') return notifView();
  if(U.homeView==='att') return attView();
  const gs = S.groups.slice().sort((x,y)=>(x.id===PRIV_ID)-(y.id===PRIV_ID)).filter(g=>S.athletes.some(a=>a.groupId===g.id));
  if(!U.homeGrp || !gs.some(g=>g.id===U.homeGrp)) U.homeGrp = gs[0]?.id;
  const g = gs.find(x=>x.id===U.homeGrp);
  let card = '<section class="card"><p class="muted">Nessun atleta da seguire.</p></section>';
  if(g){ const as = S.athletes.filter(a=>a.groupId===g.id);
    card = `<section class="card">${gpickHTML(gs.map(x=>x.id===PRIV_ID?{...x, name:'Lezioni private'}:x), g.id)}
      <div class="row between"><span class="eyebrow">${esc(g.id===PRIV_ID?'Lezioni private':g.name)} · obiettivi mentali</span>${g.id!==PRIV_ID?`<button class="btn" data-a="homeatt" data-k="${g.id}" style="min-height:40px">${attBtnLab(g,'mind')}</button>`:''}</div>
      <div class="list">${as.map(a=>{ const gl = privOf(a.id).goals.filter(x=>x.area==='men' && x.st!=='done'), lf = S.forms.filter(f=>f.athleteId===a.id && (f.kind==='pre'||f.kind==='post')).sort((x,y)=>x.date<y.date?1:-1)[0];
        return `<button class="item" data-a="staffath" data-k="${a.id}"><span class="grow"><b>${esc(a.name)}</b><br><span class="small ${gl.length?'':'muted'}">${gl.length?gl.map(x=>esc(x.text)).join(' · '):'Nessun obiettivo mentale aperto'}</span>${lf?`<br><span class="small muted">Ultima scheda partita: ${fdate(lf.date)}</span>`:''}</span><span class="chev">›</span></button>`; }).join('')}</div></section>`; }
  return `${homeHead()}
    <h2 class="hsec">I tuoi atleti</h2>
    ${card}
    <h2 class="hsec">La tua scrivania</h2>
    <section class="card" style="padding:4px 16px"><div class="list">
      ${notifTool()}
      ${toolRow('tab','mprog',IC.plan,'Programma mentale', (()=>{ const t=todayISO(), nx=mCycles().flatMap(c=>(c.meets||[]).filter(m=>!m.done&&m.date&&m.date>=t).map(m=>({c,m}))).sort((x,y)=>meetSort(x.m,y.m))[0]; return nx?`prossimo: ${esc(nx.c.title||'')} · ${esc(meetWhen(nx.m))}`:'cicli per tema e incontri'; })())}
      ${toolRow('tab','mschede',IC.form,'Schede e questionari','modifica, crea, assegna e leggi le risposte')}
      ${toolRow('tab','sath',IC.people,'Atleti','schede, obiettivi e note di ogni atleta')}
      ${toolRow('tab','tour',IC.trophy,'Tornei','chi gioca e quando')}
    </div></section>`;
}
function staffTours(){
  if(U.tOpen && tByKey(U.tOpen)) return tourDetail(tByKey(U.tOpen));
  const all = allTournaments().filter(x=>tVisible(x.t)), mon = thisMonday(), next = all.filter(x=>x.date>=mon), past = all.filter(x=>x.date<mon).reverse(), mode = U.sMode || 'next';
  const body = mode==='cal' ? seasonStrip(true) : mode==='past' ? (past.length?monthList(past,'coach'):'<p class="muted">Nessun torneo giocato.</p>') : (next.length?monthList(next,'coach'):'<section class="card"><p class="muted">Nessun torneo in programma.</p></section>');
  return `<h1>Tornei</h1>${tForSelect()}<div class="seg" role="group"><button data-a="smode" data-k="next" aria-pressed="${mode==='next'}">Prossimi</button><button data-a="smode" data-k="past" aria-pressed="${mode==='past'}">Giocati</button><button data-a="smode" data-k="cal" aria-pressed="${mode==='cal'}">Stagione</button></div>${body}`;
}
function staffNotesCard(id){
  const role = S.session.role; S.snotes = S.snotes || [];
  if(role==='coach'){ const ns = S.snotes.filter(n=>n.athleteId===id && n.share).sort((a,b)=>a.date<b.date?1:-1);
    return ns.length ? `<section class="card"><h3>Dai preparatori</h3><div class="list small">${ns.slice(0,12).map(n=>`<div><span class="tag ${n.by==='mind'?'pri':'teal'}">${n.by==='mind'?'Mentale':'Atletico'}</span> <span class="muted">${fdate(n.date)}</span><br>${esc(n.text)}</div>`).join('')}</div></section>` : ''; }
  if(role!=='fit' && role!=='mind') return '';
  const ns = S.snotes.filter(n=>n.athleteId===id && n.by===role).sort((a,b)=>a.date<b.date?1:-1);
  return `<section class="card"><h3>Le mie note</h3>
    <textarea id="f-snote" class="input" rows="2" placeholder="${role==='mind'?'Es. dopo l\'errore si chiude; lavorare sulla routine dei 15 secondi':'Es. buona reattività, rinforzare la caviglia destra'}"></textarea>
    <label class="row small" style="gap:8px;align-items:center"><input type="checkbox" id="f-snshare" ${U.snShare===false?'':'checked'} data-c="snshare"> Condividi con il maestro</label>
    <button class="btn" data-a="snoteadd" data-k="${id}" style="align-self:flex-start">Aggiungi nota</button>
    ${ns.length?`<div class="list small">${ns.slice(0,15).map(n=>`<div class="row between" style="flex-wrap:nowrap;align-items:flex-start"><span><span class="muted">${fdate(n.date)}</span> · ${esc(n.text)}<br><button class="chip" data-a="snshare" data-k="${n.id}" style="margin-top:4px">${n.share?'Condivisa con il maestro ✓':'Solo per me'}</button></span><button class="chip" data-a="snotedel" data-k="${n.id}" aria-label="Togli nota">✕</button></div>`).join('')}</div>`:''}</section>`;
}
function studentHome(){
  const a = me(), id = a.id, isPriv = a.groupId===PRIV_ID, now = todayISO();
  const todo = allTournaments().filter(x=>x.date<=now && (x.t.players||[]).includes(id) && !hasRes((x.t.results||{})[id]));
  const tr = provaTrend(id);
  return `${homeHero('Ciao '+esc((a.name||'').split(' ')[0]))}
    ${noticesFor('student', a.groupId)}
    ${todo.length?`<section class="card" style="border-color:var(--clay)"><h3>Come è andata?</h3><p class="small muted">Inserisci turno e incontri giocati.</p><div class="list">${todo.map(x=>`<button class="item" data-a="openT" data-k="${tKey(x)}"><span class="grow"><b>${esc(x.t.name)}</b><br><span class="small muted">${dRange(x.date,x.end)}</span></span><span class="chev">›</span></button>`).join('')}</div></section>`:''}
    ${myMindForms(id).replace('Dal preparatore mentale','Schede da compilare')}
    ${tr?`<section class="card">${tr}</section>`:''}
    ${isPriv ? mindNextCard(id) + `<section class="card"><h2>Il tuo programma</h2><p class="small muted">Lezioni, obiettivi e lavoro da fare.</p><button class="btn clay block" data-a="tab" data-k="pprog">Apri il programma</button></section>` : `<h2 style="margin-top:4px">Oggi</h2>` + fitTodayCard(grp(a.groupId)) + mindNextCard(id) + (isOwnG(grp(a.groupId)) ? ownTodayCard(grp(a.groupId), false) + wellToday() : todayView())}
    ${tourHomeCard(id,false)}
    <button class="btn ghost block" data-a="sprog" data-k="allen">Il mio profilo: progressi e schede ›</button>`;
}
function parentHome(){
  const a = me(), id = a.id, g = grp(a.groupId), isPriv = a.groupId===PRIV_ID, di = todayIdx(g), wk = curIdx(g)>=0;
  const tr = provaTrend(id);
  let today;
  if(isPriv) today = `<section class="card"><h2>Il programma</h2><p class="small muted">Lezioni, obiettivi e lavoro da fare.</p><button class="btn clay block" data-a="tab" data-k="pprog">Apri il programma</button></section>`;
  else { const pv = PV(g.week, di);
    today = `<section class="card"><div class="row between"><span class="eyebrow">${esc(g.name)} · settimana ${gWeekNo(g)}</span><span class="tag pri">${esc(gWeekName(g))}</span></div>
      ${sessDots(g)}
      <h2>${esc(sessHead(g, di, gDayTitle(g,di)))}</h2>
      ${wk&&!isOwnG(g)?`<p class="small"><span class="tag">Prova del giorno</span> ${esc(pv.t)}</p>`:''}
      <button class="btn ghost block" data-a="tab" data-k="pweek">Cosa fa questa settimana</button></section>`; }
  return `${homeHero('La settimana di '+esc((a.name||'').split(' ')[0]))}
    ${noticesFor('parent', a.groupId)}
    ${today}
    ${fitTodayCard(g)}
    ${mindNextCard(id)}
    ${tr?`<section class="card">${tr}</section>`:''}
    ${tourHomeCard(id,true)}
    ${isPriv?'':`<section class="card"><h3>Incontro con il maestro</h3><p class="small muted">La scheda da compilare prima dell'incontro con le famiglie.</p><button class="btn ghost block" data-a="tab" data-k="meet">Apri</button></section>`}
    <button class="btn ghost block" data-a="sprog" data-k="prof">Il profilo: progressi e partite ›</button>`;
}
function attBtnLab(g, kind){ const rec = (S.att||{})[attKey(todayISO(), g.id, kind)] || {}, n = S.athletes.filter(a=>a.groupId===g.id).length; return 'Presenze' + (Object.keys(rec).length ? ' '+Object.values(rec).filter(attPresent).length+'/'+n : ''); }
function homeHead(){ const d = new Date(); return `<section class="hero hero-s"><span class="eyebrow" style="color:var(--clay)">${['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'][d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}</span><h1>Buon lavoro</h1></section>`; }
const toolRow = (a, k, ic, t, sub) => `<button class="item" data-a="${a}" ${k?`data-k="${k}"`:''}><span class="ticon" aria-hidden="true">${ic}</span><span class="grow"><b>${t}</b>${sub?`<br><span class="small muted">${sub}</span>`:''}</span><span class="chev">›</span></button>`;
function gpickHTML(gs, sel, mark){ return gs.length>1 ? `<div class="gpick" role="group" aria-label="Gruppo">${gs.map(x=>`<button data-a="homegrp" data-k="${x.id}" aria-pressed="${x.id===sel}">${esc(x.name)}${mark&&mark(x)?' ✓':''}</button>`).join('')}</div>` : ''; }
const NOTIF_LAB = {req:['richiesta torneo','richieste tornei'], forms:['scheda nuova','schede nuove'], pain:['dolore','dolori'], fat:['fatica alta','fatiche alte'], mform:['scheda partita','schede partita'], mdone:['scheda compilata','schede compilate'], dl:['scadenza','scadenze'], tour:['torneo','tornei']};
function notifItems(){
  const role = S.session.role, today = todayISO(), lim7 = addDays(today, -7), lim14 = addDays(today, -14), out = [];
  const nm = id => esc(ath(id)?.name || '');
  const row = (a, k, body) => `<button class="item" data-a="${a}" data-k="${k}"><span class="ndot" aria-hidden="true"></span><span class="grow">${body}</span><span class="chev">›</span></button>`;
  const wellRows = act => {
    (S.well||[]).filter(w=>w.pain && w.date>=lim7).forEach(w=>out.push({k:'pain', n:1, html:row(act, act==='openathT'?w.athleteId+':allen':w.athleteId, `<b style="color:var(--ko)">${nm(w.athleteId)}</b> segnala dolore${w.where?': '+esc(w.where):''} <span class="small muted">· ${dLabel(w.date)}</span>`)}));
    (S.well||[]).filter(w=>w.fat>=5 && w.date>=lim7).forEach(w=>out.push({k:'fat', n:1, html:row(act, act==='openathT'?w.athleteId+':allen':w.athleteId, `<b>${nm(w.athleteId)}</b>: fatica 5 su 5 <span class="small muted">· ${dLabel(w.date)}</span>`)}));
  };
  const tourRows = () => nextTourPlayers(21).forEach(x=>out.push({k:'tour', n:1, html:row('openT', tKey(x), `<b>${esc(x.t.name)}</b> <span class="small muted">· ${dRange(x.date,x.end)}</span><br><span class="small muted">Giocano: ${x.t.players.map(pid=>nm(pid)).filter(Boolean).join(', ')}</span>`)}));
  if(role==='coach'){
    const reqs = allTournaments().filter(x=>(x.t.requests||[]).length), nf = newForms(), up = upcoming(30), nextT = up.find(x=>x.date>=today) || up[0];
    reqs.forEach(x=>out.push({k:'req', n:x.t.requests.length, html:row('openT', tKey(x), `<b style="color:var(--clay)">${x.t.requests.length} ${x.t.requests.length===1?'richiesta':'richieste'} di iscrizione</b> · ${esc(x.t.name)}`)}));
    if(nf) out.push({k:'forms', n:nf, html:row('tab','ath', `<b>${nf} ${nf===1?'scheda nuova':'schede nuove'}</b> da atleti e famiglie`)});
    wellRows('openathT');
    const dl = deadlines(14).filter(x=>!reqs.some(r=>tKey(r)===tKey(x)));
    dl.forEach(x=>out.push({k:'dl', n:1, html:row('openT', tKey(x), `Iscrizioni entro il <b>${dLabel(x.t.deadline)}</b> · ${esc(x.t.name)}`)}));
    if(nextT && ![...dl,...reqs].some(x=>tKey(x)===tKey(nextT))) out.push({k:'tour', n:1, html:row('openT', tKey(nextT), `Prossimo torneo: <b>${esc(nextT.t.name)}</b> <span class="small muted">· ${dRange(nextT.date,nextT.end)}</span>`)});
  } else if(role==='fit'){
    wellRows('staffath'); tourRows();
  } else if(role==='mind'){
    S.forms.filter(f=>(f.kind==='pre'||f.kind==='post') && f.date.slice(0,10)>=lim14).sort((a,b)=>a.date<b.date?1:-1).slice(0,10).forEach(f=>out.push({k:'mform', n:1, html:`<button class="item" data-a="staffath" data-k="${f.athleteId}" data-t="part"><span class="ndot" aria-hidden="true"></span><span class="grow"><b>${nm(f.athleteId)}</b> · ${esc(fname(f.kind))} <span class="small muted">· ${fdate(f.date)}</span></span><span class="chev">›</span></button>`}));
    (S.massign||[]).filter(x=>x.done && (x.doneDate||'').slice(0,10)>=lim14 && mFormById(x.formId)).forEach(x=>out.push({k:'mdone', n:1, html:row('mansopen', x.athleteId, `<b>${nm(x.athleteId)}</b> ha compilato <b>${esc(mFormById(x.formId).title)}</b> <span class="small muted">· ${fdate(x.doneDate)}</span>`)}));
    tourRows();
  }
  return out;
}
function notifSummary(items){
  const c = {}; items.forEach(x=>c[x.k]=(c[x.k]||0)+x.n);
  return Object.keys(NOTIF_LAB).filter(k=>c[k]).map(k=>`${c[k]} ${NOTIF_LAB[k][c[k]===1?0:1]}`).join(' · ');
}
function notifTool(){
  const items = notifItems(), n = items.length;
  return `<button class="item" data-a="homego" data-k="notif"><span class="ticon" aria-hidden="true">${IC.bell}</span><span class="grow"><b>Notifiche</b><br><span class="small muted">${n ? notifSummary(items) : 'niente di nuovo'}</span></span>${n?`<span class="nbadge">${n}</span>`:''}<span class="chev">›</span></button>`;
}
function notifView(){
  const items = notifItems();
  return `<button class="btn ghost" data-a="homeback" style="align-self:flex-start">‹ Home</button>
    <h1>Notifiche</h1>
    <section class="card" style="padding:4px 16px">${items.length?`<div class="list">${items.map(x=>x.html).join('')}</div>`:'<div class="row" style="gap:10px;padding:14px 0"><span class="ndot ok" aria-hidden="true"></span><span class="muted">Niente di nuovo da guardare.</span></div>'}</section>`;
}
function coachHome(){
  if(U.homeView==='att') return attView();
  if(U.homeView==='groups') return `<button class="btn ghost" data-a="homeback" style="align-self:flex-start">‹ Home</button>` + groupsView();
  if(U.homeView==='priv') return U.privOpen && ath(U.privOpen) ? privDetail(U.privOpen) + (HOOK.shareCard ? HOOK.shareCard(ath(U.privOpen)) : '') : `<button class="btn ghost" data-a="homeback" style="align-self:flex-start">‹ Home</button>` + privList();
  if(U.homeView==='backup') return backupView();
  if(HOOK.homeView){ const h = HOOK.homeView(U.homeView); if(h) return h; }
  if(U.homeView==='clean') return cleanView();
  if(U.homeView==='notice') return noticeView();
  if(U.homeView==='notif') return notifView();
  const d = new Date(), today = todayISO();
  const gs = teamGroups(), doneToday = g => curIdx(g)>=0 && doneDate(g, todayIdx(g))===today;
  if(!U.homeGrp || !gs.some(g=>g.id===U.homeGrp)) U.homeGrp = (gs.find(g=>!doneToday(g)) || gs[0])?.id;
  const g = gs.find(x=>x.id===U.homeGrp);
  let groupCard = '<section class="card"><p class="muted">Nessun gruppo. Crealo da Gruppi e atleti.</p></section>';
  if(g){ const di = todayIdx(g), wk = curIdx(g)>=0, rec = (S.att||{})[attKey(today,g.id)] || {}, n = S.athletes.filter(a=>a.groupId===g.id).length, np = Object.values(rec).filter(attPresent).length, pv = PV(g.week, di);
    groupCard = `<section class="card">
      ${gpickHTML(gs, g.id, doneToday)}
      <div class="row between"><span class="eyebrow">${esc(g.name)} · settimana ${gWeekNo(g)}</span><span class="tag pri">${esc(gWeekName(g))}</span></div>
      ${sessDots(g)}
      <h2>${esc(sessHead(g, di, gDayTitle(g,di)))}</h2>
      ${wk&&!isOwnG(g)?`<p class="small"><span class="tag">Prova</span> ${esc(pv.t)}</p>`:''}
      <div class="row"><button class="btn" data-a="homeatt" data-k="${g.id}" style="flex:1">Presenze ${Object.keys(rec).length?np+'/'+n:''}</button>${wk?`<button class="btn ghost" data-a="homeday" data-k="${isOwnG(g)?'o:'+g.id:g.week}:${di}:${g.id}" style="flex:1">Apri l'allenamento</button>`:''}</div>
      ${sessBtns(g, di)}
      ${groupStaffStrip(g)}</section>`; }
  const nn = (S.notices||[]).length, np2 = S.athletes.filter(a=>a.groupId===PRIV_ID).length;
  const tool = (a, k, ic, t, sub) => `<button class="item" data-a="${a}" ${k?`data-k="${k}"`:''}><span class="ticon" aria-hidden="true">${ic}</span><span class="grow"><b>${t}</b>${sub?`<br><span class="small muted">${sub}</span>`:''}</span><span class="chev">›</span></button>`;
  return `<section class="hero hero-s"><span class="eyebrow" style="color:var(--clay)">${['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'][d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}</span><h1>Buon lavoro</h1></section>
    <h2 class="hsec">Oggi in campo</h2>
    ${groupCard}
    ${plCard()}
    <h2 class="hsec">La tua scrivania</h2>
    <section class="card" style="padding:4px 16px"><div class="list">
      ${notifTool()}
      ${tool('homego','notice',IC.chat,'Avvisi', nn?`${nn} ${nn===1?'pubblicato':'pubblicati'} · scrivi un avviso`:'scrivi un avviso ad atleti e genitori')}
      ${tool('tab','mschede',IC.form,'Schede e questionari','modifica, crea e assegna')}
      ${tool('homelib','',IC.plan,'Libreria esercizi', `${P.ex.length+(S.customEx||[]).length} esercizi`)}
      ${HOOK.toolItems ? HOOK.toolItems() : ''}<button class="item" data-a="homego" data-k="backup"><span class="ticon" aria-hidden="true">${IC.home}</span><span class="grow"><b>Copia di sicurezza</b><br><span class="small muted">salva o ripristina i dati</span></span><span class="chev">›</span></button>
      ${tool('cleanopen','',IC.test,'Togli i dati di prova','tornei, schede e profili')}
    </div></section>`;
}
function noticeView(){
  return `<button class="btn ghost" data-a="homeback" style="align-self:flex-start">‹ Home</button>
    <h1>Avvisi</h1>
    <section class="card"><p class="small muted">Gli avvisi compaiono nella Home di atleti e genitori.</p>
      <textarea id="f-notice" class="input" rows="3" placeholder="Es. Venerdì allenamento spostato alle 17"></textarea>
      <div class="seg" role="group">${[['all','Tutti'],['student','Atleti'],['parent','Genitori']].map(([k,l])=>`<button data-a="nto" data-k="${k}" aria-pressed="${(U.nto||'all')===k}">${l}</button>`).join('')}</div>
      <button class="btn clay" data-a="noticeadd">Pubblica l'avviso</button></section>
    ${(S.notices||[]).length?`<section class="card"><h3>Pubblicati</h3><div class="list small">${(S.notices||[]).slice().sort((a,b)=>a.date<b.date?1:-1).map(n=>`<div class="row between" style="flex-wrap:nowrap;align-items:flex-start"><span>${esc(n.text)}<br><span class="muted">${fdate(n.date)} · ${n.to==='all'?'tutti':n.to==='student'?'atleti':'genitori'}</span></span><button class="chip" data-a="noticedel" data-k="${n.id}" aria-label="Togli avviso">✕</button></div>`).join('')}</div></section>`:''}`;
}
function backupView(){
  return `<button class="btn ghost" data-a="homeback" style="align-self:flex-start">‹ Home</button>
    <section class="card"><h2>Copia di sicurezza</h2><p class="small">Copia tutti i dati e incollali in un messaggio a te stesso o in una nota. Per ripristinarli, incollali qui sotto.</p>
      <button class="btn" data-a="bkcopy">Copia i dati</button></section>
    <section class="card"><h3>Ripristina</h3><textarea id="f-restore" class="input" rows="4" data-c="restore" placeholder="Incolla qui i dati copiati">${esc(U.restoreText||'')}</textarea>
      ${U.confirm==='restore'?`<div class="confirm"><span>I dati di questo telefono verranno sostituiti. Procedo?</span><div class="row"><button class="btn danger" data-a="bkrestore">Sì, ripristina</button><button class="btn ghost" data-a="nodel">Annulla</button></div></div>`:`<button class="btn danger" data-a="askrestore">Ripristina questi dati</button>`}</section>
    <section class="card"><h3>Togli i dati di prova</h3><p class="small muted">Scegli quali tornei, schede e profili inseriti per prova eliminare. Gli atleti e i gruppi restano.</p>
      <button class="btn ghost" data-a="cleanopen" style="align-self:flex-start">Scegli cosa togliere</button></section>
    <section class="card"><h3>Dati</h3>
      ${U.confirm==='reset'?`<div class="confirm"><span>Cancellare tutto, anche gruppi e atleti (e i loro accessi online)? Restano solo il programma e gli esercizi.</span><div class="row"><button class="btn danger" data-a="reset" data-k="empty">Sì, cancella tutto</button><button class="btn ghost" data-a="nodel">Annulla</button></div></div>`:
      `<div class="row"><button class="btn danger" data-a="askdel" data-k="reset">Cancella tutti i dati</button><button class="btn ghost" data-a="reset" data-k="example">Rimetti i dati di prova</button></div>`}
    </section>`;
}

