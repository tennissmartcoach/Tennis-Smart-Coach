/* Private lessons: list, calendar, import, PDF, pupil sheet, AI request */
/* ---------- private lessons ---------- */
const PRIV_ID = 'priv';
/* goals written one per line; "Tecnica: …" (or Tattica, Mentale, Fisico) at the start sets the area */
function goalLines(txt, def){
  const AR = {tecnica:'tec', tecnico:'tec', tattica:'tat', tattico:'tat', mentale:'men', fisico:'fis', fisica:'fis', atletica:'fis', atletico:'fis'};
  return txt.split(/\r?\n/).map(raw=>{ let l = raw.replace(/^\s*(?:[-•*·]|\d+[.)])\s*/,'').trim(); if(!l) return null; let area = def;
    const m = l.match(/^([A-Za-zàèéìòù]+)\s*:\s*(.+)$/); if(m && AR[m[1].toLowerCase()]){ area = AR[m[1].toLowerCase()]; l = m[2].trim(); }
    return {area, text:l}; }).filter(Boolean);
}
const GOAL_ST = [['todo','Da iniziare'],['doing','In corso'],['done','Raggiunto']];
const privOf = id => { S.priv = S.priv || {}; return S.priv[id] = S.priv[id] || {prog:{title:'',freq:''}, goals:[], lessons:[]}; };
/* ---------- private lessons: calendar ---------- */
const WD = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
const isoAdd = (iso, n) => { const d = new Date(iso+'T12:00'); d.setDate(d.getDate()+n); return new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10); };
const mondayOf = iso => { const d = new Date(iso+'T12:00'), k = (d.getDay()+6)%7; return isoAdd(iso, -k); };
function plAll(){ return S.athletes.filter(a=>a.groupId===PRIV_ID).flatMap(a=>(privOf(a.id).sched||[]).map(x=>({...x, aid:a.id, name:a.name}))).sort((x,y)=>(x.date+x.time)<(y.date+y.time)?-1:1); }
const durLab = m => m>=60 ? (m%60 ? `${Math.floor(m/60)} h ${m%60}′` : `${m/60} h`) : `${m}′`;
function plForm(aid){
  const as = S.athletes.filter(a=>a.groupId===PRIV_ID);
  if(!as.length) return '';
  const day = U.plDay || todayISO();
  return `<div style="display:flex;flex-direction:column;gap:10px;padding-top:10px;border-top:1px solid var(--line)">
    ${aid?'':`<div class="field"><label for="pl-a">Allievo</label><select id="pl-a" class="input">${as.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></div>`}
    <div class="row"><div class="field" style="flex:1;min-width:130px"><label for="pl-d">Giorno</label><input id="pl-d" class="input" type="date" value="${day}"></div>
      <div class="field" style="flex:1;min-width:100px"><label for="pl-t">Ora</label><input id="pl-t" class="input" type="time" value="${U.plLastTime||'17:00'}"></div></div>
    <div class="row"><div class="field" style="flex:1;min-width:120px"><label for="pl-m">Durata</label><select id="pl-m" class="input">${[30,45,60,90,120].map(m=>`<option value="${m}" ${m===(U.plLastDur||60)?'selected':''}>${durLab(m)}</option>`).join('')}</select></div>
      <div class="field" style="flex:1;min-width:120px"><label for="pl-r">Ripeti</label><select id="pl-r" class="input"><option value="1">Solo questa</option><option value="4">Ogni settimana, per 4</option><option value="8">Ogni settimana, per 8</option><option value="12">Ogni settimana, per 12</option></select></div></div>
    <div class="row"><button class="btn clay" data-a="pladd" data-k="${aid||''}" style="flex:1">Fissa la lezione</button><button class="btn ghost" data-a="plformclose">Annulla</button></div></div>`;
}
function plRow(x, withName){
  return `<div class="row between" style="flex-wrap:nowrap;gap:10px;padding:8px 0;border-top:1px solid var(--line)">
    <span style="font:700 18px var(--f-disp);min-width:58px;color:${x.date<todayISO()?'var(--muted)':'var(--clay)'}">${esc(x.time||'')}</span>
    ${withName?`<button class="item" data-a="plopen" data-k="${x.aid}" style="flex:1;min-width:0;padding:0;border:0"><span class="grow"><b>${esc(x.name)}</b><br><span class="small muted">${durLab(x.dur||60)}</span></span><span class="chev">›</span></button>`:`<span class="grow"><b>${fdate(x.date+'T12:00')}</b> <span class="small muted">· ${WD[new Date(x.date+'T12:00').getDay()]} · ${durLab(x.dur||60)}</span></span>`}
    ${U.confirm==='pl:'+x.id ? `<span class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn danger" data-a="pldel" data-k="${x.aid}:${x.id}" style="min-height:40px;padding:0 12px">Togli</button><button class="chip" data-a="nodel">No</button></span>` : `<button class="chip" data-a="askdel" data-k="pl:${x.id}" aria-label="Togli la lezione">✕</button>`}</div>`;
}
function plCard(){
  const as = S.athletes.filter(a=>a.groupId===PRIV_ID), today = todayISO();
  if(!as.length) return `<section class="card"><div class="row between"><h3>Lezioni private</h3></div><p class="small muted">Aggiungi i tuoi allievi privati per fissare le lezioni nel calendario.</p><button class="btn ghost" data-a="homego" data-k="priv" style="align-self:flex-start">+ Aggiungi un allievo</button></section>`;
  const day = U.plDay || today, mon = mondayOf(isoAdd(today, 7*(U.plWeek||0))), all = plAll();
  const days = [0,1,2,3,4,5,6].map(i=>isoAdd(mon,i)), cnt = d => all.filter(x=>x.date===d).length;
  const list = all.filter(x=>x.date===day);
  const dd = new Date(day+'T12:00');
  return `<section class="card">
    <div class="row between"><h3>Lezioni private</h3><button class="chip" data-a="homego" data-k="priv">I miei allievi (${as.length})</button></div>
    <div class="row between" style="flex-wrap:nowrap"><button class="chip" data-a="plweek" data-k="-1" aria-label="Settimana precedente">‹</button><span class="small muted">${fdate(days[0]+'T12:00')} – ${fdate(days[6]+'T12:00')}</span><button class="chip" data-a="plweek" data-k="1" aria-label="Settimana successiva">›</button></div>
    <div class="wkstrip">${days.map(d=>{ const n = cnt(d), dt = new Date(d+'T12:00'); return `<button data-a="plday" data-k="${d}" aria-pressed="${d===day}" class="${d===today?'today':''}" aria-label="${WD[dt.getDay()]} ${dt.getDate()}${n?`, ${n} lezioni`:''}"><small>${WD[dt.getDay()]}</small><b>${dt.getDate()}</b><i>${n?'•'.repeat(Math.min(n,3)):''}</i></button>`; }).join('')}</div>
    <span class="eyebrow">${day===today?'Oggi':WD[dd.getDay()]+' '+dd.getDate()+' '+MONTHS[dd.getMonth()]}</span>
    ${list.length?`<div>${list.map(x=>plRow(x,true)).join('')}</div>`:'<p class="small muted">Nessuna lezione privata in questo giorno.</p>'}
    ${U.plForm==='home' ? plForm('') : `<button class="btn ghost" data-a="plformopen" data-k="home" style="align-self:flex-start">+ Fissa una lezione</button>`}
  </section>`;
}
function plPupilCard(id){
  const today = todayISO(), xs = (privOf(id).sched||[]).map(x=>({...x, aid:id})).filter(x=>x.date>=today).sort((x,y)=>(x.date+x.time)<(y.date+y.time)?-1:1);
  const edit = S.session.role==='coach';
  if(!edit && !xs.length) return '';
  return `<section class="card"><h3>${edit?'Lezioni in calendario':'Le prossime lezioni'}</h3>
    ${xs.length?`<div>${xs.slice(0,8).map(x=>edit?plRow(x,false):`<div class="row" style="gap:10px;padding:6px 0;border-top:1px solid var(--line)"><b style="font:700 18px var(--f-disp);color:var(--clay);min-width:58px">${esc(x.time||'')}</b><span>${WD[new Date(x.date+'T12:00').getDay()]} ${fdate(x.date+'T12:00')} · ${durLab(x.dur||60)}</span></div>`).join('')}</div>`:'<p class="small muted">Nessuna lezione fissata.</p>'}
    ${edit ? (U.plForm===id ? plForm(id) : `<button class="btn ghost" data-a="plformopen" data-k="${id}" style="align-self:flex-start">+ Fissa una lezione</button>`) : ''}</section>`;
}
/* ---------- import private pupils from a file prepared in chat ----------
   {tipo:'tennis-smart-coach', versione:1, allievi:[{nome, obiettivo, frequenza, obiettivi:[{area,testo,stato}],
     programma:{lezioniSettimana, durata, fasi:[{nome,min}], settimane:[{nome, lezioni:[{titolo, obiettivo, esercizi:[{fase, titolo, etichetta, righe, campo, tipo}]}]}]},
     diario:[{data, fatto, prossima}], calendario:[{data, ora, durata}]}]}
   Existing pupils (same name, among the ones this coach sees) are updated: nothing is deleted, goals/diary/calendar are added without duplicates. */
const impNorm = x => String(x||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
function impMine(){ const A = typeof myAccess==='function' ? myAccess() : null; return S.athletes.filter(a=>a.groupId===PRIV_ID && (!A || athVis(a, A))); }
function impParse(txt, forId){
  let d; const raw = String(txt).trim().replace(/^```(json)?/,'').replace(/```$/,'').replace(/[\u201C\u201D\u201E\u00AB\u00BB]/g,'"').replace(/[\u2018\u2019]/g,"'").trim();
  const a0 = raw.indexOf('{'), a1 = raw.lastIndexOf('}');
  try{ d = JSON.parse(a0>=0 && a1>a0 ? raw.slice(a0, a1+1) : raw); }catch(e){ return {err:'Il file non è nel formato giusto. Usa il file preparato in chat, senza modificarlo.'}; }
  if(!d || !Array.isArray(d.allievi) || !d.allievi.length) return {err:'Nel file non ci sono allievi da importare.'};
  const mine = impMine();
  if(forId && d.allievi.length>1) return {err:'Il testo contiene più allievi: incollalo dall’elenco Lezioni private.'};
  const rows = d.allievi.filter(x=>x && x.nome).map(x=>{ const ex = forId ? ath(forId) : (mine.find(a=>impNorm(a.name)===impNorm(x.nome)) || mine.find(a=>impNorm(a.name).split(' ')[0]===impNorm(x.nome) && impNorm(x.nome).indexOf(' ')<0));
    const pv = ex ? privOf(ex.id) : null, have = new Set((pv?pv.goals:[]).map(g=>impNorm(g.text)));
    const P = x.programma || {}, W = P.settimane || [], L = W.reduce((t,w)=>t+(w.lezioni||[]).length,0), E = W.reduce((t,w)=>t+(w.lezioni||[]).reduce((u,l)=>u+(l.esercizi||[]).length,0),0);
    const SH = x.lezioni || [], SE = SH.reduce((t,l)=>t+(l.fasi||[]).reduce((u,f)=>u+(f.esercizi||[]).length,0),0), SC = SH.reduce((t,l)=>t+(l.fasi||[]).reduce((u,f)=>u+(f.esercizi||[]).filter(e=>(e.campo||[]).length).length,0),0);
    return {x, ex, card:!!x.scheda, goals:(x.obiettivi||[]).filter(g=>g && g.testo && !have.has(impNorm(g.testo))).length, sheets:SH.length, shex:SE, shc:SC, weeks:W.length, lessons:L, exs:E, diary:(x.diario||[]).length, cal:(x.calendario||[]).length}; });
  return {d, rows, forId:forId||null};
}
const aiKey = () => U.gImp ? 'g:'+U.gImp : (U.impFor||'_');
const AI_EX = '[["z",176,22,30,20],["t",191,19,"4×1\'"],["A",24,40,"S"],["M",204,76],["f","M198 72Q120 22 31 36"],["a","M30 45Q110 84 186 76"],["c",12,66],["n",70,46,"1"],["ma","M16 82C4 78 6 66 12 72"]]';
const AI_CAMPO = `IL CAMPETTO ("campo"): mettilo SEMPRE, in OGNI esercizio di OGNI fase (anche attivazione e servizio), anche se il maestro non lo chiede.
Se gli appunti non dicono dove stanno i giocatori, usa la disposizione più normale per quell'esercizio (allievo a fondo campo al centro; maestro dall'altra parte a fondo campo, a metà campo se gioca palle facili, a rete se si parla di volée) e disegna almeno: i giocatori, la palla del maestro, il colpo dell'allievo con la direzione detta (diagonale, lungolinea, centro), le zone bersaglio e i coni se nominati, un numero per ogni passaggio di una sequenza. Il maestro lo potrà correggere nell'app.
Campo visto dall'alto, largo 220 e alto 110. Rete verticale a x=110. Metà sinistra (x da 10 a 110) = lato dell'allievo; metà destra (x da 110 a 210) = lato del maestro. Linee di fondo a x=10 e x=210; linee laterali del doppio a y=9 e y=101, del singolo a y=20.5 e y=89.5; linee del servizio a x=56 e x=164.
Elementi (una lista per ogni elemento):
["A",x,y,"S"] allievo con la sua iniziale · ["B",x,y,"L"] secondo allievo · ["M",x,y] maestro · ["c",x,y] cono · ["z",x,y,larghezza,altezza] zona bersaglio · ["t",x,y,"testo"] scritta breve · ["n",x,y,"1"] numero della sequenza · ["a","M x y Q cx cy x2 y2"] colpo dell'allievo (percorso SVG) · ["b","…"] colpo del secondo allievo · ["f","…"] palla del maestro · ["ma","…"] spostamento di un giocatore.
Esempio: ${AI_EX}`;
function aiPrompt(forId){
  const a = forId ? ath(forId) : null, pv = a ? privOf(a.id) : null, notes = (U.aiNotes && U.aiNotes[forId||'_']) || '';
  const next = pv ? Math.max(0, ...(pv.sheets||[]).map(x=>+x.n||0)) + 1 : 1;
  const goals = pv ? pv.goals.map(g=>'- "'+g.text+'" ('+({tat:'tattica',tec:'tecnica',men:'mentale',fis:'fisica'}[g.area]||g.area)+(g.grp?', '+g.grp:'')+')').join('\n') : '';
  return `Sei l'assistente di un maestro di tennis. Trasforma gli appunti del maestro (in fondo) in un testo da incollare nell'app Tennis Smart Coach.

COME RISPONDERE
- Rispondi SOLO con un blocco di codice che contiene il JSON, senza altro testo prima o dopo: il maestro lo copia con un tocco e lo incolla nell'app.
- Non inventare contenuti: quello che negli appunti non c'è lo lasci vuoto o lo togli. Puoi solo mettere in ordine, dare titoli brevi e scrivere in italiano chiaro. L'unica eccezione è il campetto (vedi sotto).
- Per un minorenne usa solo il nome (o nome e iniziale del cognome), mai altri dati personali.
- Se gli appunti descrivono solo una lezione, non riscrivere identikit e obiettivi: metti solo "nome", gli obiettivi nuovi (se ce ne sono) e "lezioni".

ALLIEVO
- Nome: ${a?a.name:'(quello scritto negli appunti)'}
${a?`- Numero della prossima lezione: ${next}\n`:''}- Data di oggi: ${new Date().toISOString().slice(0,10)}${goals?`
- Obiettivi già inseriti nell'app (non ripeterli; se la lezione ne lavora qualcuno, in "toccati" scrivi il testo esatto tra virgolette):
${goals}`:''}

FORMATO
{"tipo":"tennis-smart-coach","versione":2,"allievi":[{
 "nome":"…",
 "obiettivo":"obiettivo del percorso in 1-2 frasi",
 "frequenza":"es. Lezione individuale da 60'",
 "scheda":{"livello":"…","categoria":"Adulto/Under 12…","durata":60,"formato":"1:1","focus":[{"titolo":"…","testo":"…"}]},
 "obiettivi":[{"area":"tat|tec|men|fis","gruppo":"es. Gioco di base, Scelte, Variazioni, Servizio (facoltativo)","testo":"…","ref":"sigla breve","breve":"2-3 parole","stato":"todo|doing|done"}],
 "lezioni":[{"n":${next},"data":"AAAA-MM-GG","titolo":"…","sottotitolo":"…","durata":60,"formato":"Individuale",
   "obiettivo":"cosa si allena oggi",
   "aspetti":{"tat":"…","tec":"…","men":"…","fis":"…"},
   "fasi":[{"nome":"Attivazione / Parte centrale / …","min":12,"temi":"parole chiave separate da ·",
     "esercizi":[{"titolo":"…","min":6,"righe":["svolgimento dell'esercizio"],"obiettivo":"…","serie":"…","campo":[…]}]}],
   "toccati":["ref o testo degli obiettivi lavorati"],"noteDopo":"","daRiprendere":""}]
}]}
Regole sulle aree: tecnica = come si esegue il colpo (impugnatura, braccio, gambe, servizio come gesto); tattica = dove e quando mandare la palla (regolarità, precisione, profondità, direzioni, scelte, variazioni); mentale = concentrazione, emozioni, routine; fisica = spostamenti, resistenza, rapidità.

${AI_CAMPO}

APPUNTI DEL MAESTRO
${notes.trim() || '(scrivi qui gli appunti)'}`;
}
let REC = null;
function dictate(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition, ta = document.getElementById('ai-notes');
  if(REC){ try{ REC.stop(); }catch(e){} REC = null; U.recOn = false; render(); return; }
  if(!SR){ toast('Qui il microfono dell\'app non va: tocca il riquadro e usa il microfono della tastiera'); if(ta) ta.focus(); return; }
  const key = aiKey(); U.aiNotes = U.aiNotes || {};
  const r = new SR(); r.lang = 'it-IT'; r.continuous = true; r.interimResults = false;
  r.onresult = ev=>{ let add = ''; for(let i=ev.resultIndex;i<ev.results.length;i++) if(ev.results[i].isFinal) add += ev.results[i][0].transcript; if(!add) return; const cur = U.aiNotes[key] || ''; U.aiNotes[key] = (cur && !/\s$/.test(cur) ? cur+' ' : cur) + add.trim(); const t = document.getElementById('ai-notes'); if(t) t.value = U.aiNotes[key]; };
  r.onerror = ev=>{ REC = null; U.recOn = false; render(); toast(ev.error==='not-allowed'||ev.error==='service-not-allowed' ? 'Microfono non permesso qui: usa il microfono della tastiera' : 'Dettatura interrotta'); };
  r.onend = ()=>{ if(REC===r){ REC = null; U.recOn = false; render(); } };
  try{ r.start(); REC = r; U.recOn = true; render(); }catch(e){ toast('Usa il microfono della tastiera'); }
}
function gAiPrompt(g){
  const L = g.lesson || lessonOf(g), phs = (L.phases||[]).filter(p=>!p.pause), o = ownOf(g.id), have = o.weeks.filter(w=>w.name || w.days.some(d=>d.title||d.ex.length)).length, notes = (U.aiNotes && U.aiNotes['g:'+g.id]) || '';
  return `Sei l'assistente di un maestro di tennis. Trasforma gli appunti del maestro (in fondo) nel programma di allenamento di un gruppo, da incollare nell'app Tennis Smart Coach.

COME RISPONDERE
- Rispondi SOLO con un blocco di codice che contiene il JSON, senza altro testo prima o dopo: il maestro lo copia con un tocco e lo incolla nell'app.
- Non inventare contenuti: quello che negli appunti non c'è lo lasci vuoto o lo togli. Puoi solo mettere in ordine, dare titoli brevi e scrivere in italiano chiaro. L'unica eccezione è il campetto (vedi sotto).
- Gli atleti del gruppo non vanno nominati: nel campetto usa lettere (A, B, C…).

IL GRUPPO
- Nome: ${g.name}
- Allenamenti a settimana: ${nS(g)} (al massimo ${nS(g)} lezioni per settimana)
- Durata dell'allenamento: ${L.dur||''} minuti
${phs.length?`- Fasi dell'allenamento (in "fase" scrivi uno di questi nomi esatti): ${phs.map(p=>p.n+(p.m?' '+p.m+"'":'')).join(' · ')}`:'- Fasi: usa quelle negli appunti (es. Attivazione, Parte centrale, Situazioni, Gioco)'}
${have?`- Il programma ha già ${have} ${have===1?'settimana':'settimane'}: le settimane che scrivi si aggiungono dopo. Dai a ogni settimana un nome diverso.`:''}
- Se gli appunti parlano di una sola settimana o di una sola lezione, metti solo quella.

FORMATO
{"tipo":"tennis-smart-coach","versione":2,"programma":{
 "lezioniSettimana":${nS(g)},"durata":${L.dur||90},
 "fasi":[${(phs.length?phs:[{n:'Attivazione',m:15},{n:'Parte centrale',m:45}]).map(p=>`{"nome":"${p.n}","min":${p.m||10}}`).join(',')}],
 "settimane":[{"nome":"Settimana … · tema","lezioni":[{"titolo":"…","obiettivo":"cosa si allena in questa lezione",
   "esercizi":[{"fase":"nome della fase","titolo":"…","etichetta":"organizzazione, es. a coppie, maestro al cesto","righe":["svolgimento","varianti, punteggio, serie"],"campo":[…]}]}]}]
}}

${AI_CAMPO}
Per un gruppo: i giocatori sono ["A",x,y,"A"], ["B",x,y,"B"], e se servono altri ["A",x,y,"C"]…; quelli in attesa mettili fuori dal campo (x minore di 10).

APPUNTI DEL MAESTRO
${notes.trim() || '(scrivi qui gli appunti)'}`;
}
function gParse(txt){
  let d; const raw = String(txt).trim().replace(/^```(json)?/,'').replace(/```$/,'').replace(/[“”„«»]/g,'"').replace(/[‘’]/g,"'").trim();
  const a0 = raw.indexOf('{'), a1 = raw.lastIndexOf('}');
  try{ d = JSON.parse(a0>=0 && a1>a0 ? raw.slice(a0, a1+1) : raw); }catch(e){ return {err:'Il testo non è nel formato giusto. Copia tutta la risposta dell’IA con il tasto "Copia", senza modificarla.'}; }
  const P = d && (d.programma || (d.gruppi && d.gruppi[0] && d.gruppi[0].programma) || (d.allievi && d.allievi[0] && d.allievi[0].programma));
  if(!P || !Array.isArray(P.settimane) || !P.settimane.length) return {err:'Nel testo non c’è un programma a settimane. Se è la lezione di un allievo privato, incollala nella sua pagina in Lezioni private.'};
  const W = P.settimane, L = W.reduce((t,w)=>t+(w.lezioni||[]).length,0), E = W.reduce((t,w)=>t+(w.lezioni||[]).reduce((u,l)=>u+(l.esercizi||[]).length,0),0), C = W.reduce((t,w)=>t+(w.lezioni||[]).reduce((u,l)=>u+(l.esercizi||[]).filter(e=>(e.campo||[]).length).length,0),0);
  return {P, weeks:W.length, lessons:L, exs:E, campi:C, names:W.map(w=>w.nome||'').filter(Boolean)};
}
function impProgram(P, g){
  if(!g.lesson) g.lesson = JSON.parse(JSON.stringify(lessonOf(g)));
  if(P.lezioniSettimana && g.pp) g.freq = Math.min(5, Math.max(1, +P.lezioniSettimana));
  const fixed = !g.pp && g.lesson.phases.some(p=>!p.pause);
  if(P.durata && (g.pp || !g.lesson.phases.length)) g.lesson.dur = +P.durata;
  const phs = g.lesson.phases = g.lesson.phases || [];
  const keyOf = f => { if(f===undefined || f===null || f==='') return phs.filter(p=>!p.pause)[0]?.k; const def = (typeof f==='number' || /^\d+$/.test(String(f))) ? (P.fasi||[])[+f] : {nome:String(f)}; if(!def || !def.nome) return phs.filter(p=>!p.pause)[0]?.k;
    let ph = phs.find(p=>impNorm(p.n)===impNorm(def.nome));
    if(!ph && fixed){ const ws = impNorm(def.nome).split(' ').filter(w=>w.length>3), work = phs.filter(p=>!p.pause); ph = work.find(p=>ws.some(w=>impNorm(p.n).includes(w))) || work[0]; return ph.k; }
    if(!ph){ const fd = (P.fasi||[]).find(z=>impNorm(z.nome)===impNorm(def.nome)); ph = {k:'i'+uid().slice(0,5), n:String(def.nome), m:+((fd||def).min)||10}; phs.push(ph); } return ph.k; };
  (P.fasi||[]).forEach(f=>f && f.nome && keyOf(f.nome));
  const o = ownOf(g.id), blank = o.weeks.length===1 && !o.weeks[0].name && o.weeks[0].days.every(z=>!z.title && !z.note && !z.ex.length);
  if(blank) o.weeks = [];
  S.customEx = S.customEx || [];
  const sig = (n, t) => impNorm(n)+'|'+impNorm(t), seen = new Set(o.weeks.map(w=>sig(w.name, w.days[0]&&w.days[0].title)));
  let added = 0;
  P.settimane.forEach(w=>{ if(seen.has(sig(w.nome, (w.lezioni||[])[0]&&w.lezioni[0].titolo))) return; const wk = blankWeek(); wk.name = w.nome || '';
    (w.lezioni||[]).slice(0,5).forEach((l,i)=>{ const day = wk.days[i]; day.title = l.titolo || ''; day.note = l.obiettivo || ''; day.ex = []; day.exPh = [];
      (l.esercizi||[]).forEach(e=>{ const ex = {id:'c'+uid(), custom:true, hidden:true, ph:['att','pr','sr','ap'].includes(e.tipo)?e.tipo:'pr', t:String(e.titolo||'Esercizio'), chip:String(e.etichetta||''), lines:(e.righe||[]).map(String), els:Array.isArray(e.campo)?e.campo:[]};
        S.customEx.push(ex); day.ex.push(ex.id); day.exPh.push(keyOf(e.fase)); }); });
    o.weeks.push(wk); added++; });
  if(!o.weeks.length) o.weeks.push(blankWeek()); if(o.cur>o.weeks.length || o.cur<1) o.cur = 1;
  return added;
}
function gImportView(g){
  const R = U.gImpData, k = 'g:'+g.id;
  return `<button class="btn ghost" data-a="gimpclose" style="align-self:flex-start">‹ Programma di ${esc(g.name)}</button>
    <h1>Crea il programma con l'IA</h1>
    <p class="small muted" style="margin-top:-6px">Va al gruppo <b>${esc(g.name)}</b>. Le settimane nuove si aggiungono a quelle che ci sono già.${isOwnG(g)?'':' Il gruppo passerà da "Le 12 settimane" a "Programma personale".'}</p>
    ${!R ? `<section class="card" style="border-color:var(--clay)"><h3>1 · Racconta il programma</h3><p class="small muted">Scrivi o detta come parleresti a un collega. Più cose dici, più il programma viene completo:</p>
      <ul class="small muted" style="margin:0;padding-left:18px"><li>quante settimane e il tema di ognuna</li><li>per ogni allenamento: titolo, obiettivo ed esercizi nelle fasi (${esc((lessonOf(g).phases||[]).filter(p=>!p.pause).map(p=>p.n).join(', ')||'attivazione, parte centrale…')})</li><li>per ogni esercizio: dove stanno maestro e atleti, dove va la palla, punteggio o serie</li></ul>
      <textarea id="ai-notes" class="input" rows="8" data-c="ainotes" placeholder="Es.: 4 settimane sul gioco di volo. Settimana 1, primo allenamento: attivazione 15 minuti volée a coppie a metà campo; parte centrale: io al cesto da fondo, loro a rete, volée di diritto in diagonale nel riquadro, 3 serie da 10…">${esc((U.aiNotes&&U.aiNotes[k])||'')}</textarea>
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn ${U.recOn?'danger':'ghost'}" data-a="aidict">${U.recOn?'■ Ferma la dettatura':'🎙 Detta'}</button><button class="btn clay" data-a="aicopy">Copia la richiesta per l'IA</button></div>
      ${U.aiCopied?`<div class="card" style="background:var(--surface-2,rgba(255,255,255,.04));gap:6px"><p class="small"><b>Copiata.</b> Ora apri Claude (o un'altra IA), tieni premuto nel campo del messaggio, scegli "Incolla" e invia. Quando risponde, tocca "Copia" sul riquadro con il testo e incollalo qui sotto al punto 2.</p><a class="btn ghost" style="text-decoration:none;align-self:flex-start" href="https://claude.ai/new" target="_blank" rel="noopener">Apri Claude</a></div>`:''}
      ${U.aiShow?`<p class="small muted">Il telefono non ha permesso di copiare da solo: tieni premuto qui sotto, "Seleziona tutto" e "Copia".</p><textarea class="input" rows="5" readonly onfocus="this.select()">${esc(gAiPrompt(g))}</textarea>`:''}
      <p class="small muted">Il microfono si può usare anche dalla tastiera del telefono.</p></section>
      <section class="card"><h3>2 · Incolla la risposta dell'IA</h3><p class="small muted">Tocca "Copia" sul riquadro con il testo preparato dall'IA, poi tieni premuto qui sotto e scegli "Incolla". L'app ti mostra cosa contiene prima di inserirlo.</p>
      <textarea id="gimp-txt" class="input" rows="6" placeholder="Tieni premuto qui e scegli Incolla"></textarea>
      <button class="btn clay" data-a="gimppaste" style="align-self:flex-start">Leggi il testo</button>
      ${U.gImpErr?`<p class="small" style="color:var(--ko)">${esc(U.gImpErr)}</p>`:''}</section>`
    : `<section class="card"><h3>Cosa verrà inserito</h3><ul class="small" style="margin:0;padding-left:18px">
        <li>${R.weeks} ${R.weeks===1?'settimana':'settimane'}${R.names.length?': '+R.names.map(esc).join(' · '):''}</li>
        <li>${R.lessons} ${R.lessons===1?'allenamento':'allenamenti'} con ${R.exs} esercizi${R.campi?` (${R.campi} con campetto)`:''}</li>
        ${isOwnG(g)?'':'<li>il gruppo passa a "Programma personale"</li>'}</ul>
        <p class="small muted">Non viene cancellato niente: le settimane che ci sono restano, quelle uguali non vengono doppiate. Dopo puoi modificare ogni esercizio e il suo campetto.</p></section>
      <button class="btn clay block" data-a="gimpdo">Conferma e inserisci</button>
      <button class="btn ghost block" data-a="gimpreset">Incolla un altro testo</button>`}`;
}
function importView(forId){
  const R = U.impData, who = forId ? ath(forId) : null;
  return `<button class="btn ghost" data-a="impclose" style="align-self:flex-start">‹ ${who?esc(who.name):'Lezioni private'}</button>
    <h1>${who?'Crea programma o lezione':'Nuovo allievo da chat'}</h1>
    ${who?`<p class="small muted" style="margin-top:-6px">Quello che incolli va a <b>${esc(who.name)}</b>: una lezione nuova si aggiunge alle altre, gli obiettivi uguali non si doppiano.</p>`:`<p class="small muted" style="margin-top:-6px">Per creare un allievo nuovo. Per aggiungere una lezione a un allievo che c'è già, apri il suo nome e incolla lì.</p>`}
    ${!R ? `<section class="card" style="border-color:var(--clay)"><h3>1 · Racconta la lezione</h3><p class="small muted">Scrivi o detta come parleresti a un collega. Più cose dici, più la scheda viene completa:</p>
      <ul class="small muted" style="margin:0;padding-left:18px"><li>obiettivi dell'allievo (tecnica, tattica, mentale, fisico)</li><li>le fasi con i minuti (attivazione, parte centrale…)</li><li>per ogni esercizio: dove state tu e l'allievo, dove va la palla, le serie</li></ul>
      <textarea id="ai-notes" class="input" rows="7" data-c="ainotes" placeholder="Es.: ${who?esc(who.name.split(' ')[0]):'Serena'}, 60 minuti. Obiettivo: più profondità. Attivazione 10 minuti palleggio da metà campo. Poi esercizio: io a fondo campo gioco a caso su diritto e rovescio, lei deve mandare la palla nel riquadro nell'angolo destro, 4 serie da un minuto…">${esc((U.aiNotes&&U.aiNotes[U.impFor||'_'])||'')}</textarea>
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn ${U.recOn?'danger':'ghost'}" data-a="aidict">${U.recOn?'■ Ferma la dettatura':'🎙 Detta'}</button><button class="btn clay" data-a="aicopy">Copia la richiesta per l'IA</button></div>
      ${U.aiCopied?`<div class="card" style="background:var(--surface-2,rgba(255,255,255,.04));gap:6px"><p class="small"><b>Copiata.</b> Ora apri Claude (o un'altra IA), tieni premuto nel campo del messaggio, scegli "Incolla" e invia. Quando risponde, tocca "Copia" sul riquadro con il testo e incollalo qui sotto al punto 2.</p><a class="btn ghost" style="text-decoration:none" href="https://claude.ai/new" target="_blank" rel="noopener" style="align-self:flex-start">Apri Claude</a></div>`:''}
      ${U.aiShow?`<p class="small muted">Il telefono non ha permesso di copiare da solo: tieni premuto qui sotto, "Seleziona tutto" e "Copia".</p><textarea class="input" rows="5" readonly onfocus="this.select()">${esc(aiPrompt(U.impFor||null))}</textarea>`:''}
      <p class="small muted">Il microfono si può usare anche dalla tastiera del telefono. Per i minorenni basta il nome.</p></section>
      <section class="card"><h3>2 · Incolla la risposta dell'IA</h3><p class="small muted">Tocca "Copia" sul riquadro con il testo che ti ha preparato l'IA (o che ti ho preparato in chat), poi tieni premuto qui sotto e scegli "Incolla". L'app ti mostra cosa contiene prima di inserirlo.</p>
      <textarea id="imp-txt" class="input" rows="6" placeholder="Tieni premuto qui e scegli Incolla"></textarea>
      <button class="btn clay" data-a="imppaste" style="align-self:flex-start">Leggi il testo</button>
      ${U.impErr?`<p class="small" style="color:var(--ko)">${esc(U.impErr)}</p>`:''}</section>
      <section class="card"><h3>Oppure scegli il file</h3><p class="small muted">Se hai salvato il file (finisce con .json) nei File del telefono o sul computer.</p>
      <div class="row"><label class="btn ghost" for="imp-file" style="display:inline-flex;align-items:center;cursor:pointer">Scegli il file .json</label>
      <input id="imp-file" type="file" accept=".json,application/json,.txt,text/plain" data-c="impfile" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none"></div></section>`
    : `<section class="card"><h3>Cosa verrà inserito</h3><div class="list">${R.rows.map(r=>`<div><b style="font-size:17px">${esc(r.ex?r.ex.name:r.x.nome)}</b> ${r.ex?'<span class="tag teal">aggiorno la sua scheda</span>':'<span class="tag pri">nuovo allievo</span>'}${who && impNorm(r.x.nome)!==impNorm(who.name).split(' ')[0] && impNorm(r.x.nome)!==impNorm(who.name)?`<p class="small" style="color:var(--ko)">Attenzione: il testo è intestato a "${esc(r.x.nome)}".</p>`:''}
        <ul class="small" style="margin:6px 0 0;padding-left:18px">${[r.card?'identikit (livello, categoria, durata, su cosa stiamo lavorando)':'', r.x.obiettivo?'obiettivo del percorso':'', r.x.frequenza?'frequenza e periodo':'', r.goals?`${r.goals} obiettivi nuovi`:'', r.sheets?`${r.sheets} ${r.sheets===1?'lezione svolta':'lezioni svolte'} con ${r.shex} esercizi${r.shc?` (${r.shc} con campetto)`:''}`:'', r.weeks?`programma: ${r.weeks} ${r.weeks===1?'settimana':'settimane'}, ${r.lessons} ${r.lessons===1?'lezione':'lezioni'}, ${r.exs} esercizi con campetto`:'', r.diary?`${r.diary} ${r.diary===1?'lezione':'lezioni'} nel diario`:'', r.cal?`${r.cal} ${r.cal===1?'lezione':'lezioni'} in calendario`:''].filter(Boolean).map(t=>`<li>${t}</li>`).join('')}</ul></div>`).join('')}</div>
        <p class="small muted">Non viene cancellato niente: gli obiettivi e le lezioni già presenti restano, quelli uguali non vengono doppiati.</p></section>
      <button class="btn clay block" data-a="impdo">Conferma e inserisci</button>
      <button class="btn ghost block" data-a="impreset">Scegli un altro file</button>`}`;
}
function impApply(d, forId){
  const mine = impMine(), out = [];
  d.allievi.filter(x=>x && x.nome).forEach(x=>{
    let a = forId ? ath(forId) : mine.find(z=>impNorm(z.name)===impNorm(x.nome)) || mine.find(z=>impNorm(z.name).split(' ')[0]===impNorm(x.nome) && impNorm(x.nome).indexOf(' ')<0);
    if(!a && forId) return;
    if(!a){ a = {id:uid(), groupId:PRIV_ID, name:String(x.nome).trim(), pin:genPin(), ppin:genPin()}; S.athletes.push(a); mine.push(a); }
    const pv = privOf(a.id);
    if(x.obiettivo) pv.prog.title = String(x.obiettivo).trim();
    if(x.frequenza) pv.prog.freq = String(x.frequenza).trim();
    const have = new Set(pv.goals.map(g=>impNorm(g.text))), AR = {tec:'tec',tecnica:'tec',tat:'tat',tattica:'tat',men:'men',mentale:'men',fis:'fis',fisico:'fis',fisica:'fis'}, ST = {todo:'todo','da iniziare':'todo',doing:'doing','in corso':'doing',done:'done',raggiunto:'done'};
    const refs = {};
    (x.obiettivi||[]).forEach(g=>{ if(!g || !g.testo) return; let G = pv.goals.find(z=>impNorm(z.text)===impNorm(g.testo) || (g.gruppo && impNorm(z.text)===impNorm(g.gruppo+' '+g.testo)) || (z.grp && impNorm(z.grp+' '+z.text)===impNorm(g.testo)));
      if(G && impNorm(G.text)!==impNorm(g.testo)){ G.text = String(g.testo).trim(); }
      if(G && !g.gruppo && G.grp && impNorm(g.testo).startsWith(impNorm(G.grp))) delete G.grp;
      if(G && AR[impNorm(g.area)] && G.area!==AR[impNorm(g.area)]) G.area = AR[impNorm(g.area)];
      if(!G){ G = {id:uid(), area:AR[impNorm(g.area)]||'tec', text:String(g.testo).trim(), st:ST[impNorm(g.stato)]||'todo'}; pv.goals.push(G); have.add(impNorm(g.testo)); }
      if(g.gruppo && !G.grp) G.grp = String(g.gruppo); if(g.breve && !G.short) G.short = String(g.breve);
      if(g.ref) refs[g.ref] = G.id; });
    if(x.scheda){ const c = pv.card = pv.card || {}, X = x.scheda;
      if(X.livello) c.level = String(X.livello); if(X.categoria) c.cat = String(X.categoria); if(X.durata) c.dur = +X.durata; if(X.formato) c.fmt = String(X.formato);
      if(Array.isArray(X.focus) && X.focus.length) c.focus = X.focus.map(f=>({t:String(f.titolo||''), x:String(f.testo||'')}));
      if(X.note && !c.notes) c.notes = String(X.note); }
    pv.sheets = pv.sheets || [];
    (x.lezioni||[]).forEach(l=>{ if(!l) return; const n = +l.n || (pv.sheets.length+1), old = pv.sheets.find(z=>z.n===n);
      const sh = {id: old ? old.id : 'sh'+uid(), n, date:l.data||'', title:String(l.titolo||''), sub:String(l.sottotitolo||''), dur:+l.durata||0, fmt:String(l.formato||''), obj:String(l.obiettivo||''),
        asp:Object.fromEntries(Object.entries(l.aspetti||{}).map(([k,v])=>[AR[impNorm(k)]||k, String(v)])),
        phases:(l.fasi||[]).map(f=>({n:String(f.nome||''), m:+f.min||0, tags:String(f.temi||''), ex:(f.esercizi||[]).map(e=>({t:String(e.titolo||''), min:e.min||'', x:(e.righe||[]).map(String), obj:String(e.obiettivo||''), serie:String(e.serie||''), els:Array.isArray(e.campo)?e.campo:[]}))})),
        note:String(l.nota||''), touched:(l.toccati||[]).map(r=>refs[r] || (pv.goals.find(z=>impNorm(z.text)===impNorm(r))||{}).id).filter(Boolean),
        after: l.noteDopo || (old && old.after) || '', next: l.daRiprendere || (old && old.next) || ''};
      if(old) pv.sheets[pv.sheets.indexOf(old)] = sh; else pv.sheets.push(sh); });
    pv.sheets.sort((p,q)=>p.n-q.n);
    const P = x.programma;
    if(P && (P.settimane||[]).length){
      if(!pv.pg) pv.pg = {id:'pp_'+a.id, pp:true, prog:'own', freq:1, week:1, lesson:{dur:60, phases:[]}};
      impProgram(P, pv.pg);
    }
    const lk = new Set(pv.lessons.map(l=>(l.date||'').slice(0,10)+'|'+impNorm(l.what)));
    (x.diario||[]).forEach(l=>{ if(!l || !l.data || !l.fatto) return; const k = l.data+'|'+impNorm(l.fatto); if(lk.has(k)) return; lk.add(k); pv.lessons.push({id:uid(), date:new Date(l.data+'T12:00').toISOString(), what:String(l.fatto), next:String(l.prossima||'')}); });
    pv.lessons.sort((p,q)=>p.date<q.date?-1:1);
    pv.sched = pv.sched || []; const ck = new Set(pv.sched.map(z=>z.date+'|'+z.time));
    (x.calendario||[]).forEach(c=>{ if(!c || !c.data || !c.ora || ck.has(c.data+'|'+c.ora)) return; ck.add(c.data+'|'+c.ora); pv.sched.push({id:uid(), date:c.data, time:c.ora, dur:+c.durata||60}); });
    out.push(a);
  });
  return out;
}
function privList(){
  const as = S.athletes.filter(a=>a.groupId===PRIV_ID);
  if(U.impOpen) return importView();
  return `<h1>Lezioni private</h1><section class="card"><h3>Nuovo allievo privato</h3><p class="small muted">Dopo averlo aggiunto si apre la sua pagina: lì incolli il programma preparato in chat.</p><div class="row"><input id="f-privname" class="input" placeholder="Nome e iniziale del cognome" style="flex:1;min-width:0"><button class="btn" data-a="privadd">Aggiungi</button></div></section>
    <section class="card" style="padding:4px 16px"><div class="list">${as.map(a=>{ const pv = privOf(a.id), done = pv.goals.filter(g=>g.st==='done').length;
      return `<button class="item" data-a="privopen" data-k="${a.id}"><span class="grow"><b style="font-size:17px">${esc(a.name)}</b><br><span class="small muted">${pv.prog.title?esc(pv.prog.title)+' · ':''}${pv.goals.length} obiettivi${pv.goals.length?`, ${done} raggiunti`:''} · ${pv.lessons.length} lezioni</span></span><span class="chev">›</span></button>`; }).join('') || '<p class="muted" style="padding:12px 0">Nessun allievo privato. Aggiungilo qui sopra.</p>'}</div></section>`;
}
function goalsHtml(pv, edit, aid){
  return PAREAS.map(([k,l])=>{ const gs = pv.goals.filter(g=>g.area===k); if(!gs.length) return ''; return `<div class="field"><span class="tag pri" style="align-self:flex-start">${l}</span>${gs.map(g=>`<div class="goal ${g.st}"><p>${g.grp?`<span class="small muted">${esc(g.grp)} · </span>`:''}${esc(g.text)}</p>
    ${edit?`<div class="seg" role="group">${GOAL_ST.map(([s,lab])=>`<button data-a="goalst" data-k="${aid}:${g.id}" data-v="${s}" aria-pressed="${g.st===s}">${lab}</button>`).join('')}</div> <button class="chip" data-a="goaldel" data-k="${aid}:${g.id}" style="align-self:flex-start">Togli</button>`:`<span class="tag ${g.st==='done'?'teal':g.st==='doing'?'':'pri'}">${GOAL_ST.find(x=>x[0]===g.st)[1]}</span>`}</div>`).join('')}</div>`; }).join('');
}
function ppProgCard(id){
  const pv = privOf(id), g = ppGroup(id);
  if(!g) return `<section class="card"><h3>Programma</h3><p class="small muted">Un programma a settimane, come quello dei gruppi: lezioni con titolo, obiettivo ed esercizi della libreria nelle fasi della lezione.</p><button class="btn clay" data-a="ppcreate" data-k="${id}" style="align-self:flex-start">Crea il programma</button></section>`;
  const o = ownOf(g.id), w = o.weeks[o.cur-1];
  return `<section class="card"><div class="row between"><h3>Programma</h3><span class="tag pri">${o.weeks.length} ${o.weeks.length===1?'settimana':'settimane'}</span></div>
    <p class="small">In corso: <b>settimana ${o.cur}${w.name?' · '+esc(w.name):''}</b> · ${nS(g)} ${nS(g)===1?'lezione':'lezioni'} a settimana</p>
    <div class="list small">${w.days.slice(0, nS(g)).map((d,i)=>`<div>Lezione ${i+1}: <b>${esc(d.title||'da definire')}</b>${d.ex.length?` <span class="muted">· ${d.ex.length} esercizi</span>`:''}</div>`).join('')}</div>
    <button class="btn" data-a="ppopen" data-k="${id}" style="align-self:flex-start">Apri il programma</button></section>`;
}
/* ---------- private lessons: read a programme PDF ----------
   The PDF is NOT stored: pdf.js (loaded only when needed) reads its text, the coach checks the fields found
   (objective, frequency, goals by area) and only those go into the card. Keeps the app light. */
const PDF_MAX = 20*1024*1024;
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
const kbLab = n => n>=1048576 ? (n/1048576).toFixed(1).replace('.',',')+' MB' : Math.max(1,Math.round(n/1024))+' KB';
let pdfjsP = null;
function loadPdfJs(){
  return pdfjsP = pdfjsP || new Promise((ok,ko)=>{ const sc = document.createElement('script'); sc.src = PDFJS+'pdf.min.js';
    sc.onload = ()=>{ window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS+'pdf.worker.min.js'; ok(window.pdfjsLib); };
    sc.onerror = ()=>{ pdfjsP = null; ko(new Error('pdf.js non raggiungibile')); }; document.head.appendChild(sc); });
}
async function pdfText(buf){
  const lib = await loadPdfJs(), doc = await lib.getDocument({data:buf}).promise; let out = '';
  for(let i=1; i<=doc.numPages; i++){ const c = await (await doc.getPage(i)).getTextContent(); let y = null;
    c.items.forEach(it=>{ const yy = it.transform ? it.transform[5] : y; if(y!==null && Math.abs(yy-y)>2 && !out.endsWith('\n')) out += '\n'; out += it.str; if(it.hasEOL) out += '\n'; y = yy; });
    out += '\n'; }
  return out;
}
/* finds "Obiettivo del percorso", "Frequenza / Periodo" and the goals under Tecnica, Tattica, Mentale, Fisico (as headings or "Tecnica: ...") */
const PDF_AREA = {tecnica:'tec', tecnico:'tec', tecnici:'tec', tattica:'tat', tattico:'tat', tattici:'tat', mentale:'men', mentali:'men', testa:'men', fisico:'fis', fisica:'fis', fisici:'fis', atletica:'fis', atletico:'fis', 'preparazione fisica':'fis', 'preparazione atletica':'fis'};
function pdfParse(txt){
  const out = {title:'', freq:'', goals:[]}, key = x => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z ]/g,' ').replace(/\s+/g,' ').trim();
  let sect = null, area = null;
  txt.split('\n').map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean).forEach(raw=>{
    const bullet = /^(?:[-•*·▪●◦–]|\d+[.)])\s/.test(raw), l = raw.replace(/^(?:[-•*·▪●◦–]|\d+[.)])\s*/,'').trim(); if(!l) return;
    const m = l.match(/^([^:]{2,40}):\s*(.*)$/), head = key(m ? m[1] : l), rest = m ? m[2].trim() : '';
    const ar = PDF_AREA[head.replace(/^(obiettivi|obiettivo|area|aspetti|aspetto|lavoro) /,'')];
    if(/^(obiettivo|obiettivi)( (del percorso|generale|generali|principale|finale))?$|^finalita$/.test(head) && (m || l.length<40)){ sect = 'title'; area = null; if(rest) out.title += (out.title?' ':'')+rest; return; }
    if(/^(frequenza|periodo|durata|quando)( [a-z]+){0,3}$/.test(head) && (m || l.length<40)){ sect = 'freq'; area = null; if(rest) out.freq += (out.freq?' · ':'')+rest; return; }
    if(ar && (m || l.length<40)){ sect = 'goals'; area = ar; if(rest) out.goals.push({area, text:rest}); return; }
    if(/^(settimana|lezione|mese|week|programma|esercizi|note)\b/.test(head) || (m && !rest) || (l.length<40 && l===l.toUpperCase() && /[A-Z]/.test(l))){ sect = null; area = null; return; }
    const cont = !bullet && /^[a-zà-ù(]/.test(l);
    if(sect==='title') out.title += (out.title?' ':'')+l;
    else if(sect==='freq') out.freq += (out.freq?(cont?' ':' · '):'')+l;
    else if(sect==='goals'){ const g = out.goals[out.goals.length-1]; if(cont && g && g.area===area) g.text += ' '+l; else out.goals.push({area, text:l}); }
  });
  const cap = x => x.charAt(0).toUpperCase()+x.slice(1);
  out.title = cap(out.title); out.freq = cap(out.freq); out.goals.forEach(g=>g.text = cap(g.text));
  return out;
}
async function pdfLoad(aid, f){
  U.pdfErr = null;
  if(!/pdf$/i.test(f.type||'') && !/\.pdf$/i.test(f.name||'')){ U.pdfErr = {aid, msg:'Il file scelto non è un PDF.'}; render(); return; }
  if(f.size>PDF_MAX){ U.pdfErr = {aid, msg:`Il PDF è troppo grande (${kbLab(f.size)}).`}; render(); return; }
  U.pdfBusy = aid; U.pdfDraft = null; render();
  try{
    let txt = ''; try{ txt = (await pdfText(await f.arrayBuffer())).trim(); }catch(e){ console.warn(e); }
    if(/tennis-smart-coach|"allievi"\s*:/.test(txt)){ U.pdfErr = {aid, msg:'Questo PDF contiene il testo da importare, non una scheda da leggere. Apri la sua pagina in Lezioni private, tocca "Crea programma o lezione" e incolla lì il testo preparato in chat.'}; U.pdfBusy = null; render(); return; }
    const P = txt ? pdfParse(txt) : null, lab = Object.fromEntries(PAREAS);
    U.pdfDraft = !txt ? {aid, fail:true} : {aid, text:txt.slice(0,4000), title:P.title, freq:P.freq, goals:P.goals.map(g=>lab[g.area]+': '+g.text).join('\n'), none:!P.title && !P.freq && !P.goals.length};
    if(!txt) toast('Non riesco a leggere il testo del PDF');
  }catch(e){ console.error(e); U.pdfErr = {aid, msg:'Non sono riuscito ad aprire il file. Riprova.'}; }
  U.pdfBusy = null; render();
}
function pdfDraftHtml(d){
  if(d.fail) return `<div class="note">Non sono riuscito a leggere il testo del PDF: serve la connessione, e il PDF non deve essere una foto o una scansione. Compila i campi a mano, oppure manda il PDF in chat per prepararti il file da importare.</div><button class="btn ghost" data-a="pdfskip" style="align-self:flex-start">Ok</button>`;
  return `<div class="note"><b>Controlla i dati letti dal PDF.</b> ${d.none?'Non ho trovato obiettivo, frequenza od obiettivi per area: puoi scriverli qui oppure annullare.':'Correggi quello che serve, poi tocca "Usa questi dati". Gli obiettivi si aggiungono a quelli che ci sono già.'}</div>
    <div class="field"><label for="pd-title">Obiettivo del percorso</label><textarea id="pd-title" class="input" rows="3" data-c="pdfd" data-k="title">${esc(d.title)}</textarea></div>
    <div class="field"><label for="pd-freq">Frequenza e periodo</label><input id="pd-freq" class="input" data-c="pdfd" data-k="freq" value="${esc(d.freq)}"></div>
    <div class="field"><label for="pd-goals">Obiettivi, uno per riga</label><textarea id="pd-goals" class="input" rows="6" data-c="pdfd" data-k="goals">${esc(d.goals)}</textarea><p class="small muted">Tecnica:, Tattica:, Mentale: o Fisico: all’inizio della riga indicano l’area.</p></div>
    <details class="pres"><summary class="small">Testo letto dal PDF</summary><p class="small" style="white-space:pre-wrap;margin-top:8px">${esc(d.text)}</p></details>
    <div class="row"><button class="btn clay" data-a="pdfapply" data-k="${d.aid}" style="flex:1">Usa questi dati</button><button class="btn ghost" data-a="pdfskip">Annulla</button></div>`;
}
function pdfCard(id){
  const busy = U.pdfBusy===id, err = U.pdfErr && U.pdfErr.aid===id ? U.pdfErr.msg : '', d = U.pdfDraft && U.pdfDraft.aid===id ? U.pdfDraft : null;
  return `<section class="card"><h3>Leggi dal PDF</h3>
    ${d || busy ? '' : `<p class="small muted">Scegli il PDF con il programma: l'app ne legge il testo e ti propone obiettivo, frequenza e obiettivi per area. Il PDF non viene salvato nell'app.</p>`}
    ${err ? `<p class="small" style="color:var(--ko)">${esc(err)}</p>` : ''}
    ${busy ? '<p class="small muted">Sto leggendo il PDF…</p>' : d ? pdfDraftHtml(d) : `<div class="row">
      <label class="btn ghost" for="pp-pdf-${id}" style="display:inline-flex;align-items:center;cursor:pointer">Scegli un PDF da leggere</label>
      <input id="pp-pdf-${id}" type="file" accept="application/pdf,.pdf" data-c="pdffile" data-k="${id}" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none"></div>`}
  </section>`;
}
/* ---------- private pupil sheet, laid out like the PDF: identikit + goals, then one page per lesson done ----------
   priv[aid].card = {level, cat, dur, fmt, focus:[{t,x}], notes}; goals get .grp (sub-group label);
   priv[aid].sheets = [{id, n, date, title, sub, dur, fmt, obj, asp:{tat,tec,men,fis}, phases:[{n,m,tags,ex:[{t,min,x:[],serie,obj,els}]}], touched:[goalId], after, next}] */
const PP_AREAS = [['tat','Tattico'],['tec','Tecnico'],['men','Mentale'],['fis','Fisico']];
const AREA_COL = {tat:'#8DB6FF', tec:'#4CC587', men:'#A77BF0', fis:'#F2994A'};
const PH_COL = ['#8DB6FF','#F2994A','#2FBF9B','#D7E84A','#A77BF0','#F07A6C'];
const ST_LAB = {todo:'Da iniziare', doing:'In corso', done:'Raggiunto'};
function ppTabs(tab, items){ return `<div class="seg" role="group" aria-label="Sezione">${items.map(([k,l])=>`<button data-a="pptab" data-k="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>`; }
const goalLes = (pv, gid) => (pv.sheets||[]).filter(x=>(x.touched||[]).includes(gid)).map(x=>'L'+x.n);
function idCard(id, edit){
  const a = ath(id), pv = privOf(id), c = pv.card || {};
  const tiles = [[c.dur?c.dur+"'":'', 'a lezione'], [c.fmt||'', c.fmt==='1:1'?'lezione individuale':'formato'], [c.level||'', 'livello'], [c.cat||'', 'categoria']].filter(t=>t[0]);
  const areas = PP_AREAS.map(([k,l])=>{ const gs = pv.goals.filter(g=>g.area===k); const groups = []; gs.forEach(g=>{ const gl = g.grp||''; let G = groups.find(x=>x.gl===gl); if(!G){ G = {gl, gs:[]}; groups.push(G); } G.gs.push(g); });
    return `<section class="card" style="border-left:4px solid ${AREA_COL[k]};gap:8px"><span class="eyebrow" style="color:${AREA_COL[k]}">${l}</span>
      ${gs.length ? `<div class="gtab"><div class="gtab-h"><span>Obiettivo</span><span>Lavorato in</span></div>${groups.map(G=>`<div class="gtab-g">${G.gl?`<b class="gtab-l">${esc(G.gl)}</b>`:''}${G.gs.map(g=>{ const ls = goalLes(pv, g.id); return `<div class="gtab-r"><span style="flex:1;min-width:0">${esc(g.text)}${g.st==='done'?' <span class="tstat ok">raggiunto</span>':''}</span><span class="gtab-ls">${ls.length?ls.map(x=>`<i>${x}</i>`).join(''):'<span class="muted">—</span>'}</span></div>`; }).join('')}</div>`).join('')}</div>`
        : '<p class="small muted">—</p>'}</section>`; }).join('');
  return `<section class="card"><span class="eyebrow">Lezioni private · identikit e obiettivi</span><h1>${esc(a.name)}</h1>
      ${c.cat||c.level?`<p class="small muted" style="margin-top:-4px">${esc([c.cat,c.level?'livello '+c.level.toLowerCase():''].filter(Boolean).join(' · '))}</p>`:''}
      ${pv.prog.title?`<p>${esc(pv.prog.title)}</p>`:''}${pv.prog.freq&&!tiles.length?`<p class="small muted">${esc(pv.prog.freq)}</p>`:''}
      ${tiles.length?`<div class="kpis idk">${tiles.map(([v,l])=>`<div class="kpi"><b>${esc(v)}</b><span class="small muted">${l}</span></div>`).join('')}</div>`:''}</section>
    ${(c.focus||[]).length?`<h2 class="hsec">Su cosa stiamo lavorando</h2><div class="focus2">${c.focus.map(f=>`<section class="card" style="gap:4px"><b>${esc(f.t)}</b><span class="small">${esc(f.x||'')}</span></section>`).join('')}</div>`:''}
    <h2 class="hsec">Obiettivi iniziali</h2>
    ${pv.goals.length ? areas : `<section class="card"><p class="muted">${edit?'Nessun obiettivo. Aggiungili da "Modifica" o importa la scheda da file.':'Il maestro non ha ancora inserito gli obiettivi.'}</p></section>`}
    ${c.notes||edit?`<h2 class="hsec">Note sul percorso</h2><section class="card">${edit?`<textarea class="input" rows="3" data-c="ppnote" data-k="${id}" placeholder="Come sta andando il percorso">${esc(c.notes||'')}</textarea>`:`<p style="white-space:pre-line">${esc(c.notes)}</p>`}</section>`:''}`;
}
function shFind(sid){ for(const pv of Object.values(S.priv||{})){ const x=(pv.sheets||[]).find(z=>z.id===sid); if(x) return x; } return null; }
function sheetList(id){
  const pv = privOf(id), xs = (pv.sheets||[]).slice().sort((p,q)=>p.n-q.n);
  return xs.length ? `<section class="card" style="padding:4px 16px"><div class="list">${xs.map(x=>`<button class="item lp" data-a="sheetopen" data-k="${x.id}" data-lp="${x.id}"><span class="lnum">L${x.n}</span><span class="grow"><b style="font-size:17px">${esc(x.sub||x.title)}</b><br><span class="small muted">${esc(x.title&&x.sub?x.title+' · ':'')}${x.date?fdate(x.date+'T12:00'):''}${x.dur?' · '+x.dur+"'":''}</span></span><span class="chev">›</span></button>
      ${U.lpMenu===x.id?`<div class="lpmenu"><span class="small grow">Eliminare la lezione ${x.n}${x.sub||x.title?` «${esc(x.sub||x.title)}»`:''}? Non si può recuperare.</span><div class="row" style="gap:8px"><button class="btn danger" data-a="sheetdel" data-k="${id}:${x.id}">Elimina</button><button class="btn ghost" data-a="lpclose">Annulla</button></div></div>`:''}`).join('')}</div></section>
    <p class="small muted" style="text-align:center;margin-top:-6px">Tieni premuto su una lezione per eliminarla.</p>`
    : '<section class="card"><p class="muted">Ancora nessuna lezione svolta registrata.</p></section>';
}
function sheetView(id, x, edit){
  const a = ath(id), pv = privOf(id), tot = (x.phases||[]).reduce((t,p)=>t+(+p.m||0),0) || 1;
  const gmap = Object.fromEntries(pv.goals.map(g=>[g.id,g]));
  const asp = PP_AREAS.filter(([k])=>x.asp && x.asp[k]);
  return `<button class="btn ghost" data-a="sheetclose" style="align-self:flex-start">‹ ${esc(a.name)}</button>
    <section class="card"><span class="eyebrow">${esc(a.name)} · lezione ${x.n}${x.title?' · '+esc(x.title):''}</span>
      <h1>${esc(x.sub||x.title||'Lezione '+x.n)}</h1>
      <div class="kpis idk3">${[[x.date?fdate(x.date+'T12:00'):'–','data'],[x.dur?x.dur+"'":'–','durata'],[x.fmt||'–','formato']].map(([v,l])=>`<div class="kpi"><b>${esc(v)}</b><span class="small muted">${l}</span></div>`).join('')}</div>
      ${x.obj?`<p><b>Obiettivo:</b> ${esc(x.obj)}</p>`:''}</section>
    ${asp.length?`<div class="focus2">${asp.map(([k,l])=>`<section class="card" style="gap:4px;border-top:3px solid ${AREA_COL[k]}"><span class="eyebrow" style="color:${AREA_COL[k]}">${l}</span><span class="small">${esc(x.asp[k])}</span></section>`).join('')}</div>`:''}
    ${(x.phases||[]).length?`<div class="phbar">${x.phases.map((p,i)=>`<span style="flex:${(+p.m||1)/tot};background:${PH_COL[i%PH_COL.length]}"><b>${esc(p.n)}</b>${p.m?` ${p.m}'`:''}</span>`).join('')}</div>`:''}
    ${x.note?`<p class="small muted" style="margin-top:-6px">${esc(x.note)}</p>`:''}
    ${(x.phases||[]).map((p,i)=>`<section class="card" style="border-left:4px solid ${PH_COL[i%PH_COL.length]};gap:10px">
      <div class="row between"><span class="eyebrow" style="color:${PH_COL[i%PH_COL.length]}">${esc(p.n)}</span>${p.m?`<b style="font:700 22px var(--f-disp);color:${PH_COL[i%PH_COL.length]}">${p.m}'</b>`:''}</div>
      ${p.tags?`<p class="small muted" style="margin-top:-6px">${esc(p.tags)}</p>`:''}
      ${(p.ex||[]).map((e,j)=>`<div class="shx" ${j?'style="border-top:1px dashed var(--line);padding-top:10px"':''}>
        <div class="row between" style="flex-wrap:nowrap;align-items:flex-start"><b style="font-size:17px">${esc(e.t)}</b>${e.min?`<span class="muted" style="font:700 16px var(--f-disp);white-space:nowrap">${esc(String(e.min))}'</span>`:''}</div>
        ${(e.els||[]).length?`<div class="vis"><svg viewBox="0 0 220 110" role="img" aria-label="Campo: ${esc(e.t)}">${courtSVG(e.els)}</svg></div>`:''}
        ${(e.x||[]).map(l=>`<p class="small">${esc(l)}</p>`).join('')}
        ${e.obj?`<p class="small"><b style="color:${PH_COL[i%PH_COL.length]}">Obiettivo:</b> ${esc(e.obj)}</p>`:''}${e.serie?`<p class="small"><b style="color:${PH_COL[i%PH_COL.length]}">Serie:</b> ${esc(e.serie)}</p>`:''}
        ${edit?`<button class="chip" data-a="shexed" data-k="${x.id}:${i}:${j}" style="align-self:flex-start">✎ Modifica esercizio</button>`:''}</div>`).join('')}
      ${edit?`<button class="btn ghost" data-a="shexed" data-k="${x.id}:${i}:n" style="align-self:flex-start">+ Aggiungi esercizio</button>`:''}
    </section>`).join('')}
    ${(x.touched||[]).length?`<section class="card"><span class="eyebrow">Obiettivi toccati</span><div class="chips">${x.touched.map(gid=>gmap[gid]?`<span class="chip" style="cursor:default">${esc(gmap[gid].short||gmap[gid].text)}</span>`:'').join('')}</div></section>`:''}
    <div class="focus2"><section class="card" style="gap:6px"><span class="eyebrow">Note dopo la lezione</span>${edit?`<textarea class="input" rows="3" data-c="shnote" data-k="${x.id}:after" placeholder="Cosa ha funzionato, cosa no">${esc(x.after||'')}</textarea>`:`<p class="small">${esc(x.after||'—')}</p>`}</section>
      <section class="card" style="gap:6px"><span class="eyebrow">Da riprendere</span>${edit?`<textarea class="input" rows="3" data-c="shnote" data-k="${x.id}:next" placeholder="Nella prossima lezione">${esc(x.next||'')}</textarea>`:`<p class="small">${esc(x.next||'—')}</p>`}</section></div>
    ${edit?(U.confirm==='sh:'+x.id?`<section class="card"><p>Togliere la scheda della lezione ${x.n}?</p><div class="row"><button class="btn danger" data-a="sheetdel" data-k="${id}:${x.id}">Sì, togli</button><button class="btn ghost" data-a="nodel">No</button></div></section>`:`<button class="chip" data-a="askdel" data-k="sh:${x.id}" style="align-self:center">Togli questa lezione</button>`):''}`;
}
function privDetail(id){
  const a = ath(id), pv = privOf(id), tab = U.ppTab || 'scheda';
  if(U.ed && U.ed.sheet && (pv.sheets||[]).some(x=>x.id===U.ed.sheet.sid)) return editorView();
  if(U.sheetOpen && (pv.sheets||[]).some(x=>x.id===U.sheetOpen)) return sheetView(id, pv.sheets.find(x=>x.id===U.sheetOpen), true);
  if(U.impFor===id) return importView(id);
  const empty = !(pv.card&&(pv.card.level||pv.card.dur)) && !pv.goals.length && !(pv.sheets||[]).length;
  return `<div class="row between" style="gap:8px"><button class="btn ghost" data-a="privclose">‹ Lezioni private</button>${empty?'':`<button class="btn clay" data-a="impfor" data-k="${id}">Crea programma o lezione</button>`}</div>
    ${empty ? `<section class="card" style="border-color:var(--clay)"><h3>Crea il programma di ${esc(a.name)}</h3><p class="small muted">Racconta o detta la lezione: l'IA la prepara con esercizi e campetti, tu la incolli qui. Va direttamente a ${esc(a.name)}.</p><button class="btn clay" data-a="impfor" data-k="${id}">Crea il programma</button></section>` : ''}
    ${ppTabs(tab, [['scheda','Scheda'],['lezioni','Lezioni ('+((pv.sheets||[]).length)+')'],['gest','Modifica e calendario']])}
    ${tab==='scheda' ? idCard(id, true) : tab==='lezioni' ? sheetList(id) : privManage(id)}`;
}
function privManage(id){
  const a = ath(id), pv = privOf(id);
  return `<section class="card"><span class="eyebrow">Dati della scheda</span>
      <div class="field"><label for="pp-title">Obiettivo del percorso</label><textarea id="pp-title" class="input" rows="3" data-c="pp" data-k="title" placeholder="Es. Migliorare il servizio e la transizione a rete, per arrivare pronto ai tornei di primavera">${esc(pv.prog.title)}</textarea></div>
      <div class="field"><label for="pp-freq">Frequenza e periodo</label><input id="pp-freq" class="input" data-c="pp" data-k="freq" value="${esc(pv.prog.freq)}" placeholder="Es. 1 ora a settimana, ottobre–dicembre"></div>
      <button class="btn ghost" data-a="ppsave" data-k="${id}">Salva</button></section>
    ${pdfCard(id)}
    ${ppProgCard(id)}
    <section class="card"><h3>Obiettivi</h3>${pv.goals.length?goalsHtml(pv,true,id):'<p class="muted">Nessun obiettivo. Aggiungine uno qui sotto.</p>'}
      <div class="field"><label>Nuovo obiettivo</label><div class="seg" role="group">${PAREAS.map(([k,l])=>`<button data-a="goalarea" data-k="${k}" aria-pressed="${(U.goalArea||(S.session.role==='mind'?'men':'tec'))===k}">${l}</button>`).join('')}</div>
      <div class="row"><input id="f-goal" class="input" placeholder="Es. Seconda di servizio carica, 7 su 10 dentro" style="flex:1;min-width:0"><button class="btn" data-a="goaladd" data-k="${id}">Aggiungi</button></div>${U.goalPaste===id ? `<div class="field"><label for="f-goals">Incolla gli obiettivi, uno per riga</label><textarea id="f-goals" class="input" rows="6" placeholder="Seconda carica, 7 su 10 dentro&#10;Tattica: aprire il campo con il dritto incrociato&#10;Mentale: routine dopo l'errore"></textarea><p class="small muted">Se una riga inizia con Tecnica:, Tattica:, Mentale: o Fisico: va in quell'area, altrimenti nell'area scelta sopra.</p><div class="row"><button class="btn" data-a="goalpaste" data-k="${id}" style="flex:1">Aggiungi tutti</button><button class="btn ghost" data-a="goalpastetoggle" data-k="${id}">Annulla</button></div></div>` : `<button class="chip" data-a="goalpastetoggle" data-k="${id}" style="align-self:flex-start">Incolla più obiettivi insieme</button>`}</div></section>
    ${plPupilCard(id)}
    <section class="card"><h3>Diario delle lezioni</h3>
      <div class="field"><label for="f-ldate">Data</label><input id="f-ldate" class="input" type="date" value="${new Date().toISOString().slice(0,10)}"></div>
      <div class="field"><label for="f-lwhat">Cosa abbiamo fatto</label><textarea id="f-lwhat" class="input" rows="3" placeholder="Esercizi, temi, risultati delle prove"></textarea></div>
      <div class="field"><label for="f-lnext">Per la prossima volta</label><input id="f-lnext" class="input" placeholder="Es. riprendere il rovescio in back"></div>
      <button class="btn clay" data-a="lessonadd" data-k="${id}">Salva la lezione</button>
      ${pv.lessons.length?`<div class="list">${pv.lessons.slice().reverse().map(l=>`<div><div class="row between"><b>${new Date(l.date).toLocaleDateString('it-IT',{day:'numeric',month:'long'})}</b><button class="chip" data-a="lessondel" data-k="${id}:${l.id}">Togli</button></div><p class="small">${esc(l.what)}</p>${l.next?`<p class="small muted"><b>Prossima volta:</b> ${esc(l.next)}</p>`:''}</div>`).join('')}</div>`:''}
    </section>
    ${profileCard(id)}
    ${(()=>{ const ms = S.matches.filter(m=>m.done && m.a.id===id); return ms.length?`<section class="card"><h3>Match Analysis</h3><div class="list">${ms.slice().reverse().map(matchItem).join('')}</div></section>`:''; })()}`;
}
function privStudentView(){
  const a = me(), pv = privOf(a.id), last = pv.lessons[pv.lessons.length-1];
  const ppg = ppGroup(a.id), tab = U.ppTab || 'scheda';
  if(U.sheetOpen && (pv.sheets||[]).some(x=>x.id===U.sheetOpen)) return sheetView(a.id, pv.sheets.find(x=>x.id===U.sheetOpen), false);
  const top = ppTabs(tab, [['scheda','Il mio percorso'],['lezioni','Lezioni'],['prog','Programma']]);
  if(tab==='scheda') return top + idCard(a.id, false);
  if(tab==='lezioni') return top + sheetList(a.id);
  return top + `${ppg ? ownWeekCard(ppg) : '<section class="card"><p class="muted">Il maestro non ha ancora preparato il programma a settimane.</p></section>'}
    ${plPupilCard(a.id)}
    <section class="card"><h3>I miei obiettivi</h3>${pv.goals.length?goalsHtml(pv,false,a.id):'<p class="muted">Il maestro non ha ancora inserito gli obiettivi.</p>'}</section>
    ${last?`<section class="card"><h3>Ultima lezione · ${new Date(last.date).toLocaleDateString('it-IT',{day:'numeric',month:'long'})}</h3><p>${esc(last.what)}</p>${last.next?`<p class="small"><b>Per la prossima volta:</b> ${esc(last.next)}</p>`:''}</section>`:''}
    ${profileCard(a.id)}`;
}

