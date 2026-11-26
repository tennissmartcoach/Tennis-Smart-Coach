/* Basic tools, local storage, interface state, icons, dates */
const PV = (w,d) => Object.assign({}, PROVA[w][d], (S?.provaEdit||{})[w+'-'+d] || {});
const DAYS = ['Allenamento 1','Allenamento 2','Allenamento 3','Allenamento 4','Allenamento 5'];
const DAYS_S = ['1','2','3','4','5'];
const TYPE_COL = ['#3B6FD8','#C4622D','#1F8A7A','#9A7400','#7A4FB0','#5A6270'];
const wcol = n => TYPE_COL[(n-1)%6];
const tcol = k => TYPE_COL[TYPES.findIndex(t=>t[0]===k)];
/* ---------- cycle tests: one set per player type; trained in the "filo fisso" of that type's weeks, recorded only in the test week ----------
   definitions live in S.ftests as {id:'ctests', ctests:[...]} (athletes can read ftests online); results in S.tests as {ct:tipo, cycle, date, v:{testId:value}} */
const CT_TIPI = () => WEEKS.slice(0,6).map(w=>({k:w.n, name:w.name}));
const ctTipoOfWeek = w => ((+w-1)%6)+1;
const ctAll = () => ((S.ftests||[]).find(t=>t.ctests)||{}).ctests || [];
const ctOf = tipo => ctAll().filter(t=>t.tipo===+tipo);
/* the fitness coach works only on the athletic cycle tests; the tennis ones are the coach's */
/* long histories: tables show only the latest columns; 'Vedi tutti' shows every round or day */
const COLS = 3;
const lastCols = a => U.allCols ? a : a.slice(-COLS);
const colsBtn = (n, word) => n>COLS ? `<button class="chip" data-a="allcols" style="align-self:flex-start;margin-top:6px">${U.allCols ? `Mostra solo gli ultimi ${COLS}` : `Vedi tutti i ${n} ${word}`}</button>` : '';
const ctMine = tipo => S.session && S.session.role==='fit' ? ctOf(tipo).filter(t=>t.area==='atl') : ctOf(tipo);
function ctSaveAll(list){ S.ftests = (S.ftests||[]).filter(t=>!t.ctests).concat({id:'ctests', ctests:list}); }
const ctKindLab1 = p => p.kind==='sec' ? 'tempo (meno è meglio)' : p.kind==='num' ? (+p.max>0?'numero su '+p.max:'numero (più è meglio)') : 'punti su '+(p.max||'?');
const ctKindLab = t => (t.misure||[]).length ? t.misure.map(p=>(p.nome||'')+': '+ctKindLab1(p)).join(' · ') : (t.kind==='sec' ? 'tempo in secondi (meno è meglio)' : t.kind==='num' ? 'numero (più è meglio)' : 'punti su '+(t.max||'?'));
/* a test can record several values ("misure"): t.misure=[{nome, kind:'pts'|'num'|'sec', max}]; old tests have a single t.kind/t.max.
   A result is a number for a single-value test, an array (one value per measure, null if empty) for a multi-value one. */
const ctMisIn = ms => ms.map(p=>{ const k=String(p.tipo||p.kind||'').toLowerCase(); const kind=/sec/.test(k)?'sec':/num/.test(k)?'num':'pts'; return {nome:String(p.nome||''), kind, max:kind!=='sec'&&+p.massimo>0?+p.massimo:(kind!=='sec'&&+p.max>0?+p.max:null)}; });
const ctParts = t => (t.misure||[]).length ? t.misure : [{nome:'', kind:t.kind||'pts', max:t.max}];
const ctVals = (r, t) => { const v = r && r.v ? r.v[t.id] : undefined; if(v===undefined || v===null || v==='') return ctParts(t).map(()=>null); return Array.isArray(v) ? ctParts(t).map((_,j)=>v[j]==null||v[j]===''?null:+v[j]) : [+v]; };
const ctHas = (r, t) => ctVals(r, t).some(x=>x!==null);
const ctNum = z => (Math.round(z*10)/10).toString().replace('.',',');
const ctTime = s => { s = Math.round(+s*10)/10; if(s<60) return ctNum(s)+' s'; const m = Math.floor(s/60), r = Math.round(s-m*60); return m+':'+String(r).padStart(2,'0'); };
const ctFmtPart = (p, v) => v===null ? '–' : p.kind==='sec' ? ctTime(v) : (p.kind==='pts' || (p.kind==='num' && +p.max>0)) && +p.max>0 ? ctNum(v)+'/'+p.max : ctNum(v);
// "Destra 11/15 · Sinistra 9/15 · totale 20/30" or "20/20 in 1:30"
function ctFmt(t, vals){ const ps = ctParts(t); if(ps.length===1) return ctFmtPart(ps[0], vals[0]);
  const sec = ps.findIndex(p=>p.kind==='sec'), oth = ps.findIndex(p=>p.kind!=='sec');
  if(ps.length===2 && sec>=0 && oth>=0 && vals[sec]!==null && vals[oth]!==null) return ctFmtPart(ps[oth], vals[oth])+' in '+ctTime(vals[sec]);
  const pts = ps.map((p,j)=>p.kind==='pts'&&+p.max>0&&vals[j]!==null?j:-1).filter(j=>j>=0);
  return ps.map((p,j)=>(p.nome?p.nome+' ':'')+ctFmtPart(p, vals[j])).join(' · ') + (pts.length>1 ? ` · totale ${ctNum(pts.reduce((s,j)=>s+vals[j],0))}/${pts.reduce((s,j)=>s+ +ps[j].max,0)}` : ''); }
// one number to draw the bar and compare: share of the points if the test has points, otherwise its first value
// table cell: one short value; several values become the total (or the first one) with "D 3 · S 3" underneath
function ctCell(t, vals){ const ps = ctParts(t); if(ps.length===1) return esc(ctFmt(t, vals));
  const sec = ps.findIndex(p=>p.kind==='sec'), oth = ps.findIndex(p=>p.kind!=='sec');
  if(ps.length===2 && sec>=0 && oth>=0 && vals[sec]!==null && vals[oth]!==null) return `${esc(ctFmtPart(ps[oth], vals[oth]))}<div class="small muted">in ${esc(ctTime(vals[sec]))}</div>`;
  // short labels: words shared by all names are dropped ("Entrata di diritto" / "Entrata di rovescio" -> D / R)
  const ws = ps.map(p=>(p.nome||'').toLowerCase().split(/\s+/).filter(w=>w.length>2)), common = w => ws.every(x=>x.includes(w));
  const key = ws.map((x,j)=>(x.find(w=>!common(w)) || x[0] || String(j+1)));
  const ini = key.map(k=>k.charAt(0).toUpperCase()), uniq = new Set(ini).size===ini.length;
  const lab = (p,j) => uniq ? ini[j] : key[j].charAt(0).toUpperCase()+key[j].slice(1,3);
  const pts = ps.map((p,j)=>p.kind==='pts'&&+p.max>0&&vals[j]!==null?j:-1).filter(j=>j>=0);
  const parts = ps.map((p,j)=>vals[j]===null ? '' : `<span style="white-space:nowrap">${esc(lab(p,j))} ${esc(p.kind==='sec' ? ctTime(vals[j]) : ctNum(vals[j]))}</span>`).filter(Boolean);
  if(pts.length<2) return parts.join('<br>');   // no total: one short line per value
  return `${ctNum(pts.reduce((s,j)=>s+vals[j],0))}/${pts.reduce((s,j)=>s+ +ps[j].max,0)}<div class="small muted" style="white-space:normal">${parts.join('  ')}</div>`; }
function ctScore(t, vals){ const ps = ctParts(t), pts = ps.map((p,j)=>p.kind==='pts'&&+p.max>0&&vals[j]!==null?j:-1).filter(j=>j>=0);
  if(pts.length) return {kind:'pct', v: pts.reduce((s,j)=>s+vals[j],0) / pts.reduce((s,j)=>s+ +ps[j].max,0)};
  const j = vals.findIndex(x=>x!==null); return j<0 ? null : {kind:ps[j].kind, v:vals[j], max:+ps[j].max||0}; }
// "1:30" -> 90 for seconds; comma decimals
const ctParse = (txt, kind) => { const x = String(txt||'').trim().replace(',','.'); if(x==='') return null; if(kind==='sec' && /^\d+:\d{1,2}(\.\d+)?$/.test(x)){ const [m,s] = x.split(':'); return +m*60 + +s; } return isNaN(+x) ? NaN : +x; };

const ctRecs = (aid, tipo) => (S.tests||[]).filter(r=>r.ct===+tipo && r.athleteId===aid).sort((a,b)=>(a.cycle||1)-(b.cycle||1) || String(a.date).localeCompare(String(b.date)));
/* reading what an AI wrote: first as it is, then with small repairs. Curly quotes inside a text stay as they are
   (turning them into straight ones used to break texts like "poi da “tre quarti”"); only quotes used as JSON delimiters are fixed. */
function aiJSON(txt){
  // phones can paste invisible characters (non-breaking spaces, zero-width marks): JSON.parse refuses them
  const raw = String(txt||'').replace(/[\u00a0\u2007\u202f]/g,' ').replace(/[\u200b-\u200d\u2060\ufeff]/g,'').trim().replace(/^```\s*(json)?\s*/i,'').replace(/\s*```\s*$/,'').trim();
  // the whole text from the first { to the last }, read in one go by JSON.parse (nested braces included)
  const a0 = raw.indexOf('{'), a1 = raw.lastIndexOf('}'), body = a0>=0 && a1>a0 ? raw.slice(a0, a1+1) : raw;
  aiJSON.err = a0<0 || a1<=a0 ? 'nel testo non c\u2019è nessuna parentesi graffa { }' : '';
  const tries = [b=>b,
    b=>b.replace(/([{\[,:]\s*)[“”„«]/g,'$1"').replace(/[“”»](\s*[,:\]}])/g,'"$1'),
    b=>b.replace(/([{\[,:]\s*)[“”„«]/g,'$1"').replace(/[“”»](\s*[,:\]}])/g,'"$1').replace(/,(\s*[\]}])/g,'$1'),
    b=>b.replace(/[“”„«»]/g,'"').replace(/[‘’]/g,"'").replace(/,(\s*[\]}])/g,'$1')];
  for(const f of tries){ try{ return JSON.parse(f(body)); }catch(e){ if(!aiJSON.err) aiJSON.err = aiJSONwhere(body, e); } }
  return null;
}
// the exact JSON.parse error, with the bit of text where it stopped
function aiJSONwhere(body, e){ const m = /position (\d+)/.exec(e.message||''); const at = m ? +m[1] : -1;
  return (e.message||'testo non leggibile') + (at>=0 ? ` — vicino a: «${body.slice(Math.max(0,at-25), at+15).replace(/\s+/g,' ')}»` : '');
}
/* the court drawing of an imported exercise: what cannot be drawn is left out and noted in CAMPO_LOG (shown to the coach) */
let CAMPO_LOG = [];
function cleanCampo(c, where){
  if(!Array.isArray(c)) return [];
  const num = v => typeof v==='number' ? v : (typeof v==='string' && v.trim()!=='' && !isNaN(+v) ? +v : NaN), ok = v => Number.isFinite(v);
  const PATH = /^\s*[Mm][\s\d.,\-+eEMmLlQqCcSsTtHhVvZz]*$/, out = [];
  c.forEach((e,i)=>{ const why = (()=>{
      if(!Array.isArray(e) || !e.length) return 'non è un elemento del campetto';
      const k = String(e[0]); let x;
      if(['A','B','M','c'].includes(k)){ x=[k, num(e[1]), num(e[2])]; if(!ok(x[1])||!ok(x[2])) return 'mancano le coordinate x e y'; if(k==='A'||k==='B') x.push(e[3]!=null?String(e[3]).slice(0,2):k); out.push(x); return ''; }
      if(k==='z'){ x=[k,num(e[1]),num(e[2]),num(e[3]),num(e[4])]; if(x.slice(1).some(v=>!ok(v))) return 'servono x, y, larghezza e altezza'; out.push(x); return ''; }
      if(k==='t'||k==='n'){ x=[k,num(e[1]),num(e[2])]; if(!ok(x[1])||!ok(x[2])) return 'mancano le coordinate x e y'; const tx = e[3]==null ? '' : String(e[3]).trim(); if(!tx) return 'manca il testo'; x.push(k==='n'?tx.slice(0,3):tx.slice(0,40)); out.push(x); return ''; }
      if(['a','b','f','ma'].includes(k)){ let d = e[1];
        if(typeof d!=='string' && e.length>=5 && [1,2,3,4].every(j=>ok(num(e[j])))) d = `M${num(e[1])} ${num(e[2])}L${num(e[3])} ${num(e[4])}`;   // [k,x1,y1,x2,y2] becomes a straight line
        if(typeof d!=='string' || !PATH.test(d) || !/\d/.test(d)) return 'il percorso della freccia non è valido (deve essere tipo "M60 62Q110 34 150 28")';
        out.push([k, d.trim()]); return ''; }
      return 'tipo "'+k+'" sconosciuto'; })();
    if(why) CAMPO_LOG.push({where:where||'', i:i+1, el:(()=>{ try{ return JSON.stringify(e).slice(0,60); }catch(_){ return String(e).slice(0,60); } })(), why}); });
  return out;
}
const campoWarnHtml = log => log && log.length ? `<div class="note"><b>Campetto: ${log.length===1?'saltato 1 elemento':'saltati '+log.length+' elementi'}</b>, il resto è stato importato.<ul class="small" style="margin:6px 0 0;padding-left:18px">${log.slice(0,8).map(x=>`<li>${x.where?esc(x.where)+' · ':''}n. ${x.i} <code>${esc(x.el)}</code>: ${esc(x.why)}</li>`).join('')}${log.length>8?`<li>… e altri ${log.length-8}</li>`:''}</ul></div>` : '';
const testsDef = () => ((S.ftests||[]).find(t=>t.tdef)||{}).tdef || TESTS;
const W = n => WEEKS[n-1];
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Math.random().toString(36).slice(2,10);
const pct = (a,b) => b ? Math.round(a/b*100) : null;

/* ---------- data store (this phone only, for now) ---------- */
/* Hook points for the online layer (online/cloud.js fills them in). In this-phone mode they stay empty and the app works on its own. */
const HOOK = {};
const KEY = 'smartcoach.v3';
let S;
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
function load(){ let d=null; try{ const r = localStorage.getItem(KEY); if(r) d = JSON.parse(r); }catch(e){} if(!d) return addMoreDemo(addFtDemo(addCtDemo(addTourDemo(addStaffDemo(addPlDemo(seed()))))));
  if(d.roster!==6){ const n = seed(); d = Object.assign(n, {coachCode:d.coachCode||'MAESTRO', customEx:d.customEx||[], plan:d.plan||{}, provaEdit:d.provaEdit||{}}); }
  ['forms','tests','results','matches','customEx'].forEach(k=>d[k]=d[k]||[]); d.profiles=d.profiles||{}; d.priv=d.priv||{}; d.att=d.att||{}; d.notes=d.notes||[]; d.well=d.well||[]; d.notices=d.notices||[]; d.season=d.season||{}; if(!d.season[2026]) d.season[2026]=JSON.parse(JSON.stringify(SEASON2026)); if(!d.groups.some(g=>g.id==='priv')) d.groups.push({id:'priv', name:'Lezioni private', code:'PRIV', week:1}); if(d.roster!==3){ addExample(d); d.roster=3; } if(!d.ex4) addExample4(d); if(!d.ex5) addExample5(d); d.plan=d.plan||{}; d.provaEdit=d.provaEdit||{};
  if(!d.ct1) addCtDemo(d); if(!d.ft1) addFtDemo(d); if(!d.more1) addMoreDemo(d);
  return addTourDemo(addStaffDemo(addPlDemo(d))); }


/* ---------- ui state ---------- */
const U = { step:'role', code:'', group:null, athlete:null, pin:'', err:'', tab:null, weekOpen:null, day:null, cnt:{ok:0,tot:0}, resGroup:null, resWeek:null, athleteOpen:null, matchOpen:null, setup:null, sel:{ch:undefined, ex:null}, confirm:null, newGroup:false };
const me = () => S.athletes.find(a=>a.id===S.session?.athleteId);
const grp = id => (typeof id==='string' && id.startsWith('pp_')) ? ppGroup(id.slice(3)) : S.groups.find(g=>g.id===id);
/* private pupil programme: a pseudo-group kept in priv[aid].pg, weeks in priv[aid].own */
function ppGroup(aid){ const a = ath(aid); if(!a) return undefined; const pv = privOf(aid); if(!pv.pg) return undefined; pv.pg.name = a.name; return pv.pg; }
const ath = id => S.athletes.find(a=>a.id===id);
const isCoach = () => S.session?.role==='coach';
const isStaff = r => r==='coach' || r==='fit' || r==='mind';
const ROLE_NAME = {fit:'Preparatore atletico', mind:'Preparatore mentale'};
/* sessions are numbered 1–5: the coach ticks each one when it is done, so a missed day can be made up on any other day */
const gwk = g => isOwnG(g) ? 'o'+ownOf(g.id).cur : String(g.week);
// 12 weeks done in any order: after going back to an earlier week, "next" continues from the furthest week reached (g.maxWeek)
const nextWeekNo = g => Math.min(12, Math.max(g.week, g.maxWeek||0) + 1);
function gotoWeek(g, n){ n = +n; const old = (g.sdone||{})[n];
  if(old && Object.keys(old).length){ g.past = g.past||[]; g.past.push({end:todayISO(), week:String(n), cycle:g.cycle||1, sdone:{[n]:old}}); delete g.sdone[n]; g.cycle = (g.cycle||1)+1; }
  g.maxWeek = Math.max(g.maxWeek||0, g.week); g.week = n; }
const sDone = g => ((g && g.sdone) || {})[gwk(g)] || {};
const doneDate = (g,di) => sDone(g)[di] || '';
/* how many sessions a week the group trains: with the 12-week programme fewer sessions keep the first and the last (the comparison of the prova) */
const PICK12 = {2:[0,4], 3:[0,2,4], 4:[0,1,2,4], 5:[0,1,2,3,4]};
const nS = g => g && g.pp ? Math.min(5, Math.max(1, g.freq || 1)) : Math.min(5, Math.max(2, (g && g.freq) || 5));
const pickOf = g => isOwnG(g) ? [0,1,2,3,4].slice(0, nS(g)) : PICK12[nS(g)];
const sNo = (g,di) => pickOf(g).indexOf(di) + 1;
const sLabel = (g,di) => 'Allenamento ' + (sNo(g,di) || di+1);
function curIdx(g){ if(!g || g.id===PRIV_ID) return -1; const m = sDone(g), t = todayISO(), pk = pickOf(g); for(const i of pk.slice().reverse()) if(m[i]===t) return i; for(const i of pk) if(!m[i]) return i; return -1; }
function nextFree(g){ const m = sDone(g); for(const i of pickOf(g)) if(!m[i]) return i; return -1; }
function todayIdx(g){ if(g){ const i = curIdx(g), pk = pickOf(g); return i<0 ? pk[pk.length-1] : i; } const d = new Date().getDay(); return d>=1 && d<=5 ? d-1 : 4; }
function sessDots(g){ const m = sDone(g), pk = pickOf(g); return `<span class="sdots" aria-label="${pk.filter(i=>m[i]).length} allenamenti su ${pk.length} fatti">${pk.map((i,k)=>`<i class="${m[i]?'on':''}">${k+1}</i>`).join('')}</span>`; }
// a group is in its test week when it moved there with the button, or its own current week is a test week (made by hand)
const inTestWeek = g => !!g && isOwnG(g) && !g.pp && (!!g.testFrom || (w => !!w && (w.days.some(d=>d.ctTipo) || /test/i.test(w.name||'')))(ownOf(g.id).weeks[ownOf(g.id).cur-1]));
const testEndBtn = g => inTestWeek(g) && S.session.role==='coach' ? `<button class="btn clay block" data-a="testend" data-k="${g.id}">Fine dei test: torna alle 12 settimane</button>` : '';
/* any week at any time: 1-12 or the test week (coach, groups on the 12 weeks or in their test week) */
function weekChanger(g){
  if(!g || g.pp || S.session.role!=='coach' || (isOwnG(g) && !inTestWeek(g))) return '';
  if(U.wkChg!==g.id) return `<button class="chip" data-a="wkchgopen" data-k="${g.id}" style="align-self:flex-start">Cambia settimana</button>`;
  const cur = inTestWeek(g) ? 'T' : String(g.week);
  return `<div class="row" style="gap:8px"><select id="f-wkchg-${g.id}" class="input" style="flex:1;min-width:0" aria-label="Cambia settimana">${Array.from({length:12},(_,i)=>i+1).map(n=>`<option value="${n}" ${String(n)===cur?'selected':''}>Settimana ${n} · ${esc(W(n).name)}</option>`).join('')}<option value="T" ${cur==='T'?'selected':''}>Settimana dei test</option></select><button class="btn clay" data-a="wkchg" data-k="${g.id}">Vai</button></div>`;
}
function sessBtns(g, di){ return sessBtns0(g, di) + weekChanger(g); }
function sessBtns0(g, di){ if(S.session.role!=='coach' || !g) return '';
  if(nextFree(g)<0 && inTestWeek(g)) return `<div class="note"><b>Settimana dei test completata.</b> Con "Cambia settimana" scegli da quale settimana ripartire.</div>`;
  if(nextFree(g)<0){ const endC = !isOwnG(g) && (g.week===6 || g.week===12), st = g.week<=6 ? 1 : 7;
    return `<div class="note"><b>Settimana completata.</b> Tutti e ${pickOf(g).length} gli allenamenti sono fatti.${endC?` È finito il ciclo delle settimane ${st}–${st+5}.`:''}</div>${endC?`<button class="btn clay" data-a="tweekgo" data-k="${g.id}">Inizia la settimana dei test</button>`:''}${endC?`<button class="btn ghost" data-a="cyclerep" data-k="${g.id}:${st}">Ripeti il ciclo (torna alla settimana ${st})</button>`:''}<button class="btn ghost" data-a="weekrep" data-k="${g.id}">Ripeti questa settimana</button>${(isOwnG(g) || Math.max(g.week,g.maxWeek||0)<12)?`<button class="btn ${endC?'ghost':'clay'}" data-a="weeknext" data-k="${g.id}">Passa alla settimana ${isOwnG(g)?ownOf(g.id).cur+1:nextWeekNo(g)}</button>`:''}
      ${isOwnG(g)?'':`<div class="row" style="gap:8px"><select id="f-goto-${g.id}" class="input" style="flex:1;min-width:0" aria-label="Rifai una settimana">${Array.from({length:12},(_,i)=>i+1).map(n=>`<option value="${n}" ${n===g.week?'selected':''}>Rifai la sett. ${n} · ${esc(W(n).name)}</option>`).join('')}</select><button class="btn ghost" data-a="gotoweek" data-k="${g.id}">Vai</button></div>`}`; }
  const dd = doneDate(g,di), nx = nextFree(g);
  return (dd ? `<div class="row"><button class="btn ghost" data-a="sessdone" data-k="${g.id}:${di}" style="flex:1">✓ Fatto ${dd===todayISO()?'oggi':fdate(dd)} · annulla</button>${nx>=0?`<button class="btn ghost" data-a="sessdone" data-k="${g.id}:${nx}" style="flex:1">Oggi anche il ${sNo(g,nx)} (recupero)</button>`:''}</div>` : `<button class="btn" data-a="sessdone" data-k="${g.id}:${di}">Segna l'allenamento ${sNo(g,di)} come fatto</button>`); }
const sessHead = (g, di, title) => nextFree(g)<0 ? 'Settimana completata ✓' : `${sLabel(g,di)}: ${title}`;
let toastT;
function toast(msg){ let t = document.querySelector('.toast'); if(!t){ t=document.createElement('div'); t.className='toast'; t.setAttribute('role','status'); document.body.appendChild(t);} t.textContent=msg; clearTimeout(toastT); toastT=setTimeout(()=>t.remove(),1800); }

/* ---------- icons ---------- */
const IC = {
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/></svg>',
  user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.2 4.2-6.5 8-6.5s7 2.3 8 6.5"/></svg>',
  today:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M5.5 6.5c3 2.5 3 8.5 0 11M18.5 6.5c-3 2.5-3 8.5 0 11"/></svg>',
  match:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M3 12h18"/></svg>',
  prog:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  plan:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>',
  trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M8 20h8M10 17h4"/></svg>',
  test:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 13l4-4"/><path d="M3.5 17a9 9 0 1 1 17 0"/><circle cx="12" cy="13" r="1.5"/></svg>',
  form:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  people:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.3 0 4 1.4 4.6 4"/></svg>'
};


/* ---------- dates ---------- */
const todayISO = () => { const d = new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10); };
const MONTHS = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
const dLabel = iso => { const d = new Date(iso+'T12:00'); if(isNaN(d)) return String(iso||''); return d.getDate()+' '+MONTHS[d.getMonth()].slice(0,3)+(d.getFullYear()!==new Date().getFullYear() ? ' '+String(d.getFullYear()).slice(2) : ''); };
function firstMonday(y){ const j1 = new Date(Date.UTC(y,0,1)); const add = (8 - j1.getUTCDay()) % 7; return new Date(Date.UTC(y,0,1+add)); }
function weekMonday(year, n){ return new Date(firstMonday(year).getTime() + (n-1)*7*864e5).toISOString().slice(0,10); }
function weekOf(iso){ const t = new Date(iso+'T00:00Z'); let y = t.getUTCFullYear(); if(t < firstMonday(y)) y--; return {year:y, n:1+Math.floor((t-firstMonday(y))/(7*864e5))}; }

