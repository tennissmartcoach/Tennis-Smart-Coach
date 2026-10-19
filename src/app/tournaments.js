/* Tournaments: planner, who they are for, cards and calendar, paste-to-fill */
/* ---------- tournaments: annual planner ---------- */
const WTYPES = [['train','Allenamento','#3B6FD8'],['comp','Competizione','#B4532A'],['taper','Scarico','#0E6670'],['rest','Riposo','#6B7280']];
const TKIND = [['ob','Obiettivo'],['sv','Sviluppo'],['esp','Esperienza']];
const ROUNDS = ['Qualificazioni','1° turno','2° turno','3° turno','Ottavi','Quarti','Semifinale','Finale','Vincitore'];
const hasRes = r => !!(r && (r.round || (r.matches||[]).length));
function resShort(r){ if(!hasRes(r)) return ''; const ms = (r.matches||[]), w = ms.filter(m=>m.win===true).length;
  return `${r.round?`<span class="tag teal">${esc(r.round)}</span> `:''}${ms.length?`<span class="small muted">${ms.length} ${ms.length===1?'incontro':'incontri'} · ${w} ${w===1?'vinto':'vinti'}</span>`:''}${r.note&&!ms.length?` <span class="small">${esc(r.note)}</span>`:''}`; }
function resView(r){ if(!hasRes(r)) return '';
  const ms = r.matches||[];
  return `<div>${r.round?`<span class="tag teal">${esc(r.round)}</span>`:''}</div>
    ${ms.length?`<div class="list" style="margin-top:6px">${ms.map(m=>`<div class="row" style="gap:8px;align-items:center"><span class="tstat ${m.win===true?'ok':m.win===false?'no':'wait'}" style="min-width:58px;text-align:center">${m.win===true?'Vinto':m.win===false?'Perso':'–'}</span><span class="grow">${esc(m.opp||'Avversario')}</span><b class="small">${esc(m.score||'')}</b></div>`).join('')}</div>`:''}
    ${r.note?`<p class="small" style="margin-top:6px">${esc(r.note)}</p>`:''}`; }
function resEditor(r){
  r = r || {}; const ms = r.matches || [];
  return `<section class="card"><h3>Il tuo torneo</h3>
    <p class="small muted">Scrivi tu come è andata: il maestro lo vede subito.</p>
    <div class="field"><label>Turno raggiunto</label><div class="chips">${ROUNDS.map(z=>`<button class="chip" data-a="myround" data-v="${z}" aria-pressed="${r.round===z}">${z}</button>`).join('')}</div></div>
    <div class="field"><label>Incontri giocati</label>
      ${ms.length?`<div class="list">${ms.map((m,i)=>`<div class="mrow" style="display:flex;flex-direction:column;gap:6px;padding:10px;border:1px solid var(--line);border-radius:10px">
        <div class="row between"><b class="small">Incontro ${i+1}</b><button class="chip" data-a="mmdel" data-k="${i}" aria-label="Elimina incontro ${i+1}">Elimina</button></div>
        <div class="row"><input class="input" style="flex:2;min-width:140px" data-c="mm" data-k="${i}:opp" value="${esc(m.opp||'')}" placeholder="Avversario (nome, classifica)"><input class="input" style="flex:1;min-width:110px" data-c="mm" data-k="${i}:score" value="${esc(m.score||'')}" placeholder="Punteggio es. 6-3 4-6 10-7"></div>
        <div class="seg" role="group"><button data-a="mmwin" data-k="${i}" data-v="1" aria-pressed="${m.win===true}">Vinto</button><button data-a="mmwin" data-k="${i}" data-v="0" aria-pressed="${m.win===false}">Perso</button></div></div>`).join('')}</div>`:'<p class="small muted">Nessun incontro inserito.</p>'}
      <button class="btn ghost" data-a="mmadd" style="align-self:flex-start">+ Aggiungi incontro</button></div>
    <div class="field"><label for="mr-note">Note (facoltative)</label><input id="mr-note" class="input" data-c="mres" data-k="note" value="${esc(r.note||'')}" placeholder="Come ti sei sentito, cosa ha funzionato"></div>
  </section>`; }
const myRes = () => { const x = tByKey(U.tOpen); const id = me().id; x.t.results = x.t.results || {}; return (x.t.results[id] = x.t.results[id] || {}); };
const wtype = k => WTYPES.find(t=>t[0]===k) || WTYPES[0];
function seasonOf(y){ S.season = S.season || {}; return S.season[y] = S.season[y] || {weeks:{}}; }
function weekData(y,n){ const s = seasonOf(y); return s.weeks[n] = s.weeks[n] || {type:'', t:[], note:''}; }
const addDays = (iso,n) => { const d = new Date(iso+'T12:00'); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
function tSpan(t,y,n){ const mon = weekMonday(y,n), st = t.start || mon; let en = t.end || addDays(mon,6); if(en < st) en = st; return [st,en]; }
const isAlt = x => x.i>0 && !x.t.solo;
const TROLES = [['main','1ª scelta'],['alt','Alternativa'],['extra','Torneo in più']];
const tRole = x => x.i===0 ? 'main' : x.t.solo ? 'extra' : 'alt';
const roleSeg = (k, cur) => `<div class="seg" role="group" aria-label="Ruolo nella settimana">${TROLES.map(([r,l])=>`<button data-a="trole" data-k="${k}" data-v="${r}" aria-pressed="${cur===r}">${l}</button>`).join('')}</div>`;
function setTourRole(k, role){
  const x = tByKey(k); if(!x) return k; const w = weekData(x.y,x.n), t = x.t;
  const oldMain = x.i!==0 && w.t[0] && w.t[0].name ? w.t[0] : null;
  const others = w.t.filter((z,i)=>i!==x.i && i!==0 && z.name);
  const blank = {name:'',kind:'',deadline:'',info:'',players:[],results:{}};
  let arr;
  if(role==='main'){ t.solo = false; if(oldMain) oldMain.solo = false; arr = [t, ...(oldMain?[oldMain]:[]), ...others]; }
  else { t.solo = role==='extra'; arr = [oldMain || blank, ...others, t]; }
  w.t = arr; if(!w.type) w.type = 'comp';
  return `${x.y}:${x.n}:${arr.indexOf(t)}`;
}
function setTourDates(k, st, en){
  const x = tByKey(k); if(!x) return k; const t = x.t;
  if(!st){ delete t.start; delete t.end; return k; }
  const wo = weekOf(st), mon = weekMonday(wo.year, wo.n);
  if(en && en < st) en = st;
  if(st===mon && (!en || en===addDays(mon,6))){ delete t.start; delete t.end; } else { t.start = st; if(en) t.end = en; else delete t.end; }
  if(wo.year===x.y && wo.n===x.n) return k;
  const src = weekData(x.y,x.n).t; if(x.i===0 && src.length>1) src[0] = {name:'',kind:'',deadline:'',info:'',players:[],results:{}}; else src.splice(x.i,1);
  const dst = weekData(wo.year, wo.n); if(!dst.type) dst.type = 'comp';
  let i; if(dst.t[0] && !dst.t[0].name){ dst.t[0] = t; i = 0; } else { t.solo = true; dst.t.push(t); i = dst.t.length-1; }
  return `${wo.year}:${wo.n}:${i}`;
}
function allTournaments(){
  const out = [];
  Object.entries(S.season||{}).forEach(([y,s])=>Object.entries(s.weeks).forEach(([n,w])=>(w.t||[]).forEach((t,i)=>{ if(t.name){ const [st,en] = tSpan(t,+y,+n); out.push({y:+y, n:+n, i, t, date:st, end:en}); } })));
  return out.sort((a,b)=>a.date<b.date?-1:1);
}
/* ---------- who a tournament is for: t.who = {groups:[], aths:[]} (empty = everyone) ---------- */
const tWho = t => ({all:false, groups:(t.who&&t.who.groups)||[], aths:(t.who&&t.who.aths)||[]});
const tForAll = t => !t.who;
const tForAth = (t, a) => tForAll(t) || tWho(t).groups.includes(a.groupId) || tWho(t).aths.includes(a.id) || (t.players||[]).includes(a.id) || (t.requests||[]).includes(a.id);
function tVisible(t){
  const r = S.session && S.session.role;
  if(r==='student' || r==='parent'){ const a = me(); return a ? tForAth(t, a) : true; }
  const f = U.tFor || 'all'; if(f==='all') return true;
  if(f==='everyone') return tForAll(t);
  const [k, id] = f.split(':');
  if(k==='g') return !tForAll(t) && (tWho(t).groups.includes(id) || tWho(t).aths.some(x=>ath(x)?.groupId===id));
  if(k==='a'){ const a = ath(id); if(!a) return true; return (t.players||[]).includes(a.id) || (!tForAll(t) && (tWho(t).groups.includes(a.groupId) || tWho(t).aths.includes(a.id))); }
  return true;
}
const tWhoLabel = t => tForAll(t) ? 'per tutti' : 'per ' + whoSummary(tWho(t));
function tForSelect(){
  const gs = S.groups.slice().sort((x,y)=>(x.id===PRIV_ID)-(y.id===PRIV_ID)), f = U.tFor || 'all';
  return `<div class="field"><label for="t-for">Tornei di</label><select id="t-for" class="input" data-c="tfor">
    <option value="all" ${f==='all'?'selected':''}>Tutti i tornei</option>
    <option value="everyone" ${f==='everyone'?'selected':''}>Solo quelli per tutti (non assegnati)</option>
    <optgroup label="Gruppi">${gs.map(g=>`<option value="g:${g.id}" ${f==='g:'+g.id?'selected':''}>${esc(g.id===PRIV_ID?'Lezioni private':g.name)}</option>`).join('')}</optgroup>
    ${gs.map(g=>{ const as = S.athletes.filter(a=>a.groupId===g.id); return as.length ? `<optgroup label="Atleti · ${esc(g.id===PRIV_ID?'Lezioni private':g.name)}">${as.map(a=>`<option value="a:${a.id}" ${f==='a:'+a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</optgroup>` : ''; }).join('')}
  </select></div>`;
}
function tWhoCard(who, actG, actA, actAll, editing, actToggle, all){
  return `<section class="card"><div class="row between"><h3>Per chi</h3>${actToggle?`<button class="chip" data-a="${actToggle}">${editing?'Fatto':'Modifica'}</button>`:''}</div>
    ${editing ? `<div class="seg" role="group"><button data-a="${actAll}" data-k="all" aria-pressed="${all}">Per tutti</button><button data-a="${actAll}" data-k="sel" aria-pressed="${!all}">Gruppi o atleti</button></div>
      ${all ? '<p class="small muted">Lo vedono tutti gli atleti e i genitori.</p>' : `<p class="small muted">Scegli gruppi interi o atleti singoli: solo loro lo vedono e possono chiedere l'iscrizione.</p>${whoPicker(who, actG, actA)}${!who.groups.length&&!who.aths.length?'<p class="small" style="color:var(--ko)">Nessuno scelto: per ora non lo vede nessun atleta.</p>':''}`}`
    : `<p><b>${esc(all ? 'Tutti gli atleti' : (who.groups.length||who.aths.length ? whoSummary(who) : 'Nessuno scelto'))}</b></p>`}</section>`;
}
function upcoming(days){ const now = todayISO(), lim = new Date(Date.now()+days*864e5).toISOString().slice(0,10); return allTournaments().filter(x=>x.date>=weekMonday(weekOf(now).year, weekOf(now).n) && x.date<=lim); }
function deadlines(days){ const now = todayISO(), lim = new Date(Date.now()+days*864e5).toISOString().slice(0,10); return allTournaments().filter(x=>x.t.deadline && x.t.deadline>=now && x.t.deadline<=lim); }
function tourItem(x, showWeek){
  const k = TKIND.find(z=>z[0]===x.t.kind);
  return `<button class="item" data-a="openT" data-k="${x.y}:${x.n}:${x.i}"><span class="pdot" style="background:${x.i===0?'#B4532A':'#B9A79B'}"></span><span class="grow"><b>${esc(x.t.name)}</b>${isAlt(x)?' <span class="tag pri">alternativa</span>':''}${k?` <span class="tag teal">${k[1]}</span>`:''}<br><span class="small muted">${showWeek?`Sett. ${x.n} · dal ${dLabel(x.date)} · `:''}${(x.t.players||[]).length} iscritti${x.t.deadline?` · iscrizioni entro il ${dLabel(x.t.deadline)}`:''}</span></span><span class="chev">›</span></button>`;
}
function tourWeekView(y,n){
  const w = weekData(y,n);
  while(w.t.length<2) w.t.push({name:'', kind:'', deadline:'', info:'', players:[], results:{}});
  return `<button class="btn ghost" data-a="closeweekT" style="align-self:flex-start">‹ Stagione ${y}</button>
    <section class="card"><span class="eyebrow">Settimana ${n} · dal ${dLabel(weekMonday(y,n))} ${y}</span><h1>${w.t[0].name?esc(w.t[0].name):'Programmazione della settimana'}</h1>
      <div class="field"><label>Tipo di settimana</label><div class="seg" role="group">${WTYPES.map(([k,l])=>`<button data-a="wtype" data-k="${k}" aria-pressed="${w.type===k}">${l}</button>`).join('')}</div></div>
      <div class="field"><label for="tw-note">Note</label><input id="tw-note" class="input" data-c="twnote" value="${esc(w.note||'')}" placeholder="Es. settimana con due tornei vicini, partenza giovedì"></div>
    </section>
    ${w.t.map((t,i)=>`<section class="card"><span class="eyebrow">${i===0?'Prima scelta':'Alternativa '+i}</span>
      <div class="field"><label for="tn-${i}">Torneo</label><input id="tn-${i}" class="input" data-c="tour" data-k="${i}:name" value="${esc(t.name)}" placeholder="Es. Pavia TE 14 cat. 2"></div>
      <div class="field"><label>Tipo di torneo</label><div class="seg" role="group">${TKIND.map(([k,l])=>`<button data-a="tkind" data-k="${i}" data-v="${k}" aria-pressed="${t.kind===k}">${l}</button>`).join('')}</div></div>
      <div class="row"><div class="field" style="flex:1;min-width:140px"><label for="td-${i}">Scadenza iscrizioni</label><input id="td-${i}" class="input" type="date" data-c="tour" data-k="${i}:deadline" value="${esc(t.deadline||'')}"></div>
      <div class="field" style="flex:2;min-width:180px"><label for="ti-${i}">Info</label><input id="ti-${i}" class="input" data-c="tour" data-k="${i}:info" value="${esc(t.info||'')}" placeholder="Sede, sito, quote, alloggio"></div></div>
      ${t.name?`<div class="field"><label>Chi partecipa</label><div class="chips">${S.athletes.map(a=>`<button class="chip" data-a="tplayer" data-k="${i}:${a.id}" aria-pressed="${(t.players||[]).includes(a.id)}">${esc(a.name)}</button>`).join('')}</div></div>
      ${(t.players||[]).length?`<div class="field"><label>Risultati (li inserisce l'atleta)</label><div class="list">${t.players.map(pid=>{ const r = (t.results||{})[pid]; return `<div class="row" style="align-items:center"><b style="flex:1;min-width:110px">${esc(ath(pid)?.name)}</b><span style="flex:2">${hasRes(r)?resShort(r):'<span class="small muted">non ancora inserito</span>'}</span></div>`; }).join('')}</div></div>`:''}`:''}
    </section>`).join('')}
    <button class="btn ghost" data-a="taddalt">+ Aggiungi un'alternativa</button>
    <button class="btn clay block" data-a="tsave">Salva la settimana</button>`;
}
function myTournaments(id){
  const xs = allTournaments().filter(x=>(x.t.players||[]).includes(id));
  if(!xs.length) return '';
  return `<section class="card"><h3>I tornei</h3><div class="list">${xs.map(x=>{ const r = (x.t.results||{})[id]; return `<div><b>${esc(x.t.name)}</b><br><span class="small muted">Sett. ${x.n} · dal ${dLabel(x.date)} ${x.y}</span>${hasRes(r)?`<div style="margin-top:4px">${resView(r)}</div>`:''}</div>`; }).join('')}</div></section>`;
}


/* ---------- tournaments v2: simple cards, calendar strip, requests ---------- */
const tKey = x => `${x.y}:${x.n}:${x.i}`;
const tByKey = k => { const [y,n,i] = k.split(':').map(Number); const w = (seasonOf(y).weeks||{})[n]; const t = w && w.t[i]; if(!t) return null; const [st,en] = tSpan(t,y,n); return {y,n,i,t,date:st,end:en}; };
const thisMonday = () => { const w = weekOf(todayISO()); return weekMonday(w.year, w.n); };
function dRange(iso, end){ const a = new Date(iso+'T12:00'), b = new Date((end||addDays(iso,6))+'T12:00'); if(a.getTime()===b.getTime()) return `${a.getDate()} ${MONTHS[a.getMonth()].slice(0,3)}`; return a.getMonth()===b.getMonth() ? `${a.getDate()}–${b.getDate()} ${MONTHS[a.getMonth()].slice(0,3)}` : `${a.getDate()} ${MONTHS[a.getMonth()].slice(0,3)} – ${b.getDate()} ${MONTHS[b.getMonth()].slice(0,3)}`; }
function dlState(t){ if(!t.deadline) return null; const now = todayISO(); if(t.deadline < now) return ['closed','Iscrizioni chiuse']; const days = Math.round((new Date(t.deadline+'T12:00')-new Date(now+'T12:00'))/864e5); return [days<=7?'soon':'open', days===0?'Iscrizioni: scadono oggi':`Iscrizioni entro il ${dLabel(t.deadline)}${days<=7?` · ${days} gg`:''}`]; }
const KCOL = {ob:'var(--clay)', sv:'var(--teal)', esp:'#7A8CA8'};
function tCard(x, mode){
  const t = x.t, k = TKIND.find(z=>z[0]===t.kind), dl = dlState(t), now = todayISO(), past = x.date < thisMonday(), started = x.date <= now;
  const me_ = S.session.role!=='coach' ? me()?.id : null;
  const a = new Date(x.date+'T12:00'), e = new Date((x.end||addDays(x.date,6))+'T12:00');
  const days = a.getTime()===e.getTime() ? `${a.getDate()}` : `${a.getDate()}–${e.getDate()}`, mon = a.getMonth()===e.getMonth() ? '' : `fino al ${e.getDate()} ${MONTHS[e.getMonth()].slice(0,3)}`;
  const meta = [];
  if(k) meta.push(`<span style="color:${KCOL[t.kind]};font-weight:700">${k[1]}</span>`);
  if(isAlt(x)) meta.push('alternativa');
  let right = '';
  if(!me_){
    if(!tForAll(t)) meta.push(esc(tWhoLabel(t)));
    const np = (t.players||[]).length, rq = (t.requests||[]).length;
    if(started){ const nr = (t.players||[]).filter(pid=>hasRes((t.results||{})[pid])).length; meta.push(np ? `${nr}/${np} risultati` : 'nessun iscritto'); }
    else { meta.push(np ? `${np} ${np===1?'iscritto':'iscritti'}` : 'nessun iscritto'); if(rq) meta.push(`<b style="color:var(--clay)">${rq} ${rq===1?'richiesta':'richieste'}</b>`); }
  } else {
    const isIn = (t.players||[]).includes(me_), rq = (t.requests||[]).includes(me_), res = (t.results||{})[me_];
    if(started && isIn) right = hasRes(res) ? (res.round?`<span class="tag teal">${esc(res.round)}</span>`:'<span class="tstat ok">✓</span>') : '<span class="tstat wait">Risultato?</span>';
    else if(isIn) right = '<span class="tstat ok">Iscritto ✓</span>';
    else if(rq) right = '<span class="tstat wait">Richiesta</span>';
  }
  if(dl && !started) meta.push(`<span class="${dl[0]==='soon'?'dlsoon':dl[0]==='closed'?'dlclosed':''}">${dl[0]==='closed'?'iscrizioni chiuse':'scad. '+dLabel(t.deadline)+''}</span>`);
  return `<button class="trow ${past?'past':''}" data-a="openT" data-k="${tKey(x)}" style="--kc:${KCOL[t.kind]||'var(--line)'}">
    <span class="tdd"><b>${days}</b>${mon?`<span>${MONTHS[e.getMonth()].slice(0,3)}</span>`:''}</span>
    <span class="grow" style="min-width:0"><b class="tnm">${esc(t.name)}</b><span class="tmeta">${meta.join(' · ')}</span></span>
    ${right?`<span style="flex:none">${right}</span>`:''}<span class="chev">›</span></button>`;
}
function monthList(xs, mode){
  if(!xs.length) return '';
  const g = []; xs.forEach(x=>{ const key = x.date.slice(0,7); let last = g[g.length-1]; if(!last || last.key!==key){ last = {key, xs:[]}; g.push(last); } last.xs.push(x); });
  return g.map(m=>`<div class="tmonth"><h3 class="tmh">${MONTHS[+m.key.slice(5,7)-1]} <span>${m.key.slice(0,4)}</span></h3><div class="tgroup">${m.xs.map(x=>tCard(x,mode)).join('')}</div></div>`).join('');
}
function monthEditView(){
  const {y,m} = U.mEdit, ym = `${y}-${String(m+1).padStart(2,'0')}`, s = seasonOf(y);
  const ns = []; for(let n=1;n<=53;n++){ const d = weekMonday(y,n); if(d.slice(0,7)===ym) ns.push(n); }
  const xs = allTournaments().filter(x=>x.date.slice(0,7)===ym || (x.y===y && ns.includes(x.n)));
  const wl = n => { const d = new Date(weekMonday(y,n)+'T12:00'), e = new Date(d.getTime()+6*864e5); return `${d.getDate()}–${e.getDate()} ${MONTHS[e.getMonth()].slice(0,3)}`; };
  return `<button class="btn ghost" data-a="mclose" style="align-self:flex-start">‹ Stagione ${y}</button>
    <h1 style="text-transform:capitalize">${MONTHS[m]} ${y}</h1>
    <section class="card"><h3>Tornei del mese</h3>
      ${xs.length?`<div class="list">${xs.map((x,j)=>{ const k = tKey(x); return `<div class="medrow">
        <input class="input" style="font-weight:700" data-c="mtname" data-k="${k}" value="${esc(x.t.name)}" aria-label="Nome del torneo">
        <div class="row"><div class="field" style="flex:1;min-width:120px"><label for="md-s-${j}">Dal</label><input id="md-s-${j}" class="input" type="date" data-c="mtdate" data-k="${k}" data-j="${j}" value="${x.date}"></div><div class="field" style="flex:1;min-width:120px"><label for="md-e-${j}">Al</label><input id="md-e-${j}" class="input" type="date" data-c="mtdate" data-k="${k}" data-j="${j}" value="${x.end}"></div></div>
        ${roleSeg(k, tRole(x))}
        <div class="row"><button class="chip" data-a="openT" data-k="${k}">Apri: iscritti e dettagli ›</button>${U.confirm==='mt:'+k?`<button class="btn danger" data-a="mtdel" data-k="${k}">Sì, elimina</button><button class="btn ghost" data-a="nodel">Annulla</button>`:`<button class="chip" data-a="askdel" data-k="mt:${k}">Elimina</button>`}</div></div>`; }).join('')}</div>`:'<p class="muted small">Nessun torneo in questo mese.</p>'}
    </section>
    <section class="card"><h3>+ Aggiungi un torneo</h3>
      <p class="small muted">Anche un torneo di un solo weekend o che inizia a metà settimana: scegli il primo e l'ultimo giorno e se è la prima scelta della settimana, l'alternativa o un torneo in più.</p>
      <div class="field"><label for="ma-name">Nome</label><input id="ma-name" class="input" placeholder="Es. Torneo Open U14 Catania"></div>
      <div class="row"><div class="field" style="flex:1;min-width:120px"><label for="ma-s">Dal</label><input id="ma-s" class="input" type="date" value="${ym}-01"></div><div class="field" style="flex:1;min-width:120px"><label for="ma-e">Al</label><input id="ma-e" class="input" type="date"></div></div>
      <div class="field"><label>Nella settimana è</label><div class="seg" role="group">${TROLES.map(([r,l])=>`<button data-a="marole" data-k="${r}" aria-pressed="${(U.maRole||'main')===r}">${l}</button>`).join('')}</div></div>
      <div class="field"><label>Tipo di torneo</label><div class="seg" role="group">${TKIND.map(([kk,l])=>`<button data-a="makind" data-k="${kk}" aria-pressed="${U.maKind===kk}">${l}</button>`).join('')}</div></div>
      <button class="btn clay block" data-a="mtadd">Aggiungi al calendario</button>
    </section>
    <section class="card"><h3>Tipo delle settimane</h3>
      <div class="list">${ns.map(n=>{ const w = s.weeks[n]||{}; return `<div class="row between" style="flex-wrap:nowrap"><span><b>${wl(n)}</b></span><select class="input" style="width:auto;min-width:150px" data-c="mwtype" data-k="${y}:${n}"><option value="">Da decidere</option>${WTYPES.map(([k,l])=>`<option value="${k}" ${w.type===k?'selected':''}>${l}</option>`).join('')}</select></div>`; }).join('')}</div>
    </section>`;
}
function toursView(){
  if(U.mEdit) return monthEditView();
  if(U.tWeek) return tourWeekView(U.tWeek.y, U.tWeek.n);
  if(U.tNew) return tourNewView();
  if(U.tOpen && tByKey(U.tOpen)) return tourDetail(tByKey(U.tOpen));
  const mode = U.tMode || 'next', all = allTournaments(), mon = thisMonday();
  const vis = all.filter(x=>tVisible(x.t)), next = vis.filter(x=>x.date>=mon), past = vis.filter(x=>x.date<mon).reverse();
  const reqs = all.filter(x=>(x.t.requests||[]).length).length;
  let body = '';
  const fl = (U.tFor||'all')!=='all';
  if(mode==='next') body = next.length ? monthList(next,'coach') : `<section class="card"><p class="muted">${fl?'Nessun torneo assegnato qui. Con "+ Nuovo torneo" lo crei già assegnato, oppure apri un torneo e cambia "Per chi".':'Nessun torneo in programma. Aggiungine uno con "+ Nuovo torneo".'}</p></section>`;
  else if(mode==='past') body = past.length ? monthList(past,'coach') : '<p class="muted">Nessun torneo giocato.</p>';
  else body = seasonStrip();
  return `<div class="row between"><h1>Tornei</h1><button class="btn clay" data-a="tnew">+ Nuovo torneo</button></div>
    ${reqs?`<div class="note"><b>${reqs} ${reqs===1?'torneo con richieste':'tornei con richieste'} di iscrizione</b> da atleti o genitori.</div>`:''}
    ${tForSelect()}
    ${searchCard()}
    <div class="seg" role="group"><button data-a="tmode" data-k="next" aria-pressed="${mode==='next'}">Prossimi</button><button data-a="tmode" data-k="past" aria-pressed="${mode==='past'}">Giocati</button><button data-a="tmode" data-k="cal" aria-pressed="${mode==='cal'}">Stagione</button></div>
    ${body}`;
}
const LINK_DEF = {fitp:'https://www.fitp.it', te:'https://www.tenniseurope.org'};
function searchMini(){
  if(U.editLinks) return searchCard();
  const L = Object.assign({}, LINK_DEF, S.links||{});
  return `<div class="smini"><span class="small muted">Cerca:</span><a class="chip" href="${esc(L.fitp)}" target="_blank" rel="noopener">FITP ↗</a><a class="chip" href="${esc(L.te)}" target="_blank" rel="noopener">Tennis Europe ↗</a><button class="chip" data-a="lkedit" aria-label="Cambia i link">⚙</button></div>`;
}
function searchCard(){
  const L = Object.assign({}, LINK_DEF, S.links||{});
  if(U.editLinks) return `<section class="card"><h3>Link per la ricerca</h3>
    <div class="field"><label for="lk-fitp">Pagina tornei FITP</label><input id="lk-fitp" class="input" data-c="lk" data-k="fitp" value="${esc(L.fitp)}" inputmode="url"></div>
    <div class="field"><label for="lk-te">Calendario Tennis Europe</label><input id="lk-te" class="input" data-c="lk" data-k="te" value="${esc(L.te)}" inputmode="url"></div>
    <p class="small muted">Incolla l'indirizzo della pagina di ricerca che usi di solito, per esempio quella di MyFITP già filtrata per Under 14.</p>
    <div class="row"><button class="btn" data-a="lksave">Salva</button><button class="btn ghost" data-a="lkreset">Link standard</button></div></section>`;
  return `<section class="card search"><div class="row between"><h3>Cerca nuovi tornei</h3><button class="chip" data-a="lkedit">Cambia i link</button></div>
    <div class="row" style="align-items:stretch"><a class="btn sbtn fitp" href="${esc(L.fitp)}" target="_blank" rel="noopener"><b>FITP</b><span>tornei in Italia ↗</span></a><a class="btn sbtn te" href="${esc(L.te)}" target="_blank" rel="noopener"><b>Tennis Europe</b><span>tornei internazionali ↗</span></a></div>
    <p class="small muted">Si apre il sito ufficiale. Trovato il torneo, torna qui e tocca "+ Nuovo torneo".</p></section>`;
}
function seasonStrip(ro){
  const y = U.tYear || weekOf(todayISO()).year; U.tYear = y; const s = seasonOf(y), cur = weekOf(todayISO()), myid = ro ? me()?.id : null;
  const months = {}; for(let n=1;n<=53;n++){ const d = weekMonday(y,n); if(d.slice(0,4)!==String(y)) continue; (months[+d.slice(5,7)-1] = months[+d.slice(5,7)-1] || []).push(n); }
  const cnt = k => Object.values(s.weeks).filter(w=>w.type===k).length;
  const dd = (t,n) => { if(!(t.start||t.end)) return ''; const [a,b] = tSpan(t,y,n), da = +a.slice(8), db = +b.slice(8); return `<b>${da===db?da:da+'–'+db}</b> `; };
  const cell = (t,n,i) => `<button class="wc full" data-a="openT" data-k="${y}:${n}:${i}" style="--kc:${KCOL[t.kind]||'var(--line)'}">${myid&&(t.players||[]).includes(myid)?'<b style="color:var(--ok)">✓</b> ':''}${dd(t,n)}${esc(t.name)}</button>`;
  const empty = (n,alt,ty) => ro ? `<span class="wc none">${alt?'–':(ty?ty[1]:'–')}</span>` : `<button class="wc add" data-a="tnewat" data-k="${y}:${n}:${alt?1:0}" aria-label="Aggiungi ${alt?'alternativa':'torneo'}">${alt?'+':(ty?`<span>${ty[1]}</span> +`:'+')}</button>`;
  const weekRows = n => { const w = s.weeks[n]||{}, ty = w.type?wtype(w.type):null, isCur = y===cur.year&&n===cur.n, T = w.t||[], d0 = new Date(weekMonday(y,n)+'T12:00');
    const first = T[0]&&T[0].name&&tVisible(T[0]) ? cell(T[0],n,0) : empty(n,false,ty);
    const alts = T.map((t,i)=>({t,i})).filter(o=>o.i>0 && o.t.name && !o.t.solo && tVisible(o.t)), solos = T.map((t,i)=>({t,i})).filter(o=>o.i>0 && o.t.name && o.t.solo && tVisible(o.t));
    const alt = alts.length ? alts.map(o=>cell(o.t,n,o.i)).join('') : empty(n,true);
    const sq = `<span class="wd" style="background:${ty?ty[2]:'var(--line)'};color:${ty?'#fff':'var(--muted)'}">${d0.getDate()}</span>`;
    return `<div class="wk3 ${isCur?'cur':''}">${ro?sq:`<button class="wdb" data-a="openweekT" data-k="${y}:${n}" aria-label="Settimana del ${d0.getDate()}: tipo e note">${sq}</button>`}<div class="wcol">${first}</div><div class="wcol">${alt}</div></div>`
      + solos.map(o=>`<div class="wk3"><span></span><div class="wcol" style="grid-column:2/4">${cell(o.t,n,o.i)}</div></div>`).join(''); };
  return `<div class="row between" style="flex-wrap:nowrap"><button class="chip" data-a="tyear" data-k="-1">‹ ${y-1}</button><h2 style="margin:0">Stagione ${y}</h2><button class="chip" data-a="tyear" data-k="1">${y+1} ›</button></div>
    <div class="legend">${WTYPES.map(([k,l,c])=>`<span><i style="background:${c};height:12px;width:12px;border-radius:3px"></i>${l} (${cnt(k)})</span>`).join('')}<span><i style="background:var(--line);height:12px;width:12px;border-radius:3px"></i>Da decidere</span></div>
    <div class="mlist">${Object.entries(months).map(([m,ns])=>`<section class="mcard"><div class="row between" style="flex-wrap:nowrap;gap:4px"><h3>${MONTHS[m]}</h3>${ro?'':`<button class="medit" data-a="medit" data-k="${y}:${m}" aria-label="Modifica ${MONTHS[m]}" title="Modifica">✎</button>`}</div>
      <div class="wk3 head"><span></span><span>1ª scelta</span><span>Alternativa</span></div>${ns.map(weekRows).join('')}</section>`).join('')}</div>
    <p class="small muted">${ro?'Ogni riga è una settimana (il numero è il lunedì) con il torneo principale e la sua alternativa. Il segno ✓ indica i tornei a cui sei iscritto: tocca un torneo per aprirlo.':'Ogni riga è una settimana: tocca + per aggiungere il torneo o la sua alternativa, il numero colorato per il tipo di settimana, la matita ✎ per cambiare le date dei tornei del mese o aggiungerne uno di un solo weekend.'}</p>`;
}
function tourNewView(){
  const N = U.tNew;
  if(!N.who){ const f = U.tFor || 'all', [k,id] = f.split(':'); N.who = {all:false, sel:f!=='all', groups:k==='g'?[id]:[], aths:k==='a'?[id]:[]}; }
  return `<button class="btn ghost" data-a="tnewclose" style="align-self:flex-start">‹ Tornei</button>
    ${searchCard()}
    <section class="card paste"><h3>Inserimento veloce</h3>
      <p class="small">Sulla pagina del torneo seleziona tutto il testo (o solo nome, date e scadenza), copia e incolla qui. Va bene anche solo il link.</p>
      <textarea id="tn-paste" class="input" rows="4" data-c="tpaste" placeholder="Incolla qui il testo o il link del torneo">${esc(U.tPaste||'')}</textarea>
      <button class="btn clay" data-a="tparse">Compila da solo</button>
      ${U.tParsed?`<p class="small" style="color:var(--ok);font-weight:700">${U.tParsed}</p>`:''}</section>
    <section class="card"><h1>Nuovo torneo</h1>
      <div class="field"><label for="tn-name">Nome</label><input id="tn-name" class="input" data-c="tnew" data-k="name" value="${esc(N.name)}" placeholder="Es. Pavia TE 14 cat. 2"></div>
      <div class="row"><div class="field" style="flex:1;min-width:130px"><label for="tn-date">Dal</label><input id="tn-date" class="input" type="date" data-c="tnew" data-k="date" value="${esc(N.date)}"></div><div class="field" style="flex:1;min-width:130px"><label for="tn-end">Al (se non dura tutta la settimana)</label><input id="tn-end" class="input" type="date" data-c="tnew" data-k="end" value="${esc(N.end||'')}"></div></div>
      <div class="field"><label>Priorità</label><div class="seg" role="group"><button data-a="tnewp" data-k="0" aria-pressed="${N.alt!==true}">Prima scelta</button><button data-a="tnewp" data-k="1" aria-pressed="${N.alt===true}">Alternativa</button></div></div>
      <div class="field"><label>Tipo di torneo</label><div class="seg" role="group">${TKIND.map(([k,l])=>`<button data-a="tnewk" data-k="${k}" aria-pressed="${N.kind===k}">${l}</button>`).join('')}</div></div>
      <div class="field"><label for="tn-dl">Scadenza iscrizioni</label><input id="tn-dl" class="input" type="date" data-c="tnew" data-k="deadline" value="${esc(N.deadline)}"></div>
      <div class="field"><label for="tn-info">Info</label><input id="tn-info" class="input" data-c="tnew" data-k="info" value="${esc(N.info)}" placeholder="Sede, sito, quote, alloggio"></div></section>
    ${tWhoCard(N.who, 'tnwg', 'tnwa', 'tnwall', true, '', !N.who.sel)}
    <button class="btn clay block" data-a="tnewsave">Aggiungi il torneo</button>`;
}
function tourDetail(x){
  const t = x.t, role = S.session.role, k = TKIND.find(z=>z[0]===t.kind), dl = dlState(t), past = x.date < thisMonday();
  if(role==='fit'||role==='mind'){
    return `<button class="btn ghost" data-a="closeT" style="align-self:flex-start">‹ Tornei</button>
      <section class="card"><span class="eyebrow">${dRange(x.date,x.end)} ${x.y}</span><h1>${esc(t.name)}</h1>
        <div class="row" style="gap:6px">${k?`<span class="tag ${t.kind==='ob'?'':'teal'}">${k[1]}</span>`:''}${isAlt(x)?'<span class="tag pri">alternativa</span>':''}</div>
        ${t.info?`<p class="small"><b>Info:</b> ${esc(t.info)}</p>`:''}</section>
      <section class="card"><h3>Iscritti (${(t.players||[]).length})</h3>${(t.players||[]).length?`<div class="list">${t.players.map(pid=>{ const r=(t.results||{})[pid]; return `<button class="item" data-a="staffath" data-k="${pid}"><span class="grow"><b>${esc(ath(pid)?.name)}</b>${hasRes(r)?`<br>${resShort(r)}`:''}</span><span class="chev">›</span></button>`; }).join('')}</div>`:'<p class="muted small">Nessun iscritto.</p>'}</section>`;
  }
  if(role!=='coach'){
    const id = me().id, isIn = (t.players||[]).includes(id), req = (t.requests||[]).includes(id), r = (t.results||{})[id];
    return `<button class="btn ghost" data-a="closeT" style="align-self:flex-start">‹ Tornei</button>
      <section class="card"><span class="eyebrow">${dRange(x.date,x.end)} ${x.y}</span><h1>${esc(t.name)}</h1>
        <div class="row" style="gap:6px">${k?`<span class="tag ${t.kind==='ob'?'':'teal'}">${k[1]}</span>`:''}${isAlt(x)?'<span class="tag pri">alternativa</span>':''}${dl?`<span class="tdl ${dl[0]}">${dl[1]}</span>`:''}</div>
        ${k?`<p class="small muted">${t.kind==='ob'?'Appuntamento prioritario, preparato in modo specifico.':t.kind==='sv'?'Per verificare aspetti tecnico-tattici e di comportamento.':'Per fare più partite, crescere in autonomia e adattamento.'}</p>`:''}
        ${t.info?`<p class="small"><b>Info:</b> ${esc(t.info)}</p>`:''}</section>
      ${isIn && x.date<=todayISO() ? (role==='student' ? resEditor(r) : `<section class="card"><h3>Risultato</h3>${hasRes(r)?resView(r):'<p class="small muted">L\'atleta non ha ancora inserito il risultato.</p>'}</section>`) : `<section class="card">${past ? '<p class="muted">Torneo già giocato.</p>'
        : isIn ? `<h3>Sei iscritto ✓</h3><p class="small muted">Il maestro ha confermato l'iscrizione.</p>`
        : req ? `<h3>Richiesta inviata</h3><p class="small muted">Il maestro deve confermarla.</p><button class="btn ghost" data-a="treqcancel" data-k="${tKey(x)}">Annulla la richiesta</button>`
        : dl && dl[0]==='closed' ? `<p class="muted">Le iscrizioni sono chiuse. Parlane con il maestro.</p>`
        : `<h3>Vuoi partecipare?</h3><p class="small muted">La richiesta arriva al maestro, che decide e conferma l'iscrizione.</p><button class="btn clay block" data-a="treq" data-k="${tKey(x)}">Vorrei iscrivermi</button>`}</section>`}`;
  }
  const rq = t.requests || [];
  return `<button class="btn ghost" data-a="closeT" style="align-self:flex-start">‹ Tornei</button>
    <section class="card"><span class="eyebrow">${dRange(x.date,x.end)} ${x.y}</span>
      <input class="input tname-in" data-c="tf" data-k="name" value="${esc(t.name)}" aria-label="Nome del torneo">
      <div class="field"><label>Nella settimana è</label>${roleSeg(U.tOpen, tRole(x))}</div>
      <div class="field"><label>Tipo di torneo</label><div class="seg" role="group">${TKIND.map(([kk,l])=>`<button data-a="tfkind" data-k="${kk}" aria-pressed="${t.kind===kk}">${l}</button>`).join('')}</div></div>
      <div class="row"><div class="field" style="flex:1;min-width:130px"><label for="tf-st">Dal</label><input id="tf-st" class="input" type="date" data-c="tdates" value="${x.date}"></div><div class="field" style="flex:1;min-width:130px"><label for="tf-en">Al</label><input id="tf-en" class="input" type="date" data-c="tdates" value="${x.end}"></div></div>
      <div class="row"><div class="field" style="flex:1;min-width:140px"><label for="tf-dl">Scadenza iscrizioni</label><input id="tf-dl" class="input" type="date" data-c="tf" data-k="deadline" value="${esc(t.deadline||'')}"></div>
      <div class="field" style="flex:2;min-width:180px"><label for="tf-info">Info</label><input id="tf-info" class="input" data-c="tf" data-k="info" value="${esc(t.info||'')}" placeholder="Sede, sito, quote"></div></div></section>
    ${tWhoCard(tWho(t), 'twg', 'twa', 'twall', !!U.tEdWho, 'tedwho', tForAll(t))}
    ${rq.length?`<section class="card" style="border-color:var(--clay)"><h3>Richieste di iscrizione</h3><div class="list">${rq.map(id=>`<div class="row between"><b>${esc(ath(id)?.name)}</b><span class="row"><button class="btn" data-a="treqok" data-k="${id}">Conferma</button><button class="btn ghost" data-a="treqno" data-k="${id}">No</button></span></div>`).join('')}</div></section>`:''}
    <section class="card"><div class="row between"><h3>Iscritti (${(t.players||[]).length})</h3><button class="chip" data-a="tedplayers">${U.tEdPlayers?'Fatto':'Modifica'}</button></div>
      ${U.tEdPlayers?`<div class="chips">${S.athletes.map(a=>`<button class="chip" data-a="tfplayer" data-k="${a.id}" aria-pressed="${(t.players||[]).includes(a.id)}">${esc(a.name)}</button>`).join('')}</div>`
      : (t.players||[]).length ? `<div class="list">${t.players.map(pid=>{ const r = (t.results||{})[pid]||{}; return `<div><b>${esc(ath(pid)?.name)}</b>${x.date<=todayISO()?`<div style="margin-top:6px">${hasRes(r)?resView(r):'<span class="small muted">Risultato non ancora inserito dall\'atleta.</span>'}</div>`:''}</div>`; }).join('')}</div>${x.date<=todayISO()?'':'<p class="small muted">Dopo il torneo ogni atleta inserisce da sé turno raggiunto e incontri giocati.</p>'}`
      : '<p class="muted small">Nessun iscritto.</p>'}</section>
    ${U.confirm==='tdel'?`<div class="confirm"><span>Eliminare il torneo?</span><div class="row"><button class="btn danger" data-a="tdel">Sì, elimina</button><button class="btn ghost" data-a="nodel">Annulla</button></div></div>`:`<button class="btn danger" data-a="askdel" data-k="tdel" style="align-self:flex-start">Elimina torneo</button>`}`;
}
function athleteTours(){
  if(U.tOpen && tByKey(U.tOpen)) return tourDetail(tByKey(U.tOpen));
  const id = me().id, all = allTournaments().filter(x=>tVisible(x.t)), mon = thisMonday();
  const next = all.filter(x=>x.date>=mon), mine = all.filter(x=>x.date<mon && (x.t.players||[]).includes(id)).reverse();
  const todo = S.session.role==='student' ? all.filter(x=>x.date<=todayISO() && (x.t.players||[]).includes(id) && !hasRes((x.t.results||{})[id])) : [];
  const mode = U.sMode || 'next';
  const body = mode==='cal' ? seasonStrip(true)
    : mode==='past' ? (mine.length?monthList(mine,'me'):'<section class="card"><p class="muted">Nessun torneo giocato.</p></section>')
    : (next.length?monthList(next,'me'):'<section class="card"><p class="muted">Nessun torneo in programma per ora.</p></section>');
  return `<h1>Tornei</h1>
    <p class="muted small">I tornei scelti dal maestro. Tocca un torneo per chiedere di iscriverti.</p>
    ${todo.length?`<div class="note"><b>Come è andata?</b> Inserisci il risultato di: ${todo.map(x=>`<button class="chip" data-a="openT" data-k="${tKey(x)}">${esc(x.t.name)}</button>`).join(' ')}</div>`:''}
    <div class="seg" role="group"><button data-a="smode" data-k="next" aria-pressed="${mode==='next'}">Prossimi</button><button data-a="smode" data-k="past" aria-pressed="${mode==='past'}">Giocati</button><button data-a="smode" data-k="cal" aria-pressed="${mode==='cal'}">Stagione</button></div>
    ${body}`;
}

/* ---------- paste-to-fill: read a tournament from pasted text or link ---------- */
const MON_ALL = {gen:1,jan:1,feb:2,mar:3,apr:4,mag:5,may:5,giu:6,jun:6,lug:7,jul:7,ago:8,aug:8,set:9,sep:9,ott:10,oct:10,nov:11,dic:12,dec:12};
function parseTournament(txt){
  const out = {name:'', date:'', deadline:'', info:'', cat:''};
  const raw = (txt||'').trim(); if(!raw) return out;
  const url = (raw.match(/https?:\/\/\S+/)||[])[0] || '';
  const iso = (y,m,d) => { y = +y; if(y<100) y += 2000; const s = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; return isNaN(new Date(s+'T12:00')) ? '' : s; };
  const found = []; const spans = [];
  const free = (i,len) => !spans.some(([a,b])=>i<b && i+len>a);
  const push = (pos, len, d) => { if(d && free(pos,len)){ found.push({pos, date:d}); spans.push([pos,pos+len]); } };
  const guessY = (mo, d) => { const now = new Date(); let y = now.getFullYear(); const t = new Date(y, mo-1, d); if(t < new Date(now.getTime()-45*864e5)) y++; return y; };
  const mon = w => MON_ALL[(w||'').slice(0,3).toLowerCase()];
  let m;
  const R = [
    [/\b(\d{4})-(\d{2})-(\d{2})\b/g, m=>iso(m[1],m[2],m[3])],
    [/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/g, m=>iso(m[3],m[2],m[1])],
    [/\b(\d{1,2})(?:\s*[-–\/]\s*\d{1,2})?\s+([A-Za-zàéì]{3,})\.?,?\s+(\d{4})\b/g, m=>mon(m[2])?iso(m[3],mon(m[2]),m[1]):''],
    [/\b([A-Za-z]{3,})\.?\s+(\d{1,2})(?:\s*[-–]\s*(?:[A-Za-z]{3,}\.?\s+)?\d{1,2})?,?\s+(\d{4})\b/g, m=>mon(m[1])?iso(m[3],mon(m[1]),m[2]):''],
    [/\b(\d{1,2})(?:\s*[-–\/]\s*\d{1,2})?\s+([A-Za-zàéì]{3,})\b\.?/g, m=>mon(m[2])?iso(guessY(mon(m[2]),+m[1]),mon(m[2]),m[1]):''],
    [/\b([A-Za-z]{3,})\.?\s+(\d{1,2})\b(?!\s*[:.]\d)/g, m=>mon(m[1])?iso(guessY(mon(m[1]),+m[2]),mon(m[1]),m[2]):''],
    [/\b(\d{1,2})[\/.](\d{1,2})\b(?![\/.]\d)/g, m=>(+m[2]>=1&&+m[2]<=12&&+m[1]<=31)?iso(guessY(+m[2],+m[1]),m[2],m[1]):'']
  ];
  R.forEach(([re,fn])=>{ re.lastIndex=0; while((m = re.exec(raw))) push(m.index, m[0].length, fn(m)); });
  found.sort((a,b)=>a.pos-b.pos);
  // deadline: a date within ~60 chars after a deadline keyword
  const kw = /(entry\s*deadline|deadline|closing date|entries close|entry closes|scadenza|termine iscrizion\w*|iscrizion[ei]\s*(entro|chiusura)?|chiusura iscrizioni|withdrawal|sign[\s-]*in)/ig;
  let dl = null; while((m = kw.exec(raw))){ const f = found.find(x=>x.pos>=m.index && x.pos<=m.index+80); if(f){ dl = f; break; } }
  if(dl) out.deadline = dl.date;
  const rest = found.filter(x=>x!==dl).map(x=>x.date).sort();
  if(rest.length) out.date = rest[0];
  // category
  const cat = raw.match(/super\s*category|category\s*[1-3]|cat\.?\s*[1-3]|\b(1[2-8])\s*(&|and|e)?\s*(under|U)\b|\bU\s?1[2-8]\b|under\s*1[2-8]/ig);
  if(cat) out.cat = [...new Set(cat.map(c=>c.replace(/\s+/g,' ').trim()))].slice(0,3).join(' · ');
  // name: first meaningful line, else from link
  const MONRE = '(?:gen|jan|feb|mar|apr|mag|may|giu|jun|lug|jul|ago|aug|set|sep|ott|oct|nov|dic|dec)[a-zàéì]*\\.?';
  const strip = l => l.replace(/https?:\/\/\S+/g,'')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g,'').replace(/\b\d{1,2}[\/.\-]\d{1,2}([\/.\-]\d{2,4})?\b/g,'')
    .replace(new RegExp('\\b\\d{1,2}(\\s*[-–\\/]\\s*\\d{1,2})?\\s+'+MONRE+'(,?\\s+\\d{4})?','ig'),'')
    .replace(new RegExp('\\b'+MONRE+'\\s+\\d{1,2}\\b(,?\\s+\\d{4})?','ig'),'')
    .replace(/\b(entry\s*deadline|deadline|closing date|entries close|entry closes|scadenza( iscrizioni)?|termine iscrizion\w*|tournament dates?|dates?|dal|al|ore|surface|superficie)\b\s*:?/ig,'')
    .replace(/\b\d{1,2}[:.]\d{2}\b/g,'').replace(/[|•]/g,' ').replace(/\s[-–]\s/g,' ').replace(/\s{2,}/g,' ').replace(/^[\s:·,\-–]+|[\s:·,\-–]+$/g,'').trim();
  const generic = /^(tennis europe( junior tour)?|junior tour|tournament( details| info)?|home|menu|calendar|calendario|tornei)$/i;
  const lines = raw.split(/\n+/).map(strip).filter(l=>l.length>3 && l.length<90 && /[A-Za-z]{3}/.test(l) && !generic.test(l) && !/^(category|cat\.)\s*\d$/i.test(l) && !/^(surface|superficie|draw|tabellone)\b/i.test(l));
  if(lines.length) out.name = lines[0];
  if(!out.name && url){ const slug = decodeURIComponent(url.split('/').filter(Boolean).pop()||'').replace(/[-_]+/g,' ').replace(/\.\w+$/,'').replace(/\b\d+\b/g,'').trim(); if(slug) out.name = slug.replace(/\b\w/g,c=>c.toUpperCase()); }
  if(out.cat && out.name && !out.name.toLowerCase().includes(out.cat.split(' · ')[0].toLowerCase())) out.name += ' · ' + out.cat;
  out.info = url;
  return out;
}

