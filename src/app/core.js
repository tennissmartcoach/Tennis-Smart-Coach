/* Basic tools, local storage, interface state, icons, dates */
const PV = (w,d) => Object.assign({}, PROVA[w][d], (S?.provaEdit||{})[w+'-'+d] || {});
const DAYS = ['Allenamento 1','Allenamento 2','Allenamento 3','Allenamento 4','Allenamento 5'];
const DAYS_S = ['1','2','3','4','5'];
const TYPE_COL = ['#3B6FD8','#C4622D','#1F8A7A','#9A7400','#7A4FB0','#5A6270'];
const wcol = n => TYPE_COL[(n-1)%6];
const tcol = k => TYPE_COL[TYPES.findIndex(t=>t[0]===k)];
const testsDef = () => ((S.ftests||[]).find(t=>t.tdef)||{}).tdef || TESTS;
const W = n => WEEKS[n-1];
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Math.random().toString(36).slice(2,10);
const pct = (a,b) => b ? Math.round(a/b*100) : null;

/* ---------- data store (this phone only, for now) ---------- */
const KEY = 'smartcoach.v3';
let S;
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
function load(){ let d=null; try{ const r = localStorage.getItem(KEY); if(r) d = JSON.parse(r); }catch(e){} if(!d) return addTourDemo(addStaffDemo(addPlDemo(seed())));
  if(d.roster!==6){ const n = seed(); d = Object.assign(n, {coachCode:d.coachCode||'MAESTRO', customEx:d.customEx||[], plan:d.plan||{}, provaEdit:d.provaEdit||{}}); }
  ['forms','tests','results','matches','customEx'].forEach(k=>d[k]=d[k]||[]); d.profiles=d.profiles||{}; d.priv=d.priv||{}; d.att=d.att||{}; d.notes=d.notes||[]; d.well=d.well||[]; d.notices=d.notices||[]; d.season=d.season||{}; if(!d.season[2026]) d.season[2026]=JSON.parse(JSON.stringify(SEASON2026)); if(!d.groups.some(g=>g.id==='priv')) d.groups.push({id:'priv', name:'Lezioni private', code:'PRIV', week:1}); if(d.roster!==3){ addExample(d); d.roster=3; } if(!d.ex4) addExample4(d); if(!d.ex5) addExample5(d); d.plan=d.plan||{}; d.provaEdit=d.provaEdit||{};
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
function sessBtns(g, di){ if(S.session.role!=='coach' || !g) return '';
  if(nextFree(g)<0) return `<div class="note"><b>Settimana completata.</b> Tutti e ${pickOf(g).length} gli allenamenti sono fatti.</div><button class="btn clay" data-a="weeknext" data-k="${g.id}">Passa alla settimana ${isOwnG(g)?ownOf(g.id).cur+1:Math.min(12,g.week+1)}</button>`;
  const dd = doneDate(g,di), nx = nextFree(g);
  return dd ? `<div class="row"><button class="btn ghost" data-a="sessdone" data-k="${g.id}:${di}" style="flex:1">✓ Fatto ${dd===todayISO()?'oggi':fdate(dd)} · annulla</button>${nx>=0?`<button class="btn ghost" data-a="sessdone" data-k="${g.id}:${nx}" style="flex:1">Oggi anche il ${sNo(g,nx)} (recupero)</button>`:''}</div>` : `<button class="btn" data-a="sessdone" data-k="${g.id}:${di}">Segna l'allenamento ${sNo(g,di)} come fatto</button>`; }
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
const dLabel = iso => { const d = new Date(iso+'T12:00'); return d.getDate()+' '+MONTHS[d.getMonth()].slice(0,3); };
function firstMonday(y){ const j1 = new Date(Date.UTC(y,0,1)); const add = (8 - j1.getUTCDay()) % 7; return new Date(Date.UTC(y,0,1+add)); }
function weekMonday(year, n){ return new Date(firstMonday(year).getTime() + (n-1)*7*864e5).toISOString().slice(0,10); }
function weekOf(iso){ const t = new Date(iso+'T00:00Z'); let y = t.getUTCFullYear(); if(t < firstMonday(y)) y--; return {year:y, n:1+Math.floor((t-firstMonday(y))/(7*864e5))}; }

