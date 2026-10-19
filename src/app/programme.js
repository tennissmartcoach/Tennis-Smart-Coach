/* Group programmes, plan, match setup and live screens, exercise library, court editor, session length */
/* ---------- own programme per group ---------- */
const isOwnG = g => !!g && g.prog==='own';
const blankDay = () => ({title:'', note:'', ex:[]});
const dayLab = (g,i) => g && g.pp ? 'Lezione '+(i+1) : DAYS[i];
const blankWeek = () => ({name:'', days:[0,1,2,3,4].map(blankDay)});
function ownOf(gid){ let o; if(typeof gid==='string' && gid.startsWith('pp_')){ const pv = privOf(gid.slice(3)); o = pv.own = pv.own || {cur:1, weeks:[]}; } else { S.own = S.own || {}; o = S.own[gid] = S.own[gid] || {cur:1, weeks:[]}; } if(!o.weeks.length) o.weeks.push(blankWeek()); if(o.cur>o.weeks.length) o.cur = o.weeks.length; return o; }
const gWeekNo = g => isOwnG(g) ? ownOf(g.id).cur : g.week;
const gWeekName = g => { if(!isOwnG(g)) return W(g.week).name; const o = ownOf(g.id), w = o.weeks[o.cur-1]; return w.name || `Settimana ${o.cur}`; };
const gDayTitle = (g,di) => { if(!isOwnG(g)) return P.prog[g.week][di].title; const o = ownOf(g.id), d = o.weeks[o.cur-1].days[di]; return d.title || 'Seduta da definire'; };

/* own programmes: d.ex = exercise ids, d.exPh = the group phase each one is placed in */
function mapPh(g, e){ const w = lessonOf(g).phases.filter(p=>!p.pause); if(!w.length) return (e && e.ph) || 'pr'; const k = e ? (e.ph==='ri'?'pr':e.ph) : ''; return w.some(p=>p.k===k) ? k : w[0].k; }
function ownPh(g, d, i){ return (d.exPh && d.exPh[i]) || mapPh(g, exById(d.ex[i])); }
function ownSync(g, d){ d.exPh = d.ex.map((id,i)=>ownPh(g, d, i)); return d; }
function ownItems(g, d){ return d.ex.map((id,i)=>({i, id, e:exById(id), ph:ownPh(g,d,i)})).filter(x=>x.e); }
function ownByPhase(g, d, render, adders){
  const L = lessonOf(g), items = ownItems(g, d);
  if(!L.phases.length) return items.map(x=>render(x)).join('') + (adders ? adders(null) : '');
  const keys = L.phases.filter(p=>!p.pause).map(p=>p.k); let np = 0;
  const out = L.phases.map(p=>{
    if(p.pause){ np++; return pauseRow(`${esc(p.n)}${p.m?' · '+p.m+"'":''}`, 'Acqua e recupero.'); }
    const its = items.filter(x=>x.ph===p.k);
    return (its.length ? its.map(x=>render(x)).join('') : (adders ? `<p class="small"><b>${esc(p.n)}</b>${p.m?' · '+p.m+"'":''}</p>` : '')) + (adders ? adders(p) : '');
  }).join('');
  const lost = items.filter(x=>!keys.includes(x.ph));
  return out + (lost.length ? `<p class="small muted">Esercizi in fasi che non ci sono più:</p>` + lost.map(x=>render(x)).join('') : '');
}
function ownTodayCard(g, light){
  CUR_LG = g; const o = ownOf(g.id), w = o.weeks[o.cur-1], di = todayIdx(g), wk = curIdx(g)>=0, day = w.days[di];
  const exs = ownItems(g, day);
  return `<section class="card"><div class="row between"><span class="eyebrow">${esc(g.name)} · settimana ${o.cur}</span>${w.name?`<span class="tag pri">${esc(w.name)}</span>`:''}</div>
    ${sessDots(g)}
    <h2>${esc(sessHead(g, di, day.title||'Seduta da definire'))}</h2>
    ${wk&&day.note?`<p>${esc(day.note)}</p>`:''}
    ${wk&&!light?lessonTL(g):''}
    ${wk&&exs.length&&light?`<div class="list small">${exs.map(x=>`<div>${x.e.custom?esc(x.e.t):x.e.t}</div>`).join('')}</div>`:''}</section>
    ${wk&&exs.length&&!light?ownByPhase(g, day, x=>exCard(x.e,{ph:x.ph})):''}`;
}
function ownWeekCard(g){
  CUR_LG = g; const o = ownOf(g.id), w = o.weeks[o.cur-1];
  return `<section class="card"><span class="eyebrow">${esc(g.name)} · settimana ${o.cur}</span><h2>${esc(w.name||'Settimana '+o.cur)}</h2></section>
    ${w.days.slice(0, nS(g)).map((d,i)=>{ const exs = ownItems(g, d).map(x=>x.e); return `<section class="card"><span class="eyebrow">${dayLab(g,i)}</span><h3>${esc(d.title||'Seduta da definire')}</h3>${d.note?`<p class="small">${esc(d.note)}</p>`:''}${exs.length?`<div class="list small">${exs.map(e=>`<div>${e.custom?esc(e.t):e.t}</div>`).join('')}</div>`:''}</section>`; }).join('')}`;
}
function ppBar(g){
  const aid = g.id.slice(3);
  return `<button class="btn ghost" data-a="ppback" data-k="${aid}" style="align-self:flex-start">‹ ${esc(g.name)}</button>
    <section class="card"><span class="eyebrow">Lezioni private · ${esc(g.name)}</span>
      <div class="field"><label>Lezioni a settimana</label><div class="seg" role="group">${[1,2,3,4,5].map(n=>`<button data-a="setfreq" data-k="${n}" aria-pressed="${nS(g)===n}">${n}</button>`).join('')}</div></div>
      <div class="row between" style="gap:8px"><span class="small"><b>Durata e fasi:</b> ${noLesson(g)?'da impostare':durTxt(lessonOf(g).dur)+' · '+lessonOf(g).phases.filter(p=>!p.pause).length+' fasi'}</span><button class="chip" data-a="lessonopen" data-k="${g.id}">Imposta</button></div>
      <p class="small muted">Costruisci settimane e lezioni con gli esercizi della libreria. L'allievo e i genitori vedono la settimana in corso.</p></section>`;
}
function aiGroupCard(g){ return `<section class="card" style="border-color:var(--clay)"><div class="row between" style="gap:10px"><span class="grow small"><b>Crea il programma con l'IA</b><br><span class="muted">Racconta o detta settimane e allenamenti: l'IA prepara il testo con esercizi e campetti, tu lo incolli qui.</span></span><button class="btn clay" data-a="gimpopen" data-k="${g.id}">Inizia</button></div></section>`; }
function planGroupBar(g){
  const tg = teamGroups();
  return `<section class="card"><div class="field"><label for="f-plangrp">Gruppo</label><select id="f-plangrp" class="input inbig" data-c="plangrp">${tg.map(x=>`<option value="${x.id}" ${x.id===g.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
    <div class="field"><label>Programma assegnato</label><div class="seg" role="group"><button data-a="setprog" data-k="12w" aria-pressed="${!isOwnG(g)}">Le 12 settimane</button><button data-a="setprog" data-k="own" aria-pressed="${isOwnG(g)}">Programma personale</button></div></div>
    <p class="small muted">${isOwnG(g)?'Costruisci tu settimane e sedute, con gli esercizi della libreria. Atleti e genitori vedono questo programma.':'Il programma in 12 settimane per tipologie di gioco, con prove del giorno e partita guidata.'}</p>
    <div class="row between" style="gap:8px"><span class="small"><b>Durata e fasi:</b> ${noLesson(g)?'da impostare':durTxt(lessonOf(g).dur)+' · '+lessonOf(g).phases.filter(p=>!p.pause).length+' fasi'}</span><button class="chip" data-a="lessonopen" data-k="${g.id}">${noLesson(g)?'Imposta':'Modifica'}</button></div>
    <div class="field"><label>Allenamenti a settimana</label><div class="seg" role="group">${[2,3,4,5].map(n=>`<button data-a="setfreq" data-k="${n}" aria-pressed="${nS(g)===n}">${n}</button>`).join('')}</div></div>
    ${!isOwnG(g) && nS(g)<5 ? `<p class="small muted">Con ${nS(g)} allenamenti a settimana il gruppo fa ${PICK12[nS(g)].map(i=>'il '+(i+1)).join(', ').replace(/, ([^,]*)$/,' e $1')} del programma: il primo e l'ultimo ci sono sempre, per il confronto della prova.</p>` : ''}</section>`;
}
function ownPlanView(g){
  const o = ownOf(g.id);
  if(U.oWeek && o.weeks[U.oWeek-1] && U.oDay!==null && U.oDay!==undefined){
    CUR_LG = g; const w = o.weeks[U.oWeek-1], d = w.days[U.oDay], exs = d.ex.map(exById);
    return `<button class="btn ghost" data-a="oday" data-k="" style="align-self:flex-start">‹ Settimana ${U.oWeek}</button>
      <section class="card"><span class="eyebrow">${esc(g.name)} · settimana ${U.oWeek} · ${dayLab(g,U.oDay)}</span>
        ${U.oWeek===o.cur && S.session.role==='coach' ? (doneDate(g,U.oDay)?`<button class="chip" data-a="sessdone" data-k="${g.id}:${U.oDay}" style="align-self:flex-start">✓ Fatto ${fdate(doneDate(g,U.oDay))} · annulla</button>`:`<button class="chip" data-a="sessdone" data-k="${g.id}:${U.oDay}" style="align-self:flex-start">Segna come fatto</button>`) : ''}
        <div class="field"><label for="od-t">Titolo della seduta</label><input id="od-t" class="input inbig" data-c="odtitle" value="${esc(d.title)}" placeholder="Es. Diritto in spinta + punti a tema"></div>
        <div class="field"><label for="od-n">Obiettivo e note</label><textarea id="od-n" class="input" rows="3" data-c="odnote" placeholder="Cosa vogliamo ottenere oggi">${esc(d.note)}</textarea></div>
        ${lessonTL(g)}<button class="chip" data-a="lessonopen" data-k="${g.id}" style="align-self:flex-start">Durata e fasi</button></section>
      ${ownByPhase(g, d, x=>exCard(x.e,{ph:x.ph, html:`<div class="row"><button class="chip" data-a="oedit" data-k="${x.i}">✎ Modifica</button><button class="chip" data-a="odrop" data-k="${x.i}">Togli</button><button class="chip" data-a="oup" data-k="${x.i}" aria-label="Sposta su">↑</button>${workPhases(g).length>1&&!noLesson(g)?`<select class="input" style="flex:1;min-width:0;padding:6px 8px;font-size:14px" data-c="omove" data-k="${x.i}" aria-label="Sposta in un'altra fase">${workPhases(g).map(p=>`<option value="${p.k}" ${p.k===x.ph?'selected':''}>${esc(p.n)}</option>`).join('')}</select>`:''}</div>`}),
        p=>`<div class="row"><button class="btn ghost" data-a="opick" data-k="${p?p.k:''}" style="flex:1">+ Dalla libreria</button><button class="btn ghost" data-a="onewex" data-k="${p?p.k:''}" style="flex:1">+ Scrivi un esercizio</button></div>`)}
      ${LEGEND}`;
  }
  if(U.oWeek && o.weeks[U.oWeek-1]){
    const n = U.oWeek, w = o.weeks[n-1];
    return `<button class="btn ghost" data-a="oweek" data-k="" style="align-self:flex-start">‹ Programma di ${esc(g.name)}</button>
      <section class="card"><span class="eyebrow">Settimana ${n}${o.cur===n?' · in corso':''}</span>
        <div class="field"><label for="ow-n">Nome della settimana</label><input id="ow-n" class="input inbig" data-c="owname" value="${esc(w.name)}" placeholder="Es. Costruzione dal fondo"></div>
        ${o.cur===n?'<span class="tag teal" style="align-self:flex-start">Settimana in corso per gli atleti</span>':`<button class="btn" data-a="owcur" style="align-self:flex-start">Imposta come settimana in corso</button>`}</section>
      <section class="card"><h3>${g.pp?'Le lezioni':'Gli allenamenti'} (${nS(g)} a settimana)</h3><div class="list">${w.days.slice(0, nS(g)).map((d,i)=>`<button class="item" data-a="oday" data-k="${i}"><span class="grow"><span class="eyebrow">${dayLab(g,i)}</span><br><b style="font-size:17px">${esc(d.title||'Da definire')}</b><br><span class="small muted">${d.ex.length} esercizi</span></span><span class="chev">›</span></button>`).join('')}</div></section>
      <div class="row"><button class="btn ghost" data-a="owcopy">Duplica questa settimana</button>${o.weeks.length>1?(U.confirm==='ow'?`<button class="btn danger" data-a="owdel">Sì, elimina</button><button class="btn ghost" data-a="nodel">Annulla</button>`:`<button class="btn danger" data-a="askdel" data-k="ow">Elimina settimana</button>`):''}</div>`;
  }
  return `<h1>Programma di ${esc(g.name)}</h1>
    <section class="card"><div class="list">${o.weeks.map((w,i)=>`<button class="item" data-a="oweek" data-k="${i+1}"><div class="wk" style="background:var(--pri)"><small>SETT</small>${i+1}</div><span class="grow"><b style="font-size:17px">${esc(w.name||'Senza nome')}</b><br><span class="small muted">${w.days.slice(0,nS(g)).filter(d=>d.title||d.ex.length).length} di ${nS(g)} ${g.pp?'lezioni':'allenamenti'} preparati</span></span>${o.cur===i+1?'<span class="tag teal">In corso</span>':''}<span class="chev">›</span></button>`).join('')}</div></section>
    <button class="btn clay block" data-a="owadd">+ Aggiungi settimana</button>`;
}
/* coach: programme */
function planView(){
  CUR_LG = null;
  if(U.ed) return editorView();
  if(U.lessonEd && grp(U.lessonEd)) return lessonEditor(grp(U.lessonEd));
  const tg = teamGroups(); if(!U.planGroup || !grp(U.planGroup) || U.planGroup===PRIV_ID) U.planGroup = tg[0]?.id; const pg = grp(U.planGroup);
  const top = `<div class="seg" role="group" aria-label="Sezione"><button data-a="planmode" data-k="weeks" aria-pressed="${U.planMode!=='lib'}">Programma</button><button data-a="planmode" data-k="lib" aria-pressed="${U.planMode==='lib'}">Libreria esercizi</button></div>`;
  if(U.planMode==='lib') return (U.pick?'':top) + libraryView();
  if(pg && pg.pp) return (U.oWeek?'':ppBar(pg)) + ownPlanView(pg);
  if(pg && U.gImp===pg.id) return gImportView(pg);
  if(isOwnG(pg)) return (U.oWeek?'':top + planGroupBar(pg) + aiGroupCard(pg)) + ownPlanView(pg);
  if(U.weekOpen && U.dayOpen!==null && U.dayOpen!==undefined) return dayView(U.weekOpen, U.dayOpen);
  if(U.weekOpen){
    const w = W(U.weekOpen);
    const gs = S.groups.filter(g=>g.week===w.n);
    return `
      <button class="btn ghost" data-a="closeweek" style="align-self:flex-start">‹ Tutte le settimane</button>
      <section class="card">
        <div class="row"><div class="wk" style="background:${wcol(w.n)}"><small>SETT</small>${w.n}</div><div class="grow"><span class="eyebrow">${w.n<=6?'Primo giro · conoscere':'Secondo giro · scegliere e adattarsi'}</span><h2>${esc(w.name)}</h2></div></div>
        ${gs.length?`<p class="small"><span class="tag teal">In corso</span> ${gs.map(g=>esc(g.name)).join(', ')}</p>`:''}
        <div class="field"><label for="f-setweek">Imposta come settimana in corso per</label>
          <div class="row"><select id="f-setweek" class="input" style="flex:1">${teamGroups().map(g=>`<option value="${g.id}">${esc(g.name)} (ora sett. ${g.week})</option>`).join('')}</select><button class="btn" data-a="setweek" data-k="${w.n}">Imposta</button></div></div>
      </section>
      <section class="card"><h3>I cinque allenamenti</h3><p class="muted small">Tocca un giorno per vedere e modificare la seduta.</p>
        <div class="list">${w.days.map((d,i)=>`<button class="item" data-a="openday" data-k="${i}"><span class="grow"><span class="eyebrow">${DAYS[i]}</span>${(S.plan||{})[dayKey(w.n,i)]?' <span class="tag teal">modificato</span>':''}<br><b style="font-size:17px">${esc(d)}</b><br><span class="small muted">Prova: ${esc(PV(w.n,i).t)}</span></span><span class="chev">›</span></button>`).join('')}</div>
      </section>
      <section class="card"><h3>Scelte della partita guidata</h3>
        <div class="choices">${w.choices.map((c,i)=>`<div class="choice"><i>${i+1}</i><span>${esc(c.label)}${c.u14?' <span class="tag">U14</span>':''}</span></div>`).join('')}</div>
      </section>`;
  }
  const cur = new Set(S.groups.map(g=>g.week));
  const block = (from,to,title)=>`<section class="card"><span class="eyebrow">${title}</span><div class="list">${WEEKS.slice(from,to).map(w=>`<button class="item" data-a="openweek" data-k="${w.n}"><div class="wk" style="background:${wcol(w.n)}"><small>SETT</small>${w.n}</div><span class="grow"><b style="font-size:17px">${esc(w.name)}</b><br><span class="muted small">${esc(w.days[0])} · ${esc(w.days[1])}…</span></span>${cur.has(w.n)?'<span class="tag teal">In corso</span>':''}<span class="chev">›</span></button>`).join('')}</div></section>`;
  return `${top}${pg?planGroupBar(pg)+aiGroupCard(pg):''}<h1>Le 12 settimane</h1>${block(0,6,'Primo giro · conoscere')}${block(6,12,'Secondo giro · scegliere e adattarsi')}`;
}

/* coach: results grid */
const teamGroups = () => S.groups.filter(g=>g.id!==PRIV_ID);
/* coach: groups */
function groupsView(){
  const conf = U.confirm;
  return `
    <h1>Gruppi e atleti</h1>
    ${S.groups.map(g=>{ const as = S.athletes.filter(a=>a.groupId===g.id); return `
      <section class="card">
        <div class="row between"><div style="min-width:0"><span class="eyebrow">Codice ${esc(g.code)}</span><h2>${esc(g.name)}</h2></div><span class="tag pri">Sett. ${g.week}</span></div>
        <div class="list">${as.map(a=>`<div class="row between"><span style="font-weight:600">${esc(a.name)}</span><button class="chip" data-a="askdel" data-k="ath:${a.id}" aria-label="Togli ${esc(a.name)}">Togli</button></div>
          <div class="row small" style="padding-top:0;border:0"><span class="muted">Atleta <b style="font-family:var(--f-disp);font-size:18px;color:var(--ink)">${esc(a.pin)}</b></span><button class="chip" data-a="newpin" data-k="${a.id}">Nuovo</button><span class="muted">Genitore <b style="font-family:var(--f-disp);font-size:18px;color:var(--ink)">${esc(a.ppin)}</b></span><button class="chip" data-a="newppin" data-k="${a.id}">Nuovo</button></div>
          ${conf==='ath:'+a.id?`<div class="confirm"><span>Togliere ${esc(a.name)} e tutti i suoi dati?</span><div class="row"><button class="btn danger" data-a="del" data-k="ath:${a.id}">Sì, togli</button><button class="btn ghost" data-a="nodel">Annulla</button></div></div>`:''}`).join('')}</div>
        <div class="row"><input id="f-new-${g.id}" class="input" placeholder="Nome e iniziale del cognome" style="flex:1;min-width:0"><button class="btn" data-a="addath" data-k="${g.id}">Aggiungi</button></div>
      </section>`; }).join('')}
    <section class="card">
      <h3>Nuovo gruppo</h3>
      <div class="row"><input id="f-gname" class="input" placeholder="Es. U12 Pre-agonistica" style="flex:1;min-width:0"><button class="btn" data-a="addgroup">Crea</button></div>
      <p class="muted small">Il codice del gruppo viene creato in automatico.</p>
    </section>
    <section class="card">
      <h3>Codice maestro</h3>
      <div class="row"><input id="f-cc" class="input code" value="${esc(S.coachCode)}" style="flex:1;min-width:0"><button class="btn" data-a="savecc">Salva</button></div>
    </section>
    <section class="card">
      <h3>Dati</h3>
      ${conf==='reset'?`<div class="confirm"><span>Cancellare tutti i dati di questo telefono?</span><div class="row"><button class="btn danger" data-a="reset" data-k="empty">Sì, cancella tutto</button><button class="btn ghost" data-a="nodel">Annulla</button></div></div>`:
      `<div class="row"><button class="btn danger" data-a="askdel" data-k="reset">Cancella tutti i dati</button><button class="btn ghost" data-a="reset" data-k="example">Ripristina il gruppo AGO 1</button></div>`}
    </section>`;
}

/* match analysis */
function defaultSetup(){
  const g = isCoach() ? S.groups[0] : grp(me().groupId);
  return { mode:'score', kind:'Partita', tasks:['Palla corta','Cross stretto','Vado a rete'], groupId:g?.id, a: isCoach() ? (S.athletes.find(x=>x.groupId===g?.id)?.id || '') : me().id, b:'', bName:'', type:'set', sets:1, games:4, tb:true, decider:'tb10', ad:false, first:0, trackEx:true, choices: W(g?.week||1).choices.map(c=>c.label) };
}
function matchTab(){
  if(S.live) return liveView();
  if(U.matchOpen) return summaryView(S.matches.find(m=>m.id===U.matchOpen));
  return setupView();
}
function seg(key, opts, val){ return `<div class="seg" role="group">${opts.map(([v,l])=>`<button data-a="set" data-k="${key}" data-v="${v}" aria-pressed="${String(val)===String(v)}">${l}</button>`).join('')}</div>`; }
function setupView(){
  if(!U.setup) U.setup = defaultSetup();
  const s = U.setup, g = grp(s.groupId);
  const pool = S.athletes.filter(a=>a.groupId===s.groupId);
  const recent = S.matches.filter(m=> m.done && (isCoach() ? true : (m.a.id===me().id || m.b.id===me().id))).slice(-4).reverse();
  return `
    <h1>Match Analysis</h1>
    <section class="card">
      <h3>Giocatori</h3>
      ${isCoach()?`<div class="field"><label for="f-mg">Gruppo</label><select id="f-mg" class="input" data-c="mgroup">${S.groups.map(x=>`<option value="${x.id}" ${x.id===s.groupId?'selected':''}>${esc(x.name)} · sett. ${x.week}</option>`).join('')}</select></div>
      <div class="field"><label for="f-ma">Chi analizziamo (A)</label><select id="f-ma" class="input" data-c="ma">${pool.map(a=>`<option value="${a.id}" ${a.id===s.a?'selected':''}>${esc(a.name)}</option>`).join('')}</select></div>`
      :`<p><b>A:</b> ${esc(me().name)} <span class="muted small">(le scelte sono le tue)</span></p>`}
      <div class="field"><label for="f-mb">Avversario (B)</label><select id="f-mb" class="input" data-c="mb"><option value="">Un'altra persona…</option>${pool.filter(a=>a.id!==s.a).map(a=>`<option value="${a.id}" ${a.id===s.b?'selected':''}>${esc(a.name)}</option>`).join('')}</select></div>
      ${s.b?'':`<input id="f-mbn" class="input" placeholder="Nome dell'avversario" value="${esc(s.bName)}" data-c="mbn">`}
    </section>
    <section class="card">
      <h3>Come la analizziamo</h3>
      ${seg('mode',[['score','Punteggio e scelte'],['task','A compito']],s.mode)}
      <p class="muted small">${s.mode==='task'?'Senza punteggio: dai uno o più compiti e a fine punto segni solo quando il compito è stato fatto, e com’è finito il punto.':'Il punteggio va avanti da solo; prima di ogni punto si dichiara una scelta.'}</p>
    </section>
    ${s.mode==='task'?`<section class="card">
      <h3>Compiti</h3>
      <div class="field"><label>Si gioca</label>${seg('kind',[['Partita','Partita'],['Tie-break','Tie-break'],['Punti liberi','Punti liberi']],s.kind)}</div>
      <div class="list">${s.tasks.map((c,i)=>`<div class="row"><b style="font-family:var(--f-disp);font-size:20px;color:var(--clay);width:18px">${i+1}</b><input class="input" style="flex:1;min-width:0;padding:9px 12px" value="${esc(c)}" data-c="task" data-k="${i}" aria-label="Compito ${i+1}"><button class="chip" data-a="deltask" data-k="${i}" aria-label="Togli compito ${i+1}">✕</button></div>`).join('')}</div>
      ${s.tasks.length<6?`<button class="btn ghost" data-a="addtask">+ Aggiungi un compito</button>`:''}
      <p class="muted small">Esempi: palla corta, cross stretto, vado a rete, risposta profonda, seconda carica.</p>
    </section>
    <button class="btn clay block" data-a="start" style="padding:16px;font-size:18px">Inizia</button>
    ${recent.length?`<section class="card"><h3>Ultime partite</h3><div class="list">${recent.map(matchItem).join('')}</div></section>`:''}`:`
    <section class="card">
      <h3>Tipo di partita</h3>
      ${seg('type',[['tb7','Tie-break a 7'],['tb10','Tie-break a 10'],['set','A set']],s.type)}
      ${s.type==='set'?`
        <div class="field"><label>Set</label>${seg('sets',[[1,'1 set'],[3,'2 su 3']],s.sets)}</div>
        <div class="field"><label>Game per set</label>${seg('games',[[6,'A 6 game'],[4,'A 4 game (set corti)']],s.games)}</div>
        <div class="field"><label>Sul ${s.games}-${s.games}</label>${seg('tb',[['true','Tie-break a 7'],['false','Si va avanti di 2']],s.tb)}</div>
        ${s.sets===3?`<div class="field"><label>Terzo set</label>${seg('decider',[['tb10','Super tie-break a 10'],['set','Set normale']],s.decider)}</div>`:''}
        <div class="field"><label>Sul 40-40</label>${seg('ad',[['true','Vantaggi'],['false','Killer point']],s.ad)}</div>`:''}
      <div class="field"><label>Serve per prima</label>${seg('first',[[0,'A'],[1,'B']],s.first)}</div>
    </section>
    <section class="card">
      <div class="row between"><h3>Scelte da registrare</h3><span class="tag pri">Sett. ${g?.week}</span></div>
      <p class="muted small">Prima di ogni punto A dichiara una scelta. Puoi cambiare il testo o aggiungerne.</p>
      <div class="list">${s.choices.map((c,i)=>`<div class="row"><b style="font-family:var(--f-disp);font-size:20px;color:var(--clay);width:18px">${i+1}</b><input class="input" style="flex:1;min-width:0;padding:9px 12px" value="${esc(c)}" data-c="choice" data-k="${i}" aria-label="Scelta ${i+1}"><button class="chip" data-a="delchoice" data-k="${i}" aria-label="Togli scelta ${i+1}">✕</button></div>`).join('')}</div>
      ${s.choices.length<6?`<button class="btn ghost" data-a="addchoice">+ Aggiungi una scelta</button>`:''}
      <div class="field"><label>Registra anche se la scelta è stata eseguita</label>${seg('trackEx',[['true','Sì'],['false','No, solo chi vince']],s.trackEx)}</div>
    </section>
    <button class="btn clay block" data-a="start" style="padding:16px;font-size:18px">Inizia la partita</button>
    ${recent.length?`<section class="card"><h3>Ultime partite</h3><div class="list">${recent.map(matchItem).join('')}</div></section>`:''}`}`;
}
function liveView(){
  if(S.live.mode==='task') return taskLive(S.live);
  const m = S.live, f = m.format, st = replay(m), srv = curServer(st);
  const sel = U.sel;
  const needEx = m.trackEx && sel.ch !== undefined && sel.ch !== null;
  const ready = sel.ch !== undefined && (!needEx || sel.ex !== null);
  const sets = i => st.sets.map(x=>`<span>${i===0?x.a:x.b}</span>`).join('') + (st.done===null && !st.tb?.whole && !st.tb?.decider ? `<b>${st.g[i]}</b>` : '');
  const tags = statusTags(f, st);
  const last = m.points.slice(-6).map((p,k)=>({p, n:m.points.length-Math.min(6,m.points.length)+k+1})).reverse();
  return `
    <section class="board" aria-label="Punteggio">
      <div class="hd"><span>${esc(formatLabel(f))}</span></div>
      ${[0,1].map(i=>`<div class="brow"><span class="srv ${srv===i&&st.done===null?'on':''}" aria-label="${srv===i?'al servizio':''}"></span><span class="nm">${esc(i===0?m.a.name:m.b.name)}</span><span class="sets">${sets(i)}</span><span class="pts">${st.done===null?ptLabel(f,st,i):(st.done===i?'✓':'')}</span></div>`).join('')}
      <div class="status">${tags.map(([t,c])=>`<span class="${c}">${t}</span>`).join('')}</div>
    </section>
    ${st.done===null?`
    <section class="card">
      <span class="eyebrow">1 · Prima del punto: cosa vuole fare ${esc(m.a.name)}?</span>
      <div class="pick">${m.choices.map((c,i)=>`<button data-a="pick" data-k="${i}" aria-pressed="${sel.ch===i}"><i>${i+1}</i><span>${esc(c)}</span></button>`).join('')}<button class="none" data-a="pick" data-k="none" aria-pressed="${sel.ch===null}">Nessuna scelta dichiarata</button></div>
      ${needEx?`<span class="eyebrow">2 · L'ha eseguita?</span><div class="exrow"><button class="y" data-a="ex" data-k="1" aria-pressed="${sel.ex===true}">✓ Eseguita</button><button class="n" data-a="ex" data-k="0" aria-pressed="${sel.ex===false}">✗ Non eseguita</button></div>`:''}
      <span class="eyebrow">${needEx?'3':'2'} · Chi vince il punto?</span>
      <div class="winrow"><button class="win a" data-a="point" data-k="0" ${ready?'':'disabled'}>${esc(m.a.name)}<small>vince il punto</small></button><button class="win b" data-a="point" data-k="1" ${ready?'':'disabled'}>${esc(m.b.name)}<small>vince il punto</small></button></div>
      ${ready?'':'<p class="muted small" style="text-align:center">Scegli prima cosa voleva fare (o "nessuna scelta").</p>'}
    </section>`:`
    <section class="card"><h2>Partita finita</h2><p>Vince <b>${esc(st.done===0?m.a.name:m.b.name)}</b> · ${esc(scoreLine(st))}</p><button class="btn clay block" data-a="finish">Vedi l'analisi</button></section>`}
    <section class="card">
      <div class="row between"><h3>Ultimi punti</h3><button class="chip" data-a="undo" ${m.points.length?'':'disabled'}>↩ Annulla l'ultimo</button></div>
      ${last.length?`<div class="log">${last.map(({p,n})=>`<div><span class="n">${n}</span><span class="g">${p.ch===null||p.ch===undefined?'<span class="muted">Nessuna scelta</span>':esc(m.choices[p.ch])}${p.ex===true?' ✓':p.ex===false?' ✗':''}${p.pr?' <span class="tag">imp.</span>':''}</span><b style="color:${p.w===0?'var(--ok)':'var(--ko)'}">${p.w===0?'Vinto':'Perso'}</b></div>`).join('')}</div>`:'<p class="muted small">Nessun punto ancora.</p>'}
      ${st.done===null?(U.confirm==='stop'?`<div class="confirm"><span>Chiudere la partita adesso? I punti giocati restano salvati.</span><div class="row"><button class="btn" data-a="finish">Sì, chiudi</button><button class="btn ghost" data-a="nodel">Continua</button></div></div>`:`<button class="btn ghost" data-a="askdel" data-k="stop">Chiudi la partita prima della fine</button>`):''}
    </section>`;
}
function summaryView(m){
  if(!m){ U.matchOpen=null; return setupView(); }
  if(m.mode==='task') return taskSummary(m);
  const st = replay(m), s = matchStats(m);
  const rows = s.rows.concat(s.none.n ? [s.none] : []);
  const pr = rows.filter(r=>r.prn>0).sort((a,b)=>b.prn-a.prn);
  return `
    <button class="btn ghost" data-a="closematch" style="align-self:flex-start">‹ ${S.session.role==='parent'?'Progressi':'Nuova partita'}</button>
    <section class="board">
      <div class="hd"><span>Settimana ${m.week} · ${esc(W(m.week).name)}</span><span>${new Date(m.date).toLocaleDateString('it-IT',{day:'numeric',month:'short'})}</span></div>
      ${[0,1].map(i=>`<div class="brow"><span class="srv"></span><span class="nm">${esc(i===0?m.a.name:m.b.name)}</span><span class="sets">${st.sets.map(x=>`<span${(i===0?x.a>x.b:x.b>x.a)?' style="color:var(--board-ink)"':''}>${i===0?x.a:x.b}</span>`).join('')}${st.done===null?`<b>${st.g[i]}</b>`:''}</span><span class="pts">${st.done===i?'✓':st.done===null?ptLabel(m.format,st,i):''}</span></div>`).join('')}
      <div class="status"><span>${esc(formatLabel(m.format))}</span>${st.done===null?'<span class="hot">Chiusa prima della fine</span>':''}</div>
    </section>
    <section class="card">
      <span class="eyebrow">Analisi di ${esc(m.a.name)}</span>
      <div class="kpis">
        <div class="kpi"><b>${pct(s.won,s.tot) ?? '–'}%</b><span>punti vinti (${s.won}/${s.tot})</span></div>
        <div class="kpi"><b>${pct(s.srvW,s.srv) ?? '–'}%</b><span>vinti al servizio (${s.srvW}/${s.srv})</span></div>
        <div class="kpi"><b>${pct(s.retW,s.ret) ?? '–'}%</b><span>vinti in risposta (${s.retW}/${s.ret})</span></div>
      </div>
    </section>
    <section class="card">
      <h3>Le scelte: quante volte e con che esito</h3>
      <div class="scroll-x"><table class="grid"><thead><tr><th>Scelta</th><th>Volte</th>${m.trackEx?'<th>Eseguita</th>':''}<th>Vinti</th></tr></thead>
      <tbody>${rows.map(r=>{ const pw = pct(r.won,r.n), pe = pct(r.ex,r.exn); return `<tr><td>${esc(r.label)}</td><td>${r.n}</td>${m.trackEx?`<td>${r===s.none||pe===null?'<span class="pc e">–</span>':`<span class="pc ${pe>=70?'h':pe>=50?'m':'l'}">${pe}%</span>`}</td>`:''}<td>${pw===null?'<span class="pc e">–</span>':`<span class="pc ${pw>=60?'h':pw>=45?'m':'l'}">${pw}%</span>`}</td></tr>`; }).join('')}</tbody></table></div>
      ${s.rows.some(r=>r.n)?`<div class="bars">${s.rows.filter(r=>r.n).map(r=>`<div class="bar"><div class="lab"><span>${esc(r.label)}</span><span>${r.n} su ${s.tot}</span></div><div class="track"><div class="fill clay" style="width:${pct(r.n,s.tot)}%"></div></div></div>`).join('')}</div>`:''}
    </section>
    <section class="card">
      <h3>Nei punti importanti</h3>
      <p class="muted small">30-40, 40-30, parità, vantaggi, killer point e finale di tie-break: ${s.prn} punti, ${pct(s.prw,s.prn) ?? '–'}% vinti.</p>
      ${pr.length?`<div class="bars">${pr.map(r=>{const p=pct(r.prw,r.prn); return `<div class="bar"><div class="lab"><span>${esc(r.label)}</span><span>${r.prn} volte · ${p}% vinti</span></div><div class="track"><div class="fill ok" style="width:${p}%"></div></div></div>`;}).join('')}</div>`:'<p class="muted">Nessun punto importante giocato.</p>'}
    </section>
    ${isCoach() || (S.session.role==='student' && m.a.id===me()?.id) ? (U.confirm==='m:'+m.id?`<div class="confirm"><span>Eliminare questa partita?</span><div class="row"><button class="btn danger" data-a="del" data-k="m:${m.id}">Sì, elimina</button><button class="btn ghost" data-a="nodel">Annulla</button></div></div>`:`<button class="btn danger" data-a="askdel" data-k="m:${m.id}" style="align-self:flex-start">Elimina partita</button>`) : ''}`;
}


/* ---------- programme detail, exercise library, court editor ---------- */
const EXMAP = {}; P.ex.forEach(e=>EXMAP[e.id]=e);
const exById = id => EXMAP[id] || (S.customEx||[]).find(e=>e.id===id);
const PH = {att:['Attivazione','#5B6068',"12–15'"], pr:['Fase centrale','#3B6FD8',"25–30'"], ri:['Richiamo','#3B6FD8',"20'"], sr:['Servizio e risposta','#0E6670',"15–20'"], ap:['Parte aperta · partita','#B4532A',"30'"]};
const PH_ORDER = ['att','pr','ri','sr','ap'];
const LIB_PH = [['all','Tutti'],['att','Attivazione'],['pr','Fase centrale'],['sr','Servizio'],['ap','Partita']];
const phOf = e => e.ph==='ri' ? 'pr' : e.ph;
const dayKey = (w,d) => w+'-'+d;
const plainTxt = h => { const el = document.createElement('div'); el.innerHTML = (h||'').replace(/<br\s*\/?>/gi,'\n'); return el.textContent; };
function exToEd(e, ctx){
  return {id: e.custom ? e.id : null, ph: phOf(e)==='ri'?'pr':(e.ph==='ri'?'pr':e.ph), t: e.custom ? e.t : plainTxt(e.t), chip: e.custom ? (e.chip||'') : plainTxt(e.chip), x: (e.lines||[]).map(l=>e.custom?l:plainTxt(l)).join('\n'),
    els: JSON.parse(JSON.stringify(e.els||[])), vis: !e.els && e.vis ? e.vis : (e.custom && e.vis ? e.vis : null), from: e.custom ? null : e.id, tool:'A', pend:null, ctx: ctx||null, lib: true};
}
function dayBlocks(w,d){ return (S.plan||{})[dayKey(w,d)] || P.prog[w][d].blocks; }
function editableBlocks(w,d){ S.plan = S.plan || {}; const k = dayKey(w,d); if(!S.plan[k]) S.plan[k] = JSON.parse(JSON.stringify(P.prog[w][d].blocks)); return S.plan[k]; }
let CID = 0;
function courtSVG(els){
  const u = 'cv'+(++CID), NAVY='#1B3A6B', INK='#2A2522';
  const mk = (n,c,open)=>`<marker id="${u}${n}" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto">${open?`<path d="M0 0L6 3L0 6" fill="none" stroke="${c}" stroke-width="1.4"/>`:`<path d="M0 0L6 3L0 6Z" fill="${c}"/>`}</marker>`;
  let s = `<defs>${mk('y','#F2C230')}${mk('a',NAVY)}${mk('b',INK)}${mk('n',NAVY,true)}${mk('m',INK,true)}</defs><rect width="220" height="110" rx="6" fill="#C46F45"/><g fill="none" stroke="#FBF3EC" stroke-width="1.3"><rect x="10" y="9" width="200" height="92"/><path d="M10 20.5H210M10 89.5H210M56.2 20.5V89.5M163.8 20.5V89.5M56.2 55H163.8"/></g><path d="M110 3V107" stroke="#2A2522" stroke-width="2.2"/>`;
  const people = [], labels = [];
  (els||[]).forEach(e=>{ const k = e[0];
    if(k==='z') s += `<rect x="${e[1]}" y="${e[2]}" width="${e[3]}" height="${e[4]}" fill="#ffffff" fill-opacity="0.3" stroke="#ffffff" stroke-dasharray="2 2"/>`;
    else if(k==='a'||k==='b') s += `<path d="${e[1]}" fill="none" stroke="${k==='a'?NAVY:INK}" stroke-width="2" marker-end="url(#${u}${k})"/>`;
    else if(k==='f') s += `<path d="${e[1]}" fill="none" stroke="#F2C230" stroke-width="1.8" stroke-dasharray="4 3" marker-end="url(#${u}y)"/>`;
    else if(k==='ma') s += `<path d="${e[1]}" fill="none" stroke="${NAVY}" stroke-width="1.7" stroke-dasharray="1.5 2.5" marker-end="url(#${u}n)"/>`;
    else if(k==='t') labels.push(`<text x="${e[1]}" y="${e[2]}" text-anchor="middle" font-size="7" font-weight="600" fill="#ffffff" font-family="sans-serif">${esc(e[3]||'')}</text>`);
    else if(k==='c') s += `<path d="M${e[1]-4} ${e[2]+4}L${e[1]} ${e[2]-5}L${e[1]+4} ${e[2]+4}Z" fill="#F2994A" stroke="#ffffff" stroke-width=".8"/>`;
    else if(k==='n') labels.push(`<circle cx="${e[1]}" cy="${e[2]}" r="5.5" fill="#ffffff"/><text x="${e[1]}" y="${e[2]+3}" text-anchor="middle" font-size="8" font-weight="700" fill="#1F2328" font-family="sans-serif">${e[3]}</text>`);
    else if(k==='A'||k==='B') people.push(`<circle cx="${e[1]}" cy="${e[2]}" r="7" fill="${k==='A'?NAVY:'#ffffff'}" stroke="${k==='A'?'#ffffff':INK}" stroke-width="1.5"/><text x="${e[1]}" y="${e[2]+3}" text-anchor="middle" font-size="9" font-weight="700" fill="${k==='A'?'#ffffff':INK}" font-family="sans-serif">${esc(e[3]||k)}</text>`);
    else if(k==='M') people.push(`<rect x="${e[1]-7}" y="${e[2]-7}" width="14" height="14" rx="2" fill="#F2C230" stroke="#2A2522" stroke-width="1.2"/><text x="${e[1]}" y="${e[2]+3.5}" text-anchor="middle" font-size="9" font-weight="700" fill="#2A2522" font-family="sans-serif">M</text>`);
  });
  return s + labels.join('') + people.join('');
}
const LEGEND = `<div class="legend"><span><i style="background:#1B3A6B"></i>colpo di A</span><span><i style="background:#2A2522"></i>colpo di B</span><span><i style="background:#F2C230"></i>palla del maestro</span><span><i class="dots"></i>spostamento</span><span><b class="sq">M</b>maestro</span></div>`;
function exVis(e){ if(e.els) return e.els.length ? `<div class="vis"><svg viewBox="0 0 220 110" role="img" aria-label="Disegno dell'esercizio">${courtSVG(e.els)}</svg></div>` : ''; return e.vis ? `<div class="vis">${e.vis}</div>` : ''; }
function exLines(e){ return e.custom ? (e.lines||[]).map(l=>`<p>${esc(l)}</p>`).join('') : e.lines.map(l=>`<p>${l}</p>`).join(''); }
function exOrigin(e){ return e.custom ? 'Esercizio aggiunto da te' : `Settimana ${e.w} · ${DAYS[e.d]}`; }
let CUR_PH = null;
function exCard(e, tools){
  const [lab,col,time] = phInfo((tools && tools.ph) || CUR_PH || e.ph);
  return `<article class="ex" style="border-left-color:${col}">
    <div class="row between"><span class="phase" style="background:${col}">${lab}</span>${time&&!tools?.notime?`<span class="muted small" style="font-family:var(--f-disp);font-size:18px;font-weight:700">${time}</span>`:''}</div>
    <h3 style="font-size:22px">${e.custom?esc(e.t):e.t}</h3>
    ${e.chip?`<p class="small"><span class="tag pri">${e.custom?esc(e.chip):e.chip}</span></p>`:''}
    ${exVis(e)}
    <div class="exl">${exLines(e)}</div>
    ${tools?.origin?`<p class="small muted">${exOrigin(e)}</p>`:''}
    ${tools?.html||''}
  </article>`;
}
function pauseRow(t, x){ return `<div class="pause"><b>${t}</b><span>${x}</span></div>`; }

/* day view (coach, from Programma) */
function dayView(w, d){
  const pg0 = grp(U.planGroup), LG = (pg0 && !isOwnG(pg0)) ? pg0 : (S.groups.find(x=>x.id!==PRIV_ID && !isOwnG(x) && x.week===w) || pg0); CUR_LG = LG;
  const D = P.prog[w][d], B = dayBlocks(w,d), wk = W(w), fri = d===4, edit = U.editDay;
  const custom = !!(S.plan||{})[dayKey(w,d)] || (S.filoEdit||{})[dayKey(w,d)]!==undefined;
  const blockHtml = ph => { CUR_PH = ph; try{
    const ids = B[ph] || [];
    const items = ids.map((id,i)=>{ const e = exById(id); if(!e) return ''; const ex = fri && ph==='ap' && !e.custom ? {...e, lines:e.lines.concat([`<b>Le scelte:</b> ${wk.choices.map((c,j)=>`${j+1} ${esc(c.label)}`).join(' · ')}`])} : e;
      return exCard(ex, edit ? {html:`<div class="row"><button class="chip" data-a="dayedex" data-k="${ph}:${i}">Modifica</button><button class="chip" data-a="pickex" data-k="${ph}:${i}">Sostituisci</button><button class="chip" data-a="dropex" data-k="${ph}:${i}">Togli</button>${i>0?`<button class="chip" data-a="upex" data-k="${ph}:${i}" aria-label="Sposta su">↑</button>`:''}</div>`} : null); }).join('');
    return (edit && !ids.length ? `<p class="small"><b>${esc(phInfo(ph)[0])}</b></p>` : '') + items + (edit ? `<div class="row"><button class="btn ghost" data-a="pickex" data-k="${ph}:new" style="flex:1">+ Dalla libreria</button><button class="btn ghost" data-a="daynewex" data-k="${ph}" style="flex:1">+ Scrivi un esercizio</button></div>` : '') + (!ids.length && !edit ? `<p class="muted small"><b>${esc(phInfo(ph)[0])}</b>: nessun esercizio in questa fase.</p>` : '');
    } finally { CUR_PH = null; } };
  return `
    <button class="btn ghost" data-a="closeday" style="align-self:flex-start">‹ Settimana ${w}</button>
    <section class="card">
      <span class="eyebrow">Settimana ${w} · ${esc(wk.name)} · ${DAYS[d]}</span>
      <h1>${esc(D.title)}</h1>
      ${S.session.role==='coach'?S.groups.filter(g=>g.id!==PRIV_ID && !isOwnG(g) && g.week===w && pickOf(g).includes(d)).map(g=>`<div class="row" style="gap:8px"><span class="small"><b>${esc(g.name)}</b> · ${sLabel(g,d).toLowerCase()}</span>${doneDate(g,d)?`<button class="chip" data-a="sessdone" data-k="${g.id}:${d}">✓ Fatto ${fdate(doneDate(g,d))} · annulla</button>`:`<button class="chip" data-a="sessdone" data-k="${g.id}:${d}">Segna come fatto</button>`}</div>`).join(''):''}
      ${D.obj?`<p><b>Obiettivo:</b> ${D.obj}</p>`:''}
      ${U.editProva ? provaForm(w,d) : provaBox(w, d) + `<div class="row"><button class="chip" data-a="editprova">Modifica la prova</button>${(S.provaEdit||{})[w+'-'+d]?'<span class="tag teal">prova modificata</span>':''}</div>`}
      ${provaResults(w,d)}
      ${D.kw?`<p class="small"><span class="muted">Parola chiave:</span> <b>${esc(D.kw)}</b></p>`:''}
      ${LG?`<div class="row between" style="gap:6px"><span class="small muted">Struttura di ${esc(LG.name)}</span>${S.session.role==='coach'?`<button class="chip" data-a="lessonopen" data-k="${LG.id}">Durata e fasi</button>`:''}</div>`:''}
      ${lessonTL(LG, fri)}
      <div class="row">${edit?`<button class="btn clay" data-a="editday" data-k="0">Fine modifiche</button>${custom?`<button class="btn danger" data-a="resetday">Ripristina l'originale</button>`:''}`:`<button class="btn" data-a="editday" data-k="1">Modifica il programma</button>${custom?'<span class="tag teal">Modificato</span>':''}`}</div>
    </section>
    ${(()=>{ let np = 0; const lp = lessonOf(LG).phases; return (lp.length ? lp : NEUTRAL()).map(fp=>{
      if(fp.pause){ np++; return pauseRow(`${esc(fp.n)} · ${fp.m}'`, np===1 ? (fri ? 'Acqua. Il maestro spiega come funziona il match guidato e le scelte della settimana.' : `Acqua. Il maestro spiega il tema del giorno${D.kw?` e la parola chiave: <b>${esc(D.kw)}</b>`:''}.`) : np===2 ? (fri ? 'Acqua, poi servizio e risposta.' : 'Acqua, poi si passa al servizio.') : 'Acqua e recupero.'); }
      if(fp.k==='filo') return !fri ? (()=>{ const fk = dayKey(w,d), ov = (S.filoEdit||{})[fk], txt = ov!==undefined ? ov : D.filo; if(!edit && !txt) return '';
      return `<article class="ex" style="border-left-color:#8A6200"><div class="row between"><span class="phase" style="background:#8A6200">${esc(fp.n)} · ${fp.m}'</span>${ov!==undefined&&!edit?'<span class="tag teal">modificato</span>':''}</div>${edit?`<textarea class="input" rows="4" data-c="filo" data-k="${fk}" placeholder="Il lavoro fisso di 10' di questa seduta">${esc(ov!==undefined?ov:plainTxt(D.filo||''))}</textarea>${ov!==undefined?`<button class="chip" data-a="filoreset" data-k="${fk}" style="align-self:flex-start">Ripristina l'originale</button>`:''}`:`<div class="exl">${ov!==undefined?`<p style="white-space:pre-line">${esc(ov)}</p>`:`<p>${D.filo}</p>`}</div>`}</article>`; })() : '';
      if(fp.k==='pr') return blockHtml(fri ? 'ri' : 'pr');
      return blockHtml(fp.k); }).join(''); })()}
    ${fri && D.confronto ? `<section class="card" style="background:var(--board);color:var(--board-ink);border:0"><span class="eyebrow" style="color:var(--ball)">Confronto finale</span>${D.confronto.map((q,i)=>`<p><b>${i+1}.</b> ${q}</p>`).join('')}</section>` : ''}
    ${D.alts.length?`<section class="card"><h3>Alternative</h3>${D.alts.map(a=>`<div><p style="font-weight:700">${esc(a.t)}</p><p class="small">${a.x}</p></div>`).join('')}</section>`:''}
    ${LEGEND}`;
}

/* library */
function libraryView(){
  if(U.libOpen){ const e = exById(U.libOpen); if(e) return `<button class="btn ghost" data-a="libclose" style="align-self:flex-start">‹ Libreria</button>${exCard(e,{origin:true, notime:true, html: U.pick ? `<button class="btn clay block" data-a="choose" data-k="${e.id}">Usa questo esercizio</button>` : (!e.custom?`<button class="btn ghost" data-a="editex" data-k="${e.id}" style="align-self:flex-start">Modifica (crea la tua versione)</button>`:'') + (e.custom?`<div class="row"><button class="btn ghost" data-a="editex" data-k="${e.id}">Modifica</button>${U.confirm==='ex:'+e.id?`<button class="btn danger" data-a="delex" data-k="${e.id}">Sì, elimina</button><button class="btn ghost" data-a="nodel">Annulla</button>`:`<button class="btn danger" data-a="askdel" data-k="ex:${e.id}">Elimina</button>`}</div>`:'')})}${LEGEND}`; U.libOpen=null; }
  const f = U.libPh || 'all', q = (U.libQ||'').toLowerCase().trim();
  const all = (S.customEx||[]).slice().reverse().concat(P.ex);
  const list = all.filter(e=> !e.hidden && (f==='all' || phOf(e)===f) && (!U.libMine || e.custom) && (!q || (e.t+' '+e.chip+' '+(e.custom?(e.lines||[]).join(' '):e.lines.join(' '))).toLowerCase().includes(q)));
  const n = U.libN || 40;
  return `
    ${U.pick?`<div class="note"><b>Scegli un esercizio</b> da inserire in ${U.pick.own?'':phInfo(U.pick.ph)[0].toLowerCase()+' · '}Settimana ${U.pick.w}, ${DAYS[U.pick.d]}. <button class="chip" data-a="cancelpick">Annulla</button></div>`:''}
    <div class="row between"><h1>Libreria</h1>${U.pick?'':`<button class="btn clay" data-a="newex">+ Nuovo esercizio</button>`}</div>
    <div class="chips">${LIB_PH.map(([k,l])=>`<button class="chip" data-a="libph" data-k="${k}" aria-pressed="${f===k}">${l}</button>`).join('')}<button class="chip" data-a="libmine" aria-pressed="${!!U.libMine}">Solo i miei</button></div>
    <input id="f-libq" class="input" placeholder="Cerca: volée, smorzata, servizio…" value="${esc(U.libQ||'')}" data-c="libq" autocomplete="off">
    <p class="muted small">${list.length} esercizi</p>
    <section class="card" style="padding:4px 16px"><div class="list">${list.slice(0,n).map(e=>{ const [lab,col] = PH[e.ph]||PH.pr; return `<button class="item" data-a="libopen" data-k="${e.id}"><span class="pdot" style="background:${col}"></span><span class="grow"><b>${e.custom?esc(e.t):e.t}</b><br><span class="muted small">${lab} · ${exOrigin(e)}${(e.vis&&e.vis.includes('<svg'))||(e.els&&e.els.length)?' · con disegno':''}</span></span><span class="chev">›</span></button>`; }).join('')}</div></section>
    ${list.length>n?`<button class="btn ghost block" data-a="libmore">Mostra altri ${Math.min(40,list.length-n)}</button>`:''}`;
}

/* new / edit exercise with court drawing */
const TOOLS = [['A','Giocatore A'],['B','Giocatore B'],['M','Maestro'],['a','Colpo di A'],['b','Colpo di B'],['f','Palla del maestro'],['ma','Spostamento'],['z','Zona bersaglio'],['c','Cono'],['n','Numero']];
function editorView(){
  const E = U.ed;
  return `
    <button class="btn ghost" data-a="edclose" style="align-self:flex-start">‹ ${E.sheet?'Lezione':E.ctx?'Seduta':'Libreria'}</button>
    <h1>${E.sheet?(E.sheet.j===null?'Nuovo esercizio':'Modifica esercizio'):E.id?'Modifica esercizio':E.from?'Modifica esercizio (la tua versione)':'Nuovo esercizio'}</h1>
    ${E.from?'<div class="note">Stai modificando un esercizio del programma: viene salvata <b>una tua versione</b>, l\'originale resta nella libreria.</div>':''}
    <section class="card">
      ${E.sheet?'':`<div class="field"><label>Fase</label><div class="seg sub" role="group">${workPhases(getLG()).map(p=>p.k).concat(workPhases(getLG()).some(p=>p.k===E.ph)?[]:[E.ph]).filter(k=>k&&k!=='ri').map(k=>`<button data-a="edph" data-k="${k}" aria-pressed="${E.ph===k}">${esc(phInfo(k)[0].split(' ')[0])}</button>`).join('')}</div></div>`}
      <div class="field"><label for="ed-t">Titolo</label><input id="ed-t" class="input" data-c="ed" data-k="t" value="${esc(E.t)}" placeholder="Es. Smorzata e avanti"></div>
      <div class="field"><label for="ed-chip">Organizzazione</label><input id="ed-chip" class="input" data-c="ed" data-k="chip" value="${esc(E.chip)}" placeholder="Es. Maestro al cesto, poi a coppie"></div>
      <div class="field"><label for="ed-x">Descrizione</label><textarea id="ed-x" class="input" rows="4" data-c="ed" data-k="x" placeholder="Una riga per ogni punto: esecuzione, evoluzione, attenzione…">${esc(E.x)}</textarea></div>
      ${E.sheet?`<div class="row" style="gap:8px"><div class="field" style="width:90px"><label for="ed-min">Minuti</label><input id="ed-min" class="input" inputmode="numeric" data-c="ed" data-k="min" value="${esc(String(E.min||''))}"></div><div class="field grow" style="flex:1;min-width:0"><label for="ed-serie">Serie</label><input id="ed-serie" class="input" data-c="ed" data-k="serie" value="${esc(E.serie||'')}" placeholder="Es. 4 serie da 1'"></div></div>
      <div class="field"><label for="ed-obj">Obiettivo</label><input id="ed-obj" class="input" data-c="ed" data-k="obj" value="${esc(E.obj||'')}" placeholder="Es. profondità e precisione"></div>`:''}
    </section>
    <section class="card">
      <h3>Disegno sul campo</h3>
      <div class="chips">${TOOLS.map(([k,l])=>`<button class="chip" data-a="tool" data-k="${k}" aria-pressed="${E.tool===k}">${l}</button>`).join('')}</div>
      <p class="muted small">${['a','b','f','ma'].includes(E.tool)?(E.pend?'Ora tocca dove arriva la freccia.':'Tocca il punto di partenza, poi quello di arrivo.'):E.tool==='z'?(E.pend?'Ora tocca l’angolo opposto della zona.':'Tocca un angolo della zona, poi quello opposto.'):'Tocca il campo per posizionare.'}</p>
      ${E.vis && !E.els.length ? `<div class="vis">${E.vis}</div><p class="small muted">Disegno originale. Se disegni sul campo qui sotto, lo sostituisci.</p>` : ''}
      <div class="vis edit"><svg viewBox="0 0 220 110" data-a="courttap" role="img" aria-label="Campo da disegnare">${courtSVG(E.els)}${E.pend?`<circle cx="${E.pend[0]}" cy="${E.pend[1]}" r="3.5" fill="#D7E84A" stroke="#14284B"/>`:''}</svg></div>
      <div class="row"><button class="btn ghost" data-a="edundo" ${E.els.length?'':'disabled'} style="flex:1">↩ Annulla l'ultimo</button><button class="btn ghost" data-a="edclear" ${E.els.length?'':'disabled'} style="flex:1">Cancella disegno</button></div>
      ${LEGEND}
    </section>
    ${E.ctx||E.sheet?`<label class="row small" style="gap:8px;align-items:center"><input type="checkbox" data-c="edlib" ${E.lib?'checked':''}> Salva anche nella libreria esercizi</label>`:''}
    <button class="btn clay block" data-a="edsave">${E.sheet?'Salva nella lezione':E.ctx?'Salva e metti nella seduta':'Salva nella libreria'}</button>
    ${E.sheet && E.sheet.j!==null ? (U.confirm==='shx'?`<section class="card"><p>Togliere questo esercizio dalla lezione?</p><div class="row"><button class="btn danger" data-a="shexdel">Sì, togli</button><button class="btn ghost" data-a="nodel">No</button></div></section>`:`<button class="chip" data-a="askdel" data-k="shx" style="align-self:center">Togli questo esercizio</button>`) : ''}`;
}
function arrowPath(x1,y1,x2,y2,curve){
  if(!curve) return `M${x1} ${y1}L${x2} ${y2}`;
  const mx=(x1+x2)/2, my=(y1+y2)/2, dx=x2-x1, dy=y2-y1, len=Math.hypot(dx,dy)||1, k=.18*len;
  let nx=-dy/len, ny=dx/len; if(ny>0){ nx=-nx; ny=-ny; }
  return `M${x1} ${y1}Q${(mx+nx*k).toFixed(1)} ${(my+ny*k).toFixed(1)} ${x2} ${y2}`;
}

/* match analysis by task */
function taskLive(m){
  const sel = U.tsel || [];
  const pts = m.points.filter(p=>!p.empty), empt = m.points.length - pts.length;
  const cnt = i => pts.filter(p=>p.t.includes(i)).length;
  const last = m.points.slice(-6).map((p,k)=>({p, n:m.points.length-Math.min(6,m.points.length)+k+1})).reverse();
  return `
    <section class="board"><div class="hd"><span>${esc(m.kind)} a compito</span><span>${pts.length} punti con compito${empt?` · ${empt} senza`:''}</span></div>
      <div class="brow" style="grid-template-columns:minmax(0,1fr) auto"><span class="nm">${esc(m.a.name)}</span><span class="pts" style="padding:2px 10px">${pts.filter(p=>p.w===0).length}–${pts.filter(p=>p.w===1).length}</span></div>
      <div class="status"><span>vinti–persi nei punti con compito</span></div></section>
    <section class="card">
      <span class="eyebrow">1 · A fine punto: cosa ha fatto?</span>
      <p class="muted small">Puoi toccarne più di uno. Se non ha fatto nessun compito, non segnare niente.</p>
      <div class="pick">${m.tasks.map((t,i)=>`<button data-a="tsel" data-k="${i}" aria-pressed="${sel.includes(i)}"><i>${cnt(i)}</i><span>${esc(t)}</span></button>`).join('')}</div>
      <span class="eyebrow">2 · Com'è finito il punto?</span>
      <div class="winrow"><button class="win a" data-a="tpoint" data-k="0" ${sel.length?'':'disabled'} style="background:#1E7A4C">Vinto</button><button class="win b" data-a="tpoint" data-k="1" ${sel.length?'':'disabled'} style="background:#B0372B">Perso</button></div>
      <button class="btn ghost block" data-a="tpoint" data-k="x" ${sel.length?'':'disabled'}>Salva senza esito</button>
      <button class="chip" data-a="tempty" style="align-self:center">+1 punto giocato senza compito <span class="muted">(facoltativo)</span></button>
    </section>
    <section class="card">
      <div class="row between"><h3>Ultimi punti</h3><button class="chip" data-a="undo" ${m.points.length?'':'disabled'}>↩ Annulla l'ultimo</button></div>
      ${last.length?`<div class="log">${last.map(({p,n})=>`<div><span class="n">${n}</span><span class="g">${p.empty?'<span class="muted">Senza compito</span>':p.t.map(i=>esc(m.tasks[i])).join(' + ')}</span><b style="color:${p.w===0?'var(--ok)':p.w===1?'var(--ko)':'var(--muted)'}">${p.empty?'':p.w===0?'Vinto':p.w===1?'Perso':'–'}</b></div>`).join('')}</div>`:'<p class="muted small">Nessun punto ancora.</p>'}
      ${U.confirm==='stop'?`<div class="confirm"><span>Chiudere e vedere l'analisi?</span><div class="row"><button class="btn" data-a="finish">Sì, chiudi</button><button class="btn ghost" data-a="nodel">Continua</button></div></div>`:`<button class="btn clay block" data-a="askdel" data-k="stop">Fine: vedi l'analisi</button>`}
    </section>`;
}
function taskStats(list){
  const by = {};
  list.forEach(m=>{ m.points.filter(p=>!p.empty).forEach(p=>p.t.forEach(i=>{ const k = m.tasks[i]; by[k] = by[k] || {label:k, n:0, won:0, known:0}; by[k].n++; if(p.w!==null&&p.w!==undefined){ by[k].known++; if(p.w===0) by[k].won++; } })); });
  return Object.values(by).sort((a,b)=>b.n-a.n);
}
function taskBars(rows){ return `<div class="bars">${rows.map(r=>{ const p = pct(r.won,r.known); return `<div class="bar"><div class="lab"><span>${esc(r.label)}</span><span>${r.n} volte${p!==null?` · ${p}% vinti`:''}</span></div><div class="track"><div class="fill ok" style="width:${p??0}%"></div></div></div>`; }).join('')}</div>`; }
function taskSummary(m){
  const pts = m.points.filter(p=>!p.empty), empt = m.points.length - pts.length, rows = taskStats([m]);
  const known = pts.filter(p=>p.w!==null&&p.w!==undefined), won = known.filter(p=>p.w===0).length;
  return `
    <button class="btn ghost" data-a="closematch" style="align-self:flex-start">‹ ${S.session.role==='parent'?'Progressi':'Nuova partita'}</button>
    <section class="board"><div class="hd"><span>Settimana ${m.week} · ${esc(m.kind)} a compito</span><span>${fdate(m.date)}</span></div>
      <div class="brow" style="grid-template-columns:minmax(0,1fr) auto"><span class="nm">${esc(m.a.name)}${m.b?.name?` <span style="color:var(--board-dim);font-size:18px">contro ${esc(m.b.name)}</span>`:''}</span></div>
      <div class="status">${m.tasks.map(t=>`<span>${esc(t)}</span>`).join('')}</div></section>
    <section class="card"><span class="eyebrow">Analisi di ${esc(m.a.name)}</span>
      <div class="kpis">
        <div class="kpi"><b>${pts.length}</b><span>punti con un compito</span></div>
        <div class="kpi"><b>${empt?pct(pts.length,m.points.length)+'%':'–'}</b><span>${empt?`dei ${m.points.length} punti segnati`:'punti senza compito non contati'}</span></div>
        <div class="kpi"><b>${known.length?pct(won,known.length)+'%':'–'}</b><span>vinti quando ha fatto il compito (${won}/${known.length})</span></div>
      </div></section>
    <section class="card"><h3>Ogni compito</h3>${rows.length?taskBars(rows):'<p class="muted">Nessun compito registrato.</p>'}</section>
    ${isCoach() || (S.session.role==='student' && m.a.id===me()?.id) ? (U.confirm==='m:'+m.id?`<div class="confirm"><span>Eliminare questa partita?</span><div class="row"><button class="btn danger" data-a="del" data-k="m:${m.id}">Sì, elimina</button><button class="btn ghost" data-a="nodel">Annulla</button></div></div>`:`<button class="btn danger" data-a="askdel" data-k="m:${m.id}" style="align-self:flex-start">Elimina partita</button>`) : ''}`;
}


/* ---------- length and phases of a training session, per group ---------- */
const DEF_PHASES = () => [{k:'att',n:'Attivazione',m:13},{k:'p1',n:'Pausa',m:4,pause:true},{k:'pr',n:'Fase centrale',m:28},{k:'p2',n:'Pausa',m:3,pause:true},{k:'filo',n:'Filo fisso',m:10},{k:'sr',n:'Servizio e risposta',m:17},{k:'ap',n:'Parte aperta · partita',m:30}];
const PHCOL = {att:'#5B6068', pr:'#3B6FD8', ri:'#3B6FD8', filo:'#8A6200', sr:'#0E6670', ap:'#B4532A'};
const XCOL = ['#7A4FB0','#1F8A7A','#9A7400','#C4622D','#5A6270'];
const lessonOf = g => (g && g.lesson) || {dur:105, phases:DEF_PHASES()};
const ensureLesson = g => { if(!g.lesson) g.lesson = {dur:105, phases:DEF_PHASES()}; return g.lesson; };
const phColor = (p,i) => p.pause ? 'var(--sunk)' : (PHCOL[p.k] || XCOL[i % XCOL.length]);
const durTxt = m => { const h = Math.floor(m/60), r = m%60; return h ? `${h} h${r?' '+r+"'":''}` : `${r}'`; };
let CUR_LG = null;
const getLG = () => CUR_LG || grp(U.planGroup) || teamGroups()[0] || null;
function phInfo(k){
  const L = lessonOf(getLG()), kk = k==='ri' ? 'pr' : k, i = L.phases.findIndex(x=>x.k===kk), p = L.phases[i];
  if(p) return [k==='ri' && p.n==='Fase centrale' ? 'Richiamo' : p.n, phColor(p,i), p.m ? p.m+"'" : ''];
  if(PH[k]) return [PH[k][0], PH[k][1], L.phases.length ? PH[k][2] : ''];
  return ['Esercizio','#5A6270',''];
}
const noLesson = g => !lessonOf(g).phases.length;
const NEUTRAL = () => ['att','pr','filo','sr','ap'].map(k=>({k, n:k==='filo'?'Filo fisso':PH[k][0], m:0}));
const workPhases = g => { const w = lessonOf(g).phases.filter(p=>!p.pause && p.k!=='filo'); return w.length ? w : ['att','pr','sr','ap'].map(k=>({k, n:PH[k][0], m:0})); };
function lessonTL(g, fri){
  const L = lessonOf(g); if(!L.phases.length) return `<p class="small muted">Durata e fasi dell'allenamento non ancora impostate${g?' per '+esc(g.name):''}.</p>`; let ph = L.phases.map((p,i)=>({...p, c:phColor(p,i)}));
  if(fri){ const f = ph.find(p=>p.k==='filo'); ph = ph.filter(p=>p.k!=='filo'); const a = ph.find(p=>p.k==='ap'); if(f && a) a.m += f.m; ph.forEach(p=>{ if(p.k==='pr' && p.n==='Fase centrale') p.n='Richiamo'; if(p.k==='ap' && p.n==='Parte aperta · partita') p.n='Match guidato'; }); }
  const tot = ph.reduce((t,p)=>t+(+p.m||0),0);
  return `<div class="tl" aria-hidden="true">${ph.map(p=>`<span style="flex:${Math.max(1,+p.m||0)} 1 0;background:${p.c}">${p.pause?'':esc(p.n)}</span>`).join('')}</div>
    <p class="small muted">${durTxt(tot)} · ${ph.filter(p=>!p.pause).map(p=>`${esc(p.n)} ${p.m}'`).join(' · ')}</p>`;
}
function lessonEditor(g){
  const L = ensureLesson(g), tot = L.phases.reduce((t,p)=>t+(+p.m||0),0), diff = (L.dur && L.phases.length) ? tot - L.dur : 0;
  return `<button class="btn ghost" data-a="lessonclose" style="align-self:flex-start">‹ Programma di ${esc(g.name)}</button>
    <h1>Durata e fasi · ${esc(g.name)}</h1>
    <section class="card"><h3>Quanto dura l'allenamento</h3>
      <div class="seg" role="group">${[60,75,90,105,120].map(m=>`<button data-a="lessondur" data-k="${m}" aria-pressed="${L.dur===m}">${durTxt(m)}</button>`).join('')}</div>
      <div class="field"><label for="f-ldur">Altra durata (minuti)</label><input id="f-ldur" class="input" type="number" inputmode="numeric" min="30" max="240" value="${L.dur||''}" placeholder="Es. 70" data-c="lessondur"></div>
      <p class="small muted">Cambiando la durata, i minuti delle fasi si adattano in proporzione.</p></section>
    <section class="card"><h3>Le fasi</h3>
      ${lessonTL(g)}
      <div class="list">${L.phases.map((p,i)=>`<div class="phrow"><span class="pdot" style="background:${phColor(p,i)}"></span>
        <input class="input" data-c="phname" data-k="${i}" value="${esc(p.n)}" aria-label="Nome della fase ${i+1}">
        <input class="input phmin" type="number" inputmode="numeric" min="0" max="120" data-c="phmin" data-k="${i}" value="${p.m}" aria-label="Minuti di ${esc(p.n)}"><span class="small muted">min</span>
        <span class="row" style="gap:4px;flex-wrap:nowrap">${i>0?`<button class="chip mini" data-a="phup" data-k="${i}" aria-label="Sposta su">↑</button>`:''}<button class="chip mini" data-a="phdel" data-k="${i}" aria-label="Togli ${esc(p.n)}">✕</button></span></div>`).join('')}</div>
      ${!L.phases.length?'<p class="small muted">Nessuna fase: aggiungi le fasi del tuo allenamento con "+ Fase" e "+ Pausa".</p>':''}<p class="small ${diff?'':'muted'}" style="${diff?'color:var(--ko);font-weight:600':''}">Totale ${tot} minuti${diff?` · ${diff>0?diff+' in più':(-diff)+' in meno'} rispetto a ${L.dur}`:(L.dur&&L.phases.length?' · torna con la durata':'')}</p>
      <div class="row"><button class="btn ghost" data-a="phadd" data-k="work" style="flex:1">+ Fase</button><button class="btn ghost" data-a="phadd" data-k="pause" style="flex:1">+ Pausa</button></div>
      ${diff&&L.dur?`<button class="btn" data-a="phfit">Adatta i minuti a ${L.dur}</button>`:''}
      ${(U.lessonUndo||[]).length?`<button class="chip" data-a="phundo" style="align-self:flex-start">↶ Annulla l'ultima modifica</button>`:''}
      <p class="small muted">Puoi rinominare le fasi (per esempio "Tecnica" invece di "Fase centrale"), toglierle o aggiungerne. Nelle fasi nuove inserisci gli esercizi dalla seduta con "Modifica".</p></section>
    ${teamGroups().length>1?`<section class="card"><h3>Usala anche per altri gruppi</h3><div class="row" style="gap:6px">${teamGroups().filter(x=>x.id!==g.id).map(x=>`<button class="chip" data-a="lessoncopy" data-k="${x.id}">${esc(x.name)}</button>`).join('')}</div></section>`:''}`;
}
function lessonSnap(){ const g=grp(U.lessonEd); if(!g) return; U.lessonUndo=U.lessonUndo||[]; U.lessonUndo.push(JSON.parse(JSON.stringify(ensureLesson(g)))); if(U.lessonUndo.length>30) U.lessonUndo.shift(); }
function scalePhases(L, newDur){ if(!L.phases.length){ L.dur = newDur; return; } const tot = L.phases.reduce((t,p)=>t+(+p.m||0),0) || 1; L.phases.forEach(p=>{ p.m = Math.max(p.pause?2:5, Math.round(p.m*newDur/tot)); }); const t2 = L.phases.reduce((t,p)=>t+p.m,0), big = L.phases.filter(p=>!p.pause).sort((a,b)=>b.m-a.m)[0]; if(big) big.m += newDur - t2; L.dur = newDur; }

