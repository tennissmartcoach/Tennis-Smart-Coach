/* Main render, login, today, athlete card and lists, player type */
/* ---------- render ---------- */
function render(){ const keep = HOOK.beforeRender ? HOOK.beforeRender() : null; try{ renderBase(); } finally { if(HOOK.afterRender) HOOK.afterRender(keep); } }
function renderBase(){
  try{ renderInner(); }catch(e){ console.error(e); document.getElementById('app').innerHTML = `<section class="card" style="margin:16px"><h2>Qualcosa non ha funzionato</h2><p class="small">Questa schermata non si è potuta aprire. I dati sono al sicuro.</p><p class="small muted">${String(e&&e.message||e).replace(/</g,'&lt;')}</p><button class="btn clay" onclick="U.tab=null;U.tOpen=null;U.mEdit=null;U.oWeek=null;U.oDay=null;U.athleteOpen=null;render()">Torna alla Home</button></section>`; }
}
function renderInner(){
  const root = document.getElementById('app');
  const gate = HOOK.gate ? HOOK.gate() : ''; if(gate){ root.innerHTML = gate; return; }
  if(S.session?.role==='student' && !me()) S.session=null;
  if(!S.session){ root.innerHTML = loginView(); return; }
  const role = S.session.role;
  const isPriv = !isStaff(role) && me()?.groupId===PRIV_ID;
  const tabs = role==='fit' ? [['fhome','Home',IC.home],['fprog','Programma',IC.plan],['sath','Atleti',IC.people],['stest','Test',IC.test],['tour','Tornei',IC.trophy]]
    : role==='mind' ? [['mhome','Home',IC.home],['mprog','Programma',IC.plan],['sath','Atleti',IC.people],['mschede','Schede',IC.form],['tour','Tornei',IC.trophy]]
    : role==='coach'
    ? [['home','Home',IC.home],['plan','Programma',IC.plan],['match','Match Analysis',IC.match],['ath','Gruppi e atleti',IC.people],['tour','Tornei',IC.trophy]]
    : role==='parent'
    ? (isPriv ? [['phome','Home',IC.home],['pprog','Programma',IC.today],['stours','Tornei',IC.trophy],['prog','Profilo',IC.user]] : [['phome','Home',IC.home],['pweek','Settimana',IC.today],['stours','Tornei',IC.trophy],['prog','Profilo',IC.user],['meet','Incontro',IC.chat]])
    : (isPriv ? [['shome','Home',IC.home],['pprog','Programma',IC.today],['match','Match Analysis',IC.match],['stours','Tornei',IC.trophy],['prog','Profilo',IC.user]]
              : [['shome','Home',IC.home],['week','Settimana',IC.plan],['match','Match Analysis',IC.match],['stours','Tornei',IC.trophy],['prog','Profilo',IC.user]]);
  if(!U.tab) U.tab = tabs[0][0];
  const club = HOOK.clubName ? HOOK.clubName() : '';
  const who = (role==='coach' || ROLE_NAME[role]) ? (role==='coach' ? 'Maestro' : ROLE_NAME[role]) + (club ? ' · ' + esc(club) : '') : (role==='parent' ? 'Genitore di ' : '') + esc(me()?.name) + ' · ' + esc(grp(me()?.groupId)?.name);
  let body = '';
  switch(U.tab){
    case 'today': body = noticesFor('student', me().groupId) + todayView(); break;
    case 'fhome': body = fitHome(); break;
    case 'mhome': body = mindHome(); break;
    case 'sath': body = U.athleteOpen && ath(U.athleteOpen) ? athleteView(U.athleteOpen) : staffAthList(); break;
    case 'stest': body = `<h1>Test</h1><div class="seg" role="group"><button data-a="ftmode" data-k="fit" aria-pressed="${U.ftMode!=='prog'}">Test atletici</button><button data-a="ftmode" data-k="prog" aria-pressed="${U.ftMode==='prog'}">Test del programma</button></div>` + (U.ftMode==='prog' ? testsView() : fitTestsView()); break;
    case 'mschede': body = mindSchede(); break;
    case 'mprog': body = mprogView(); break;
    case 'fprog': body = fitProgView(); break;
    case 'shome': body = U.mfill ? mfillView() : U.form ? formView() : studentHome(); break;
    case 'phome': body = parentHome(); break;
    case 'prog': body = U.mfill ? mfillView() : U.form ? formView() : athleteView(me().id, true); break;
    case 'stours': body = athleteTours(); break;
    case 'forms': body = U.form ? formView() : formsList(); break;
    case 'pweek': body = noticesFor('parent', me().groupId) + (isOwnG(grp(me().groupId)) ? ownWeekCard(grp(me().groupId)) : parentWeek()); break;
    case 'meet': body = U.form ? formView() : meetView(); break;
    case 'pmatch': body = summaryView(S.matches.find(m=>m.id===U.matchOpen)); break;
    case 'plan': body = planView(); break;
    case 'ath': body = (U.athleteOpen && ath(U.athleteOpen)) ? athleteView(U.athleteOpen) + athManage(ath(U.athleteOpen)) : (U.athPriv && ath(U.athPriv)) ? privDetail(U.athPriv) + (HOOK.shareCard ? HOOK.shareCard(ath(U.athPriv)) : '') + athManage(ath(U.athPriv)) : athList(); break;
    case 'priv': body = U.privOpen && ath(U.privOpen) ? privDetail(U.privOpen) + (HOOK.shareCard ? HOOK.shareCard(ath(U.privOpen)) : '') : privList(); break;
    case 'week': body = isOwnG(grp(me().groupId)) ? ownWeekCard(grp(me().groupId)) : studentWeek(); break;
    case 'home': body = coachHome(); break;
    case 'tour': body = isCoach() ? toursView() : staffTours(); break;
    case 'pprog': body = noticesFor(S.session.role, me().groupId) + privStudentView(); break;
    case 'groups': body = groupsView(); break;
    case 'match': body = matchTab(); break;
  }
  if(U.tdEd) body = tdefView();
  root.innerHTML = `
    <header class="top"><svg class="mark" viewBox="0 0 120 120" aria-hidden="true"><rect x="1.5" y="1.5" width="117" height="117" rx="27" fill="#18222F" stroke="#2A374B" stroke-width="3"/><rect x="24" y="68" width="18" height="28" rx="5" fill="#FFFFFF" fill-opacity=".45"/><rect x="50" y="52" width="18" height="44" rx="5" fill="#FFFFFF" fill-opacity=".7"/><rect x="76" y="44" width="18" height="52" rx="5" fill="#FFFFFF"/><circle cx="85" cy="25" r="13" fill="#D7E84A"/></svg><div class="t"><small>TENNIS</small><b>Smart Coach</b><span>${who}</span></div><button data-a="logout">Esci</button></header>
    <main>${exampleNote()}${body}</main>
    <div class="tabs"><nav>${tabs.map(([k,l,i])=>`<button data-a="tab" data-k="${k}" ${U.tab===k?'aria-current="page"':''} style="position:relative">${i}<span>${l}</span>${k==='ath'&&newForms()?`<b class="dot" aria-label="${newForms()} schede nuove">${newForms()}</b>`:''}</button>`).join('')}</nav></div>`;
}
function tdefView(){
  const E = U.tdEd, custom = (S.ftests||[]).some(t=>t.tdef);
  return `<button class="btn ghost" data-a="tdclose" style="align-self:flex-start">‹ Indietro</button>
    <h1>Prove dei test</h1><p class="small muted">Le prove che gli atleti fanno nelle settimane ${TEST_WEEKS.join(', ')}. I risultati già salvati restano: se togli una prova, i suoi vecchi risultati non si vedono più nella tabella.</p>
    ${E.map((t,i)=>`<section class="card"><div class="row between"><span class="eyebrow">Prova ${i+1}</span><span class="row" style="gap:6px">${i>0?`<button class="chip" data-a="tdup" data-k="${i}" aria-label="Sposta su">↑</button>`:''}<button class="chip" data-a="tddel" data-k="${i}">Togli</button></span></div>
      <div class="field"><label for="td-l-${i}">Nome</label><input id="td-l-${i}" class="input" data-c="tdl" data-k="${i}" value="${esc(t.l)}" placeholder="Es. Sprint 10 m"></div>
      <div class="field"><label for="td-u-${i}">Come si misura</label><input id="td-u-${i}" class="input" data-c="tdu" data-k="${i}" value="${esc(t.u)}" placeholder="Es. secondi, 2 prove, vale la migliore"></div>
      <div class="seg" role="group"><button data-a="tdsec" data-k="${i}" data-v="0" aria-pressed="${!t.sec}">Più è alto, meglio è</button><button data-a="tdsec" data-k="${i}" data-v="1" aria-pressed="${!!t.sec}">Più è basso, meglio è</button></div></section>`).join('')}
    <button class="btn ghost block" data-a="tdadd">+ Aggiungi prova</button>
    <button class="btn clay block" data-a="tdsave">Salva le prove</button>
    <button class="btn ghost block" data-a="tdclose">Annulla</button>
    ${custom ? (U.confirm==='tdreset' ? `<section class="card"><p>Tornare alle prove originali dell'app?</p><div class="row"><button class="btn danger" data-a="tdreset">Sì, torna all'originale</button><button class="btn ghost" data-a="nodel">No</button></div></section>` : `<button class="chip" data-a="tdresetask" style="align-self:center">Torna alle prove originali</button>`) : ''}`;
}
function newForms(){ const s = S.seen || ''; return S.forms.filter(f=>f.date>s).length; }
function exampleNote(){
  if(U.tab==='match' && S.live) return '';
  if(HOOK.statusBar) return HOOK.statusBar();
  return `<div class="note"><b>Versione di prova.</b> Per ora i dati restano solo su questo telefono.</div>`;
}

/* login */
function loginView(){
  let inner = '';
  if(U.step==='role'){
    inner = `
      <div class="card">
        <h2>Chi sei?</h2>
        ${orbitHTML('role', null)}
        <p class="small muted" style="text-align:center">L'atleta è al centro del progetto: maestro, genitori e preparatori lavorano intorno a lui.</p>
      </div>
      <div class="note"><b>Accesso libero per la prova:</b> per ora non servono codici né PIN.</div>`;
  } else if(U.step==='code'){
    inner = `
      <div class="card">
        <h2>Codice del gruppo</h2>
        <p class="muted small">Te lo dà il maestro. Basta inserirlo la prima volta.</p>
        <div class="field"><label for="f-code">Codice</label><input id="f-code" class="input code" autocomplete="off" autocapitalize="characters" placeholder="AGO1" value="${esc(U.code)}"></div>
        ${U.err?`<div class="err">${esc(U.err)}</div>`:''}
        <button class="btn block" data-a="code">Avanti</button>
        <button class="btn ghost block" data-a="back">Indietro</button>
      </div>`;
  } else if(U.step==='name'){
    inner = S.groups.filter(g=>S.athletes.some(x=>x.groupId===g.id)).map(g=>`
      <div class="card">
        <span class="eyebrow">${esc(g.name)}</span>
        <h2>${U.role==='parent'?'Di chi sei genitore?':'Chi sei?'}</h2>
        <div class="list">${S.athletes.filter(a=>a.groupId===g.id).map(a=>`<button class="item" data-a="pickname" data-k="${a.id}"><span class="grow" style="font-weight:600;font-size:18px">${esc(a.name)}</span><span class="chev">›</span></button>`).join('')}</div>
        <button class="btn ghost block" data-a="back">Indietro</button>
      </div>`).join('');
  } else if(U.step==='pin'){
    inner = `
      <div class="card">
        <span class="eyebrow">${esc(ath(U.athlete).name)}</span>
        <h2>${U.role==='parent'?'PIN genitore':'Il tuo PIN'}</h2>
        <div class="pin" aria-label="Cifre inserite: ${U.pin.length} su 4">${[0,1,2,3].map(i=>`<span class="${i<U.pin.length?'f':''}"></span>`).join('')}</div>
        ${U.err?`<div class="err">${esc(U.err)}</div>`:''}
        <div class="keypad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-a="key" data-k="${n}">${n}</button>`).join('')}<button data-a="back" style="font-size:16px">Indietro</button><button data-a="key" data-k="0">0</button><button data-a="key" data-k="del" aria-label="Cancella" style="font-size:22px">⌫</button></div>
      </div>`;
  } else if(U.step==='coach'){
    inner = `
      <div class="card">
        <h2>Accesso maestro</h2>
        <div class="field"><label for="f-coach">Codice maestro</label><input id="f-coach" class="input code" autocomplete="off" autocapitalize="characters"></div>
        ${U.err?`<div class="err">${esc(U.err)}</div>`:''}
        <button class="btn block" data-a="coachin">Entra</button>
        <button class="btn ghost block" data-a="back">Indietro</button>
      </div>`;
  }
  return `<main style="padding-bottom:32px">
    <section class="hero"><div class="lines" aria-hidden="true"></div><span class="eyebrow" style="color:var(--clay)">Settore agonistico</span><h1>Tennis Smart Coach</h1><p>Il programma della settimana, gli esercizi e la partita guidata, dal tuo telefono.</p></section>
    ${inner}</main>`;
}

/* student: today */
function provaBox(w, d, big){
  const pv = PV(w,d);
  return `<div class="count-box"><div class="eyebrow">Prova del giorno</div><p style="font-weight:700;font-size:${big?20:17}px">${esc(pv.t)}${pv.k==='su'?` <span class="tag">su ${pv.n}</span>`:pv.k==='min'?' <span class="tag">1 minuto</span>':''}</p>
    <p class="small"><b>Quando:</b> ${esc(pv.when)}</p><p class="small"><b>Come:</b> ${esc(pv.how)}</p></div>`;
}
function provaForm(w,d){
  const pv = U.pvDraft;
  return `<div class="count-box" style="display:flex;flex-direction:column;gap:10px"><div class="eyebrow">Modifica la prova del giorno</div>
    <div class="field"><label for="pv-t">Cosa si conta</label><input id="pv-t" class="input" data-c="pv" data-k="t" value="${esc(pv.t)}"></div>
    <div class="field"><label>Tipo</label><div class="seg" role="group"><button data-a="pvkind" data-k="su" aria-pressed="${pv.k==='su'}">Su un numero di palle</button><button data-a="pvkind" data-k="min" aria-pressed="${pv.k==='min'}">In 1 minuto</button></div></div>
    ${pv.k==='su'?`<div class="field"><label for="pv-n">Quante palle</label><input id="pv-n" class="input" type="number" inputmode="numeric" min="1" max="50" data-c="pv" data-k="n" value="${pv.n||10}"></div>`:''}
    <div class="field"><label for="pv-when">Quando</label><input id="pv-when" class="input" data-c="pv" data-k="when" value="${esc(pv.when)}"></div>
    <div class="field"><label for="pv-how">Come (chi alimenta, cosa vale)</label><textarea id="pv-how" class="input" rows="4" data-c="pv" data-k="how">${esc(pv.how)}</textarea></div>
    <div class="row"><button class="btn clay" data-a="savepv">Salva</button><button class="btn ghost" data-a="cancelpv">Annulla</button>${(S.provaEdit||{})[w+'-'+d]?'<button class="btn danger" data-a="resetpv">Torna all’originale</button>':''}</div>
    <p class="small muted">Vale per tutti i gruppi. Gli atleti vedono subito la nuova prova nella schermata Oggi.</p></div>`;
}
function provaResults(w,d){
  const gs = teamGroups().filter(g=>g.week===w); if(!gs.length || PV(w,d).k==='test') return '';
  return gs.map(g=>{ const as = S.athletes.filter(a=>a.groupId===g.id); const rows = as.map(a=>{ const rs = S.results.filter(r=>r.athleteId===a.id && r.week===w && r.day===d); return {a, r:rs[rs.length-1]}; });
    const done = rows.filter(x=>x.r).length;
    return `<details class="pres"><summary><b>Risultati della prova · ${esc(g.name)}</b> <span class="muted small">${done} su ${as.length}</span></summary><div class="list small">${rows.map(({a,r})=>`<div class="row between"><span>${esc(a.name)}</span><b>${r?resVal(r):'<span class="muted">–</span>'}</b></div>`).join('')}</div></details>`; }).join('');
}
const resVal = r => r.kind==='min' ? `${r.ok}` : `${r.ok}/${r.tot}`;
function todayView(){
  const a = me(), g = grp(a.groupId), w = W(g.week);
  if(U.day===null) U.day = todayIdx(g);
  const d = U.day, pv = PV(w.n, d);
  const mine = S.results.filter(r=>r.athleteId===a.id && r.week===g.week && r.day===d);
  const c = U.cnt;
  let tool = '';
  if(pv.k==='test') tool = `<p>Oggi niente conta personale: i test li registra il maestro.</p>`;
  else if(pv.k==='su'){ const done = c.tot>=pv.n;
    tool = `<div class="tally" aria-live="polite"><span class="pct">${c.ok}</span><span class="frac">riuscite · palla ${Math.min(c.tot+ (done?0:1), pv.n)} di ${pv.n}</span></div>
      <div class="track"><div class="fill clay" style="width:${c.tot/pv.n*100}%"></div></div>
      <div class="counter"><button class="big yes" data-a="cnt" data-k="1" ${done?'disabled':''}><span>✓</span>Riuscita</button><button class="big no" data-a="cnt" data-k="0" ${done?'disabled':''}><span>✗</span>Non riuscita</button></div>
      ${done?`<p class="note"><b>Fatto:</b> ${c.ok} su ${pv.n}. Ora salva.</p>`:''}`; }
  else { const left = U.timer ? Math.max(0, Math.ceil((U.timer-Date.now())/1000)) : 60;
    tool = `<div class="tally" aria-live="polite"><span class="pct">${c.ok}</span><span class="frac" id="timer">${U.timer?(left?`${left}"`:'Tempo!'):'1:00'}</span></div>
      <div class="counter"><button class="big yes" data-a="cntmin" style="grid-column:1/-1;min-height:150px"><span>+1</span>Palla buona</button></div>
      <div class="row"><button class="btn ghost" data-a="timer" style="flex:1">${U.timer?'Ricomincia il minuto':'Avvia il minuto'}</button></div>`; }
  return `
    <section class="card">
      <div class="row"><div class="wk" style="background:${wcol(w.n)}"><small>SETT</small>${w.n}</div><div class="grow" style="min-width:0"><span class="eyebrow">Settimana ${w.n} di 12</span><h2>${esc(w.name)}</h2></div></div>
      <div class="seg" role="group" aria-label="Allenamento">${pickOf(g).map((i,k)=>`<button data-a="day" data-k="${i}" aria-pressed="${i===d}">${k+1}${doneDate(g,i)?' ✓':''}</button>`).join('')}</div>
      <div><span class="eyebrow">${sLabel(g,d)}${doneDate(g,d)?' · fatto '+(doneDate(g,d)===todayISO()?'oggi':fdate(doneDate(g,d))):''}</span><h3 style="font-size:24px">${esc(w.days[d])}</h3></div>
      ${provaBox(w.n, d, true)}
    </section>
    ${pv.k!=='test'?`<section class="card">
      <h3>Il tuo risultato</h3>
      <div class="field"><label for="f-manual">${pv.k==='su'?`Quante riuscite su ${pv.n}?`:'Il tuo numero in 1 minuto'}</label>
        <div class="row" style="flex-wrap:nowrap"><input id="f-manual" class="input inbig" type="number" inputmode="numeric" min="0" ${pv.k==='su'?`max="${pv.n}"`:''} placeholder="${pv.k==='su'?'Es. 7':'Es. 18'}" style="flex:1;min-width:0;font-size:24px">${pv.k==='su'?`<span class="muted" style="font-family:var(--f-disp);font-size:22px;font-weight:700">/ ${pv.n}</span>`:''}</div></div>
      <button class="btn clay block" data-a="cntsave">Salva</button>
      ${mine.length?`<div class="list small">${mine.map(r=>`<div class="row between"><span>Salvata alle ${new Date(r.date).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}</span><b>${resVal(r)}</b></div>`).join('')}</div>`:''}
    </section>`:`<section class="card"><p>Oggi i test li registra il maestro.</p></section>`}
    ${wellToday()}`;
}

/* athlete progress (student "Progressi" and coach detail) */
const ATABS = [['prof','Profilo'],['allen','Allenamento'],['part','Partite'],['quest','Schede']];
function latestTipo(id){ const t = formsOf(id,'tipo'); return t.length ? tipoOf(t[t.length-1]).first : null; }
function testEntry(id){
  if(!U.testWeek) U.testWeek = 1; const wk = U.testWeek;
  const t = S.tests.find(t=>t.athleteId===id && t.week===wk);
  const val = k => t && t.v[k]!==undefined && t.v[k]!==null ? t.v[k] : '';
  return `<section class="card"><h3>Test</h3>
    <div class="seg" role="group">${TEST_WEEKS.map(n=>`<button data-a="testweek" data-k="${n}" aria-pressed="${n===wk}">Sett. ${n}${S.tests.some(x=>x.athleteId===id&&x.week===n)?' ✓':''}</button>`).join('')}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px">${testsDef().map(x=>`<div class="field"><label for="t-${id}-${x.k}">${esc(x.l)}<br><span style="font-weight:400">${esc(x.u)}</span></label><input id="t-${id}-${x.k}" class="input" inputmode="decimal" value="${val(x.k)}" placeholder="–"></div>`).join('')}</div>
    <button class="btn clay block" data-a="savetest" data-k="${id}">Salva i test della settimana ${wk}</button>
    <button class="chip" data-a="tdopen" style="align-self:flex-start">Modifica le prove dei test</button>
    <h3 style="margin-top:6px">Confronto settimane 1 · 6 · 12</h3>${testTable(id)}</section>`;
}
function athleteView(id, self){
  const a = ath(id), g = grp(a.groupId), role = S.session.role;
  const res = S.results.filter(r=>r.athleteId===id);
  const groups = {};
  res.slice().sort((x,y)=>x.week-y.week||x.day-y.day||(x.date<y.date?-1:1)).forEach(r=>{ const pv = PV(r.week,r.day); const k = pv.t+'|'+(r.kind||pv.k); (groups[k] = groups[k] || {t:pv.t, kind:r.kind||pv.k, rows:[]}).rows.push(r); });
  const ms = S.matches.filter(m=>m.done && (m.a.id===id));
  const merged = mergeStats(ms.filter(m=>m.mode!=='task'));
  const tms = ms.filter(m=>m.mode==='task');
  const tw = TEST_WEEKS.filter(n=>S.tests.some(x=>x.athleteId===id&&x.week===n));
  const tabs = role==='parent' ? ATABS.slice(0,3) : role==='fit' ? ATABS.slice(0,3) : role==='mind' ? [ATABS[0],ATABS[2],ATABS[3]] : ATABS;
  let tab = U.athTab || 'prof'; if(!tabs.some(t=>t[0]===tab)) tab = tabs[0][0];
  const X = athleteExtra(id), lt = latestTipo(id);
  let body = '';
  if(U.finalView===id) return finalProfile(id);
  if(tab==='prof'){
    const pc = profileCard(id), pv = privOf(id);
    const goals = a.groupId===PRIV_ID ? '' : ((role==='coach'||role==='mind') ? `<section class="card"><h3>Obiettivi personali</h3>${pv.goals.length?goalsHtml(pv,true,id):'<p class="muted small">Nessun obiettivo.</p>'}
      <div class="seg" role="group">${PAREAS.map(([k,l])=>`<button data-a="goalarea" data-k="${k}" aria-pressed="${(U.goalArea||(S.session.role==='mind'?'men':'tec'))===k}">${l}</button>`).join('')}</div>
      <div class="row"><input id="f-goal" class="input" placeholder="Es. Seconda carica, 7 su 10 dentro" style="flex:1;min-width:0"><button class="btn" data-a="goaladd" data-k="${id}">Aggiungi</button></div>${U.goalPaste===id ? `<div class="field"><label for="f-goals">Incolla gli obiettivi, uno per riga</label><textarea id="f-goals" class="input" rows="6" placeholder="Seconda carica, 7 su 10 dentro&#10;Tattica: aprire il campo con il dritto incrociato&#10;Mentale: routine dopo l'errore"></textarea><p class="small muted">Se una riga inizia con Tecnica:, Tattica:, Mentale: o Fisico: va in quell'area, altrimenti nell'area scelta sopra.</p><div class="row"><button class="btn" data-a="goalpaste" data-k="${id}" style="flex:1">Aggiungi tutti</button><button class="btn ghost" data-a="goalpastetoggle" data-k="${id}">Annulla</button></div></div>` : `<button class="chip" data-a="goalpastetoggle" data-k="${id}" style="align-self:flex-start">Incolla più obiettivi insieme</button>`}</section>`
      : (pv.goals.length?`<section class="card"><h3>I miei obiettivi</h3>${goalsHtml(pv,false,id)}</section>`:''));
    body = (role==='coach'?`<button class="btn clay" data-a="finalopen" data-k="${id}">Profilo di fine ciclo</button>`:'') + (pc || '<section class="card"><p class="muted">Il maestro non ha ancora condiviso la scheda.</p></section>') + goals + notesCard(id) + staffNotesCard(id) + (role==='fit' ? '' : X.tipo + X.arma);
  } else if(tab==='allen'){
    body = `<section class="card"><h3>Prove del giorno</h3>
      <p class="muted small">Ogni prova con i suoi risultati nel tempo: quando una prova torna, si vede se il numero cresce.</p>
      ${Object.keys(groups).length?Object.values(groups).map(gp=>{ const mx = gp.kind==='min' ? Math.max(...gp.rows.map(r=>r.ok),1) : null;
        return `<div class="field"><b>${esc(gp.t)}</b><div class="bars">${gp.rows.map(r=>{ const v = gp.kind==='min' ? r.ok/mx*100 : pct(r.ok,r.tot); return `<div class="bar"><div class="lab"><span>Sett. ${r.week} · ${DAYS_S[r.day]}</span><span>${resVal(r)}${gp.kind==='min'?' in 1 minuto':''}</span></div><div class="track"><div class="fill" style="width:${v}%;background:${wcol(r.week)}"></div></div></div>`; }).join('')}</div></div>`; }).join(''):`<p class="muted">Ancora nessuna prova salvata.</p>`}
      </section>` + staffProgCards(id) + fitTestsCard(id) + attCard(id) + (role!=='parent'?wellCard(id):'') + ((role==='coach'||role==='fit') ? testEntry(id) : `<section class="card"><h3>Test</h3>${testTable(id)}</section>`);
  } else if(tab==='tour'){
    body = athleteTours().replace('<h1>Tornei</h1>','');
  } else if(tab==='part'){
    body = myTournaments(id) + `${ms.length?`<section class="card"><h3>Partite analizzate</h3><div class="list">${ms.slice().reverse().map(m=>matchItem(m)).join('')}</div></section>`:''}
      <section class="card"><h3>Le scelte in partita</h3>${merged.length?`<p class="muted small">Quante volte, e quanti punti vinti.</p>${choiceBars(merged)}`:`<p class="muted">Ancora nessuna partita con punteggio e scelte.</p>`}</section>
      ${tms.length?`<section class="card"><h3>I compiti in partita</h3><p class="muted small">Da ${tms.length} ${tms.length===1?'partita':'partite'} a compito.</p>${taskBars(taskStats(tms))}</section>`:''}
      ${role!=='parent' ? (matchFormsSummary(id) || '<section class="card"><h3>Prima e dopo la partita</h3><p class="muted">Ancora nessuna scheda.</p></section>') : ''}`;
  } else {
    body = (role==='student' ? myMindForms(id) : '') + (role==='student' ? formsList().replace('<h1>Le mie schede</h1>','<h2>Da compilare</h2>') + '<h2 style="margin-top:8px">Quelle che hai inviato</h2>' : '') + ((X.sett || '') + (X.fam || '') || '<section class="card"><p class="muted">Nessun questionario.</p></section>');
  }
  return `
    ${self?'':`<button class="btn ghost" data-a="closeath" style="align-self:flex-start">‹ Atleti</button>`}
    <section class="card">
      <div class="row between"><span class="eyebrow">${esc(g.name)}</span>${lt?`<span class="tag" style="background:${tcol(lt)};color:#fff">${tname(lt)}</span>`:''}</div>
      <h1>${esc(a.name)}</h1>
      <div class="kpis">
        <div class="kpi"><b>${res.length}</b><span>prove del giorno</span></div>
        <div class="kpi"><b>${tw.length?tw.join(' · '):'–'}</b><span>test fatti (settimane)</span></div>
        <div class="kpi"><b>${ms.length}</b><span>partite analizzate</span></div>
      </div>
    </section>
    <div class="seg sub" role="group" style="position:sticky;top:calc(env(safe-area-inset-top,0px) + 54px);z-index:4">${tabs.map(([k,l])=>`<button data-a="athtab" data-k="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>
    ${body}`;
}
const TAB_OF = {tipo:'prof', arma:'prof', pre:'part', post:'part', sett:'quest', gen:'quest'};
function athList(){
  const gs = S.groups.slice().sort((x,y)=>(x.id===PRIV_ID)-(y.id===PRIV_ID));
  if(!U.resGroup || !grp(U.resGroup)) U.resGroup = (gs.find(g=>S.athletes.some(a=>a.groupId===g.id))||gs[0])?.id;
  const g = grp(U.resGroup);
  const gname = x => x.id===PRIV_ID ? 'Lezioni private' : x.name;
  const picker = `<div class="field"><label for="f-athgrp">Gruppo</label><select id="f-athgrp" class="input inbig" data-c="athgrp">${gs.map(x=>`<option value="${x.id}" ${x.id===U.resGroup?'selected':''}>${esc(gname(x))} (${S.athletes.filter(a=>a.groupId===x.id).length})</option>`).join('')}</select></div>`;
  const newForm = U.newAth ? `<section class="card"><h3>${U.athBulk?'Aggiungi una lista di atleti':'Nuovo atleta'}</h3>
      <div class="seg" role="group"><button data-a="athbulk" data-k="0" aria-pressed="${!U.athBulk}">Uno alla volta</button><button data-a="athbulk" data-k="1" aria-pressed="${!!U.athBulk}">Incolla una lista</button></div>
      ${U.athBulk ? `<div class="field"><label for="f-na-list">Nomi, uno per riga</label><textarea id="f-na-list" class="input" rows="8" placeholder="Luca R.&#10;Giulia M.&#10;&#10;Scuola tennis martedì:&#10;Marco B.&#10;Sara T."></textarea>
        <p class="small muted">Nome e iniziale del cognome. Una riga che finisce con i due punti (per esempio "Scuola tennis martedì:") crea un gruppo nuovo, o usa quello con lo stesso nome; i nomi sotto vanno in quel gruppo. Gli altri vanno nel gruppo scelto qui sotto.</p></div>
      <div class="field"><label for="f-na-grp">Gruppo</label><select id="f-na-grp" class="input">${gs.map(x=>`<option value="${x.id}" ${x.id===U.resGroup?'selected':''}>${esc(gname(x))}</option>`).join('')}</select></div>
      <div class="row"><button class="btn clay" data-a="athbulkadd" style="flex:1">Aggiungi tutti</button><button class="btn ghost" data-a="athnewtoggle">Annulla</button></div>
      </section>` : `
      <div class="field"><label for="f-na-name">Nome e iniziale del cognome</label><input id="f-na-name" class="input" placeholder="Es. Luca R."></div>
      <div class="field"><label for="f-na-grp">Gruppo</label><select id="f-na-grp" class="input">${gs.map(x=>`<option value="${x.id}" ${x.id===U.resGroup?'selected':''}>${esc(gname(x))}</option>`).join('')}</select></div>
      <div class="row"><button class="btn clay" data-a="athnew" style="flex:1">Aggiungi</button><button class="btn ghost" data-a="athnewtoggle">Annulla</button></div>
      </section>`}` : '';
  const gTools = g ? `<div class="row" style="gap:8px">${g.id!==PRIV_ID?`<span class="small muted">Codice gruppo <b style="font-family:var(--f-disp);font-size:17px;color:var(--ink);letter-spacing:.04em">${esc(g.code||'')}</b></span>`:''}
      <span style="flex:1"></span>
      <button class="chip" data-a="pinstoggle" aria-pressed="${!!U.showPins}">${U.showPins?'Nascondi PIN':'Codici e PIN'}</button>
      ${g.id!==PRIV_ID?`<button class="chip" data-a="grpedit" aria-pressed="${!!U.grpEdit}">Gestisci gruppo</button>`:''}</div>` : '';
  const newGrp = U.newGrp ? `<section class="card"><h3>Nuovo gruppo</h3>
      <div class="field"><label for="f-gname">Nome del gruppo</label><input id="f-gname" class="input" placeholder="Es. U12 Pre-agonistica"></div>
      <div class="row"><button class="btn clay" data-a="grpnew" style="flex:1">Crea il gruppo</button><button class="btn ghost" data-a="grpnewtoggle">Annulla</button></div>
      <p class="small muted">Il codice del gruppo viene creato in automatico.</p></section>` : '';
  const grpEdit = (U.grpEdit && g && g.id!==PRIV_ID) ? (()=>{ const n = S.athletes.filter(a=>a.groupId===g.id).length; return `<section class="card"><h3>Gestisci ${esc(g.name)}</h3>
      <div class="field"><label for="f-grn">Nome</label><input id="f-grn" class="input" data-c="grname" value="${esc(g.name)}"></div>
      <div class="row"><span class="small muted">Codice del gruppo <b style="color:var(--ink)">${esc(g.code||'')}</b></span><button class="chip" data-a="grpcode">Nuovo codice</button></div>
      ${n ? `<p class="small muted">Per eliminare il gruppo sposta o togli prima i suoi ${n} atleti.</p>` : (U.confirm==='grp:'+g.id ? `<div class="confirm"><span>Eliminare il gruppo ${esc(g.name)}?</span><div class="row"><button class="btn danger" data-a="grpdel">Sì, elimina</button><button class="btn ghost" data-a="nodel">Annulla</button></div></div>` : `<button class="btn danger" data-a="askdel" data-k="grp:${g.id}" style="align-self:flex-start">Elimina gruppo</button>`)}</section>`; })() : '';
  const pins = (U.showPins && g) ? (()=>{ const as = S.athletes.filter(a=>a.groupId===g.id); return `<section class="card"><h3>Codici e PIN · ${esc(g.id===PRIV_ID?'Lezioni private':g.name)}</h3>${HOOK.pinsExtra ? HOOK.pinsExtra(g) : ''}
      ${as.length?`<div class="list">${as.map(a=>`<div class="pinrow">
        <b>${esc(a.name)}</b>${HOOK.athExtra ? HOOK.athExtra(a) : ''}
        <div class="row" style="gap:6px 14px"><span class="small muted pinl">PIN atleta <b class="pin">${esc(a.pin||'')}</b><button class="chip mini" data-a="newpin" data-k="${a.id}" aria-label="Nuovo PIN atleta">↻</button></span><span class="small muted pinl">PIN genitore <b class="pin">${esc(a.ppin||'')}</b><button class="chip mini" data-a="newppin" data-k="${a.id}" aria-label="Nuovo PIN genitore">↻</button></span></div>
        <div class="row" style="gap:8px;flex-wrap:nowrap"><select class="input" style="flex:1;min-width:0" data-c="athmove" data-k="${a.id}" aria-label="Gruppo di ${esc(a.name)}">${S.groups.map(x=>`<option value="${x.id}" ${x.id===a.groupId?'selected':''}>${esc(x.id===PRIV_ID?'Lezioni private':x.name)}</option>`).join('')}</select>${U.confirm==='ath:'+a.id?`<button class="btn danger" data-a="del" data-k="ath:${a.id}">Sì, togli</button><button class="chip" data-a="nodel">No</button>`:`<button class="chip" data-a="askdel" data-k="ath:${a.id}">Togli</button>`}</div></div>`).join('')}</div>
      <p class="small muted">${HOOK.pinHelp || "Il PIN servirà ad atleti e genitori per entrare nell'app con il codice del gruppo. ↻ ne crea uno nuovo."} Dal menu "Gruppo" sposti un atleta in un altro gruppo.</p>`:'<p class="muted small">Nessun atleta in questo gruppo.</p>'}</section>`; })() : '';
  const head = `<div class="row between"><h1>Gruppi e atleti</h1></div>
    <div class="row" style="gap:8px">${U.newAth?'':`<button class="btn clay" data-a="athnewtoggle" style="flex:1">+ Nuovo atleta</button>`}${U.newGrp?'':`<button class="btn ghost" data-a="grpnewtoggle" style="flex:1">+ Nuovo gruppo</button>`}</div>
    ${newGrp}${newForm}${picker}${gTools}${grpEdit}${pins}`;
  if(!g) return head + `<section class="card"><p>Nessun gruppo. Crealo con "+ Nuovo gruppo".</p></section>`;
  const as = S.athletes.filter(a=>a.groupId===g.id), ids = new Set(as.map(a=>a.id)), seen = S.seen || '';
  if(g.id===PRIV_ID){
    return head + (as.length ? `<div class="agrid">${as.map(a=>{ const pv = privOf(a.id), done = pv.goals.filter(x=>x.st==='done').length;
      return `<button class="acard" data-a="athpriv" data-k="${a.id}"><b style="font-size:18px;font-family:var(--f-disp)">${esc(a.name)}</b>
        ${pv.prog.title?`<span class="small">${esc(pv.prog.title)}</span>`:''}
        <span class="small muted">${pv.goals.length} obiettivi${pv.goals.length?`, ${done} raggiunti`:''} · ${pv.lessons.length} lezioni</span></button>`; }).join('')}</div>` : '<section class="card"><p class="muted">Nessun allievo a lezione privata. Aggiungilo con "+ Nuovo atleta".</p></section>');
  }
  const recent = S.forms.filter(f=>ids.has(f.athleteId)).sort((a,b)=>a.date<b.date?1:-1);
  const fresh = recent.filter(f=>f.date>seen);
  const card = a => { const lt = latestTipo(a.id), rs = S.results.filter(r=>r.athleteId===a.id).sort((x,y)=>x.date<y.date?1:-1), lr = rs[0];
    const nf = fresh.filter(f=>f.athleteId===a.id).length;
    return `<button class="acard" data-a="openath" data-k="${a.id}">
      <div class="row between" style="flex-wrap:nowrap"><b style="font-size:18px;font-family:var(--f-disp)">${esc(a.name)}</b>${nf?`<span class="tag">${nf} ${nf===1?'nuova':'nuove'}</span>`:''}</div>
      ${lt?`<span class="tag" style="background:${tcol(lt)};color:#fff;align-self:flex-start">${tname(lt)}</span>`:'<span class="small muted">Tipologia: questionario da fare</span>'}
      <span class="small">${lr?`Ultima prova: <b>${resVal(lr)}</b> · ${esc(PV(lr.week,lr.day).t)}`:'<span class="muted">Nessuna prova salvata</span>'}</span>
      <span class="small muted">Test ${TEST_WEEKS.map(n=>`${n} ${S.tests.some(x=>x.athleteId===a.id&&x.week===n)?'✓':'–'}`).join(' · ')}</span>
    </button>`; };
  return head + `
    ${recent.length?`<button class="news" data-a="toggleinbox"><span>${fresh.length?`<b>${fresh.length} ${fresh.length===1?'scheda nuova':'schede nuove'}</b>`:'Schede ricevute'}</span><span class="chev">${U.showInbox?'⌃':'⌄'}</span></button>
      ${U.showInbox?`<section class="card" style="padding:4px 16px"><div class="list">${recent.slice(0,12).map(f=>`<button class="item" data-a="openath" data-k="${f.athleteId}" data-t="${TAB_OF[f.kind]||'prof'}"><span class="grow"><b>${esc(ath(f.athleteId)?.name)}</b> · ${esc(fname(f.kind))}${f.by==='parent'?' <span class="tag teal">famiglia</span>':''}${f.date>seen?' <span class="tag">nuova</span>':''}<br><span class="muted small">${fdate(f.date)}</span></span><span class="chev">›</span></button>`).join('')}</div></section>`:''}`:''}
    ${as.length?`<div class="agrid">${as.map(card).join('')}</div>`:'<section class="card"><p class="muted">Nessun atleta in questo gruppo. Aggiungilo con "+ Nuovo atleta".</p></section>'}`;
}
function choiceBars(rows){
  return `<div class="bars">${rows.map(r=>{ const p = pct(r.won, r.n); return `<div class="bar"><div class="lab"><span>${esc(r.label)}</span><span>${r.n} punti · ${p}% vinti</span></div><div class="track"><div class="fill ok" style="width:${p}%"></div></div></div>`; }).join('')}</div>`;
}
function matchItem(m){
  const d = new Date(m.date).toLocaleDateString('it-IT',{day:'numeric',month:'short'});
  if(m.mode==='task') return `<button class="item" data-a="openmatch" data-k="${m.id}"><div class="wk" style="background:${wcol(m.week)}"><small>SETT</small>${m.week}</div><span class="grow"><b>${esc(m.a.name)}</b> · ${esc(m.kind)} a compito<br><span class="muted small">${d} · ${m.points.filter(p=>!p.empty).length} punti con compito</span></span><span class="chev">›</span></button>`;
  const st = replay(m);
  return `<button class="item" data-a="openmatch" data-k="${m.id}"><div class="wk" style="background:${wcol(m.week)}"><small>SETT</small>${m.week}</div><span class="grow"><b>${esc(m.a.name)}</b> – ${esc(m.b.name)}<br><span class="muted small">${d} · ${esc(scoreLine(st)||'in corso')}</span></span><span class="chev">›</span></button>`;
}


/* ---------- player type, weekly programme for athletes and parents ---------- */
const AREA_ORDER = [['Tecnica','Tecnica'],['Tattica','Tattica'],['Testa','Mentale'],['Atletica','Fisico']];
function typeCard(w, full, noHead){
  const pf = PROF[w], wk = W(w);
  const rows = AREA_ORDER.map(([k,lab])=>({lab, r:pf.rows.find(x=>x.a===k)})).filter(x=>x.r);
  return `<section class="card">
    ${noHead?'<span class="eyebrow">Le caratteristiche della tipologia</span>':`<div class="row"><div class="wk" style="background:${wcol(w)}"><small>SETT</small>${w}</div><div class="grow" style="min-width:0"><span class="eyebrow">Settimana ${w} di 12 · la tipologia</span><h2>${esc(wk.name)}</h2></div></div>`}
    <p>${pf.idea}</p>
    <div class="list">${rows.map(({lab,r})=>`<div><span class="tag pri">${lab}</span><p class="small" style="margin-top:6px">${r.fa}</p>${full?`<p class="small muted" style="margin-top:4px"><b>Da evitare:</b> ${r.no}</p>`:''}</div>`).join('')}</div>
  </section>`;
}
function weekDays(w, full, g){
  const pk = g ? pickOf(g) : [0,1,2,3,4];
  return `<section class="card"><h3>Allenamento per allenamento</h3><div class="list">${P.prog[w].map((D,d)=>{ if(!pk.includes(d)) return '';
    const B = dayBlocks(w,d), seq = d===4 ? ['att','ri','sr','ap'] : ['att','pr','sr','ap'];
    const ex = full ? seq.map(ph=>(B[ph]||[]).map(id=>exById(id)).filter(Boolean).map(e=>`<li><b>${phInfo(ph)[0]}:</b> ${e.custom?esc(e.t):e.t}</li>`).join('')).join('') : '';
    return `<div><span class="eyebrow">${g?sLabel(g,d):DAYS[d]}</span><p style="font-weight:700;font-size:17px">${esc(D.title)}</p>${D.obj?`<p class="small">${D.obj}</p>`:''}
      ${full?`<ul class="small" style="margin:6px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:3px">${ex}</ul><p class="small" style="margin-top:6px"><span class="tag">Prova</span> ${esc(PV(w,d).t)}</p>`:''}</div>`; }).join('')}</div></section>`;
}
function studentWeek(){
  const a = me(), g = grp(a.groupId), w = W(g.week);
  return `${typeCard(w.n, true)}${weekDays(w.n, true, g)}
    <section class="card"><span class="eyebrow">Le scelte dell’allenamento 5</span><div class="choices">${w.choices.map((c,i)=>`<div class="choice"><i>${i+1}</i><span>${esc(c.label)}</span></div>`).join('')}</div></section>`;
}

/* ---------- athlete card: strengths and areas to improve ---------- */
const PAREAS = [['tec','Tecnica'],['tat','Tattica'],['men','Mentale'],['fis','Fisico']];
function profileCard(id){
  const pr = (S.profiles||{})[id], role = S.session.role;
  if(!isStaff(role) && (!pr || pr.share===false)) return '';
  if(isStaff(role) && role!=='coach' && !pr) return '';
  if(role==='coach' && U.profEdit===id){
    const A = U.profDraft;
    return `<section class="card"><h3>Scheda atleta</h3>
      ${PAREAS.map(([k,l])=>`<div class="field"><span class="tag pri" style="align-self:flex-start">${l}</span>
        <label for="pf-${k}f">Punti di forza</label><textarea id="pf-${k}f" class="input" rows="2" data-c="pf" data-k="${k}f">${esc(A[k+'f']||'')}</textarea>
        <label for="pf-${k}m">Da migliorare</label><textarea id="pf-${k}m" class="input" rows="2" data-c="pf" data-k="${k}m">${esc(A[k+'m']||'')}</textarea></div>`).join('')}
      <div class="field"><label>Chi la vede</label><div class="seg" role="group"><button data-a="pfshare" data-k="1" aria-pressed="${A.share!==false}">Anche atleta e genitori</button><button data-a="pfshare" data-k="0" aria-pressed="${A.share===false}">Solo il maestro</button></div></div>
      <div class="row"><button class="btn clay" data-a="pfsave" data-k="${id}">Salva la scheda</button><button class="btn ghost" data-a="pfcancel">Annulla</button></div></section>`;
  }
  const has = pr && PAREAS.some(([k])=>pr[k+'f']||pr[k+'m']);
  return `<section class="card"><div class="row between"><h3>Scheda atleta</h3>${role==='coach'?`<button class="chip" data-a="pfedit" data-k="${id}">${has?'Modifica':'Compila'}</button>`:''}</div>
    ${has?`<div class="list">${PAREAS.map(([k,l])=>`<div><span class="tag pri">${l}</span>
      <p class="small" style="margin-top:6px"><b style="color:var(--ok)">Punti di forza:</b> ${esc(pr[k+'f']||'–')}</p>
      <p class="small"><b style="color:var(--clay)">Da migliorare:</b> ${esc(pr[k+'m']||'–')}</p></div>`).join('')}</div>
      ${role==='coach'?`<p class="small muted">${pr.share===false?'Visibile solo al maestro.':'Visibile anche ad atleta e genitori.'} Aggiornata il ${fdate(pr.date)}.</p>`:''}`
    : '<p class="muted">Ancora da compilare: punti di forza e da migliorare per tecnica, tattica, mentale e fisico.</p>'}</section>`;
}

