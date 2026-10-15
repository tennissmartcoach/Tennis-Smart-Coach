/* ---------- online archive (Firebase) ---------- */
const FB_CONFIG = {
  apiKey: "AIzaSyC9zK-Ddkfaxvz3CjwJzo9Ou3UdrVoj2HY",
  authDomain: "tennis-smart-coach-d660d.firebaseapp.com",
  projectId: "tennis-smart-coach-d660d",
  storageBucket: "tennis-smart-coach-d660d.firebasestorage.app",
  messagingSenderId: "1091138705263",
  appId: "1:1091138705263:web:4e3bfed851a700894efa9a"
};
const ROLE_LABEL = {coach:'Maestro', fit:'Preparatore atletico', mind:'Preparatore mentale', student:'Atleta', parent:'Genitore'};
const LOCAL_KEYS = new Set(['session','live','seen']);
const C = { ready:false, screen:'loading', user:null, club:null, clubName:'', member:null, last:{}, dirty:new Set(), timer:null, status:'ok', err:'', info:'', mode:'ath', invite:null, unsub:[], busy:false, staff:null, invites:null, pendingRender:false };
let fbAuth = null, fbDb = null;

function normalize(d){
  d = d || {};
  d.roster = 3; d.ex4 = true; d.ex5 = true;
  d.coachCode = d.coachCode || 'MAESTRO';
  d.groups = d.groups || []; d.athletes = d.athletes || [];
  ['forms','tests','results','matches','customEx'].forEach(k=>d[k]=d[k]||[]);
  d.profiles=d.profiles||{}; d.priv=d.priv||{}; d.att=d.att||{}; d.notes=d.notes||[]; d.well=d.well||[]; d.notices=d.notices||[]; d.season=d.season||{};
  if(!d.season[2026]) d.season[2026]=JSON.parse(JSON.stringify(SEASON2026));
  if(!d.groups.some(g=>g.id==='priv')) d.groups.push({id:'priv', name:'Lezioni private', code:'PRIV', week:1});
  d.plan=d.plan||{}; d.provaEdit=d.provaEdit||{};
  return d;
}
function emptyState(){ return normalize({example:false, groups:[{id:'g1', name:'Gruppo 1', code:'G1', week:1, lesson:{dur:0, phases:[]}}], athletes:[]}); }

function cErr(e){
  const c = (e && (e.code||'')) + '';
  const M = {
    'auth/invalid-email':'L\'indirizzo email non è valido.',
    'auth/missing-password':'Scrivi la password.',
    'auth/weak-password':'La password deve avere almeno 6 caratteri.',
    'auth/email-already-in-use':'Esiste già un account con questa email: usa "Accedi".',
    'auth/invalid-credential': C.mode==='ath' ? 'Codice o PIN non corretti. Controlla o chiedi al maestro.' : 'Email o password non corrette.',
    'tsc/pinchanged':'Il PIN è stato cambiato dal maestro: inserisci il codice con il PIN nuovo.',
    'tsc/code':'Codice non trovato. Controlla di averlo scritto giusto, con i trattini.',
    'auth/wrong-password':'Email o password non corrette.',
    'auth/user-not-found':'Non esiste un account con questa email.',
    'auth/too-many-requests':'Troppi tentativi. Aspetta qualche minuto e riprova.',
    'auth/network-request-failed':'Connessione assente. Controlla la rete e riprova.',
    'permission-denied':'Permesso negato: controlla che le regole del database siano state pubblicate.',
    'unavailable':'Server non raggiungibile. Controlla la connessione.'
  };
  return M[c] || ('Errore: ' + (e && e.message ? e.message : c || 'sconosciuto'));
}
const cv = id => (document.getElementById(id)?.value || '').trim();
const cval = id => esc((U.cv||{})[id]||'');

function cloudRender(){ render(); }
function cloudStop(){ C.unsub.forEach(f=>{ try{ f(); }catch(e){} }); C.unsub = []; }

function cloudInit(){
  if(!window.firebase){ C.screen='nofb'; return cloudRender(); }
  try{
    firebase.initializeApp(FB_CONFIG); fbAuth = firebase.auth(); fbDb = firebase.firestore();
    try{ fbDb.enablePersistence({synchronizeTabs:true}).catch(()=>{}); }catch(e){}
    fbAuth.languageCode = 'it';
  }catch(e){ C.err = cErr(e); C.screen='error'; return cloudRender(); }
  fbAuth.onAuthStateChanged(u=>{
    C.user = u; cloudStop(); C.ready = false; C.last = {}; C.club = null; C.member = null; C.sh = {}; C.pt = {}; C.partLoaded = {}; C.codes = null;
    if(!u){ C.screen='auth'; cloudRender(); return; }
    cloudAfterLogin();
  });
  document.addEventListener('input', e=>{ const t=e.target; if(t && t.id && /^c-(name|email|club|code)$/.test(t.id)) (U.cv=U.cv||{})[t.id]=t.value; });
  window.addEventListener('online', statusPaint); window.addEventListener('offline', statusPaint);
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden' && C.ready){ clearTimeout(C.timer); cloudFlush(); } });
  document.addEventListener('focusout', ()=>{ if(C.pendingRender){ setTimeout(()=>{ const a=document.activeElement; if(!a || !/INPUT|TEXTAREA|SELECT/.test(a.tagName)){ C.pendingRender=false; render(); } }, 50); } });
}

async function cloudAfterLogin(){
  C.screen='loading'; C.err=''; C.info=''; cloudRender();
  try{
    const us = await fbDb.doc('users/'+C.user.uid).get();
    const club = us.exists ? us.data().club : null;
    if(club){
      const m = await fbDb.doc(`clubs/${club}/members/${C.user.uid}`).get();
      if(m.exists) return cloudOpen(club, m.data());
      if(us.data().athleteId){ C.screen='removed'; return cloudRender(); }
    }
    const email = (C.user.email||'').toLowerCase();
    let inv = null; try{ inv = await fbDb.doc('invites/'+email).get(); }catch(e){}
    if(inv && inv.exists){ C.invite = inv.data(); C.screen='join'; return cloudRender(); }
    C.screen='create'; cloudRender();
  }catch(e){ C.err = cErr(e); C.screen='error'; cloudRender(); }
}

/* ---------- data layout ----------
   clubs/{c}/data/{key}          shared club data (staff write; athletes read only PUBLIC_KEYS)
   clubs/{c}/ath/{aid}/data/{k}  each athlete's own data (staff all; the athlete and parent their own)
*/
const PUBLIC_KEYS = ['groups','athletes','season','plan','provaEdit','customEx','own','fitProg','notices','filoEdit','ftests','mforms','roster','example','ex4','ex5'];
const PART_ARR = {results:x=>x.athleteId, forms:x=>x.athleteId, well:x=>x.athleteId, tests:x=>x.athleteId, notes:x=>x.athleteId, snotes:x=>x.athleteId, massign:x=>x.athleteId, fres:x=>x.athleteId, matches:m=>m&&m.a&&m.a.id};
const ATH_READ = ['results','forms','well','tests','massign','fres','matches','priv','profiles','att','tours'];
const ATH_WRITE = ['results','forms','well','matches','tours','massign'];
const COMPOSED = ['athletes','season','profiles','priv','att', ...Object.keys(PART_ARR)];
const isStaffRole = r => r==='coach' || r==='fit' || r==='mind';
const jclone = v => v===undefined ? undefined : JSON.parse(JSON.stringify(v));
const itemKey = it => (it && it.id) ? 'i:'+it.id : 'j:'+JSON.stringify(it);
const isEmptyV = v => v==null || (Array.isArray(v) ? !v.length : (typeof v==='object' && !Object.keys(v).length));

function ensureTourIds(season){
  Object.entries(season||{}).forEach(([y,s])=>Object.entries((s&&s.weeks)||{}).forEach(([n,w])=>(w.t||[]).forEach((t,i)=>{ if(t && !t.id) t.id = `t${y}-${n}-${i}`; })));
}
function composeKey(k){
  const sh = C.sh, pt = C.pt, known = isStaffRole(C.member.role) ? new Set((sh.athletes||[]).map(a=>a.id)) : null, aids = Object.keys(pt).filter(x=>!known || known.has(x));
  if(k==='athletes'){ const pins = sh.pins || {}; return (jclone(sh.athletes)||[]).map(a=>Object.assign(a, pins[a.id]||{})); }
  if(k==='season'){
    const s = jclone(sh.season) || {}; const tours = {};
    aids.forEach(aid=>{ const T = pt[aid].tours || {}; Object.keys(T).forEach(tid=>{ (tours[tid] = tours[tid] || {})[aid] = T[tid]; }); });
    ensureTourIds(s);
    Object.values(s).forEach(y=>Object.values((y&&y.weeks)||{}).forEach(w=>(w.t||[]).forEach(t=>{
      const m = tours[t.id]; if(!m) return;
      t.requests = (t.requests||[]).filter(a=>!(a in m)); t.results = t.results || {};
      Object.keys(m).forEach(aid=>{ if(m[aid].req) t.requests.push(aid); if(m[aid].res) t.results[aid] = m[aid].res; });
    })));
    return s;
  }
  if(PART_ARR[k]){
    const out = (jclone(sh[k]) || []); const seen = new Set(out.map(itemKey));
    aids.forEach(aid=>(pt[aid][k]||[]).forEach(it=>{ const kk = itemKey(it); if(!seen.has(kk)){ seen.add(kk); out.push(it); } }));
    return out;
  }
  if(k==='profiles' || k==='priv'){
    const o = jclone(sh[k]) || {};
    aids.forEach(aid=>{ const v = k==='profiles' ? (pt[aid].profiles || pt[aid].profilesPriv) : pt[aid].priv; if(v) o[aid] = v; });
    return o;
  }
  if(k==='att'){
    const o = jclone(sh.att) || {};
    aids.forEach(aid=>{ const A = pt[aid].att || {}; Object.keys(A).forEach(day=>{ (o[day] = o[day] || {})[aid] = A[day]; }); });
    return o;
  }
  return jclone(sh[k]);
}
function composeAll(){
  const d = {};
  Object.keys(C.sh).forEach(k=>{ if(k!=='pins') d[k] = composeKey(k); });
  COMPOSED.forEach(k=>{ d[k] = composeKey(k); });
  return d;
}
/* split the in-memory state back into shared docs and per-athlete docs */
function decompose(S){
  const out = {sh:{}, pt:{}};
  if(!isStaffRole(C.member.role)){
    const aid = C.member.athleteId, P = out.pt[aid] = {};
    ['results','forms','well','matches','massign'].forEach(k=>{ P[k] = (S[k]||[]).filter(x=>PART_ARR[k](x)===aid); });
    ensureTourIds(S.season); const T = {};
    Object.values(S.season||{}).forEach(y=>Object.values((y&&y.weeks)||{}).forEach(w=>(w.t||[]).forEach(t=>{
      const req = (t.requests||[]).includes(aid), res = (t.results||{})[aid];
      if(req || res) T[t.id] = Object.assign({}, req?{req:true}:{}, res?{res}:{});
    })));
    P.tours = T; return out;
  }
  const aids = new Set((S.athletes||[]).map(a=>a.id));
  aids.forEach(aid=>{ out.pt[aid] = {}; });
  Object.keys(S).forEach(k=>{ if(!LOCAL_KEYS.has(k) && !COMPOSED.includes(k)) out.sh[k] = S[k]; });
  const pins = {};
  out.sh.athletes = (S.athletes||[]).map(a=>{ const {pin, ppin, pin6, ppin6, ...rest} = a; pins[a.id] = {pin, ppin}; return rest; });
  out.sh.pins = pins;
  ensureTourIds(S.season); const season = jclone(S.season) || {};
  Object.values(season).forEach(y=>Object.values((y&&y.weeks)||{}).forEach(w=>(w.t||[]).forEach(t=>{
    const keepReq = [], keepRes = {};
    (t.requests||[]).forEach(aid=>{ if(aids.has(aid)){ const T = out.pt[aid].tours = out.pt[aid].tours || {}; (T[t.id] = T[t.id] || {}).req = true; } else keepReq.push(aid); });
    Object.entries(t.results||{}).forEach(([aid,r])=>{ if(aids.has(aid)){ const T = out.pt[aid].tours = out.pt[aid].tours || {}; (T[t.id] = T[t.id] || {}).res = r; } else keepRes[aid] = r; });
    t.requests = keepReq; t.results = keepRes;
  })));
  out.sh.season = season;
  Object.keys(PART_ARR).forEach(k=>{
    const orphans = [];
    (S[k]||[]).forEach(it=>{ const aid = PART_ARR[k](it); if(aids.has(aid)) (out.pt[aid][k] = out.pt[aid][k] || []).push(it); else orphans.push(it); });
    out.sh[k] = orphans;
  });
  const shProf = {}, shPriv = {};
  Object.entries(S.profiles||{}).forEach(([aid,v])=>{ if(aids.has(aid)) out.pt[aid][v && v.share===false ? 'profilesPriv' : 'profiles'] = v; else shProf[aid] = v; });
  Object.entries(S.priv||{}).forEach(([aid,v])=>{ if(aids.has(aid)) out.pt[aid].priv = v; else shPriv[aid] = v; });
  out.sh.profiles = shProf; out.sh.priv = shPriv;
  const shAtt = {};
  Object.entries(S.att||{}).forEach(([day,m])=>Object.entries(m||{}).forEach(([aid,v])=>{ if(aids.has(aid)){ const A = out.pt[aid].att = out.pt[aid].att || {}; A[day] = v; } else (shAtt[day] = shAtt[day] || {})[aid] = v; }));
  out.sh.att = shAtt;
  aids.forEach(aid=>{ const P = out.pt[aid]; ['tours','att','profiles','profilesPriv','priv', ...Object.keys(PART_ARR)].forEach(k=>{ if(P[k]===undefined) P[k] = (k==='priv'||k==='profiles'||k==='profilesPriv') ? null : (k==='tours'||k==='att' ? {} : []); }); });
  return out;
}
const affectedBy = (k, part) => part ? ({tours:'season', profilesPriv:'profiles'}[k] || k) : ((k==='pins') ? 'athletes' : k);
function applyRemote(k, part){
  const sk = affectedBy(k, part);
  if(C.timer){ clearTimeout(C.timer); C.timer = null; cloudFlush(); }
  S[sk] = composeKey(sk); S = normalize(S);
  const a = document.activeElement; if(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) C.pendingRender = true; else render();
}

async function cloudOpen(club, member){
  C.club = club; C.member = member; C.sh = {}; C.pt = {}; C.partLoaded = {}; C.last = {};
  try{ const cs = await fbDb.doc('clubs/'+club).get(); C.clubName = cs.exists ? (cs.data().name||'') : ''; C.ownerUid = cs.exists ? (cs.data().owner||'') : ''; }catch(e){}
  const staff = isStaffRole(member.role);
  let pending = 0, started = false;
  const done = () => {
    if(C.ready || pending > 0 || !started) return;
    S = normalize(composeAll());
    let seen = ''; try{ seen = localStorage.getItem('tsc.seen.'+C.user.uid) || ''; }catch(e){}
    S.seen = seen; S.session = staff ? {role: member.role} : {role: member.role, athleteId: member.athleteId};
    if(!staff && !S.athletes.some(a=>a.id===member.athleteId)) S.athletes.push({id:member.athleteId, groupId:'', name:member.name||''});
    if(!staff){ const nm = (S.athletes.find(a=>a.id===member.athleteId)||{}).name || member.name || ''; accPut({email:(C.user.email||'').toLowerCase(), name:nm, role:member.role}); }
    C.ready = true; C.screen = 'app'; U.tab = null; render();
    if(staff) setTimeout(cloudFlush, 300);
  };
  const onErr = e => { C.status='err'; C.err=cErr(e); statusPaint(); if(!C.ready){ C.screen='error'; cloudRender(); } };
  const watchDoc = (ref, path, setter) => { pending++; let first = true;
    C.unsub.push(ref.onSnapshot(d=>{
      const v = d.exists ? d.data().v : undefined;
      if(first){ first = false; C.last[path] = v; setter(v); pending--; done(); return; }
      if(d.metadata && d.metadata.hasPendingWrites) return;
      if(C.last[path]===v) return; C.last[path] = v; setter(v); if(C.ready) applyRemote(path.split('/').pop(), path[0]==='p');
    }, onErr)); };
  const parse = v => { try{ return v===undefined ? undefined : JSON.parse(v); }catch(e){ return undefined; } };
  const watchPart = aid => {
    if(C.partLoaded[aid] !== undefined) return; C.partLoaded[aid] = false; C.pt[aid] = C.pt[aid] || {};
    if(staff){ pending++; let first = true;
      C.unsub.push(fbDb.collection(`clubs/${club}/ath/${aid}/data`).onSnapshot(snap=>{
        if(first){ first = false; snap.forEach(d=>{ const v = d.data().v; C.last[`p/${aid}/${d.id}`] = v; C.pt[aid][d.id] = parse(v); }); C.partLoaded[aid] = true; pending--;
          if(C.ready){ COMPOSED.forEach(k=>{ S[k] = composeKey(k); }); S = normalize(S); render(); } else done(); return; }
        snap.docChanges().forEach(ch=>{ if(ch.type==='removed' || ch.doc.metadata.hasPendingWrites) return; const path = `p/${aid}/${ch.doc.id}`, v = ch.doc.data().v; if(C.last[path]===v) return; C.last[path] = v; C.pt[aid][ch.doc.id] = parse(v); applyRemote(ch.doc.id, true); });
      }, onErr));
    } else {
      ATH_READ.forEach(k=>watchDoc(fbDb.doc(`clubs/${club}/ath/${aid}/data/${k}`), `p/${aid}/${k}`, v=>{ C.pt[aid][k] = parse(v); }));
      C.partLoaded[aid] = true;
    }
  };
  C.watchPart = watchPart;
  if(staff){
    pending++; let first = true;
    C.unsub.push(fbDb.collection(`clubs/${club}/data`).onSnapshot(snap=>{
      if(first){ first = false; snap.forEach(d=>{ const v = d.data().v; C.last['s/'+d.id] = v; C.sh[d.id] = parse(v); });
        (C.sh.athletes||[]).forEach(a=>watchPart(a.id)); pending--; started = true; done(); return; }
      snap.docChanges().forEach(ch=>{ if(ch.type==='removed' || ch.doc.metadata.hasPendingWrites) return; const path = 's/'+ch.doc.id, v = ch.doc.data().v; if(C.last[path]===v) return; C.last[path] = v; C.sh[ch.doc.id] = parse(v);
        if(ch.doc.id==='athletes') (C.sh.athletes||[]).forEach(a=>watchPart(a.id)); applyRemote(ch.doc.id, false); });
    }, onErr));
  } else {
    PUBLIC_KEYS.forEach(k=>watchDoc(fbDb.doc(`clubs/${club}/data/${k}`), 's/'+k, v=>{ C.sh[k] = parse(v); }));
    watchPart(member.athleteId); started = true; done();
  }
  C.unsub.push(fbDb.doc(`clubs/${club}/members/${C.user.uid}`).onSnapshot(m=>{
    if(!m.exists && C.ready){ C.ready=false; C.screen='removed'; cloudStop(); cloudRender(); }
    else if(m.exists){ C.member = m.data(); }
  }, ()=>{}));
}

/* save: write only what changed, a moment after the last edit */
function save(){ if(!C.ready) return; clearTimeout(C.timer); C.status='saving'; statusPaint(); C.timer = setTimeout(cloudFlush, 700); }
async function cloudFlush(){
  C.timer = null;
  if(!C.ready || !fbDb) return;
  try{ localStorage.setItem('tsc.seen.'+C.user.uid, S.seen||''); }catch(e){}
  if(isStaffRole(C.member.role)) stampPrivOwners();
  const staff = isStaffRole(C.member.role), D = decompose(S), writes = [];
  if(staff){
    (S.athletes||[]).forEach(a=>{ if(C.partLoaded[a.id]===undefined) C.watchPart(a.id); });
    Object.keys(D.sh).forEach(k=>{ const v = JSON.stringify(D.sh[k]===undefined ? null : D.sh[k]); const path = 's/'+k; if(C.last[path]===v) return; if(C.last[path]===undefined && isEmptyV(D.sh[k])) return; writes.push([path, `clubs/${C.club}/data/${k}`, v]); });
  }
  Object.keys(D.pt).forEach(aid=>{
    if(staff && !C.partLoaded[aid]) return;
    Object.keys(D.pt[aid]).forEach(k=>{ if(!staff && !ATH_WRITE.includes(k)) return; const val = D.pt[aid][k]; const v = JSON.stringify(val===undefined ? null : val); const path = `p/${aid}/${k}`;
      if(C.last[path]===v) return; if(C.last[path]===undefined && isEmptyV(val)) return; writes.push([path, `clubs/${C.club}/ath/${aid}/data/${k}`, v]); });
  });
  if(writes.some(w=>w[2].length > 900000)){ C.status='big'; C.err='Una sezione è diventata troppo grande per essere salvata.'; statusPaint(); return; }
  if(staff){ Object.keys(D.sh).forEach(k=>{ C.sh[k] = jclone(D.sh[k]); }); }
  Object.keys(D.pt).forEach(aid=>{ if(staff && !C.partLoaded[aid]) return; C.pt[aid] = C.pt[aid] || {}; Object.keys(D.pt[aid]).forEach(k=>{ if(!staff && !ATH_WRITE.includes(k)) return; C.pt[aid][k] = jclone(D.pt[aid][k]); }); });
  const prev = writes.map(w=>[w[0], C.last[w[0]]]);
  writes.forEach(w=>{ C.last[w[0]] = w[2]; });
  if(!writes.length){ if(C.status!=='big' && C.status!=='err') C.status='ok'; statusPaint(); if(staff && C.member.role==='coach') syncCodes(); return; }
  try{
    for(let i=0; i<writes.length; i+=400){ const b = fbDb.batch(); writes.slice(i,i+400).forEach(w=>b.set(fbDb.doc(w[1]), {v:w[2], at:firebase.firestore.FieldValue.serverTimestamp(), by:C.user.uid})); await b.commit(); }
    C.status='ok'; C.err='';
  }catch(e){ prev.forEach(([p,old])=>{ C.last[p] = old; }); C.status='err'; C.err=cErr(e); }
  statusPaint();
  if(staff && C.member.role==='coach') syncCodes();
}

/* ---------- athlete and parent accounts ---------- */
const PIN_LEN = 6;
const genPin6 = () => String(Math.floor(Math.random()*9e5)+1e5);
const loginEmail = (aid, role) => `${aid}.${role}@${C.club}.tsc-login.app`.toLowerCase();
const loginPw = pin => 'TSC' + pin;
const personalCode = a => { const g = grp(a.groupId); return (g && g.code && a.num) ? `${g.code}-${a.num}` : ''; };
function nextNum(gid, except){ const used = new Set(S.athletes.filter(x=>x.groupId===gid && x.id!==except && x.num).map(x=>x.num)); for(let i=1;i<100;i++){ const n = String(i).padStart(2,'0'); if(!used.has(n)) return n; } return String(Math.floor(Math.random()*900)+100); }
async function syncCodes(){
  if(!C.club) return;
  const want = {};
  S.groups.forEach(g=>{ if(!g.code) return; const nums = {}; S.athletes.forEach(a=>{ if(a.groupId===g.id && a.num && a.online) nums[a.num] = a.id; }); if(Object.keys(nums).length) want[g.code.toUpperCase()] = {club:C.club, nums}; });
  C.codes = C.codes || {};
  for(const code of Object.keys(want)){ const v = JSON.stringify(want[code]); if(C.codes[code]===v) continue;
    try{ await fbDb.doc('codes/'+code).set(want[code]); C.codes[code] = v; }
    catch(e){ toast(`Il codice gruppo ${code} è già usato da un altro circolo: crea un nuovo codice in "Gestisci gruppo".`); C.codes[code] = v; } }
  for(const code of Object.keys(C.codes)){ if(want[code]) continue; try{ await fbDb.doc('codes/'+code).delete(); }catch(e){} delete C.codes[code]; }
}
function secApp(){ const a = (firebase.apps||[]).find(x=>x.name==='sec') || firebase.initializeApp(FB_CONFIG, 'sec'); try{ a.auth().setPersistence(firebase.auth.Auth.Persistence.NONE); }catch(e){} return a; }
async function ensureAccount(a, role, pinField){
  const sec = secApp(), sa = sec.auth(), email = loginEmail(a.id, role), pw = loginPw(a[pinField]);
  let cred;
  try{ cred = await sa.createUserWithEmailAndPassword(email, pw); }
  catch(e){ if(e.code==='auth/email-already-in-use') cred = await sa.signInWithEmailAndPassword(email, pw); else throw e; }
  const uid = cred.user.uid;
  await sec.firestore().doc('users/'+uid).set({club:C.club, athleteId:a.id, role});
  await sa.signOut();
  await fbDb.doc(`clubs/${C.club}/members/${uid}`).set({role, athleteId:a.id, admin:false, name:a.name, at:firebase.firestore.FieldValue.serverTimestamp()});
  return uid;
}
async function flushNow(){ clearTimeout(C.timer); C.timer = null; await cloudFlush(); if(C.status==='err') throw new Error(C.err); }
async function changePin(aid, role, pinField){
  const newPin = genPin6(), a = ath(aid);
  if(!(a.online && a.online[role])){ a[pinField] = newPin; save(); return newPin; }
  const sec = secApp(), sa = sec.auth();
  const cred = await sa.signInWithEmailAndPassword(loginEmail(aid, role), loginPw(a[pinField]));
  await cred.user.updatePassword(loginPw(newPin)); await sa.signOut();
  ath(aid)[pinField] = newPin; await flushNow(); return newPin;
}
Object.assign(ACT, {
  newpin(k){ cBusyToast(async ()=>{ const p = await changePin(k, 'student', 'pin'); toast('Nuovo PIN atleta: '+p); }); },
  newppin(k){ cBusyToast(async ()=>{ const p = await changePin(k, 'parent', 'ppin'); toast('Nuovo PIN genitore: '+p); }); },
  actgroup(){ const gid = U.resGroup; if(!grp(gid)) return; const ids = S.athletes.filter(a=>a.groupId===gid).map(a=>a.id);
    cBusyToast(async ()=>{ let n = 0;
      for(let tries=0; tries<6; tries++){
        const g = grp(gid);
        if(!g.code || !/-[A-Z0-9]{3}$/.test(g.code)) g.code = genCode(gid===PRIV_ID ? 'PRV' : g.name);
        const cs = await fbDb.doc('codes/'+g.code.toUpperCase()).get();
        if(!cs.exists || cs.data().club===C.club) break; g.code = '';
      }
      for(const id of ids){
        for(const [role, f] of [['student','pin'],['parent','ppin']]){
          let a = ath(id); if(!a) break;
          if(!a.num) a.num = nextNum(gid, id);
          if(a.online && a.online[role]) continue;
          if(!a[f] || a[f].length < PIN_LEN) a[f] = genPin6();
          await flushNow();                       /* the PIN is stored before the account exists */
          const uidNew = await ensureAccount(ath(id), role, f);
          a = ath(id); a.online = Object.assign({}, a.online, {[role]: uidNew}); n++;
          await flushNow(); render();
        }
      }
      toast(n ? `Accessi attivati per ${ids.length} atleti` : 'Gli accessi erano già attivi');
    }); },
  copyacc(k){ const [aid, role] = k.split(':'); const a = ath(aid); const pin = role==='parent' ? a.ppin : a.pin;
    const t = `Tennis Smart Coach – accesso ${role==='parent'?'genitore di '+a.name:'atleta '+a.name}\nApri ${location.origin+location.pathname}\nTocca "Atleta o genitore", scegli "${role==='parent'?'Genitore':'Atleta'}" e inserisci:\nCodice: ${personalCode(a)}\nPIN: ${pin}`;
    try{ navigator.clipboard.writeText(t).then(()=>toast('Accesso copiato: incollalo su WhatsApp'), ()=>toast(t)); }catch(e){ toast(t); } }
});
function cBusyToast(fn){ if(C.busy) return; C.busy = true; render(); Promise.resolve().then(fn).catch(e=>toast(cErr(e))).finally(()=>{ C.busy = false; render(); }); }
function cloudPinsExtra(g){
  if(!C.club || C.member.role!=='coach' || !g) return '';
  const as = S.athletes.filter(a=>a.groupId===g.id); if(!as.length) return '';
  const missing = as.filter(a=>!(a.online && a.online.student && a.online.parent)).length;
  return `<div class="note">${missing ? `<b>Accessi online:</b> ${missing} ${missing===1?'atleta da attivare':'atleti da attivare'}. Ogni atleta e ogni genitore riceve un codice personale e un PIN di 6 cifre.` : '<b>Accessi online attivi</b> per tutto il gruppo.'}</div>
    ${missing ? `<button class="btn clay block" data-a="actgroup" ${C.busy?'disabled':''}>${C.busy?'Attivazione in corso…':'Attiva gli accessi online'}</button>` : ''}`;
}
function cloudAthExtra(a){
  if(!C.club || C.member.role!=='coach') return '';
  const code = personalCode(a), on = a.online && a.online.student && a.online.parent;
  return `<div class="row" style="gap:6px 10px;align-items:center"><span class="small muted">Codice</span><b class="pin" style="display:inline">${esc(code||'—')}</b>${on?'<span class="tstat ok">online</span>':'<span class="tstat wait">da attivare</span>'}</div>
    ${on?`<div class="row" style="gap:6px"><button class="chip" data-a="copyacc" data-k="${a.id}:student">Copia accesso atleta</button><button class="chip" data-a="copyacc" data-k="${a.id}:parent">Copia accesso genitore</button></div>`:''}`;
}

/* ---------- several children (or athletes) on the same phone ---------- */
const ACC_KEY = 'tsc.accts';
const accList = () => { try{ return JSON.parse(localStorage.getItem(ACC_KEY)||'[]'); }catch(e){ return []; } };
const accSave = l => { try{ localStorage.setItem(ACC_KEY, JSON.stringify(l)); }catch(e){} };
function accPut(a){ const l = accList().filter(x=>x.email!==a.email); const old = accList().find(x=>x.email===a.email) || {}; l.push(Object.assign(old, a)); accSave(l); }
function accDrop(email){ accSave(accList().filter(x=>x.email!==email)); }
function codeCheck(rawCode, pin){
  const raw = (rawCode||'').toUpperCase().replace(/\s+/g,''), i = raw.lastIndexOf('-');
  if(i<1) return 'Scrivi il codice personale completo, per esempio U12-AB3-01.';
  if(!/^\d{6}$/.test(pin||'')) return 'Il PIN è di 6 cifre.';
  return {group:raw.slice(0,i), num:raw.slice(i+1).padStart(2,'0'), code:raw, pin};
}
async function codeLogin(chk, role){
  const cs = await fbDb.doc('codes/'+chk.group).get();
  const aid = cs.exists ? (cs.data().nums||{})[chk.num] : null;
  if(!aid){ const e = new Error('code'); e.code = 'tsc/code'; throw e; }
  const email = `${aid}.${role}@${cs.data().club}.tsc-login.app`.toLowerCase();
  if(C.ready){ clearTimeout(C.timer); try{ await cloudFlush(); }catch(e){} }
  await fbAuth.signInWithEmailAndPassword(email, loginPw(chk.pin));
  accPut({email, pin:chk.pin, role, code:chk.code});
}
function accountsBar(){
  if(!C.ready || isStaffRole(C.member.role)) return '';
  const l = accList(), me_ = (C.user.email||'').toLowerCase(), many = l.length > 1;
  const chips = l.map((x,i)=>`<button class="chip" data-a="cswitch" data-k="${i}" aria-pressed="${x.email===me_}">${esc((x.name||x.code||'').split(' ')[0])}${x.role==='parent'&&!many?'':''}</button>`).join('');
  const form = U.addAcc ? `<section class="card"><h3>Aggiungi un altro figlio</h3>
      <p class="small muted">Usa il codice personale dell'altro figlio e il PIN genitore che ti ha dato il maestro. Poi passi dall'uno all'altro con un tocco.</p>
      <div class="seg" role="group"><button data-a="crole" data-k="parent" aria-pressed="${U.cRole!=='student'}">Genitore</button><button data-a="crole" data-k="student" aria-pressed="${U.cRole==='student'}">Atleta</button></div>
      <div class="field"><label for="c-code2">Codice personale</label><input id="c-code2" class="input inbig" autocapitalize="characters" placeholder="Es. U12-AB3-02" style="text-transform:uppercase"></div>
      <div class="field"><label for="c-pin2">PIN</label><input id="c-pin2" class="input inbig" type="password" inputmode="numeric" maxlength="6" placeholder="6 cifre"></div>
      <div class="row"><button class="btn clay" data-a="caddacc" style="flex:1" ${C.busy?'disabled':''}>${C.busy?'Accesso…':'Aggiungi'}</button><button class="btn ghost" data-a="caddtoggle">Annulla</button></div></section>` : '';
  return `<div class="row accbar" style="gap:6px">${many?chips:''}<button class="chip" data-a="caddtoggle">+ ${C.member.role==='parent'?'Altro figlio':'Altro atleta'}</button></div>${form}`;
}
Object.assign(ACT, {
  caddtoggle(){ U.addAcc = !U.addAcc; if(U.addAcc && !U.cRole) U.cRole = C.member.role; },
  caddacc(){ const chk = codeCheck(cv('c-code2'), cv('c-pin2')); if(typeof chk==='string'){ toast(chk); return; }
    const role = U.cRole==='student' ? 'student' : 'parent';
    cBusyToast(async ()=>{ U.addAcc = false; await codeLogin(chk, role); }); },
  cswitch(k){ const x = accList()[+k]; if(!x || x.email===(C.user.email||'').toLowerCase()) return;
    cBusyToast(async ()=>{ clearTimeout(C.timer); try{ await cloudFlush(); }catch(e){}
      try{ await fbAuth.signInWithEmailAndPassword(x.email, loginPw(x.pin)); }
      catch(e){ if(/credential|password/.test(e.code||'')){ accDrop(x.email); throw Object.assign(new Error('pin'), {code:'tsc/pinchanged'}); } throw e; } }); },
  cquick(k){ const x = accList()[+k]; if(!x) return; C.mode='ath';
    cBusy(async ()=>{ try{ await fbAuth.signInWithEmailAndPassword(x.email, loginPw(x.pin)); }
      catch(e){ if(/credential|password/.test(e.code||'')){ accDrop(x.email); throw Object.assign(new Error('pin'), {code:'tsc/pinchanged'}); } throw e; } }); }
});

/* hooks called by the app */
function cloudAthRemoved(aid){
  if(!C.club || !isStaffRole(C.member.role)) return;
  const a = ath(aid); const uids = a && a.online ? Object.values(a.online) : [];
  const b = fbDb.batch();
  uids.forEach(u=>b.delete(fbDb.doc(`clubs/${C.club}/members/${u}`)));
  Object.keys((C.pt||{})[aid]||{}).concat(ATH_READ).forEach(k=>b.delete(fbDb.doc(`clubs/${C.club}/ath/${aid}/data/${k}`)));
  ['notes','snotes','profilesPriv'].forEach(k=>b.delete(fbDb.doc(`clubs/${C.club}/ath/${aid}/data/${k}`)));
  b.commit().catch(()=>{});
  delete C.pt[aid];
  Object.keys(C.last).forEach(p=>{ if(p.startsWith(`p/${aid}/`)) delete C.last[p]; });
}
function cloudMoved(a){ if(!C.club) return; if(a.num || a.online) a.num = nextNum(a.groupId, a.id); }
Object.assign(ACT, {
  crole(k){ U.cRole = k; if(C.screen==='auth') U.cWho = k; },
  calogin(){
    const chk = codeCheck(cv('c-code'), cv('c-pin')); if(typeof chk==='string'){ C.err = chk; return; }
    const role = U.cRole==='parent' ? 'parent' : 'student';
    cBusy(()=>codeLogin(chk, role));
  }
});

function statusText(){
  if(!navigator.onLine) return ['off','Offline: le modifiche restano sul telefono e partono appena torna la rete'];
  if(C.status==='saving') return ['saving','Salvataggio…'];
  if(C.status==='err' || C.status==='big') return ['err', C.err || 'Errore di salvataggio'];
  return ['ok','Salvato online'];
}
function statusPaint(){ const el = document.getElementById('sync'); if(!el) return; const [k,t] = statusText(); el.className = 'sync '+k; el.querySelector('span').textContent = t; }
function syncBar(){ const [k,t] = statusText(); return `<div id="sync" class="sync ${k}" role="status"><i></i><span>${esc(t)}</span>${C.clubName?`<b>${esc(C.clubName)}</b>`:''}</div>` + accountsBar(); }

/* ---------- screens before the app: login, join, create ---------- */
function cloudView(){
  const hero = `<section class="hero"><div class="lines" aria-hidden="true"></div><span class="eyebrow" style="color:var(--clay)">Settore agonistico</span><h1>Tennis Smart Coach</h1><p>Programma, atleti, tornei e staff: tutto in un posto, online.</p></section>`;
  const err = C.err ? `<div class="err" role="alert">${esc(C.err)}</div>` : '';
  const info = C.info ? `<div class="note">${esc(C.info)}</div>` : '';
  let inner = '';
  if(C.screen==='loading') inner = `<section class="card"><p class="muted">Caricamento…</p></section>`;
  else if(C.screen==='nofb') inner = `<section class="card"><h2>Connessione assente</h2><p>Non riesco a raggiungere il servizio online. Controlla la connessione e ricarica la pagina.</p></section>`;
  else if(C.screen==='error') inner = `<section class="card"><h2>Qualcosa non ha funzionato</h2>${err}<div class="row"><button class="btn" data-a="cretry">Riprova</button><button class="btn ghost" data-a="clogout">Esci</button></div></section>`;
  else if(C.screen==='removed') inner = `<section class="card"><h2>Accesso rimosso</h2><p>Il tuo accesso a questo circolo è stato rimosso dal maestro responsabile.</p><button class="btn" data-a="clogout">Esci</button></section>`;
  else if(C.screen==='auth'){
    const m = C.mode, who = U.cWho;
    const quick = accList().length ? `<div class="field"><label>Già usati su questo telefono</label><div class="row" style="gap:6px">${accList().map((x,i)=>`<button class="chip" data-a="cquick" data-k="${i}">${esc((x.name||x.code||'').split(' ')[0])} · ${x.role==='parent'?'genitore':'atleta'}</button>`).join('')}</div></div>` : '';
    inner = `<section class="card">
      <h2 style="text-align:center">Chi sei?</h2>
      ${orbitHTML('cwho', who||null)}
      ${!who ? `<p class="small muted" style="text-align:center">Tocca chi sei per entrare. L'atleta è al centro: intorno a lui lavorano maestro, genitori e preparatori.</p>${quick}` : m==='ath' ? `<h3>Entra come ${who==='parent'?'genitore':'atleta'}</h3>
      <div class="field"><label for="c-code">Codice personale</label><input id="c-code" class="input inbig" value="${cval('c-code')}" autocapitalize="characters" autocomplete="username" placeholder="Es. U12-AB3-01" style="text-transform:uppercase;letter-spacing:.04em"></div>
      <div class="field"><label for="c-pin">PIN</label><input id="c-pin" class="input inbig" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="current-password" placeholder="6 cifre"></div>
      ${err}<button class="btn clay block" data-a="calogin" ${C.busy?'disabled':''}>Entra</button>
      ${quick}
      <p class="small muted">Codice e PIN te li dà il maestro. Il genitore ha lo stesso codice del figlio, con il suo PIN.</p>` : `
      <h3>Entra come ${esc((ROLE_LABEL[who]||'staff').toLowerCase())}</h3>
      ${m!=='reset' ? `<div class="seg" role="group" style="margin-top:4px"><button data-a="cmode" data-k="login" aria-pressed="${m==='login'}">Accedi</button><button data-a="cmode" data-k="signup" aria-pressed="${m==='signup'}">Crea account</button></div>` : ''}
      ${m==='reset' ? `<h2>Password dimenticata</h2><p class="small muted">Ti mandiamo un'email con il link per sceglierne una nuova.</p>` : ''}
      ${m==='signup' ? `<div class="field"><label for="c-name">Nome e cognome</label><input id="c-name" class="input" value="${cval('c-name')}" autocomplete="name" placeholder="Es. Mario Rossi"></div>` : ''}
      <div class="field"><label for="c-email">Email</label><input id="c-email" class="input" value="${cval('c-email')}" type="email" autocomplete="email" inputmode="email" placeholder="nome@esempio.it"></div>
      ${m!=='reset' ? `<div class="field"><label for="c-pw">Password</label><input id="c-pw" class="input" type="password" autocomplete="${m==='signup'?'new-password':'current-password'}" placeholder="${m==='signup'?'Almeno 6 caratteri':''}"></div>` : ''}
      ${err}${info}
      ${m==='login' ? `<button class="btn clay block" data-a="clogin" ${C.busy?'disabled':''}>Accedi</button><button class="btn ghost block" data-a="cmode" data-k="reset">Password dimenticata?</button>` : ''}
      ${m==='signup' ? `<button class="btn clay block" data-a="csignup" ${C.busy?'disabled':''}>Crea account</button><p class="small muted">Se un collega ti ha invitato, usa la stessa email dell'invito.</p>` : ''}
      ${m==='reset' ? `<button class="btn clay block" data-a="creset" ${C.busy?'disabled':''}>Mandami il link</button><button class="btn ghost block" data-a="cmode" data-k="login">‹ Torna all'accesso</button>` : ''}`}
    </section>`;
  }
  else if(C.screen==='join'){
    const I = C.invite || {};
    inner = `<section class="card"><span class="eyebrow">Invito</span><h2>${esc(I.clubName||'Circolo')}</h2>
      <p>Sei stato invitato come <b>${esc(ROLE_LABEL[I.role]||I.role)}</b>.</p>${err}
      <button class="btn clay block" data-a="cjoin" ${C.busy?'disabled':''}>Entra nel circolo</button>
      <button class="btn ghost block" data-a="clogout">Esci</button></section>`;
  }
  else if(C.screen==='create'){
    inner = `<section class="card"><h2>Benvenuto${C.user&&C.user.displayName?', '+esc(C.user.displayName.split(' ')[0]):''}</h2>
      <p class="small">Non risulti in nessun circolo. Se un collega ti deve invitare, chiedigli di usare questa email: <b>${esc(C.user?.email||'')}</b>, poi tocca "Controlla di nuovo".</p>
      <button class="btn ghost" data-a="cretry" style="align-self:flex-start">Controlla di nuovo</button></section>
    <section class="card"><h3>Oppure crea il tuo circolo</h3>
      <p class="small muted">Diventi il maestro responsabile: potrai invitare colleghi e preparatori.</p>
      <div class="field"><label for="c-club">Nome del circolo o del settore</label><input id="c-club" class="input" value="${cval('c-club')}" placeholder="Es. Settore agonistico TC Roma"></div>
      <div class="field"><label>Per iniziare</label><div class="seg" role="group"><button data-a="cstart" data-k="empty" aria-pressed="${U.cStart!=='example'}">Vuoto</button><button data-a="cstart" data-k="example" aria-pressed="${U.cStart==='example'}">Con dati di prova</button></div>
        <p class="small muted">${U.cStart==='example'?'Il gruppo di prova AGO 1 con atleti ed esempi, per provare tutte le funzioni.':'Un gruppo vuoto da riempire con i tuoi atleti. Puoi anche ripristinare una copia di sicurezza dalla versione di prova.'}</p></div>
      ${err}<button class="btn clay block" data-a="ccreate" ${C.busy?'disabled':''}>Crea il circolo</button></section>
    <button class="btn ghost" data-a="clogout" style="align-self:center">Esci</button>`;
  }
  return `<div class="login">${hero}${inner}</div>`;
}

async function cBusy(fn){ C.busy = true; C.err=''; C.info=''; cloudRender(); try{ await fn(); }catch(e){ C.err = cErr(e); } C.busy = false; cloudRender(); }
Object.assign(ACT, {
  cmode(k){ C.mode = k; C.err=''; C.info=''; if(k==='ath'){ if(!U.cWho || !['student','parent'].includes(U.cWho)) U.cWho = U.cRole==='parent'?'parent':'student'; } else if(!U.cWho || ['student','parent'].includes(U.cWho)) U.cWho = 'coach'; },
  cwho(k){ U.cWho = k; C.err=''; C.info=''; if(k==='student'||k==='parent'){ C.mode='ath'; U.cRole=k; } else if(C.mode==='ath') C.mode='login'; },
  cstart(k){ U.cStart = k; },
  cretry(){ if(C.user) cloudAfterLogin(); },
  clogout(){ if(C.user && C.member && !isStaffRole(C.member.role)) accDrop((C.user.email||'').toLowerCase()); U.addAcc=false; cloudStop(); fbAuth && fbAuth.signOut(); },
  clogin(){ const e = cv('c-email'), p = document.getElementById('c-pw')?.value || ''; cBusy(()=>fbAuth.signInWithEmailAndPassword(e, p)); },
  csignup(){ const n = cv('c-name'), e = cv('c-email'), p = document.getElementById('c-pw')?.value || ''; if(!n){ C.err='Scrivi nome e cognome.'; return; }
    cBusy(async ()=>{ const r = await fbAuth.createUserWithEmailAndPassword(e, p); try{ await r.user.updateProfile({displayName:n}); }catch(_){} }); },
  creset(){ const e = cv('c-email'); if(!e){ C.err='Scrivi la tua email.'; return; } cBusy(async ()=>{ await fbAuth.sendPasswordResetEmail(e); C.info='Email inviata: apri il link che trovi nella posta (controlla anche lo spam).'; C.mode='login'; }); },
  cjoin(){ const I = C.invite, u = C.user, email = (u.email||'').toLowerCase();
    cBusy(async ()=>{
      const b = fbDb.batch();
      b.set(fbDb.doc(`clubs/${I.club}/members/${u.uid}`), {role:I.role, admin:false, name:u.displayName||email, email, at:firebase.firestore.FieldValue.serverTimestamp()});
      b.set(fbDb.doc('users/'+u.uid), {club:I.club, email, name:u.displayName||''});
      await b.commit();
      try{ const d = fbDb.batch(); d.delete(fbDb.doc('invites/'+email)); d.delete(fbDb.doc(`clubs/${I.club}/invites/${email}`)); await d.commit(); }catch(_){}
      await cloudAfterLogin();
    }); },
  ccreate(){ const name = cv('c-club'); if(!name){ C.err='Scrivi il nome del circolo.'; return; } const u = C.user, email=(u.email||'').toLowerCase(), example = U.cStart==='example';
    cBusy(async ()=>{
      const ref = fbDb.collection('clubs').doc();
      await ref.set({name, owner:u.uid, at:firebase.firestore.FieldValue.serverTimestamp()});
      const b = fbDb.batch();
      b.set(fbDb.doc(`clubs/${ref.id}/members/${u.uid}`), {role:'coach', admin:true, name:u.displayName||email, email, at:firebase.firestore.FieldValue.serverTimestamp()});
      b.set(fbDb.doc('users/'+u.uid), {club:ref.id, email, name:u.displayName||''});
      await b.commit();
      const st = example ? normalize(seed()) : emptyState(); const d = fbDb.batch();
      Object.keys(st).forEach(k=>{ if(LOCAL_KEYS.has(k)) return; d.set(fbDb.doc(`clubs/${ref.id}/data/${k}`), {v:JSON.stringify(st[k]===undefined?null:st[k]), at:firebase.firestore.FieldValue.serverTimestamp(), by:u.uid}); });
      await d.commit();
      await cloudAfterLogin();
    }); },
  /* staff management (admin) */
  staffopen(){ U.homeView='staff'; C.staff=null; C.invites=null; cloudLoadStaff(); window.scrollTo(0,0); },
  staffinvite(){ const email = cv('st-email').toLowerCase(), role = document.getElementById('st-role')?.value || 'coach';
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ toast('Scrivi un\'email valida'); return; }
    const data = {club:C.club, clubName:C.clubName, role, by:C.user.uid, at:firebase.firestore.FieldValue.serverTimestamp()};
    const b = fbDb.batch(); b.set(fbDb.doc('invites/'+email), data); b.set(fbDb.doc(`clubs/${C.club}/invites/${email}`), data);
    b.commit().then(()=>{ toast('Invito creato'); cloudLoadStaff(); }).catch(e=>toast(cErr(e))); },
  staffuninvite(k){ const b = fbDb.batch(); b.delete(fbDb.doc('invites/'+k)); b.delete(fbDb.doc(`clubs/${C.club}/invites/${k}`)); b.commit().then(()=>{ toast('Invito annullato'); cloudLoadStaff(); }).catch(e=>toast(cErr(e))); },
  cshare(k){ const [aid, u] = k.split(':'); const a = ath(aid); if(!a) return; const sh = new Set(a.share||[]); if(sh.has(u)) sh.delete(u); else sh.add(u); a.share = [...sh]; save(); toast(sh.has(u) ? 'Condiviso' : 'Non più condiviso'); },
  caccall(k){ S.access = S.access || {}; S.access[k] = {all:true}; save(); },
  caccg(k){ const [uid, gid] = k.split(':'); S.access = S.access || {}; const cur = S.access[uid]; const sel = new Set(cur && cur.all===false ? (cur.groups||[]) : []); if(sel.has(gid)) sel.delete(gid); else sel.add(gid); S.access[uid] = {all:false, groups:[...sel]}; save(); },
  staffremove(k){ fbDb.doc(`clubs/${C.club}/members/${k}`).delete().then(()=>{ U.confirm=null; toast('Accesso rimosso'); cloudLoadStaff(); }).catch(e=>toast(cErr(e))); },
  staffcopy(){ const t = `Ciao! Ti ho invitato su Tennis Smart Coach. Apri ${location.origin+location.pathname} , tocca "Crea account" e usa questa email.`; try{ navigator.clipboard.writeText(t).then(()=>toast('Messaggio copiato'), ()=>toast(t)); }catch(e){ toast(t); } }
});
async function cloudLoadStaff(){
  try{
    const [ms, is] = await Promise.all([fbDb.collection(`clubs/${C.club}/members`).get(), C.member.admin ? fbDb.collection(`clubs/${C.club}/invites`).get() : Promise.resolve(null)]);
    C.staff = []; ms.forEach(d=>{ const m = d.data(); if(isStaffRole(m.role)) C.staff.push({uid:d.id, ...m}); });
    C.invites = []; if(is) is.forEach(d=>C.invites.push({email:d.id, ...d.data()}));
  }catch(e){ C.staff = []; C.invites = []; toast(cErr(e)); }
  render();
}
/* ---------- who sees which groups (app level) ----------
   S.access = {uid: {all:true} | {all:false, groups:[gid…]}}  set by the club admin.
   Private-lesson athletes (group PRIV_ID) are seen only by the coach who teaches them (a.owner; legacy = club owner). */
const VIEW_ARR = {results:x=>x.athleteId, forms:x=>x.athleteId, well:x=>x.athleteId, tests:x=>x.athleteId, notes:x=>x.athleteId, snotes:x=>x.athleteId, massign:x=>x.athleteId, fres:x=>x.athleteId, matches:m=>m&&m.a&&m.a.id};
const privOwner = a => a.owner || C.ownerUid;
function myAccess(){
  if(!C.ready || !C.member || !C.user || !isStaffRole(C.member.role) || !S || !Array.isArray(S.athletes)) return null;
  const acc = (S.access||{})[C.user.uid], all = !!C.member.admin || !acc || acc.all!==false;
  const groups = new Set(all ? [] : (acc.groups||[]));
  if(!all){ const rg = new Set(((C.sh && C.sh.groups) || []).map(g=>g.id)); (S.groups||[]).forEach(g=>{ if(!rg.has(g.id)) groups.add(g.id); }); }
  const coach = C.member.role==='coach', uid = C.user.uid;
  return {all, groups, uid, coach, shared: !coach && S.athletes.some(a=>a.groupId===PRIV_ID && (a.share||[]).includes(uid))};
}
const grpVis = (g, A) => g.id===PRIV_ID ? (A.coach || A.shared) : (A.all || A.groups.has(g.id));
const athVis = (a, A) => a.groupId===PRIV_ID ? (A.coach ? privOwner(a)===A.uid : (a.share||[]).includes(A.uid)) : (A.all || A.groups.has(a.groupId));
function viewFilterOn(){
  const A = myAccess(); if(!A) return null;
  const vis = new Set(S.athletes.filter(a=>athVis(a,A)).map(a=>a.id));
  if(vis.size===S.athletes.length && (S.groups||[]).every(g=>grpVis(g,A))) return null;
  const keep = {athletes:S.athletes, groups:S.groups};
  S.athletes = S.athletes.filter(a=>vis.has(a.id)); S.groups = (S.groups||[]).filter(g=>grpVis(g,A));
  Object.entries(VIEW_ARR).forEach(([k,f])=>{ if(Array.isArray(S[k])){ keep[k] = S[k]; S[k] = S[k].filter(x=>vis.has(f(x))); } });
  return keep;
}
function viewFilterOff(keep){ if(keep) Object.assign(S, keep); }
function stampPrivOwners(){
  const acc = (S.access||{})[C.user.uid];
  if(acc && acc.all===false && !C.member.admin){ const rg = new Set(((C.sh && C.sh.groups) || []).map(g=>g.id)), mine = new Set(acc.groups||[]);
    (S.groups||[]).forEach(g=>{ if(g.id!==PRIV_ID && !rg.has(g.id) && !mine.has(g.id)){ mine.add(g.id); } }); acc.groups = [...mine]; }
  const remote = new Set(((C.sh && C.sh.athletes) || []).map(a=>a.id));
  (S.athletes||[]).forEach(a=>{ if(a.groupId===PRIV_ID && !a.owner) a.owner = remote.has(a.id) ? (C.ownerUid || C.user.uid) : C.user.uid; });
}
function cloudShareCard(a){
  if(!a || a.groupId!==PRIV_ID || !C.ready || !C.member || C.member.role!=='coach' || privOwner(a)!==C.user.uid) return '';
  if(!C.staff && !C.staffLoading){ C.staffLoading = true; cloudLoadStaff().finally(()=>{ C.staffLoading = false; }); }
  const preps = (C.staff||[]).filter(m=>m.role==='fit'||m.role==='mind'), sh = a.share||[];
  return `<section class="card"><h3>Condividi con un preparatore</h3><p class="small muted">Gli allievi privati li vedi solo tu. Tocca i preparatori che devono seguire anche ${esc(a.name)}: lo troveranno tra i loro atleti.</p>
    ${!C.staff ? '<p class="small muted">Caricamento…</p>' : preps.length ? `<div class="chips">${preps.map(m=>`<button class="chip" data-a="cshare" data-k="${a.id}:${m.uid}" aria-pressed="${sh.includes(m.uid)}">${esc(m.name||m.email)} · ${m.role==='fit'?'atletico':'mentale'}</button>`).join('')}</div>` : '<p class="small muted">Nel circolo non ci sono ancora preparatori: li invita il responsabile da Staff e accessi.</p>'}</section>`;
}
function accessCard(m){
  const acc = (S.access||{})[m.uid], all = !acc || acc.all!==false, sel = new Set(all ? [] : (acc.groups||[]));
  const gs = (S.groups||[]).filter(g=>g.id!==PRIV_ID);
  return `<div style="display:flex;flex-direction:column;gap:6px;padding:8px 0 4px"><span class="small muted">Gruppi che vede</span>
    <div class="chips"><button class="chip" data-a="caccall" data-k="${m.uid}" aria-pressed="${all}">Tutti i gruppi</button>${gs.map(g=>`<button class="chip" data-a="caccg" data-k="${m.uid}:${g.id}" aria-pressed="${!all && sel.has(g.id)}">${esc(g.name)}</button>`).join('')}</div>
    ${!all && !sel.size ? '<span class="small" style="color:var(--ko)">Nessun gruppo: non vede nessun atleta.</span>' : ''}</div>`;
}
function staffView(){
  const admin = C.member && C.member.admin;
  return `<button class="btn ghost" data-a="homeback" style="align-self:flex-start">‹ Home</button>
    <h1>Staff e accessi</h1>
    <section class="card"><h3>Chi è nel circolo</h3>${!C.staff?'<p class="muted small">Caricamento…</p>':`<div class="list">${C.staff.map(m=>`<div class="row between" style="flex-wrap:nowrap"><span><b>${esc(m.name||m.email)}</b><br><span class="small muted">${esc(ROLE_LABEL[m.role]||m.role)}${m.admin?' · responsabile':''} · ${esc(m.email||'')}</span></span>${admin && m.uid!==C.user.uid ? (U.confirm==='sm:'+m.uid?`<span class="row"><button class="btn danger" data-a="staffremove" data-k="${m.uid}">Rimuovi</button><button class="btn ghost" data-a="nodel">No</button></span>`:`<button class="chip" data-a="askdel" data-k="sm:${m.uid}">Rimuovi</button>`) : ''}</div>${admin && !m.admin ? accessCard(m) : ''}`).join('<hr style="border:0;border-top:1px solid var(--line);margin:4px 0">')}</div><p class="small muted">${admin?'Scegli quali gruppi vede ogni collega. ':''}Le lezioni private le vede solo il maestro che le fa.</p>`}</section>
    ${admin?`<section class="card"><h3>Invita un collega</h3>
      <div class="field"><label for="st-email">Email del collega</label><input id="st-email" class="input" type="email" inputmode="email" placeholder="collega@esempio.it"></div>
      <div class="field"><label for="st-role">Ruolo</label><select id="st-role" class="input"><option value="coach">Maestro</option><option value="fit">Preparatore atletico</option><option value="mind">Preparatore mentale</option></select></div>
      <button class="btn clay block" data-a="staffinvite">Crea l'invito</button>
      <p class="small muted">Poi manda al collega il link dell'app: crea l'account con la stessa email ed entra direttamente nel circolo.</p>
      <button class="btn ghost" data-a="staffcopy" style="align-self:flex-start">Copia il messaggio da mandare</button></section>
    ${C.invites && C.invites.length?`<section class="card"><h3>Inviti in attesa</h3><div class="list">${C.invites.map(i=>`<div class="row between" style="flex-wrap:nowrap"><span><b>${esc(i.email)}</b><br><span class="small muted">${esc(ROLE_LABEL[i.role]||i.role)}</span></span><button class="chip" data-a="staffuninvite" data-k="${esc(i.email)}">Annulla</button></div>`).join('')}</div></section>`:''}`:'<p class="small muted">Solo il maestro responsabile può invitare o rimuovere persone.</p>'}`;
}
