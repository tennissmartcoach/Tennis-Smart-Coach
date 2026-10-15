// Minimal in-memory stand-in for the Firebase compat SDK, for local tests only.
(function(){
  const LS = 'mockfs';
  let store = {}; try{ store = JSON.parse(localStorage.getItem(LS)||'{}'); }catch(e){}
  let users = {}; try{ users = JSON.parse(localStorage.getItem(LS+'.users')||'{}'); }catch(e){}
  const persist = () => { localStorage.setItem(LS, JSON.stringify(store)); localStorage.setItem(LS+'.users', JSON.stringify(users)); };
  const listeners = []; // {kind:'col'|'doc', path, cb}
  window.__mockLog = [];
  const clone = v => JSON.parse(JSON.stringify(v));
  const SERVER_TS = {__ts:true};
  const fix = o => { const r = {}; for(const k in o){ r[k] = o[k] && o[k].__ts ? new Date().toISOString() : o[k]; } return r; };
  function snapDoc(path){ const ex = path in store; return {id:path.split('/').pop(), exists:ex, data:()=>ex?clone(store[path]):undefined, metadata:{hasPendingWrites:false}}; }
  function colDocs(col){ return Object.keys(store).filter(p=>p.startsWith(col+'/') && p.slice(col.length+1).indexOf('/')<0).map(snapDoc); }
  function notify(changed){
    listeners.forEach(l=>{
      if(l.kind==='col'){ const hits = changed.filter(p=>p.startsWith(l.path+'/') && p.slice(l.path.length+1).indexOf('/')<0); if(!hits.length) return; const docs = colDocs(l.path);
        l.cb({forEach:f=>docs.forEach(f), docChanges:()=>hits.filter(p=>p in store).map(p=>({type:'modified', doc:snapDoc(p)}))}); }
      else if(changed.includes(l.path)) l.cb(snapDoc(l.path));
    });
  }
  function write(ops){ const changed = []; ops.forEach(([t,p,d])=>{ window.__mockLog.push(t+' '+p); if(t==='set') store[p] = fix(clone(d)); else delete store[p]; changed.push(p); }); persist(); setTimeout(()=>notify(changed), 0); return Promise.resolve(); }
  window.__mockRemoteSet = (p, d) => write([['set', p, d]]);
  window.__mockStore = () => store;
  function docRef(path){ return {
    path, id: path.split('/').pop(),
    get: () => Promise.resolve(snapDoc(path)),
    set: d => write([['set', path, d]]),
    delete: () => write([['del', path]]),
    onSnapshot: (cb) => { const l = {kind:'doc', path, cb}; listeners.push(l); setTimeout(()=>cb(snapDoc(path)),0); return ()=>{ const i = listeners.indexOf(l); if(i>=0) listeners.splice(i,1); }; }
  }; }
  function colRef(path){ return {
    doc: id => docRef(path+'/'+(id || Math.random().toString(36).slice(2,12))),
    get: () => Promise.resolve({forEach:f=>colDocs(path).forEach(f)}),
    onSnapshot: (cb) => { const l = {kind:'col', path, cb}; listeners.push(l); setTimeout(()=>{ const docs = colDocs(path); cb({forEach:f=>docs.forEach(f), docChanges:()=>docs.map(d=>({type:'added', doc:d}))}); },0); return ()=>{ const i = listeners.indexOf(l); if(i>=0) listeners.splice(i,1); }; }
  }; }
  const db = { doc: docRef, collection: colRef, enablePersistence: () => Promise.resolve(), batch: () => { const ops = []; return { set:(r,d)=>ops.push(['set', r.path, d]), delete:r=>ops.push(['del', r.path]), commit:()=>write(ops) }; } };
  function mkAuth(name){
    const SK = LS+'.cur.'+name;
    let cur = null; if(name==='main'){ try{ cur = JSON.parse(sessionStorage.getItem(SK)||'null'); }catch(e){} }
    const authCbs = [];
    const mkUser = u => u ? Object.assign({}, u, {
      updateProfile: p => { Object.assign(u, p); users[u.email].displayName = p.displayName; persist(); return Promise.resolve(); },
      updatePassword: pw => { users[u.email].pw = pw; persist(); return Promise.resolve(); } }) : null;
    const setCur = u => { cur = u; if(name==='main') sessionStorage.setItem(SK, JSON.stringify(u)); setTimeout(()=>authCbs.forEach(f=>f(mkUser(cur))),0); };
    const err = code => { const e = new Error(code); e.code = code; return Promise.reject(e); };
    return { languageCode:'', setPersistence: () => Promise.resolve(),
      get currentUser(){ return mkUser(cur); },
      onAuthStateChanged: f => { authCbs.push(f); setTimeout(()=>f(mkUser(cur)),0); },
      signInWithEmailAndPassword: (e,p) => { const u = users[(e||'').toLowerCase()]; if(!u || u.pw!==p) return err('auth/invalid-credential'); setCur({uid:u.uid, email:u.email, displayName:u.displayName}); return Promise.resolve({user:mkUser(cur)}); },
      createUserWithEmailAndPassword: (e,p) => { e=(e||'').toLowerCase(); if(!/@/.test(e)) return err('auth/invalid-email'); if((p||'').length<6) return err('auth/weak-password'); if(users[e]) return err('auth/email-already-in-use'); users[e] = {uid:'u'+Math.random().toString(36).slice(2,8), email:e, pw:p, displayName:''}; persist(); setCur({uid:users[e].uid, email:e, displayName:''}); return Promise.resolve({user:mkUser(cur)}); },
      sendPasswordResetEmail: () => Promise.resolve(),
      signOut: () => { setCur(null); return Promise.resolve(); }
    };
  }
  const firestoreFn = () => db; firestoreFn.FieldValue = { serverTimestamp: () => SERVER_TS };
  const apps = [];
  const mkApp = name => { const au = mkAuth(name); const ap = {name, auth: () => au, firestore: () => db}; apps.push(ap); return ap; };
  const main = mkApp('[DEFAULT]'.replace('[DEFAULT]','main'));
  const authFn = () => main.auth(); authFn.Auth = {Persistence:{NONE:'none', LOCAL:'local'}};
  window.__mockUsers = () => users;
  window.firebase = { apps, initializeApp: (cfg, name) => name ? mkApp(name) : main, auth: authFn, firestore: firestoreFn };
})();
