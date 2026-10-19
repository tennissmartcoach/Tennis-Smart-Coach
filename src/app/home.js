/* Home screens, "who are you" orbit, remove test data */
/* ---------- home ---------- */
function provaTrend(id){
  const rs = S.results.filter(r=>r.athleteId===id).sort((x,y)=>x.date<y.date?1:-1); const last = rs[0]; if(!last) return null;
  const t = PV(last.week,last.day).t, prev = rs.slice(1).find(r=>PV(r.week,r.day).t===t && (r.kind||'')===(last.kind||''));
  let delta = '';
  if(prev){ const v = r => r.kind==='min' ? r.ok : (r.tot ? r.ok/r.tot*10 : r.ok); const dv = last.kind==='min'||last.tot===prev.tot ? last.ok-prev.ok : Math.round((v(last)-v(prev))*10)/10;
    delta = dv>0 ? `<span class="tstat ok">+${dv} rispetto all'ultima volta</span>` : dv<0 ? `<span class="tstat wait">${dv} rispetto all'ultima volta</span>` : `<span class="tstat wait">uguale all'ultima volta</span>`; }
  else delta = '<span class="small muted">prima volta: la prossima si vede il confronto</span>';
  return `<p class="small" style="margin:0">Ultima prova: <b>${esc(t)}</b></p><div class="row" style="align-items:center;gap:10px"><b style="font-size:28px;font-family:var(--fd,inherit)">${resVal(last)}</b>${delta}</div>`;
}
function tourHomeCard(id, forParent){
  const all = allTournaments().filter(x=>tVisible(x.t)), mon = thisMonday();
  const mineNext = all.filter(x=>x.date>=mon && (x.t.players||[]).includes(id));
  const lastPlayed = all.filter(x=>x.date<mon && (x.t.players||[]).includes(id) && hasRes((x.t.results||{})[id])).pop();
  const open = all.filter(x=>x.date>=mon && !(x.t.players||[]).includes(id) && !(x.t.requests||[]).includes(id) && !(dlState(x.t)&&dlState(x.t)[0]==='closed'));
  return `<section class="card"><div class="row between"><h3>Tornei</h3><button class="chip" data-a="tab" data-k="stours">Tutti</button></div>
    ${mineNext.length?`<div class="tgroup">${mineNext.slice(0,3).map(x=>tCard(x,'me')).join('')}</div>`:'<p class="small muted">Nessuna iscrizione confermata per ora.</p>'}
    ${open.length?`<p class="small" style="margin-top:4px">${open.length} ${open.length===1?'torneo aperto':'tornei aperti'}: ${forParent?'potete':'puoi'} chiedere l'iscrizione da "Tutti".</p>`:''}
    ${lastPlayed?`<p class="small" style="margin-top:4px">Ultimo giocato: <b>${esc(lastPlayed.t.name)}</b> ${resShort(lastPlayed.t.results[id])}</p>`:''}</section>`;
}
function homeHero(title){ const d = new Date(); return `<section class="hero"><div class="lines" aria-hidden="true"></div><span class="eyebrow" style="color:var(--clay)">${['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'][d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}</span><h1>${title}</h1></section>`; }
function staffGroupPicker(){
  const gs = S.groups.slice().sort((x,y)=>(x.id===PRIV_ID)-(y.id===PRIV_ID));
  if(!U.resGroup || !grp(U.resGroup)) U.resGroup = gs[0]?.id;
  return `<div class="field"><label for="f-athgrp">Gruppo</label><select id="f-athgrp" class="input inbig" data-c="athgrp">${gs.map(x=>`<option value="${x.id}" ${x.id===U.resGroup?'selected':''}>${esc(x.id===PRIV_ID?'Lezioni private':x.name)} (${S.athletes.filter(a=>a.groupId===x.id).length})</option>`).join('')}</select></div>`;
}
function staffAthList(){
  const role = S.session.role, pick = staffGroupPicker(), as = S.athletes.filter(a=>a.groupId===U.resGroup);
  const lim14 = new Date(Date.now()-14*864e5).toISOString().slice(0,10);
  const card = a => { const lt = latestTipo(a.id);
    let info = '';
    if(role==='fit'){ const w = (S.well||[]).filter(x=>x.athleteId===a.id).sort((x,y)=>x.date<y.date?1:-1)[0]; const nt = S.tests.filter(x=>x.athleteId===a.id).length;
      info = `<span class="small">${w?`Ultimo "Come stai": fatica <b>${w.fat||'–'}/5</b>${w.pain?` · <b style="color:var(--ko)">dolore${w.where?': '+esc(w.where):''}</b>`:''} <span class="muted">(${dLabel(w.date)})</span>`:'<span class="muted">Nessun "Come stai" inviato</span>'}</span><span class="small muted">Test inseriti: ${nt}</span>`; }
    else { const fs = S.forms.filter(f=>f.athleteId===a.id), rec = fs.filter(f=>f.date.slice(0,10)>=lim14).length, lm = S.forms.filter(f=>f.athleteId===a.id && (f.kind==='pre'||f.kind==='post')).sort((x,y)=>x.date<y.date?1:-1)[0];
      info = `<span class="small">${lm?`Ultima scheda partita: ${esc(fname(lm.kind))} · ${fdate(lm.date)}`:'<span class="muted">Nessuna scheda partita</span>'}</span><span class="small muted">${rec} schede nelle ultime 2 settimane</span>`; }
    return `<button class="acard" data-a="openath" data-k="${a.id}"><b style="font-size:18px;font-family:var(--f-disp)">${esc(a.name)}</b>${lt?`<span class="tag" style="background:${tcol(lt)};color:#fff;align-self:flex-start">${tname(lt)}</span>`:''}${info}</button>`; };
  return `<h1>Atleti</h1>${pick}${as.length?`<div class="agrid">${as.map(card).join('')}</div>`:'<section class="card"><p class="muted">Nessun atleta in questo gruppo.</p></section>'}`;
}
function nextTourPlayers(days){
  const mon = thisMonday(), lim = addDays(todayISO(), days);
  return allTournaments().filter(x=>x.date>=mon && x.date<=lim && (x.t.players||[]).length);
}
const blankFitWeek = () => ({name:'', days:[0,1,2,3,4].map(()=>({title:'', text:''}))});
function fitProgOf(gid){ S.fitProg = S.fitProg || {}; const o = S.fitProg[gid] = S.fitProg[gid] || {cur:1, weeks:[]}; if(!o.weeks.length) o.weeks.push(blankFitWeek()); if(o.cur>o.weeks.length) o.cur=o.weeks.length; return o; }
function fitDay(g, di){ const o = fitProgOf(g.id), w = o.weeks[o.cur-1]; return w ? w.days[di] : null; }
function fitHome(){
  if(U.homeView==='notif') return notifView();
  if(U.homeView==='att') return attView();
  const gs = teamGroups(), today = todayISO();
  if(!U.homeGrp || !gs.some(g=>g.id===U.homeGrp)) U.homeGrp = gs[0]?.id;
  const g = gs.find(x=>x.id===U.homeGrp);
  let card = '<section class="card"><p class="muted">Nessun gruppo da seguire.</p></section>';
  if(g){ const di = todayIdx(g), wk = curIdx(g)>=0, o = fitProgOf(g.id), fd = fitDay(g,di);
    card = `<section class="card">${gpickHTML(gs, g.id)}
      <div class="row between"><span class="eyebrow">${esc(g.name)} · prep. atletica sett. ${o.cur}</span>${o.weeks[o.cur-1].name?`<span class="tag teal">${esc(o.weeks[o.cur-1].name)}</span>`:''}</div>
      ${sessDots(g)}
      <h2>${esc(sessHead(g, di, fd.title||'Seduta da scrivere'))}</h2>
      ${wk&&fd.text?`<p style="white-space:pre-line">${esc(fd.text)}</p>`:''}
      ${wk?`<p class="small muted">Seduta tecnica del maestro: ${esc(gDayTitle(g,di))}</p>`:''}
      <div class="row"><button class="btn" data-a="homeatt" data-k="${g.id}" style="flex:1">${attBtnLab(g,'fit')}</button><button class="btn ghost" data-a="fpopen" data-k="${g.id}:${o.cur}" style="flex:1">Apri la settimana</button></div></section>`; }
  return `${homeHead()}
    <h2 class="hsec">Oggi in campo</h2>
    ${card}
    <h2 class="hsec">La tua scrivania</h2>
    <section class="card" style="padding:4px 16px"><div class="list">
      ${notifTool()}
      ${toolRow('tab','fprog',IC.plan,'Programma atletico','settimane e sedute dei gruppi')}
      ${toolRow('tab','stest',IC.test,'Test','test atletici e test del programma')}
      ${toolRow('tab','mschede',IC.form,'Schede e questionari','modifica, crea e assegna')}
    </div></section>`;
}
function fitProgView(){
  const tg = teamGroups(); if(!U.fpGroup || !grp(U.fpGroup) || U.fpGroup===PRIV_ID) U.fpGroup = tg[0]?.id; const g = grp(U.fpGroup);
  if(!g) return '<h1>Programma</h1><section class="card"><p class="muted">Nessun gruppo.</p></section>';
  const o = fitProgOf(g.id);
  if(U.fpWeek && o.weeks[U.fpWeek-1]){
    const n = U.fpWeek, w = o.weeks[n-1];
    return `<button class="btn ghost" data-a="fpweek" data-k="" style="align-self:flex-start">‹ Programma di ${esc(g.name)}</button>
      <section class="card"><span class="eyebrow">Preparazione atletica · settimana ${n}${o.cur===n?' · in corso':''}</span>
        <div class="field"><label for="fpw-n">Nome della settimana</label><input id="fpw-n" class="input inbig" data-c="fpwname" value="${esc(w.name)}" placeholder="Es. Forza e rapidità"></div>
        ${o.cur===n?'<span class="tag teal" style="align-self:flex-start">Settimana in corso per gli atleti</span>':`<button class="btn" data-a="fpcur" style="align-self:flex-start">Imposta come settimana in corso</button>`}</section>
      ${w.days.map((d,i)=>!pickOf(g).includes(i)?'':`<section class="card"><span class="eyebrow">${sLabel(g,i)}</span>
        <input class="input" style="font-weight:700" data-c="fpdt" data-k="${i}" value="${esc(d.title)}" placeholder="Titolo, es. Rapidità e cambi di direzione" aria-label="Titolo ${DAYS[i]}">
        <textarea class="input" rows="4" data-c="fpdx" data-k="${i}" placeholder="Es. 10' attivazione&#10;4×20 m sprint, rec. 1'&#10;3×10 affondi per gamba&#10;Core 8'" aria-label="Seduta ${DAYS[i]}">${esc(d.text)}</textarea></section>`).join('')}
      <p class="small muted">Si salva da solo. Gli atleti vedono la seduta del giorno nella loro Home quando questa è la settimana in corso.</p>
      <div class="row"><button class="btn ghost" data-a="fpcopy">Duplica questa settimana</button>${o.weeks.length>1?(U.confirm==='fpw'?`<button class="btn danger" data-a="fpdel">Sì, elimina</button><button class="btn ghost" data-a="nodel">Annulla</button>`:`<button class="btn danger" data-a="askdel" data-k="fpw">Elimina settimana</button>`):''}</div>`;
  }
  return `<h1>Programma atletico</h1>
    <section class="card"><div class="field"><label for="f-fpgrp">Gruppo</label><select id="f-fpgrp" class="input inbig" data-c="fpgrp">${tg.map(x=>`<option value="${x.id}" ${x.id===g.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div></section>
    <section class="card"><div class="list">${o.weeks.map((w,i)=>`<button class="item" data-a="fpweek" data-k="${i+1}"><div class="wk" style="background:var(--pri)"><small>SETT</small>${i+1}</div><span class="grow"><b style="font-size:17px">${esc(w.name||'Senza nome')}</b><br><span class="small muted">${w.days.filter(d=>d.title||d.text).length} di 5 sedute scritte</span></span>${o.cur===i+1?'<span class="tag teal">In corso</span>':''}<span class="chev">›</span></button>`).join('')}</div></section>
    <button class="btn clay block" data-a="fpadd">+ Aggiungi settimana</button>`;
}
const FT_SUGG = [['Sprint 20 m','s','low'],['Salto in lungo da fermo','cm','high'],['Spider test (ventaglio)','s','low'],['Lancio palla medica','m','high'],['Plank','s','high'],['Navetta 5-10-5','s','low']];
const ftById = id => (S.ftests||[]).find(t=>t.id===id);
const ftRes = (tid, aid) => (S.fres||[]).filter(r=>r.testId===tid && r.athleteId===aid).sort((a,b)=>a.date<b.date?-1:1);
function ftDelta(t, rs){ if(rs.length<2) return ''; const a = rs[rs.length-2].v, b = rs[rs.length-1].v, d = Math.round((b-a)*100)/100; if(!d) return '<span class="tstat wait">=</span>'; const good = t.better==='low' ? d<0 : d>0; if(!isStaff(S.session.role)) return good ? `<span class="tstat ok">${d>0?'+':''}${d} meglio di prima</span>` : `<span class="tstat wait">${d>0?'+':''}${d} rispetto a prima</span>`; return `<span class="tstat ${good?'ok':'no'}">${d>0?'+':''}${d} ${good?'meglio':'peggio'}</span>`; }
function fitTestsView(){
  S.ftests = S.ftests || []; S.fres = S.fres || [];
  if(U.ftNew){ const N = U.ftNew;
    return `<section class="card"><h3>Nuovo test atletico</h3>
      <div class="field"><label>Suggeriti</label><div class="chips">${FT_SUGG.map((x,i)=>`<button class="chip" data-a="ftsugg" data-k="${i}">${x[0]}</button>`).join('')}</div></div>
      <div class="field"><label for="ftn-l">Nome</label><input id="ftn-l" class="input" data-c="ftn" data-k="l" value="${esc(N.l)}" placeholder="Es. Sprint 20 m"></div>
      <div class="row"><div class="field" style="flex:1;min-width:120px"><label for="ftn-u">Unità</label><input id="ftn-u" class="input" data-c="ftn" data-k="u" value="${esc(N.u)}" placeholder="Es. s, cm, ripetizioni"></div>
      <div class="field" style="flex:2;min-width:180px"><label>Il risultato è migliore se</label><div class="seg" role="group"><button data-a="ftbetter" data-k="high" aria-pressed="${N.better==='high'}">Più alto</button><button data-a="ftbetter" data-k="low" aria-pressed="${N.better==='low'}">Più basso</button></div></div></div>
      <div class="field"><label for="ftn-x">Come si fa (facoltativo)</label><textarea id="ftn-x" class="input" rows="2" data-c="ftn" data-k="x" placeholder="Es. partenza da fermi, 2 tentativi, vale il migliore">${esc(N.x||'')}</textarea></div>
      <div class="row"><button class="btn clay" data-a="ftsave" style="flex:1">Salva il test</button><button class="btn ghost" data-a="ftcancel">Annulla</button></div></section>`; }
  const t = U.ftOpen && ftById(U.ftOpen);
  if(t){
    const tg = S.groups.slice().sort((x,y)=>(x.id===PRIV_ID)-(y.id===PRIV_ID)); if(!U.ftGroup || !grp(U.ftGroup)) U.ftGroup = tg[0]?.id;
    const d = U.ftDate || todayISO(), as = S.athletes.filter(a=>a.groupId===U.ftGroup);
    const dates = [...new Set(S.fres.filter(r=>r.testId===t.id && as.some(a=>a.id===r.athleteId)).map(r=>r.date))].sort().slice(-4);
    return `<button class="btn ghost" data-a="ftclose" style="align-self:flex-start">‹ Test atletici</button>
      <section class="card"><span class="eyebrow">Test atletico · ${esc(t.u)} · meglio ${t.better==='low'?'più basso':'più alto'}</span><h1>${esc(t.l)}</h1>${t.x?`<p class="small">${esc(t.x)}</p>`:''}</section>
      <section class="card"><h3>Inserisci i risultati</h3>
        <div class="row"><div class="field" style="flex:1;min-width:130px"><label for="ft-d">Giorno</label><input id="ft-d" class="input" type="date" data-c="ftdate" value="${d}"></div>
        <div class="field" style="flex:1;min-width:130px"><label for="ft-g">Gruppo</label><select id="ft-g" class="input" data-c="ftgrp">${tg.map(x=>`<option value="${x.id}" ${x.id===U.ftGroup?'selected':''}>${esc(x.id===PRIV_ID?'Lezioni private':x.name)}</option>`).join('')}</select></div></div>
        <div class="list">${as.map(a=>{ const r = S.fres.find(z=>z.testId===t.id && z.athleteId===a.id && z.date===d); return `<div class="row between" style="flex-wrap:nowrap"><b style="flex:1;min-width:0">${esc(a.name)}</b><input id="ft-in-${a.id}" class="input" style="width:110px" inputmode="decimal" value="${r?r.v:''}" placeholder="${esc(t.u)}"></div>`; }).join('')}</div>
        <button class="btn clay block" data-a="ftrec">Salva i risultati</button></section>
      ${dates.length?`<section class="card"><h3>Storico</h3><div class="scroll-x"><table class="grid"><thead><tr><th>Atleta</th>${dates.map(x=>`<th>${dLabel(x)}</th>`).join('')}<th></th></tr></thead><tbody>${as.map(a=>{ const rs = ftRes(t.id,a.id); return `<tr><td>${esc(a.name)}</td>${dates.map(x=>{ const r = rs.find(z=>z.date===x); return `<td>${r?r.v:'–'}</td>`; }).join('')}<td>${ftDelta(t,rs)}</td></tr>`; }).join('')}</tbody></table></div></section>`:''}
      ${U.confirm==='ft'?`<div class="confirm"><span>Eliminare il test e tutti i suoi risultati?</span><div class="row"><button class="btn danger" data-a="ftdel">Sì, elimina</button><button class="btn ghost" data-a="nodel">Annulla</button></div></div>`:`<button class="btn danger" data-a="askdel" data-k="ft" style="align-self:flex-start">Elimina test</button>`}`;
  }
  return `<button class="btn clay block" data-a="ftnew">+ Nuovo test atletico</button>
    ${S.ftests.filter(t=>!t.tdef).length?`<section class="card" style="padding:4px 16px"><div class="list">${S.ftests.filter(t=>!t.tdef).map(t=>{ const n = new Set(S.fres.filter(r=>r.testId===t.id).map(r=>r.date)).size; return `<button class="item" data-a="ftopen" data-k="${t.id}"><span class="grow"><b style="font-size:17px">${esc(t.l)}</b><br><span class="small muted">${esc(t.u)} · meglio ${t.better==='low'?'più basso':'più alto'} · ${n} ${n===1?'rilevazione':'rilevazioni'}</span></span><span class="chev">›</span></button>`; }).join('')}</div></section>`:'<section class="card"><p class="muted">Nessun test atletico. Creane uno: puoi partire dai suggeriti (sprint, salto, spider test…).</p></section>'}`;
}
function fitTestsCard(id){
  const ts = (S.ftests||[]).filter(t=>ftRes(t.id,id).length); if(!ts.length) return '';
  return `<section class="card"><h3>Test atletici</h3><div class="list small">${ts.map(t=>{ const rs = ftRes(t.id,id), l = rs[rs.length-1]; return `<div class="row between" style="flex-wrap:nowrap"><span><b>${esc(t.l)}</b><br><span class="muted">${dLabel(l.date)}${rs.length>1?` · prima ${rs[rs.length-2].v}`:''}</span></span><span style="text-align:right"><b style="font-size:18px">${l.v}</b> ${esc(t.u)}<br>${ftDelta(t,rs)}</span></div>`; }).join('')}</div></section>`;
}
function fitTodayCard(g){
  if(!g || g.id===PRIV_ID || curIdx(g)<0) return '';
  const d = fitDay(g, todayIdx(g)); if(!d || !(d.title||d.text)) return '';
  return `<section class="card" style="border-left:4px solid #F2994A"><span class="eyebrow" style="color:#F2994A">Preparazione atletica · allenamento ${todayIdx(g)+1}</span>${d.title?`<h3>${esc(d.title)}</h3>`:''}${d.text?`<p style="white-space:pre-line">${esc(d.text)}</p>`:''}</section>`;
}

/* ---------- "who are you": the athlete at the centre, the people around ---------- */
const ORB_IC = {
  student:'<circle cx="12" cy="5" r="2.4"/><path d="M12 8v6l-3 6M12 14l3 6M8 10.5l4-1 3 2.5"/><ellipse cx="18.5" cy="6.5" rx="2.2" ry="3" transform="rotate(35 18.5 6.5)"/><path d="M17.3 9 15 11.5"/>',
  parent:'<circle cx="8" cy="6" r="2.5"/><circle cx="16.5" cy="9" r="2"/><path d="M3.5 20c.4-4 2.2-6.5 4.5-6.5s4.1 2.5 4.5 6.5M13 20c.3-3 1.7-5 3.5-5s3.2 2 3.5 5"/>',
  coach:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.8h6V4M8.5 10h7M8.5 14h7M8.5 18h4"/>',
  fit:'<path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/>',
  mind:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>'
};
const ORB_COL = {coach:'#4C8DFF', parent:'#2FBF9B', mind:'#A77BF0', fit:'#F2994A'};
const ORB_LAB = {student:'Atleta', parent:'Genitore', coach:'Maestro', fit:'Preparatore atletico', mind:'Preparatore mentale'};
function orbitHTML(action, sel){
  const ic = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ORB_IC[k]}</svg>`;
  const sat = (k, x, y) => `<button class="orb-sat${sel===k?' on':''}" style="left:${x}%;top:${y}%;--rc:${ORB_COL[k]}" data-a="${action}" data-k="${k}" aria-pressed="${sel===k}"><i>${ic(k)}</i><span>${ORB_LAB[k]}</span></button>`;
  return `<div class="orbit" role="group" aria-label="Chi sei?">
    <svg class="orb-lines" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="37" /><path d="M50 50 L23 23 M50 50 L77 23 M50 50 L77 77 M50 50 L23 77"/></svg>
    ${sat('coach',23,23)}${sat('parent',77,23)}${sat('mind',23,77)}${sat('fit',77,77)}
    <button class="orb-core${sel==='student'?' on':''}" data-a="${action}" data-k="student" aria-pressed="${sel==='student'}">${ic('student')}<b>Atleta</b><small>al centro</small></button>
  </div>`;
}

/* coach: rename, move or remove an athlete from the athlete's own page */
function athManage(a){
  if(!a || S.session.role!=='coach') return '';
  return `<section class="card"><h3>Gestisci ${esc(a.name)}</h3>
    <div class="field"><label for="f-amn">Nome</label><input id="f-amn" class="input" data-c="athname" data-k="${a.id}" value="${esc(a.name)}"></div>
    <div class="field"><label for="f-amg">Gruppo</label><select id="f-amg" class="input" data-c="athmove" data-k="${a.id}">${S.groups.map(x=>`<option value="${x.id}" ${x.id===a.groupId?'selected':''}>${esc(x.id===PRIV_ID?'Lezioni private':x.name)}</option>`).join('')}</select></div>
    ${U.confirm==='ath:'+a.id ? `<div class="confirm"><span>Togliere ${esc(a.name)}? Si cancellano anche i suoi dati (prove, schede, partite) e il suo accesso.</span><div class="row"><button class="btn danger" data-a="del" data-k="ath:${a.id}">Sì, togli</button><button class="btn ghost" data-a="nodel">Annulla</button></div></div>`
      : `<button class="btn danger" data-a="askdel" data-k="ath:${a.id}" style="align-self:flex-start">Togli l'atleta</button>`}
  </section>`;
}


/* ---------- remove test data (tournaments, filled forms, profiles) ---------- */
function cleanTours(){ const all = []; Object.entries(S.season||{}).forEach(([y,s])=>Object.entries((s&&s.weeks)||{}).forEach(([n,w])=>(w.t||[]).forEach((t,i)=>{ if(t && t.name) all.push({k:`${y}:${n}:${i}`, t, y:+y, n:+n}); }))); return all.sort((a,b)=>a.y-b.y||a.n-b.n); }
const hasEntries = t => (t.players||[]).length || (t.requests||[]).length || Object.keys(t.results||{}).length;
function cleanView(){
  const all = cleanTours();
  if(!U.clean) U.clean = {sel:Object.fromEntries(all.filter(x=>/simulazione/i.test(x.t.name)).map(x=>[x.k,true])), res:true, forms:true, prof:true};
  const C_ = U.clean, nres = all.filter(x=>hasEntries(x.t)).length, nf = (S.forms||[]).length, np = Object.keys(S.profiles||{}).length, nsel = all.filter(x=>C_.sel[x.k]).length;
  const ck = (c,k,on,label,sub) => `<label class="ckrow"><input type="checkbox" data-c="${c}" data-k="${k}" ${on?'checked':''}><span><b>${label}</b>${sub?`<br><span class="small muted">${sub}</span>`:''}</span></label>`;
  return `<button class="btn ghost" data-a="cleanback" style="align-self:flex-start">‹ Home</button>
    <h1>Togli i dati di prova</h1>
    <section class="card"><h3>Ripartire da zero</h3>
      <p class="small">Tiene solo <b>gruppi e atleti</b> (nomi, codici, PIN e accessi online). Toglie tutto il resto: tornei e calendario, prove del giorno, partite, schede, profili, test, presenze, fatica e dolori, note, avvisi e i contenuti delle lezioni private.</p>
      <p class="small muted">Restano anche i programmi, gli esercizi e le schede preparate dallo staff.</p>
      ${U.confirm==='wipe' ? `<div class="confirm"><span>Tolgo tutto tranne gruppi e atleti? Non si può annullare.</span><div class="row"><button class="btn danger" data-a="wipeall">Sì, togli tutto</button><button class="btn ghost" data-a="nodel">Annulla</button></div></div>`
        : `<button class="btn danger block" data-a="askdel" data-k="wipe">Togli tutto tranne gruppi e atleti</button>`}</section>
    <h2>Oppure scegli cosa togliere</h2>
    <div class="note">Prima di procedere fai una copia: Home → <b>Copia di sicurezza</b> → <b>Copia i dati</b>, così, se togli qualcosa per sbaglio, puoi rimetterlo.</div>
    <section class="card"><h3>Tornei da eliminare</h3><p class="small muted">Sono già spuntati quelli con "(simulazione)" nel nome. Spunta anche gli altri che avevi inserito per prova.</p>
      <div class="row"><button class="chip" data-a="cleanall" data-k="1">Seleziona tutti</button><button class="chip" data-a="cleanall" data-k="0">Nessuno</button></div>
      ${all.length ? `<div class="list">${all.map(x=>ck('cleantour', x.k, C_.sel[x.k], esc(x.t.name), `${dRange(...tSpan(x.t,x.y,x.n))} ${x.y}`)).join('')}</div>` : '<p class="muted small">Nessun torneo in calendario.</p>'}</section>
    <section class="card"><h3>Altro da togliere</h3><div class="list">
      ${ck('cleanopt','res',C_.res,'Iscrizioni e risultati dei tornei che restano', `${nres} tornei con iscritti, richieste o risultati`)}
      ${ck('cleanopt','forms',C_.forms,'Schede compilate da atleti e genitori', `${nf} schede (anche la tipologia del giocatore torna "da fare")`)}
      ${ck('cleanopt','prof',C_.prof,'Profili di fine ciclo', `${np} profili`)}
    </div></section>
    ${U.confirm==='clean' ? `<div class="confirm"><span>Elimino ${nsel} tornei${C_.res?', iscrizioni e risultati':''}${C_.forms?', le schede':''}${C_.prof?', i profili':''}?</span><div class="row"><button class="btn danger" data-a="cleanrun">Sì, elimina</button><button class="btn ghost" data-a="nodel">Annulla</button></div></div>`
      : `<button class="btn danger block" data-a="askdel" data-k="clean">Elimina i dati selezionati</button>`}`;
}

