/* Button actions (ACT), event listeners and app start: must be loaded last */
/* ---------- actions ---------- */
function genCode(name){ const base = (name.match(/U\d{2}/i)?.[0] || name.replace(/[^A-Za-z]/g,'').slice(0,3) || 'GRP').toUpperCase(); let c; do { c = base + '-' + Math.random().toString(36).slice(2,5).toUpperCase(); } while(S.groups.some(g=>g.code===c)); return c; }
const genPin = () => String(Math.floor(1000+Math.random()*9000));
const ACT = {
  role(k){ U.err=''; U.role=k; if(k==='fit'||k==='mind'){ S.session={role:k}; U.tab=null; U.setup=null; save(); return; } if(k==='coach'){ S.session={role:'coach'}; U.tab=null; U.setup=null; save(); return; } U.step='name'; },
  back(){ U.err=''; U.pin=''; U.step='role'; },
  code(){ const v = document.getElementById('f-code').value.trim().toUpperCase(); U.code=v; const g = S.groups.find(x=>x.code===v); if(!g){ U.err='Codice non trovato. Controlla di averlo scritto giusto, con il trattino.'; return; } U.err=''; U.group=g.id; U.step='name'; },
  pickname(k){ S.session={role:U.role, athleteId:k}; U.tab=null; U.step='role'; U.setup=null; save(); },
  key(k){ if(k==='del'){ U.pin=U.pin.slice(0,-1); return; } if(U.pin.length>=4) return; U.pin+=k; U.err='';
    if(U.pin.length===4){ const a = ath(U.athlete); if((U.role==='parent'?a.ppin:a.pin)===U.pin){ S.session={role:U.role, athleteId:a.id}; U.tab=null; U.step='role'; U.pin=''; U.setup=null; save(); } else { U.err='PIN sbagliato. Riprova o chiedi al maestro.'; U.pin=''; } } },
  coachin(){ const v = document.getElementById('f-coach').value.trim().toUpperCase(); if(v!==S.coachCode.toUpperCase()){ U.err='Codice maestro sbagliato.'; return; } S.session={role:'coach'}; U.tab=null; U.err=''; U.step='role'; U.setup=null; save(); },
  logout(){ if(HOOK.logout){ HOOK.logout(); return; } S.session=null; Object.assign(U,{athMode:null,testAth:null,privOpen:null,profEdit:null,form:null,testWeek:null,tab:null,step:'role',weekOpen:null,athleteOpen:null,matchOpen:null,setup:null,day:null,cnt:{ok:0,tot:0},confirm:null}); save(); },
  tab(k){ if(k==='plan' && String(U.planGroup||'').startsWith('pp_')){ U.planGroup=null; U.oWeek=null; U.oDay=null; } U.tab=k; if(k==='fprog'){ U.fpWeek=null; } if(k==='mprog'){ U.mcOpen=null; } if(k==='mschede'){ U.mEd=null; U.mfOpen=null; U.biEd=null; U.biOpen=null; U.mrAth=''; } U.mfill=null; if(k==='prog'){ U.athTab=null; U.tOpen=null; } U.confirm=null; U.form=null; U.testAth=null; U.finalView=null; if(k==='home'||k==='fhome'||k==='mhome'){ U.homeView=null; } if(k==='tour'||k==='stours'){ U.tWeek=null; U.tOpen=null; U.tNew=null; U.mEdit=null; } if(k==='plan'){ U.ed=null; U.pick=null; U.oWeek=null; U.oDay=null; } if(k!=='ath') U.athleteOpen=null; U.privOpen=null; U.athPriv=null; U.newAth=false; U.profEdit=null; window.scrollTo(0,0); },
  day(k){ U.day=+k; U.cnt={ok:0,tot:0}; U.timer=null; clearInterval(U.tick); },
  cnt(k){ const pv=PV(grp(me().groupId).week,U.day); if(U.cnt.tot>=pv.n) return; U.cnt.tot++; if(k==='1') U.cnt.ok++; U.cnt.hist=(U.cnt.hist||[]).concat(k==='1'); if(navigator.vibrate) try{navigator.vibrate(15)}catch(e){} },
  cntmin(){ U.cnt.ok++; U.cnt.tot++; U.cnt.hist=(U.cnt.hist||[]).concat(true); if(navigator.vibrate) try{navigator.vibrate(15)}catch(e){} },
  timer(){ U.cnt={ok:0,tot:0}; U.timer=Date.now()+60000; clearInterval(U.tick); U.tick=setInterval(()=>{ const el=document.getElementById('timer'); const left=Math.max(0,Math.ceil((U.timer-Date.now())/1000)); if(el) el.textContent = left?left+'"':'Tempo!'; if(!left){ clearInterval(U.tick); if(navigator.vibrate) try{navigator.vibrate([200,100,200])}catch(e){} toast('Tempo! Ora salva'); } },250); },
  cntundo(){ const h=U.cnt.hist||[]; if(!h.length) return; const l=h.pop(); U.cnt.tot--; if(l) U.cnt.ok--; },
  cntsave(){ const a=me(), g=grp(a.groupId), pv=PV(g.week,U.day), mv=document.getElementById('f-manual')?.value.trim();
    let ok = U.cnt.ok, tot = pv.k==='su' ? pv.n : null;
    if(!mv){ toast('Scrivi il tuo risultato'); return; }
    ok = Math.max(0, Math.round(+mv)); if(isNaN(ok)){ toast('Scrivi un numero'); return; } if(pv.k==='su' && ok>pv.n){ toast(`Al massimo ${pv.n}`); return; }
    S.results.push({id:uid(), athleteId:a.id, groupId:g.id, week:g.week, day:U.day, kind:pv.k, ok, tot, date:new Date().toISOString()});
    U.cnt={ok:0,tot:0}; U.timer=null; clearInterval(U.tick); save(); toast('Prova salvata'); },
  openweek(k){ U.weekOpen=+k; U.dayOpen=null; window.scrollTo(0,0); }, closeweek(){ U.weekOpen=null; U.dayOpen=null; },
  setweek(k){ const g=grp(document.getElementById('f-setweek').value); g.week=+k; save(); toast(g.name+': settimana '+k); },
  resgroup(k){ U.resGroup=k; U.resWeek=grp(k).week; }, resweek(k){ U.resWeek=Math.min(12,Math.max(1,U.resWeek+ +k)); },
  openath(k,d){ U.athleteOpen=k; U.athTab=d&&d.t?d.t:null; U.showInbox=false; S.seen=new Date().toISOString(); save(); window.scrollTo(0,0); },
  lessonopen(k){ U.lessonUndo=[]; U.lessonEd=k; U.planGroup=k; U.tab='plan'; window.scrollTo(0,0); },
  lessonclose(){ U.lessonEd=null; U.lessonUndo=[]; },
  phundo(){ const g=grp(U.lessonEd), st=U.lessonUndo||[]; if(!g || !st.length) return; g.lesson=st.pop(); save(); toast('Modifica annullata'); },
  lessondur(k){ lessonSnap(); const g=grp(U.lessonEd); if(!g) return; scalePhases(ensureLesson(g), +k); save(); },
  phup(k){ lessonSnap(); const L=ensureLesson(grp(U.lessonEd)), i=+k; [L.phases[i-1],L.phases[i]]=[L.phases[i],L.phases[i-1]]; save(); },
  phdel(k){ lessonSnap(); const L=ensureLesson(grp(U.lessonEd)); if(L.phases.filter(p=>!p.pause).length<=1 && !L.phases[+k].pause){ toast('Serve almeno una fase'); return; } L.phases.splice(+k,1); save(); },
  phadd(k){ lessonSnap(); const L=ensureLesson(grp(U.lessonEd)); L.phases.push(k==='pause'?{k:'p'+uid().slice(0,4), n:'Pausa', m:3, pause:true}:{k:'x'+uid().slice(0,5), n:'Nuova fase', m:10}); save(); },
  phfit(){ lessonSnap(); const L=ensureLesson(grp(U.lessonEd)); scalePhases(L, L.dur); save(); },
  lessoncopy(k){ const from=ensureLesson(grp(U.lessonEd)), to=grp(k); to.lesson=JSON.parse(JSON.stringify(from)); save(); toast('Struttura copiata su '+to.name); },
  setfreq(k){ const g=grp(U.planGroup); if(!g) return; g.freq=+k; save(); toast(`${k} allenamenti a settimana per ${g.name}`); },
  setprog(k){ const g=grp(U.planGroup); if(!g) return; g.prog=k; if(k==='own') ownOf(g.id); U.oWeek=null; U.oDay=null; save(); toast(k==='own'?'Programma personale per '+g.name:'Le 12 settimane per '+g.name); },
  oweek(k){ U.oWeek = k?+k:null; U.oDay=null; U.confirm=null; window.scrollTo(0,0); },
  oday(k){ U.oDay = k===''?null:+k; window.scrollTo(0,0); },
  owadd(){ const o=ownOf(U.planGroup); o.weeks.push(blankWeek()); save(); U.oWeek=o.weeks.length; U.oDay=null; window.scrollTo(0,0); },
  owcopy(){ const o=ownOf(U.planGroup); o.weeks.push(JSON.parse(JSON.stringify(o.weeks[U.oWeek-1]))); save(); U.oWeek=o.weeks.length; toast('Settimana duplicata'); window.scrollTo(0,0); },
  owdel(){ const o=ownOf(U.planGroup); o.weeks.splice(U.oWeek-1,1); if(o.cur>o.weeks.length) o.cur=o.weeks.length; U.oWeek=null; U.confirm=null; save(); toast('Settimana eliminata'); },
  owcur(){ ownOf(U.planGroup).cur=U.oWeek; save(); toast('Settimana in corso aggiornata'); },
  oedit(k){ const g=grp(U.planGroup), d=ownOf(U.planGroup).weeks[U.oWeek-1].days[U.oDay], i=+k, e=exById(d.ex[i]); if(!e) return; U.ed=exToEd(e, {own:U.planGroup, w:U.oWeek, d:U.oDay, ph:ownPh(g,d,i), i}); U.ed.lib=!e.hidden; if(e.custom && e.hidden){ U.ed.id=e.id; } window.scrollTo(0,0); },
  onewex(k){ const g=grp(U.planGroup); U.ed={id:null, ph:k||mapPh(g,null), t:'', chip:'', x:'', els:[], vis:null, from:null, tool:'A', pend:null, ctx:{own:U.planGroup, w:U.oWeek, d:U.oDay, ph:k||mapPh(g,null), i:null}, lib:true}; window.scrollTo(0,0); },
  opick(k){ U.pick={own:U.planGroup, w:U.oWeek, d:U.oDay, ph:k||'', i:null}; U.planMode='lib'; U.libPh='all'; U.libOpen=null; U.libQ=''; window.scrollTo(0,0); },
  odrop(k){ const d=ownSync(grp(U.planGroup), ownOf(U.planGroup).weeks[U.oWeek-1].days[U.oDay]); d.ex.splice(+k,1); d.exPh.splice(+k,1); save(); },
  oup(k){ const d=ownSync(grp(U.planGroup), ownOf(U.planGroup).weeks[U.oWeek-1].days[U.oDay]), j=+k; let i=j-1; while(i>=0 && d.exPh[i]!==d.exPh[j]) i--; if(i<0){ toast('È già il primo della fase'); return; } [d.ex[i],d.ex[j]]=[d.ex[j],d.ex[i]]; [d.exPh[i],d.exPh[j]]=[d.exPh[j],d.exPh[i]]; save(); },
  tnewat(k){ const [y,n,alt]=k.split(':').map(Number); U.tPaste=''; U.tParsed=''; U.tNew={name:'', date:weekMonday(y,n), end:'', alt:alt===1, kind:'', deadline:'', info:''}; window.scrollTo(0,0); },
  ftmode(k){ U.ftMode=k; U.ftOpen=null; U.ftNew=null; },
  ftnew(){ U.ftNew={l:'', u:'', better:'high', x:''}; },
  ftcancel(){ U.ftNew=null; },
  ftsugg(k){ const x=FT_SUGG[+k]; Object.assign(U.ftNew,{l:x[0], u:x[1], better:x[2]}); },
  ftbetter(k){ U.ftNew.better=k; },
  ftsave(){ const N=U.ftNew; if(!N.l.trim()){ toast('Scrivi il nome del test'); return; } S.ftests=S.ftests||[]; const t={id:uid(), l:N.l.trim(), u:N.u.trim()||'', better:N.better, x:(N.x||'').trim()}; S.ftests.push(t); save(); U.ftNew=null; U.ftOpen=t.id; toast('Test creato'); },
  ftopen(k){ U.ftOpen=k; U.confirm=null; window.scrollTo(0,0); }, ftclose(){ U.ftOpen=null; U.confirm=null; },
  ftrec(){ const t=ftById(U.ftOpen), d=U.ftDate||todayISO(); S.fres=S.fres||[]; let n=0, bad=false;
    S.athletes.filter(a=>a.groupId===U.ftGroup).forEach(a=>{ const el=document.getElementById('ft-in-'+a.id); if(!el) return; const raw=el.value.trim().replace(',','.'); S.fres=S.fres.filter(r=>!(r.testId===t.id && r.athleteId===a.id && r.date===d)); if(raw===''){ return; } const v=+raw; if(isNaN(v)){ bad=true; return; } S.fres.push({id:uid(), testId:t.id, athleteId:a.id, date:d, v}); n++; });
    save(); toast(bad?'Alcuni valori non sono numeri':`Salvati ${n} risultati`); },
  ftdel(){ S.ftests=(S.ftests||[]).filter(t=>t.id!==U.ftOpen); S.fres=(S.fres||[]).filter(r=>r.testId!==U.ftOpen); U.ftOpen=null; U.confirm=null; save(); toast('Test eliminato'); },
  fpopen(k){ const [g,n]=k.split(':'); U.tab='fprog'; U.fpGroup=g; U.fpWeek=+n; window.scrollTo(0,0); },
  fpweek(k){ U.fpWeek = k?+k:null; U.confirm=null; window.scrollTo(0,0); },
  fpadd(){ const o=fitProgOf(U.fpGroup); o.weeks.push(blankFitWeek()); save(); U.fpWeek=o.weeks.length; window.scrollTo(0,0); },
  fpcopy(){ const o=fitProgOf(U.fpGroup); o.weeks.push(JSON.parse(JSON.stringify(o.weeks[U.fpWeek-1]))); save(); U.fpWeek=o.weeks.length; toast('Settimana duplicata'); window.scrollTo(0,0); },
  fpdel(){ const o=fitProgOf(U.fpGroup); o.weeks.splice(U.fpWeek-1,1); if(o.cur>o.weeks.length) o.cur=o.weeks.length; U.fpWeek=null; U.confirm=null; save(); toast('Settimana eliminata'); },
  fpcur(){ fitProgOf(U.fpGroup).cur=U.fpWeek; save(); toast('Settimana in corso aggiornata'); },
  msmode(k){ U.msMode=k; U.maOpen=null; U.mrAth=''; U.biOpen=null; },
  maopen(k){ U.maOpen = U.maOpen===k ? null : k; },
  mednew(){ U.mEd={title:'', intro:'', qs:[{t:'', type:'text'}]}; window.scrollTo(0,0); },
  mededit(k){ const f=mFormById(k); U.mEd=JSON.parse(JSON.stringify(f)); window.scrollTo(0,0); },
  medclose(){ U.mEd=null; },
  bidopen(k){ U.biOpen=k; U.confirm=null; window.scrollTo(0,0); },
  bidclose(){ U.biOpen=null; window.scrollTo(0,0); },
  bivmode(k){ const v=fvisOf(U.biOpen); v.all = k==='all'; setFvis(U.biOpen, v); },
  bivg(k){ const v=fvisOf(U.biOpen); const i=v.groups.indexOf(k); if(i>=0) v.groups.splice(i,1); else { v.groups.push(k); v.aths=v.aths.filter(id=>ath(id)?.groupId!==k); } setFvis(U.biOpen, v); },
  biva(k){ const v=fvisOf(U.biOpen); const i=v.aths.indexOf(k); if(i>=0) v.aths.splice(i,1); else v.aths.push(k); setFvis(U.biOpen, v); },
  mrathopen(k){ U.mrAth=k; U.maOpen=null; window.scrollTo(0,0); },
  mrathclose(){ U.mrAth=''; U.maOpen=null; window.scrollTo(0,0); },
  tdopen(){ U.tdEd=JSON.parse(JSON.stringify(testsDef())); U.confirm=null; window.scrollTo(0,0); },
  tdclose(){ U.tdEd=null; U.confirm=null; window.scrollTo(0,0); },
  tdadd(){ U.tdEd.push({k:'x'+uid(), l:'', u:''}); },
  tddel(k){ U.tdEd.splice(+k,1); },
  tdup(k){ const q=U.tdEd, i=+k; [q[i-1],q[i]]=[q[i],q[i-1]]; },
  tdsec(k,d){ U.tdEd[+k].sec = d.v==='1'; },
  tdresetask(){ U.confirm='tdreset'; },
  tdreset(){ S.ftests=(S.ftests||[]).filter(t=>!t.tdef); save(); U.tdEd=null; U.confirm=null; toast('Prove tornate all’originale'); },
  tdsave(){ const T=U.tdEd.map(t=>({k:t.k, l:t.l.trim(), u:(t.u||'').trim(), ...(t.sec?{sec:true}:{})})).filter(t=>t.l); if(!T.length){ toast('Serve almeno una prova'); return; }
    S.ftests=(S.ftests||[]).filter(t=>!t.tdef).concat({id:'tdef', tdef:T}); save(); U.tdEd=null; U.confirm=null; toast('Prove dei test salvate'); window.scrollTo(0,0); },
  answath(k){ if(S.session.role==='coach'){ U.tab='ath'; U.athleteOpen=k; U.athTab=null; window.scrollTo(0,0); } else ACT.staffath(k); },
  homegrp(k){ U.homeGrp=k; },
  pptab(k){ U.ppTab=k; U.sheetOpen=null; window.scrollTo(0,0); },
  sheetopen(k){ U.sheetOpen=k; U.lpMenu=null; window.scrollTo(0,0); },
  shexed(k){ const [sid,pi,j]=k.split(':'), x=shFind(sid); if(!x) return; const e=j==='n'?null:x.phases[+pi].ex[+j];
    U.ed={id:null, ph:'pr', t:e?e.t||'':'', chip:e?e.chip||'':'', x:e?(e.x||[]).join('\n'):'', min:e?e.min||'':'', obj:e?e.obj||'':'', serie:e?e.serie||'':'', els:e?JSON.parse(JSON.stringify(e.els||[])):[], vis:null, from:null, tool:'A', pend:null, ctx:null, lib:false, sheet:{sid, pi:+pi, j:j==='n'?null:+j}}; U.confirm=null; window.scrollTo(0,0); },
  shexdel(){ const E=U.ed; const x=E&&E.sheet&&shFind(E.sheet.sid); if(x){ x.phases[E.sheet.pi].ex.splice(E.sheet.j,1); save(); toast('Esercizio tolto'); } U.ed=null; U.confirm=null; },
  lpclose(){ U.lpMenu=null; U.confirm=null; },
  sheetclose(){ U.sheetOpen=null; U.ppTab='lezioni'; window.scrollTo(0,0); },
  sheetdel(k){ const [aid,sid]=k.split(':'); const pv=privOf(aid); pv.sheets=(pv.sheets||[]).filter(x=>x.id!==sid); U.sheetOpen=null; U.confirm=null; U.lpMenu=null; save(); toast('Lezione tolta'); },
  impfor(k){ U.impFor=k; U.aiCopied=false; U.aiShow=false; U.impData=null; U.impErr=''; window.scrollTo(0,0); },
  impgo(){ U.impFor=null; U.tab='home'; U.homeView='priv'; U.privOpen=null; U.athPriv=null; U.sheetOpen=null; U.impOpen=true; U.impData=null; U.impErr=''; window.scrollTo(0,0); },
  impopen(){ U.impOpen=true; U.impData=null; U.impErr=''; window.scrollTo(0,0); },
  impclose(){ if(REC){ try{ REC.stop(); }catch(e){} REC=null; U.recOn=false; } U.aiCopied=false; U.aiShow=false; U.impFor=null; U.impOpen=false; U.impData=null; U.impErr=''; window.scrollTo(0,0); },
  impreset(){ U.impData=null; U.impErr=''; },
  aidict(){ dictate(); },
  aicopy(){ const ta=document.getElementById('ai-notes'); U.aiNotes=U.aiNotes||{}; if(ta) U.aiNotes[aiKey()]=ta.value; if(!(U.aiNotes[aiKey()]||'').trim()){ toast(U.gImp?'Prima scrivi o detta il programma':'Prima scrivi o detta la lezione'); return; } const txt=U.gImp?gAiPrompt(grp(U.gImp)):aiPrompt(U.impFor||null);
    try{ navigator.clipboard.writeText(txt).then(()=>{ U.aiCopied=true; U.aiShow=false; render(); toast('Richiesta copiata'); }, ()=>{ U.aiShow=true; U.aiCopied=true; render(); }); }catch(e){ U.aiShow=true; U.aiCopied=true; } },
  gimpopen(k){ U.gImp=k; U.gImpData=null; U.gImpErr=''; U.aiCopied=false; U.aiShow=false; U.oWeek=null; U.oDay=null; window.scrollTo(0,0); },
  gimpclose(){ if(REC){ try{ REC.stop(); }catch(e){} REC=null; U.recOn=false; } U.gImp=null; U.gImpData=null; U.gImpErr=''; U.aiCopied=false; U.aiShow=false; window.scrollTo(0,0); },
  gimppaste(){ const r=gParse(document.getElementById('gimp-txt').value||''); if(r.err){ U.gImpErr=r.err; U.gImpData=null; } else { U.gImpErr=''; U.gImpData=r; } },
  gimpreset(){ U.gImpData=null; U.gImpErr=''; },
  gimpdo(){ const g=grp(U.gImp), R=U.gImpData; if(!g||!R) return; const before=ownOf(g.id).weeks.filter(w=>w.name||w.days.some(d=>d.title||d.ex.length)).length; g.prog='own'; const n=impProgram(R.P, g); save();
    if(U.aiNotes) U.aiNotes['g:'+g.id]=''; U.gImp=null; U.gImpData=null; U.aiCopied=false; U.aiShow=false; U.planGroup=g.id; U.planMode='weeks'; U.oDay=null; U.oWeek = n ? before+1 : null; toast(n?`${g.name}: ${n} ${n===1?'settimana aggiunta':'settimane aggiunte'}`:'Queste settimane c\u2019erano già'); window.scrollTo(0,0); },
  imppaste(){ const r = impParse(document.getElementById('imp-txt').value||'', U.impFor||null); if(r.err){ U.impErr=r.err; U.impData=null; } else { U.impErr=''; U.impData=r; } },
  impdo(){ const R=U.impData; if(!R) return; const as = impApply(R.d, R.forId); save(); const was = R.forId; if(U.aiNotes) U.aiNotes[was||'_']=''; U.aiCopied=false; U.aiShow=false; U.impFor=null; U.impOpen=false; U.impData=null; U.ppTab = was && R.d.allievi[0] && (R.d.allievi[0].lezioni||[]).length ? 'lezioni' : 'scheda'; U.sheetOpen=null; toast(as.length===1?`${as[0].name}: scheda importata`:`${as.length} allievi importati`); if(as.length===1){ if(U.tab==='home') U.homeView='priv'; U.privOpen=as[0].id; U.athPriv=as[0].id; } window.scrollTo(0,0); },
  ppcreate(k){ const pv=privOf(k); if(!pv.pg) pv.pg={id:'pp_'+k, pp:true, prog:'own', freq:1, week:1, lesson:{dur:60, phases:[]}}; ownOf('pp_'+k); save(); ACT.ppopen(k); toast('Programma creato'); },
  ppopen(k){ U.tab='plan'; U.planMode='weeks'; U.planGroup='pp_'+k; U.oWeek=null; U.oDay=null; U.pick=null; window.scrollTo(0,0); },
  ppback(k){ U.planGroup=null; U.oWeek=null; U.oDay=null; if(S.session.role==='coach'){ U.tab='home'; U.homeView='priv'; U.privOpen=k; } window.scrollTo(0,0); },
  tnwall(k){ const w=U.tNew.who; w.sel = k!=='all'; if(!w.sel){ w.groups=[]; w.aths=[]; } },
  tnwg(k){ const w=U.tNew.who, i=w.groups.indexOf(k); if(i>=0) w.groups.splice(i,1); else { w.groups.push(k); w.aths=w.aths.filter(id=>ath(id)?.groupId!==k); } },
  tnwa(k){ const w=U.tNew.who, i=w.aths.indexOf(k); if(i>=0) w.aths.splice(i,1); else w.aths.push(k); },
  tedwho(){ U.tEdWho=!U.tEdWho; },
  twall(k){ const t=tByKey(U.tOpen).t; if(k==='all') delete t.who; else if(!t.who) t.who={groups:[], aths:[]}; save(); },
  twg(k){ const t=tByKey(U.tOpen).t, w=t.who=t.who||{groups:[],aths:[]}; w.groups=w.groups||[]; w.aths=w.aths||[]; const i=w.groups.indexOf(k); if(i>=0) w.groups.splice(i,1); else { w.groups.push(k); w.aths=w.aths.filter(id=>ath(id)?.groupId!==k); } save(); },
  twa(k){ const t=tByKey(U.tOpen).t, w=t.who=t.who||{groups:[],aths:[]}; w.groups=w.groups||[]; w.aths=w.aths||[]; const i=w.aths.indexOf(k); if(i>=0) w.aths.splice(i,1); else w.aths.push(k); save(); },
  mcnew(){ S.mforms=S.mforms||[]; const c={id:uid(), mcycle:true, title:'', goal:'', who:{groups:[], aths:[]}, meets:[{id:uid(), date:'', time:'', title:'', act:'', home:''}], date:new Date().toISOString()}; S.mforms.push(c); save(); U.mcOpen=c.id; window.scrollTo(0,0); },
  mcopen(k){ U.mcOpen=k; U.confirm=null; window.scrollTo(0,0); },
  mcclose(){ U.mcOpen=null; U.confirm=null; window.scrollTo(0,0); },
  mcdel(k){ const c=mCycle(k); if(c){ const ids=(c.meets||[]).map(m=>m.id); S.mnotes=S.mnotes||{}; ids.forEach(i=>delete S.mnotes[i]); } S.mforms=(S.mforms||[]).filter(f=>f.id!==k); U.mcOpen=null; U.confirm=null; save(); toast('Ciclo tolto'); },
  mcg(k){ const c=mCycle(U.mcOpen); c.who=c.who||{groups:[],aths:[]}; const g=c.who.groups, i=g.indexOf(k); if(i>=0) g.splice(i,1); else { g.push(k); c.who.aths=(c.who.aths||[]).filter(id=>ath(id)?.groupId!==k); } save(); },
  mca(k){ const c=mCycle(U.mcOpen); c.who=c.who||{groups:[],aths:[]}; const a=c.who.aths=c.who.aths||[], i=a.indexOf(k); if(i>=0) a.splice(i,1); else a.push(k); save(); },
  mtgadd(k){ const c=mCycle(k), ms=(c.meets||[]).slice().sort(meetSort), last=ms[ms.length-1]; c.meets=c.meets||[]; c.meets.push({id:uid(), date:last&&last.date?isoAdd(last.date,7):'', time:last?.time||'', title:'', act:'', home:''}); save(); },
  mtgdel(k){ const [cid,mid]=k.split(':'); const c=mCycle(cid); c.meets=(c.meets||[]).filter(m=>m.id!==mid); if(S.mnotes) delete S.mnotes[mid]; U.confirm=null; save(); },
  mmdone(k){ const [cid,mid]=k.split(':'); const m=(mCycle(cid).meets||[]).find(x=>x.id===mid); m.done=!m.done; save(); },
  mmassign(k){ const [cid,mid]=k.split(':'); const c=mCycle(cid), m=(c.meets||[]).find(x=>x.id===mid); if(!m||!m.formId) return; S.massign=S.massign||[]; const now=new Date().toISOString(); let n=0;
    cycleAths(c).forEach(aid=>{ if(!S.massign.some(x=>x.formId===m.formId && x.athleteId===aid && !x.done)){ S.massign.push({id:uid(), formId:m.formId, athleteId:aid, date:now, done:false, answers:{}}); n++; } }); save(); toast(n?`Scheda assegnata a ${n} atleti`:'Già assegnata a tutti'); },
  mansopen(k){ U.tab='mschede'; U.msMode='resp'; U.mrAth=k; U.maOpen=null; U.homeView=null; window.scrollTo(0,0); },
  plday(k){ U.plDay=k; },
  plweek(k){ U.plWeek=(U.plWeek||0)+(+k); const mon=mondayOf(isoAdd(todayISO(),7*U.plWeek)); U.plDay = U.plWeek===0 ? todayISO() : mon; },
  plformopen(k){ U.plForm=k; },
  plformclose(){ U.plForm=null; },
  plopen(k){ U.homeView='priv'; U.privOpen=k; window.scrollTo(0,0); },
  pladd(k){ const aid = k || document.getElementById('pl-a')?.value, d = document.getElementById('pl-d').value, t = document.getElementById('pl-t').value, m = +document.getElementById('pl-m').value, r = +document.getElementById('pl-r').value;
    if(!aid || !ath(aid)){ toast('Scegli l’allievo'); return; } if(!d){ toast('Scegli il giorno'); return; } if(!t){ toast('Scegli l’ora'); return; }
    const pv = privOf(aid); pv.sched = pv.sched || []; const series = r>1 ? uid() : undefined;
    for(let i=0;i<r;i++) pv.sched.push({id:uid(), date:isoAdd(d,7*i), time:t, dur:m, ...(series?{series}:{})});
    U.plLastTime=t; U.plLastDur=m; U.plForm=null; U.plDay=d; save(); toast(r>1?`${r} lezioni fissate`:'Lezione fissata'); },
  pldel(k){ const [aid,id]=k.split(':'); const pv=privOf(aid); pv.sched=(pv.sched||[]).filter(x=>x.id!==id); U.confirm=null; save(); toast('Lezione tolta'); },
  biopen(k){ U.biEd=tplNow(k); U.confirm=null; window.scrollTo(0,0); },
  biclose(){ U.biEd=null; U.confirm=null; window.scrollTo(0,0); },
  biqadd(){ U.biEd.qs.push({k:'x'+uid(), t:'area', l:''}); },
  biqdel(k){ U.biEd.qs.splice(+k,1); },
  biqup(k){ const q=U.biEd.qs, i=+k; [q[i-1],q[i]]=[q[i],q[i-1]]; },
  biqt(k,d){ const q=U.biEd.qs[+k]; if(q.t===d.v || (d.v==='seg'&&q.t==='pair')) return; q.t=d.v; q.k='x'+uid(); if(d.v==='seg' && !q.o) q.o=['Sì','No']; },
  bisadd(){ U.biEd.shots.push({k:'x'+uid(), n:''}); },
  bisdel(k){ U.biEd.shots.splice(+k,1); },
  btqadd(){ U.biEd.tq.push({q:'', o:[{t:'',ty:'F'},{t:'',ty:'C'}]}); },
  btqdel(k){ U.biEd.tq.splice(+k,1); },
  btqup(k){ const q=U.biEd.tq, i=+k; [q[i-1],q[i]]=[q[i],q[i-1]]; },
  btoadd(k){ U.biEd.tq[+k].o.push({t:'', ty:'U'}); },
  btodel(k){ const [i,j]=k.split(':').map(Number); U.biEd.tq[i].o.splice(j,1); },
  biresetask(){ U.confirm='bireset'; },
  bireset(){ const k=U.biEd.builtin; S.mforms=(S.mforms||[]).filter(f=>f.builtin!==k); save(); U.biEd=null; U.confirm=null; toast('Scheda tornata all’originale'); window.scrollTo(0,0); },
  bisave(){ const E=JSON.parse(JSON.stringify(U.biEd)), k=E.builtin;
    if(!E.title.trim()){ toast('Scrivi il titolo'); return; }
    const out = {id:'tpl-'+k, builtin:k, title:E.title.trim(), intro:(E.intro||'').trim(), by:S.session.role, date:new Date().toISOString()};
    if(k==='tipo'){
      out.tq = E.tq.map(q=>({q:q.q.trim(), o:q.o.map(o=>({t:o.t.trim(), ty:o.ty})).filter(o=>o.t)})).filter(q=>q.q);
      if(!out.tq.length){ toast('Serve almeno una situazione'); return; }
      if(out.tq.some(q=>q.o.length<2)){ toast('Ogni situazione ha bisogno di almeno 2 risposte'); return; }
    } else {
      out.qs = E.qs.map(q=>{ const r={k:q.k, t:q.t, l:q.l.trim()}; if(q.t==='seg'||q.t==='pair'){ r.o = (q.os!==undefined ? q.os.split('/') : q.o||[]).map(x=>String(x).trim()).filter(Boolean); if(q.os!==undefined && q.t==='pair'){ r.t='seg'; r.k='x'+uid(); } } return r; }).filter(q=>q.l);
      if(out.qs.some(q=>(q.t==='seg'||q.t==='pair') && q.o.length<2)){ toast('Le domande a scelta hanno bisogno di almeno 2 risposte, separate da /'); return; }
      if(k==='arma'){ out.shots = E.shots.map(sh=>({k:sh.k, n:sh.n.trim()})).filter(sh=>sh.n); }
      if(!out.qs.length && !(out.shots||[]).length){ toast('Serve almeno una domanda'); return; }
    }
    S.mforms=(S.mforms||[]).filter(f=>f.builtin!==k).concat(out); save(); U.biEd=null; U.confirm=null; toast('Scheda salvata: atleti e famiglie vedono la nuova versione'); window.scrollTo(0,0); },
  medqadd(){ U.mEd.qs.push({t:'', type:'text'}); },
  medqdel(k){ U.mEd.qs.splice(+k,1); },
  medqt(k,d){ U.mEd.qs[+k].type=d.v; },
  medsave(){ const E=U.mEd; if(!E.title.trim()){ toast('Scrivi il titolo'); return; } const qs=E.qs.filter(q=>q.t.trim()); if(!qs.length){ toast('Scrivi almeno una domanda'); return; }
    S.mforms=S.mforms||[]; const f={id:E.id||uid(), title:E.title.trim(), intro:(E.intro||'').trim(), qs, date:E.date||new Date().toISOString()}; const i=S.mforms.findIndex(z=>z.id===f.id); if(i>=0) S.mforms[i]=f; else S.mforms.push(f);
    save(); U.mEd=null; U.mfOpen=f.id; U.mfSel=null; toast('Scheda salvata'); window.scrollTo(0,0); },
  mfopen(k){ U.mfOpen=k; U.mfSel=null; window.scrollTo(0,0); }, mfclose(){ U.mfOpen=null; U.msMode='mine'; },
  mfsel(k){ const s=U.mfSel.aths; const i=s.indexOf(k); if(i>=0) s.splice(i,1); else s.push(k); },
  mfselg(k){ const s=U.mfSel; const i=s.groups.indexOf(k); if(i>=0) s.groups.splice(i,1); else { s.groups.push(k); s.aths=s.aths.filter(id=>ath(id)?.groupId!==k); } },
  maundo(k){ S.massign=(S.massign||[]).filter(x=>x.id!==k || x.done); save(); },
  mfselall(){ const as=S.athletes.filter(a=>a.groupId===U.mfGroup).map(a=>a.id), s=U.mfSel||[]; U.mfSel = as.every(a=>s.includes(a)) ? s.filter(x=>!as.includes(x)) : [...new Set([...s,...as])]; },
  mfassign(){ S.massign=S.massign||[]; const now=new Date().toISOString(); let n=0; const sel=U.mfSel; [...new Set([...S.athletes.filter(a=>sel.groups.includes(a.groupId)).map(a=>a.id), ...sel.aths])].forEach(aid=>{ if(!S.massign.some(x=>x.formId===U.mfOpen && x.athleteId===aid && !x.done)){ S.massign.push({id:uid(), formId:U.mfOpen, athleteId:aid, date:now, done:false, answers:{}}); n++; } }); U.mfSel={groups:[],aths:[]}; save(); toast(n?`Assegnata a ${n} ${n===1?'atleta':'atleti'}`:'Già assegnata'); },
  mfill(k){ U.mfill=k; U.mfDraft=null; window.scrollTo(0,0); }, mfillclose(){ U.mfill=null; U.mfDraft=null; },
  mfscale(k){ const [i,n]=k.split(':').map(Number); U.mfDraft.a[i]=n; },
  mfsend(){ const x=(S.massign||[]).find(z=>z.id===U.mfill), f=mFormById(x.formId), D=U.mfDraft; if(f.qs.some((q,i)=>!D.a[i] && D.a[i]!==0)){ toast('Rispondi a tutte le domande'); return; } x.answers=D.a; x.done=true; x.doneDate=new Date().toISOString(); U.mfill=null; U.mfDraft=null; save(); toast('Scheda inviata'); window.scrollTo(0,0); },
  staffath(k,d){ U.tab='sath'; U.athleteOpen=k; U.athTab=d&&d.t?d.t:null; U.tOpen=null; window.scrollTo(0,0); },
  snoteadd(k){ const t=document.getElementById('f-snote').value.trim(); if(!t){ toast('Scrivi la nota'); return; } S.snotes=S.snotes||[]; S.snotes.push({id:uid(), athleteId:k, by:S.session.role, text:t, date:new Date().toISOString(), share:document.getElementById('f-snshare').checked}); save(); toast('Nota salvata'); },
  snshare(k){ const n=(S.snotes||[]).find(x=>x.id===k); if(n){ n.share=!n.share; save(); } },
  snotedel(k){ S.snotes=(S.snotes||[]).filter(x=>x.id!==k); save(); },
  smode(k){ U.sMode=k; },
  medit(k){ const [y,m]=k.split(':').map(Number); U.mEdit={y,m}; U.maKind=''; U.confirm=null; window.scrollTo(0,0); },
  mclose(){ U.mEdit=null; U.confirm=null; window.scrollTo(0,0); },
  makind(k){ U.maKind = U.maKind===k?'':k; },
  mtdel(k){ const x=tByKey(k); if(x){ const w=weekData(x.y,x.n); if(x.i===0 && w.t.length>1) w.t[0]={name:'',kind:'',deadline:'',info:'',players:[],results:{}}; else w.t.splice(x.i,1); } U.confirm=null; save(); toast('Torneo eliminato'); },
  mtadd(){ const n=document.getElementById('ma-name').value.trim(), st=document.getElementById('ma-s').value; let en=document.getElementById('ma-e').value;
    if(!n){ toast('Scrivi il nome del torneo'); return; } if(!st){ toast('Scegli il primo giorno'); return; } if(en && en<st) en=st;
    const wo=weekOf(st), w=weekData(wo.year,wo.n), mon=weekMonday(wo.year,wo.n); const t={name:n, kind:U.maKind||'', deadline:'', info:'', players:[], requests:[], results:{}};
    if(st!==mon || (en && en!==addDays(mon,6))){ t.start=st; if(en) t.end=en; }
    w.t.push(t); setTourRole(`${wo.year}:${wo.n}:${w.t.length-1}`, U.maRole||'main');
    U.maKind=''; U.maRole=''; save(); toast('Torneo aggiunto'); },
  marole(k){ U.maRole=k; },
  trole(k,d){ const nk=setTourRole(k,d.v); if(U.tOpen===k) U.tOpen=nk; save(); toast(d.v==='main'?'Ora è la prima scelta':d.v==='alt'?'Ora è un\'alternativa':'Torneo in più nella settimana'); },
  athbulk(k){ U.athBulk = k==='1'; },
  athbulkadd(){ const txt = document.getElementById('f-na-list').value; let gid = document.getElementById('f-na-grp').value; const made = [], newG = [];
    txt.split(/\r?\n/).forEach(raw=>{ let l = raw.replace(/^\s*(?:[-•*·]|\d+[.)])\s*/,'').trim(); if(!l) return;
      if(/:$/.test(l)){ const gn = l.slice(0,-1).trim(); if(!gn) return; if(/^lezioni private$/i.test(gn)){ gid = PRIV_ID; return; }
        let g = S.groups.find(x=>x.id!==PRIV_ID && x.name.toLowerCase()===gn.toLowerCase()); if(!g){ g = {id:uid(), name:gn, code:genCode(gn), week:1, lesson:{dur:0, phases:[]}}; S.groups.push(g); newG.push(gn); } gid = g.id; return; }
      if(S.athletes.some(a=>a.groupId===gid && a.name.toLowerCase()===l.toLowerCase())) return;
      const id = uid(); S.athletes.push({id, groupId:gid, name:l, pin:genPin(), ppin:genPin()}); if(gid===PRIV_ID) privOf(id); made.push(id); });
    if(!made.length && !newG.length){ toast('Nessun nome nuovo da aggiungere'); return; }
    save(); U.newAth=false; U.athBulk=false; U.resGroup=gid; toast(`${made.length} atleti aggiunti`+(newG.length?` · ${newG.length} gruppi nuovi`:'')); },
  goalpastetoggle(k){ U.goalPaste = U.goalPaste===k ? null : k; },
  goalpaste(k){ const pv = privOf(k), gs = goalLines(document.getElementById('f-goals').value, U.goalArea||(S.session.role==='mind'?'men':'tec'));
    gs.forEach(g=>pv.goals.push({id:uid(), area:g.area, text:g.text, st:'todo'}));
    if(!gs.length){ toast('Incolla almeno un obiettivo'); return; } U.goalPaste=null; save(); toast(gs.length+' obiettivi aggiunti'); },
  pdfopen(k){ const f = privOf(k).pdf; if(!f) return;
    const b = atob(f.data.slice(f.data.indexOf(',')+1)), u8 = new Uint8Array(b.length); for(let i=0;i<b.length;i++) u8[i] = b.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([u8], {type:'application/pdf'}));
    if(!window.open(url, '_blank')){ const l = document.createElement('a'); l.href = url; l.download = f.name; document.body.appendChild(l); l.click(); l.remove(); }
    setTimeout(()=>URL.revokeObjectURL(url), 60000); },
  pdfdel(k){ delete privOf(k).pdf; U.confirm=null; U.pdfDraft=null; save(); toast('PDF tolto'); },
  pdfskip(){ U.pdfDraft=null; },
  pdfapply(k){ const d = U.pdfDraft; if(!d || d.aid!==k) return; const pv = privOf(k), title = (d.title||'').trim(), freq = (d.freq||'').trim();
    if(title) pv.prog.title = title; if(freq) pv.prog.freq = freq;
    const have = new Set(pv.goals.map(g=>g.text.toLowerCase())), gs = goalLines(d.goals||'', 'tec').filter(g=>!have.has(g.text.toLowerCase()));
    gs.forEach(g=>pv.goals.push({id:uid(), area:g.area, text:g.text, st:'todo'}));
    U.pdfDraft=null; save(); toast(gs.length ? `Scheda aggiornata · ${gs.length} obiettivi aggiunti` : 'Scheda aggiornata'); },
  athnewtoggle(){ U.athBulk=false; U.newAth=!U.newAth; U.newGrp=false; },
  grpnewtoggle(){ U.newGrp=!U.newGrp; U.newAth=false; },
  grpnew(){ const n=(document.getElementById('f-gname')?.value||'').trim(); if(!n){ toast('Scrivi il nome del gruppo'); return; } const id=uid(); S.groups.push({id, name:n, code:genCode(n), week:1, lesson:{dur:0, phases:[]}}); U.resGroup=id; U.newGrp=false; save(); toast('Gruppo creato'); },
  pinstoggle(){ U.showPins=!U.showPins; U.confirm=null; },
  grpedit(){ U.grpEdit=!U.grpEdit; U.confirm=null; },
  grpcode(){ const g=grp(U.resGroup); if(HOOK.codeChanging) HOOK.codeChanging(g); g.code=genCode(g.name); save(); toast('Nuovo codice: '+g.code); },
  grpdel(){ const id=U.resGroup; S.groups=S.groups.filter(x=>x.id!==id); U.resGroup=null; U.grpEdit=false; U.confirm=null; save(); toast('Gruppo eliminato'); },
  athnew(){ const n=document.getElementById('f-na-name').value.trim(), gid=document.getElementById('f-na-grp').value; if(!n){ toast('Scrivi il nome'); return; }
    const id=uid(); S.athletes.push({id, groupId:gid, name:n, pin:genPin(), ppin:genPin()}); if(gid===PRIV_ID) privOf(id); save(); U.newAth=false; U.resGroup=gid; toast(n+' aggiunto a '+(gid===PRIV_ID?'Lezioni private':grp(gid).name)); },
  athpriv(k){ U.athPriv=k; window.scrollTo(0,0); },
  athtab(k){ U.athTab=k; U.tOpen=null; }, sprog(k){ U.tab='prog'; U.athTab=k; U.tOpen=null; U.form=null; window.scrollTo(0,0); }, sprogclose(){ U.sProg=false; window.scrollTo(0,0); }, toggleinbox(){ U.showInbox=!U.showInbox; }, closeath(){ U.athleteOpen=null; },
  openmatch(k){ U.tab = (S.session.role==='parent'||S.session.role==='fit'||S.session.role==='mind') ? 'pmatch' : 'match'; U.matchOpen=k; U.confirm=null; window.scrollTo(0,0); }, closematch(){ U.matchOpen=null; U.setup=null; if(S.session.role==='parent') U.tab='prog'; if(S.session.role==='fit'||S.session.role==='mind') U.tab='sath'; },
  newpin(k){ ath(k).pin=genPin(); save(); toast('Nuovo PIN atleta'); }, newppin(k){ ath(k).ppin=genPin(); save(); toast('Nuovo PIN genitore'); },
  askdel(k){ U.confirm=k; }, nodel(){ U.confirm=null; },
  del(k){ const [t,id]=k.split(':');
    if(t==='ath'){ if(HOOK.athRemoved) HOOK.athRemoved(id); S.athletes=S.athletes.filter(a=>a.id!==id); S.results=S.results.filter(r=>r.athleteId!==id); S.matches=S.matches.filter(m=>m.a.id!==id); S.forms=S.forms.filter(f=>f.athleteId!==id); S.tests=S.tests.filter(t=>t.athleteId!==id); toast('Tolto dal gruppo'); if(U.athleteOpen===id) U.athleteOpen=null; if(U.athPriv===id) U.athPriv=null; }
    if(t==='m'){ S.matches=S.matches.filter(m=>m.id!==id); U.matchOpen=null; toast('Partita eliminata'); }
    U.confirm=null; save(); },
  addath(k){ const i=document.getElementById('f-new-'+k); const n=i.value.trim(); if(!n){ toast('Scrivi il nome'); return; } S.athletes.push({id:uid(), groupId:k, name:n, pin:genPin(), ppin:genPin()}); save(); toast(n+' aggiunto al gruppo'); },
  addgroup(){ const n=document.getElementById('f-gname').value.trim(); if(!n){ toast('Scrivi il nome del gruppo'); return; } S.groups.push({id:uid(), name:n, code:genCode(n), week:1}); save(); toast('Gruppo creato'); },
  savecc(){ const v=document.getElementById('f-cc').value.trim().toUpperCase(); if(v.length<4){ toast('Almeno 4 caratteri'); return; } S.coachCode=v; save(); toast('Codice maestro salvato'); },
  reset(k){ const sess=S.session; if(typeof cloudAthRemoved==='function') (S.athletes||[]).forEach(a=>cloudAthRemoved(a.id)); S = k==='empty' ? {roster:6, example:false, coachCode:S.coachCode, season:{2026:{weeks:{}}}, groups:[], athletes:[], results:[], matches:[], forms:[], tests:[], customEx:S.customEx||[], plan:S.plan||{}, session:sess, live:null} : seed(); S.session=sess; U.confirm=null; U.resGroup=null; U.resWeek=null; U.setup=null; save(); toast(k==='empty'?'Tutto cancellato: puoi partire con i tuoi gruppi':'Dati di prova ripristinati'); },
  set(k,d){ const s=U.setup; let v=d.v; if(v==='true') v=true; else if(v==='false') v=false; else if(/^\d+$/.test(v)) v=+v; s[k]=v; },
  psave(k){ const s=U.setup, x={choices:s.choices.map(c=>String(c).trim()).filter(Boolean), tasks:s.tasks.map(c=>String(c).trim()).filter(Boolean), at:todayISO()};
    if(!x.choices.length && !x.tasks.length){ toast('Scrivi almeno una scelta o un compito'); return; }
    if(k==='a'){ const a=ath(s.a); if(!a) return; a.mset=x; s.from='athlete'; toast('Salvate per '+a.name); }
    else { const g=grp(s.groupId); if(!g) return; g.mset=x; s.from=ath(s.a)?.mset?'athlete':'group'; toast('Salvate per '+g.name+(ath(s.a)?.mset?' ('+ath(s.a).name+' ha le sue)':'')); }
    save(); },
  pclear(k){ const s=U.setup; if(k==='a'){ const a=ath(s.a); if(a) delete a.mset; } else { const g=grp(s.groupId); if(g) delete g.mset; } presetInto(s); save(); toast('Tolte'); },
  addchoice(){ U.setup.choices.push('Nuova scelta'); }, delchoice(k){ U.setup.choices.splice(+k,1); },
  start(){ const s=U.setup; const a=ath(s.a); if(!a){ toast('Scegli chi analizziamo'); return; }
    if(s.mode==='task'){ const tasks=s.tasks.map(t=>t.trim()).filter(Boolean); if(!tasks.length){ toast('Serve almeno un compito'); return; } const g=grp(s.groupId);
      const b = s.b ? {id:s.b, name:ath(s.b).name} : {id:null, name:s.bName.trim()};
      S.live={id:uid(), mode:'task', groupId:g.id, week:g.week, date:new Date().toISOString(), a:{id:a.id,name:a.name}, b, kind:s.kind, tasks, points:[], done:false}; U.tsel=[]; save(); window.scrollTo(0,0); return; }
    if(!s.choices.length){ toast('Serve almeno una scelta'); return; }
    const b = s.b ? {id:s.b, name:ath(s.b).name} : {id:null, name:s.bName.trim()||'Avversario'};
    const g = grp(s.groupId);
    const format = {type:s.type, sets:s.sets, games:s.games, tb:s.tb, decider:s.decider, ad:s.ad, first:s.first};
    S.live = {id:uid(), groupId:g.id, week:g.week, date:new Date().toISOString(), a:{id:a.id,name:a.name}, b, format, choices:s.choices.map(c=>c.trim()||'Scelta'), trackEx:s.trackEx, points:[], done:false};
    U.sel={ch:undefined, ex:null}; save(); window.scrollTo(0,0); },
  pick(k){ const v = k==='none' ? null : +k; U.sel.ch = U.sel.ch===v ? undefined : v; U.sel.ex=null; },
  ex(k){ U.sel.ex = k==='ng' ? 'ng' : k==='1'; },
  // ace / double fault / return error: the point is not played and the app knows who won it (the receiver only on a double fault)
  fittennis(){ U.fitTennis = !U.fitTennis; },
  srvset(k){ if(S.live){ S.live.srvNow=+k; save(); } },
  quickpt(k){ const m=S.live, st=replay(m); if(st.done!==null) return; const sv=curServer(st); if(U.sel.ch===undefined) U.sel.ch=null; U.sel.ex='ng'; U.sel.how=k; ACT.point(String(k==='df'?1-sv:sv)); },
  point(k){ const m=S.live, st=replay(m); if(st.done!==null) return; const w=+k; const ng = U.sel.ex==='ng';
    m.points.push(Object.assign({w, ch:U.sel.ch??null, ex: (m.trackEx && U.sel.ch!==null && !ng) ? U.sel.ex : null, srv:curServer(st), pr:isPressure(m.format,st)}, ng?{ng:true}:{}, U.sel.how?{how:U.sel.how}:{}));
    const gBefore = st.g[0]+st.g[1]+st.sets.length*100; applyPoint(m.format, st, w);
    U.sel={ch:undefined, ex:null}; save();
    const gAfter = st.g[0]+st.g[1]+st.sets.length*100;
    if(gAfter!==gBefore && st.done===null && !st.tb && (st.g[0]+st.g[1])%2===1) toast('Cambio campo'); },
  editprova(){ const pv = PV(U.weekOpen,U.dayOpen); if(pv.k==='test') pv.k='su'; U.pvDraft = {t:pv.t, k:pv.k, n:pv.n||10, when:pv.when, how:pv.how}; U.editProva=true; },
  pvkind(k){ U.pvDraft.k=k; },
  cancelpv(){ U.editProva=false; },
  savepv(){ const x=U.pvDraft; if(!x.t.trim()){ toast('Scrivi cosa si conta'); return; } const n=Math.round(+x.n);
    if(x.k==='su' && !(n>=1 && n<=50)){ toast('Numero di palle tra 1 e 50'); return; }
    S.provaEdit=S.provaEdit||{}; S.provaEdit[U.weekOpen+'-'+U.dayOpen]={t:x.t.trim(), k:x.k, n:x.k==='su'?n:undefined, when:x.when.trim(), how:x.how.trim()}; U.editProva=false; save(); toast('Prova del giorno aggiornata'); },
  resetpv(){ delete S.provaEdit[U.weekOpen+'-'+U.dayOpen]; U.editProva=false; save(); toast('Prova originale ripristinata'); },
  athmode(k){ U.athMode=k; U.testAth=null; },
  pfedit(k){ const pr=(S.profiles||{})[k]||{}; U.profDraft=Object.assign({share:true}, pr); U.profEdit=k; }, pfcancel(){ U.profEdit=null; },
  pfshare(k){ U.profDraft.share = k==='1'; },
  pfsave(k){ S.profiles=S.profiles||{}; S.profiles[k]=Object.assign({}, U.profDraft, {date:new Date().toISOString()}); U.profEdit=null; save(); toast('Scheda atleta salvata'); },
  privopen(k){ U.privOpen=k; U.ppTab='scheda'; U.sheetOpen=null; window.scrollTo(0,0); }, privclose(){ U.privOpen=null; U.athPriv=null; U.sheetOpen=null; },
  privadd(){ const n=document.getElementById('f-privname').value.trim(); if(!n){ toast('Scrivi il nome'); return; } const id=uid(); S.athletes.push({id, groupId:PRIV_ID, name:n, pin:genPin(), ppin:genPin()}); privOf(id); save(); U.privOpen=id; toast(n+' aggiunto'); window.scrollTo(0,0); },
  ppsave(k){ const pv=privOf(k); pv.prog.title=document.getElementById('pp-title').value.trim(); pv.prog.freq=document.getElementById('pp-freq').value.trim(); save(); toast('Programma salvato'); },
  goalarea(k){ U.goalArea=k; },
  goaladd(k){ const t=document.getElementById('f-goal').value.trim(); if(!t){ toast('Scrivi l’obiettivo'); return; } privOf(k).goals.push({id:uid(), area:U.goalArea||(S.session.role==='mind'?'men':'tec'), text:t, st:'todo'}); save(); toast('Obiettivo aggiunto'); },
  goalst(k,d){ const [a,gid]=k.split(':'); const g=privOf(a).goals.find(x=>x.id===gid); if(g){ g.st=d.v; save(); } },
  goaldel(k){ const [a,gid]=k.split(':'); const pv=privOf(a); pv.goals=pv.goals.filter(x=>x.id!==gid); save(); },
  lessonadd(k){ const what=document.getElementById('f-lwhat').value.trim(); if(!what){ toast('Scrivi cosa avete fatto'); return; } const dv=document.getElementById('f-ldate').value; privOf(k).lessons.push({id:uid(), date:dv?new Date(dv+'T12:00').toISOString():new Date().toISOString(), what, next:document.getElementById('f-lnext').value.trim()}); privOf(k).lessons.sort((a,b)=>a.date<b.date?-1:1); save(); toast('Lezione salvata'); },
  lessondel(k){ const [a,l]=k.split(':'); const pv=privOf(a); pv.lessons=pv.lessons.filter(x=>x.id!==l); save(); },
  fseg(k,d){ U.form.ans[k]=d.v; },
  homeback(){ U.homeView=null; U.privOpen=null; window.scrollTo(0,0); }, homego(k){ U.homeView=k; window.scrollTo(0,0); },
  homeatt(k){ U.homeView='att'; U.attGroup=k; U.attKind=attKindOf(); U.attDate=todayISO(); window.scrollTo(0,0); },
  sessdone(k){ const [gid,di]=k.split(':'), g=grp(gid); if(!g) return; g.sdone=g.sdone||{}; const key=gwk(g), m=g.sdone[key]=g.sdone[key]||{};
    if(m[di]) delete m[di]; else m[di]=todayISO(); save(); toast(m[di]?`${sLabel(g,+di)} fatto`:'Segno tolto'); },
  weeknext(k){ const g=grp(k); if(!g) return; if(isOwnG(g)){ const o=ownOf(g.id); if(o.cur>=o.weeks.length){ toast('Aggiungi prima la settimana successiva nel programma'); return; } o.cur++; } else { if(g.week>=12){ toast('Il programma di 12 settimane è finito'); return; } g.week++; } save(); toast('Si passa alla settimana '+(isOwnG(g)?ownOf(g.id).cur:g.week)); },
  homeday(k){ if(k.startsWith('o:')){ const [,gid,d]=k.split(':'); const o=ownOf(gid); U.tab='plan'; U.planMode='weeks'; U.planGroup=gid; U.oWeek=o.cur; U.oDay=+d; window.scrollTo(0,0); return; } const [w,d,gid]=k.split(':'); if(gid) U.planGroup=gid; U.tab='plan'; U.planMode='weeks'; U.weekOpen=w; U.dayOpen=d; window.scrollTo(0,0); },
  homelib(){ U.tab='plan'; U.planMode='lib'; U.libOpen=null; window.scrollTo(0,0); },
  attset(k,d){ S.att=S.att||{}; const g=grp(U.attGroup)||teamGroups()[0], key=attKey(U.attDate||todayISO(), g.id, U.attKind??attKindOf()); const r=S.att[key]=S.att[key]||{}; if(r[k]===d.v) delete r[k]; else r[k]=d.v; save(); },
  attall(k){ S.att=S.att||{}; const g=grp(U.attGroup)||teamGroups()[0], key=attKey(U.attDate||todayISO(), g.id, U.attKind??attKindOf()); const r=S.att[key]=S.att[key]||{}; S.athletes.filter(a=>a.groupId===g.id).forEach(a=>{ if(k==='w' || !r[a.id]) r[a.id]=k||'p'; }); save(); toast(k==='w'?'Segnata la pioggia per tutti':'Tutti presenti'); },
  noteadd(k){ const t=document.getElementById('f-note').value.trim(); if(!t) return; S.notes=S.notes||[]; S.notes.push({id:uid(), athleteId:k, date:new Date().toISOString(), text:t}); save(); toast('Nota salvata'); },
  notedel(k){ S.notes=(S.notes||[]).filter(n=>n.id!==k); save(); },
  wfat(k){ U.wellDraft.fat=+k; }, wpain(k){ U.wellDraft.pain = k==='1'; },
  wsave(){ const W0=U.wellDraft; if(!W0.fat){ toast('Scegli quanto è stato faticoso'); return; } S.well=S.well||[]; const a=me(); S.well=S.well.filter(x=>!(x.athleteId===a.id&&x.date===W0.date)); S.well.push({athleteId:a.id, date:W0.date, fat:W0.fat, pain:!!W0.pain, where:W0.pain?W0.where:''}); save(); toast('Grazie, inviato al maestro'); },
  nto(k){ U.nto=k; },
  noticeadd(){ const t=document.getElementById('f-notice').value.trim(); if(!t){ toast('Scrivi l’avviso'); return; } S.notices=S.notices||[]; S.notices.push({id:uid(), date:new Date().toISOString(), text:t, to:U.nto||'all'}); save(); toast('Avviso pubblicato'); },
  noticedel(k){ S.notices=(S.notices||[]).filter(n=>n.id!==k); save(); },
  openathT(k){ const [a,t]=k.split(':'); U.tab='ath'; U.athleteOpen=a; U.athTab=t; window.scrollTo(0,0); },
  finalopen(k){ U.finalView=k; window.scrollTo(0,0); }, finalclose(){ U.finalView=null; },
  tyear(k){ U.tYear=(U.tYear||weekOf(todayISO()).year)+ +k; },
  openweekT(k){ const [y,n]=k.split(':').map(Number); U.tab='tour'; U.tWeek={y,n}; window.scrollTo(0,0); },
  closeweekT(){ const w=seasonOf(U.tWeek.y).weeks[U.tWeek.n]; if(w){ w.t=w.t.filter((t,i)=>t.name||i===0); if(!w.type&&!w.note&&!w.t.some(t=>t.name)) delete seasonOf(U.tWeek.y).weeks[U.tWeek.n]; } U.tWeek=null; save(); },
  wtype(k){ const w=weekData(U.tWeek.y,U.tWeek.n); w.type = w.type===k?'':k; save(); },
  tkind(k,d){ const t=weekData(U.tWeek.y,U.tWeek.n).t[+k]; t.kind = t.kind===d.v?'':d.v; save(); },
  tplayer(k){ const [i,pid]=k.split(':'); const t=weekData(U.tWeek.y,U.tWeek.n).t[+i]; t.players=t.players||[]; t.players = t.players.includes(pid) ? t.players.filter(x=>x!==pid) : t.players.concat(pid); save(); },
  taddalt(){ weekData(U.tWeek.y,U.tWeek.n).t.push({name:'', kind:'', deadline:'', info:'', players:[], results:{}}); },
  tsave(){ save(); toast('Settimana salvata'); ACT.closeweekT(); window.scrollTo(0,0); },
  cleanopen(){ U.homeView='clean'; U.clean=null; U.confirm=null; window.scrollTo(0,0); },
  cleanback(){ U.homeView=null; U.confirm=null; },
  cleanall(k){ const on = k==='1'; cleanTours().forEach(x=>{ U.clean.sel[x.k]=on; }); },
  wipeall(){
    ['results','matches','forms','tests','well','notes','snotes','fres','massign','notices'].forEach(k=>{ S[k] = []; });
    S.profiles = {}; S.att = {}; S.live = null;
    Object.keys(S.priv||{}).forEach(id=>{ S.priv[id] = {prog:{title:'',freq:''}, goals:[], lessons:[]}; });
    const yrs = Object.keys(S.season||{}); S.season = {}; (yrs.length?yrs:['2026']).forEach(y=>{ S.season[y] = {weeks:{}}; }); if(!S.season[2026]) S.season[2026] = {weeks:{}};
    U.confirm=null; U.clean=null; U.homeView=null; U.tOpen=null; U.athleteOpen=null; U.matchOpen=null; save(); toast('Fatto: sono rimasti solo gruppi e atleti'); },
  cleanrun(){ const C_ = U.clean; const keys = cleanTours().filter(x=>C_.sel[x.k]);
    keys.sort((a,b)=>b.y-a.y||b.n-a.n||(+b.k.split(':')[2])-(+a.k.split(':')[2])).forEach(x=>{ const w = S.season[x.y].weeks[x.n], i = +x.k.split(':')[2];
      if(i===w.t.length-1) w.t.pop(); else w.t[i] = {name:'', kind:'', deadline:'', info:'', players:[], results:{}}; });
    if(C_.res) cleanTours().forEach(x=>{ x.t.players=[]; x.t.requests=[]; x.t.results={}; });
    if(C_.forms) S.forms = [];
    if(C_.prof) S.profiles = {};
    U.confirm=null; U.clean=null; U.homeView=null; U.tOpen=null; save(); toast(`Dati di prova eliminati (${keys.length} tornei)`); },
  bkcopy(){ const txt=JSON.stringify(Object.assign({}, S, {session:null, live:null})); try{ navigator.clipboard.writeText(txt).then(()=>toast('Dati copiati'), ()=>{ U.restoreText=txt; render(); toast('Seleziona il testo e copialo'); }); }catch(e){ U.restoreText=txt; toast('Seleziona il testo e copialo'); } },
  askrestore(){ if(!(U.restoreText||'').trim()){ toast('Incolla prima i dati'); return; } U.confirm='restore'; },
  bkrestore(){ try{ const d=JSON.parse(U.restoreText); if(!d.athletes||!d.groups) throw 0; const sess=S.session; S=d; S.session=sess; U.restoreText=''; U.confirm=null; save(); toast('Dati ripristinati'); }catch(e){ toast('Questi dati non sono validi'); U.confirm=null; } },
  openT(k){ if(isStaff(S.session.role)) U.tab='tour'; else { U.tab='stours'; U.form=null; } U.tOpen=k; U.tEdPlayers=false; U.tEdWho=false; U.confirm=null; window.scrollTo(0,0); }, closeT(){ U.tOpen=null; U.tEdPlayers=false; },
  tmode(k){ U.tMode=k; },
  tnew(){ U.tPaste=''; U.tParsed=''; U.tNew={name:'', date:'', alt:false, kind:'', deadline:'', info:''}; window.scrollTo(0,0); }, tnewclose(){ U.tNew=null; },
  tnewp(k){ U.tNew.alt = k==='1'; }, tnewk(k){ U.tNew.kind = U.tNew.kind===k?'':k; },
  tnewsave(){ const N=U.tNew; if(!N.name.trim()){ toast('Scrivi il nome del torneo'); return; } if(!N.date){ toast('Scegli il primo giorno del torneo'); return; }
    const wo=weekOf(N.date), w=weekData(wo.year, wo.n); const t={name:N.name.trim(), kind:N.kind, deadline:N.deadline, info:N.info.trim(), players:[], requests:[], results:{}}; if(N.who && N.who.sel) t.who={groups:[...N.who.groups], aths:[...N.who.aths]};
    let i; if(!N.alt){ if(w.t[0]&&w.t[0].name){ w.t.splice(0,0,t); } else { w.t[0]=t; } i=0; if(!w.type) w.type='comp'; } else { if(!w.t[0]) w.t[0]={name:'',kind:'',deadline:'',info:'',players:[],results:{}}; w.t.push(t); i=w.t.length-1; }
    const mon=weekMonday(wo.year,wo.n); if(N.date!==mon || (N.end && N.end!==addDays(mon,6))){ t.start=N.date; if(N.end) t.end = N.end<N.date?N.date:N.end; }
    save(); U.tNew=null; U.tOpen=`${wo.year}:${wo.n}:${i}`; toast('Torneo aggiunto'); window.scrollTo(0,0); },
  tfkind(k){ const x=tByKey(U.tOpen); x.t.kind = x.t.kind===k?'':k; save(); },
  tedplayers(){ U.tEdPlayers=!U.tEdPlayers; },
  tfplayer(k){ const x=tByKey(U.tOpen), t=x.t; t.players=t.players||[]; t.players = t.players.includes(k)?t.players.filter(z=>z!==k):t.players.concat(k); t.requests=(t.requests||[]).filter(z=>z!==k); save(); },
  treq(k){ const x=tByKey(k); x.t.requests=x.t.requests||[]; const id=me().id; if(!x.t.requests.includes(id)) x.t.requests.push(id); save(); toast('Richiesta inviata al maestro'); },
  myround(k,d){ const r=myRes(); r.round = r.round===d.v ? '' : d.v; save(); },
  mmadd(){ const r=myRes(); (r.matches=r.matches||[]).push({opp:'',score:'',win:null}); save(); },
  mmdel(k){ const r=myRes(); (r.matches||[]).splice(+k,1); save(); },
  mmwin(k,d){ const r=myRes(); const m=r.matches[+k]; const v=d.v==='1'; m.win = m.win===v ? null : v; save(); },
  treqcancel(k){ const x=tByKey(k); x.t.requests=(x.t.requests||[]).filter(z=>z!==me().id); save(); },
  treqok(k){ const x=tByKey(U.tOpen), t=x.t; t.requests=(t.requests||[]).filter(z=>z!==k); t.players=t.players||[]; if(!t.players.includes(k)) t.players.push(k); save(); toast('Iscrizione confermata'); },
  treqno(k){ const x=tByKey(U.tOpen); x.t.requests=(x.t.requests||[]).filter(z=>z!==k); save(); },
  tdel(){ const [y,n,i]=U.tOpen.split(':').map(Number); const w=seasonOf(y).weeks[n]; if(i===0 && w.t.length>1) w.t[0]={name:'',kind:'',deadline:'',info:'',players:[],results:{}}; else w.t.splice(i,1); U.tOpen=null; U.confirm=null; save(); toast('Torneo eliminato'); },
  lkedit(){ U.editLinks=true; U.lkDraft=Object.assign({}, LINK_DEF, S.links||{}); },
  lksave(){ const d=U.lkDraft||{}; const fix=u=>{ u=(u||'').trim(); if(!u) return ''; return /^https?:\/\//i.test(u)?u:'https://'+u; }; S.links={fitp:fix(d.fitp)||LINK_DEF.fitp, te:fix(d.te)||LINK_DEF.te}; U.editLinks=false; save(); toast('Link salvati'); },
  lkreset(){ S.links={}; U.editLinks=false; save(); toast('Link standard ripristinati'); },
  tparse(){ const p = parseTournament(U.tPaste||''); const N = U.tNew; const got = [];
    if(p.name){ N.name = p.name; got.push('nome'); } if(p.date){ N.date = p.date; got.push('settimana'); } if(p.deadline){ N.deadline = p.deadline; got.push('scadenza'); } if(p.info){ N.info = p.info; got.push('link'); }
    const onlyLink = /^\s*https?:\/\/\S+\s*$/.test(U.tPaste||'');
    U.tParsed = onlyLink ? 'Dal solo link posso ricavare il nome. Per date e scadenza copia anche il testo della pagina, insieme al link.' : got.length ? `Trovati: ${got.join(', ')}.${!p.date?' Le date non le ho trovate: scegli la settimana qui sotto.':''}${!p.deadline?' Scadenza non trovata.':''}` : 'Non ho trovato dati utili: prova a copiare anche le date del torneo.'; if(!got.length) toast('Nessun dato trovato'); },
  planmode(k){ U.planMode=k; U.libOpen=null; window.scrollTo(0,0); },
  openday(k){ U.dayOpen=+k; U.editDay=false; U.editProva=false; window.scrollTo(0,0); }, closeday(){ U.dayOpen=null; U.editDay=false; },
  editday(k){ U.editDay = k==='1'; },
  resetday(){ delete S.plan[dayKey(U.weekOpen,U.dayOpen)]; if(S.filoEdit) delete S.filoEdit[dayKey(U.weekOpen,U.dayOpen)]; save(); toast('Programma originale ripristinato'); },
  pickex(k){ const [ph,i]=k.split(':'); U.pick={w:U.weekOpen, d:U.dayOpen, ph, i: i==='new'?null:+i}; U.planMode='lib'; U.libPh=ph==='ri'?'pr':(PH[ph]?ph:'all'); U.libOpen=null; U.libQ=''; window.scrollTo(0,0); },
  dropex(k){ const [ph,i]=k.split(':'); const B=editableBlocks(U.weekOpen,U.dayOpen); B[ph].splice(+i,1); save(); },
  upex(k){ const [ph,i]=k.split(':'); const B=editableBlocks(U.weekOpen,U.dayOpen), a=B[ph], j=+i; [a[j-1],a[j]]=[a[j],a[j-1]]; save(); },
  cancelpick(){ U.pick=null; U.planMode='weeks'; U.libOpen=null; window.scrollTo(0,0); },
  choose(k){ if(U.pick&&U.pick.own){ const pk=U.pick, g0=grp(pk.own), dd=ownSync(g0, ownOf(pk.own).weeks[pk.w-1].days[pk.d]); dd.ex.push(k); dd.exPh.push(pk.ph || mapPh(g0, exById(k))); save(); U.pick=null; U.planMode='weeks'; U.libOpen=null; toast('Esercizio inserito'); window.scrollTo(0,0); return; } const pk=U.pick, B=editableBlocks(pk.w,pk.d); B[pk.ph]=B[pk.ph]||[]; if(pk.i===null) B[pk.ph].push(k); else B[pk.ph][pk.i]=k; save(); U.pick=null; U.planMode='weeks'; U.libOpen=null; U.editDay=true; toast('Esercizio inserito'); window.scrollTo(0,0); },
  libph(k){ U.libPh=k; U.libN=40; }, libmine(){ U.libMine=!U.libMine; U.libN=40; }, libmore(){ U.libN=(U.libN||40)+40; },
  libopen(k){ U.libOpen=k; U.confirm=null; window.scrollTo(0,0); }, libclose(){ U.libOpen=null; U.confirm=null; },
  newex(){ U.ed={id:null, ph:U.libPh&&U.libPh!=='all'?U.libPh:'pr', t:'', chip:'', x:'', els:[], tool:'A', pend:null}; window.scrollTo(0,0); },
  editex(k){ U.ed=exToEd(exById(k)); U.libOpen=null; window.scrollTo(0,0); },
  filoreset(k){ if(S.filoEdit) delete S.filoEdit[k]; save(); },
  dayedex(k){ const [ph,i]=k.split(':'); const id=dayBlocks(U.weekOpen,U.dayOpen)[ph][+i]; U.ed=exToEd(exById(id), {w:U.weekOpen, d:U.dayOpen, ph, i:+i}); window.scrollTo(0,0); },
  daynewex(k){ U.ed={id:null, ph:k==='ri'?'pr':k, t:'', chip:'', x:'', els:[], vis:null, from:null, tool:'A', pend:null, ctx:{w:U.weekOpen, d:U.dayOpen, ph:k, i:null}, lib:true}; window.scrollTo(0,0); },
  delex(k){ S.customEx=S.customEx.filter(e=>e.id!==k); Object.values(S.plan||{}).forEach(B=>Object.keys(B).forEach(ph=>B[ph]=B[ph].filter(id=>id!==k))); U.libOpen=null; U.confirm=null; save(); toast('Esercizio eliminato'); },
  edclose(){ U.ed=null; }, edph(k){ U.ed.ph=k; }, tool(k){ U.ed.tool=k; U.ed.pend=null; },
  edundo(){ U.ed.els.pop(); U.ed.pend=null; }, edclear(){ U.ed.els=[]; U.ed.pend=null; },
  courttap(k,d,ev){ const E=U.ed, svg=ev.target.closest('svg'), r=svg.getBoundingClientRect();
    const x=Math.round((ev.clientX-r.left)/r.width*220), y=Math.round((ev.clientY-r.top)/r.height*110);
    if(['A','B','M','c'].includes(E.tool)) E.els.push([E.tool,x,y]);
    else if(E.tool==='n'){ const n=E.els.filter(e=>e[0]==='n').length+1; E.els.push(['n',x,y,n]); }
    else if(!E.pend) E.pend=[x,y];
    else { const [x1,y1]=E.pend; E.pend=null;
      if(E.tool==='z') E.els.push(['z',Math.min(x1,x),Math.min(y1,y),Math.abs(x-x1),Math.abs(y-y1)]);
      else E.els.push([E.tool, arrowPath(x1,y1,x,y, E.tool!=='ma')]); } },
  edsave(){ const E=U.ed; if(!E.t.trim()){ toast('Scrivi il titolo'); return; }
    if(E.sheet){ const x=shFind(E.sheet.sid); if(!x){ U.ed=null; return; } const ph=x.phases[E.sheet.pi]; ph.ex=ph.ex||[];
      const ne={t:E.t.trim(), min:String(E.min||'').trim(), x:E.x.split('\n').map(l=>l.trim()).filter(Boolean), obj:String(E.obj||'').trim(), serie:String(E.serie||'').trim(), els:E.els, chip:E.chip.trim()};
      if(E.sheet.j===null) ph.ex.push(ne); else ph.ex[E.sheet.j]=Object.assign(ph.ex[E.sheet.j]||{}, ne);
      if(E.lib){ S.customEx=S.customEx||[]; S.customEx.push({id:'c'+uid(), custom:true, ph:'pr', t:ne.t, chip:ne.chip, lines:ne.x, els:ne.els}); }
      save(); U.ed=null; toast(E.sheet.j===null?'Esercizio aggiunto':'Esercizio modificato'); return; }
    const ex={id:E.id||('c'+uid()), custom:true, ph:E.ph, t:E.t.trim(), chip:E.chip.trim(), lines:E.x.split('\n').map(l=>l.trim()).filter(Boolean)};
    if(E.els.length || !E.vis) ex.els=E.els; else ex.vis=E.vis;
    if(E.from) ex.from=E.from; if(E.ctx && !E.lib) ex.hidden=true;
    S.customEx=S.customEx||[]; const i=S.customEx.findIndex(e=>e.id===ex.id); if(i>=0) S.customEx[i]=ex; else S.customEx.push(ex);
    if(E.ctx && E.ctx.own && E.ctx.i!==null && E.ctx.i!==undefined){ const g0=grp(E.ctx.own), dd=ownSync(g0, ownOf(E.ctx.own).weeks[E.ctx.w-1].days[E.ctx.d]); dd.ex[E.ctx.i]=ex.id; save(); U.ed=null; toast('Esercizio modificato'); return; }
    if(E.ctx && E.ctx.own){ const g0=grp(E.ctx.own), dd=ownSync(g0, ownOf(E.ctx.own).weeks[E.ctx.w-1].days[E.ctx.d]); dd.ex.push(ex.id); dd.exPh.push(E.ctx.ph || mapPh(g0, ex)); save(); U.ed=null; toast('Esercizio aggiunto alla seduta'); window.scrollTo(0,0); return; }
    if(E.ctx){ const B=editableBlocks(E.ctx.w,E.ctx.d); B[E.ctx.ph]=B[E.ctx.ph]||[]; if(E.ctx.i===null) B[E.ctx.ph].push(ex.id); else B[E.ctx.ph][E.ctx.i]=ex.id; save(); U.ed=null; U.editDay=true; toast(E.ctx.i===null?'Esercizio aggiunto alla seduta':'Esercizio modificato'); window.scrollTo(0,0); return; }
    save(); U.ed=null; U.libOpen=ex.id; toast('Esercizio salvato'); window.scrollTo(0,0); },
  addtask(){ U.setup.tasks.push('Nuovo compito'); }, deltask(k){ U.setup.tasks.splice(+k,1); },
  tsel(k){ const i=+k; U.tsel=U.tsel||[]; U.tsel = U.tsel.includes(i) ? U.tsel.filter(x=>x!==i) : U.tsel.concat(i); },
  tpoint(k){ const sel=U.tsel||[]; if(!sel.length) return; S.live.points.push({t:sel.slice().sort(), w: k==='x'?null:+k}); U.tsel=[]; save(); toast('Punto segnato'); },
  tempty(){ S.live.points.push({t:[], w:null, empty:true}); save(); toast('Punto senza compito'); },
  openform(k){ U.form={kind:k, step:0, ans:{}, tpl:tplNow(k)}; window.scrollTo(0,0); }, closeform(){ U.form=null; },
  tipoans(k){ U.form.ans[U.form.step]=+k; U.form.step++; window.scrollTo(0,0); }, tipoback(){ U.form.step=Math.max(0,Math.min(U.form.step,(U.form.tpl||tplNow('tipo')).tq.length)-1); },
  rate(k,d){ U.form.ans[k]=+d.v; },
  saveform(){ const F=U.form, a=me(), g=grp(a.groupId);
    if(F.kind==='gen' && !Object.values(F.ans).some(v=>String(v).trim())){ toast('Rispondete ad almeno una domanda'); return; }
    const nf = {id:uid(), athleteId:a.id, kind:F.kind, by:S.session.role, week:g.week, date:new Date().toISOString(), ans:F.ans}; if(F.tpl && tplCustom(F.kind)){ const {id:_i, by:_b, date:_d, ...tp} = F.tpl; nf.tpl = tp; } S.forms.push(nf); U.form=null; save(); toast(F.kind==='gen'?'Inviato al maestro':'Scheda salvata'); window.scrollTo(0,0); },
  testweek(k){ U.testWeek=+k; },
  testath(k){ U.tab='ath'; U.athleteOpen=k; U.athTab='allen'; U.testWeek=1; window.scrollTo(0,0); }, testback(){ U.testAth=null; },
  savetest(k){ const wk=U.testWeek, v={}; let any=false;
    testsDef().forEach(t=>{ const x=document.getElementById(`t-${k}-${t.k}`).value.trim().replace(',','.'); if(x!==''){ const num=+x; v[t.k]=isNaN(num)?x:num; any=true; } });
    const ex=S.tests.find(t=>t.athleteId===k && t.week===wk);
    if(ex){ ex.v=v; ex.date=new Date().toISOString(); } else if(any) S.tests.push({id:uid(), athleteId:k, week:wk, date:new Date().toISOString(), v}); else { toast('Nessun dato da salvare'); return; }
    save(); toast('Test salvati'); },
  savetests(){ const g=grp(U.resGroup), wk=U.testWeek; let n=0;
    S.athletes.filter(a=>a.groupId===g.id).forEach(a=>{ const v={}; let any=false;
      testsDef().forEach(t=>{ const x=document.getElementById(`t-${a.id}-${t.k}`).value.trim().replace(',','.'); if(x!==''){ const num=+x; v[t.k]=isNaN(num)?x:num; any=true; } });
      const ex=S.tests.find(t=>t.athleteId===a.id && t.week===wk);
      if(ex){ ex.v=v; ex.date=new Date().toISOString(); n++; } else if(any){ S.tests.push({id:uid(), athleteId:a.id, week:wk, date:new Date().toISOString(), v}); n++; } });
    save(); toast(n?`Test salvati (${n})`:'Nessun dato da salvare'); },
  undo(){ S.live.points.pop(); U.sel={ch:undefined, ex:null}; U.tsel=[]; save(); },
  finish(){ const m=S.live; if(!m.points.length){ S.live=null; U.confirm=null; save(); return; } m.done=true; S.matches.push(m); S.live=null; U.matchOpen=m.id; U.confirm=null; save(); window.scrollTo(0,0); }
};
let LP_T = null, LP_FIRED = false;
const lpOpen = k=>{ LP_FIRED = true; U.lpMenu = k; U.confirm = null; render(); try{ navigator.vibrate && navigator.vibrate(20); }catch(e){} };
document.addEventListener('pointerdown', e=>{ const t = e.target.closest && e.target.closest('[data-lp]'); clearTimeout(LP_T); LP_FIRED = false; if(!t) return; const k = t.dataset.lp; LP_T = setTimeout(()=>lpOpen(k), 550); });
['pointerup','pointercancel','pointerleave'].forEach(n=>document.addEventListener(n, ()=>clearTimeout(LP_T)));
document.addEventListener('pointermove', e=>{ if(Math.abs(e.movementX||0)+Math.abs(e.movementY||0)>6) clearTimeout(LP_T); });
document.addEventListener('contextmenu', e=>{ const t = e.target.closest && e.target.closest('[data-lp]'); if(!t) return; e.preventDefault(); clearTimeout(LP_T); lpOpen(t.dataset.lp); });
document.addEventListener('click', e=>{
  if(LP_FIRED){ LP_FIRED = false; if(e.target.closest && e.target.closest('[data-lp]')){ e.preventDefault(); return; } }
  const t = e.target.closest('[data-a]'); if(!t || t.disabled) return;
  const fn = ACT[t.dataset.a]; if(!fn) return;
  fn(t.dataset.k, t.dataset, e); render();
});
document.addEventListener('change', e=>{
  const t = e.target, c = t.dataset?.c;
  if(c==='impfile'){ const f = t.files && t.files[0]; if(f){ f.text().then(txt=>{ const r = impParse(txt, U.impFor||null); if(r.err){ U.impErr=r.err; U.impData=null; } else { U.impErr=''; U.impData=r; } render(); }); } t.value=''; return; }
  if(c==='pdffile'){ const f = t.files && t.files[0]; if(f) pdfLoad(t.dataset.k, f); t.value=''; return; }
  if(c==='tfres'){ const [pid,f]=t.dataset.k.split(':'); const x=tByKey(U.tOpen); x.t.results=x.t.results||{}; (x.t.results[pid]=x.t.results[pid]||{})[f]=t.value; save(); return; }
  if((c==='tf'||c==='tnew') && t.type==='date'){ render(); return; }
  if(c==='tres'){ const [i,pid,f]=t.dataset.k.split(':'); const tt=weekData(U.tWeek.y,U.tWeek.n).t[+i]; tt.results=tt.results||{}; (tt.results[pid]=tt.results[pid]||{})[f]=t.value; save(); return; }
  if(c==='tdates' && U.tOpen){ U.tOpen=setTourDates(U.tOpen, document.getElementById('tf-st').value, document.getElementById('tf-en').value); save(); render(); return; }
  if(c==='mtdate'){ const j=t.dataset.j; setTourDates(t.dataset.k, document.getElementById('md-s-'+j).value, document.getElementById('md-e-'+j).value); save(); render(); return; }
  if(c==='mwtype'){ const [y,n]=t.dataset.k.split(':').map(Number); weekData(y,n).type=t.value; save(); render(); return; }
  if(c==='edlib' && U.ed){ U.ed.lib=t.checked; return; }
  if(c==='ftdate'){ U.ftDate=t.value||todayISO(); render(); return; }
  if(c==='ftgrp'){ U.ftGroup=t.value; render(); return; }
  if(c==='fpgrp'){ U.fpGroup=t.value; U.fpWeek=null; render(); return; }
  if(c==='mrgrp'){ U.mrGroup=t.value; U.mrAth=''; U.maOpen=null; render(); return; }
  if(c==='mrath'){ U.mrAth=t.value; U.maOpen=null; render(); return; }
  if(c==='mfgrp'){ U.mfGroup=t.value; render(); return; }
  if(c==='fitdate'){ U.fitDate=t.value||todayISO(); render(); return; }
  if(c==='snshare'){ U.snShare=t.checked; return; }
  if(c==='cleantour'){ U.clean.sel[t.dataset.k]=t.checked; return; }
  if(c==='cleanopt'){ U.clean[t.dataset.k]=t.checked; return; }
  if(c==='athname'){ const a=ath(t.dataset.k), v=t.value.trim(); if(a && v){ a.name=v; save(); toast('Nome aggiornato'); render(); } return; }
  if(c==='athmove'){ const a=ath(t.dataset.k); if(a){ a.groupId=t.value; if(HOOK.athMoved) HOOK.athMoved(a); if(t.value===PRIV_ID) privOf(a.id); save(); toast(a.name+' spostato'); render(); } return; }
  if(c==='athgrp'){ U.resGroup=t.value; U.athleteOpen=null; render(); return; }
  if(c==='lessondur'){ const g=grp(U.lessonEd), n=Math.max(30,Math.min(240,+t.value||0)); if(g && n){ lessonSnap(); scalePhases(ensureLesson(g), n); save(); render(); } return; }
  if(c==='phmin'){ lessonSnap(); const L=ensureLesson(grp(U.lessonEd)); L.phases[+t.dataset.k].m=Math.max(0,Math.min(240,+t.value||0)); save(); render(); return; }
  if(c==='mmf' && (t.type==='date'||t.type==='time')){ const [cid,mid,f]=t.dataset.k.split(':'); const m=(mCycle(cid)?.meets||[]).find(x=>x.id===mid); if(m){ m[f]=t.value; save(); render(); } return; }
  if(c==='mmform'){ const [cid,mid]=t.dataset.k.split(':'); const m=(mCycle(cid)?.meets||[]).find(x=>x.id===mid); if(m){ m.formId=t.value||undefined; save(); render(); } return; }
  if(c==='tfor'){ U.tFor=t.value; U.tOpen=null; render(); return; }
  if(c==='bty' && U.biEd){ const [i,j]=t.dataset.k.split(':').map(Number); U.biEd.tq[i].o[j].ty=t.value; return; }
  if(c==='omove'){ const d=ownSync(grp(U.planGroup), ownOf(U.planGroup).weeks[U.oWeek-1].days[U.oDay]); d.exPh[+t.dataset.k]=t.value; save(); render(); return; }
  if(c==='plangrp'){ U.planGroup=t.value; U.weekOpen=null; U.dayOpen=null; U.oWeek=null; U.oDay=null; render(); return; }
  if(c==='attdate'){ U.attDate=t.value||todayISO(); render(); return; }
  if(c==='tour' && t.type==='date'){ render(); return; }
  if(!c || !U.setup) return;
  const s = U.setup;
  if(c==='mgroup'){ s.groupId=t.value; const g=grp(t.value); s.a=S.athletes.find(x=>x.groupId===g.id)?.id||''; s.b=''; presetInto(s); render(); }
  if(c==='ma'){ s.a=t.value; if(s.b===s.a) s.b=''; presetInto(s); render(); }
  if(c==='mb'){ s.b=t.value; render(); }
});
document.addEventListener('focusin', e=>{ if(e.target && e.target.dataset && e.target.dataset.c==='phname') lessonSnap(); });
document.addEventListener('input', e=>{
  if(e.target && e.target.dataset && e.target.dataset.c==='phname'){ const L=ensureLesson(grp(U.lessonEd)); L.phases[+e.target.dataset.k].n=e.target.value; save(); return; }
  const t = e.target, c = t.dataset?.c;
  if(c==='ftext' && U.form){ U.form.ans[t.dataset.k]=t.value; return; }
  if(c==='ed' && U.ed){ U.ed[t.dataset.k]=t.value; return; }
  if(c==='fitnote'){ const g=grp(U.planGroup); if(g){ g.fitNotes=g.fitNotes||{}; g.fitNotes[fitNoteKey(g)]=t.value; save(); } return; }
  if(c==='pdfd' && U.pdfDraft){ U.pdfDraft[t.dataset.k]=t.value; return; }
  if(c==='ainotes'){ U.aiNotes = U.aiNotes || {}; U.aiNotes[aiKey()] = t.value; return; }
  if(c==='pv' && U.pvDraft){ U.pvDraft[t.dataset.k]=t.value; return; }
  if(c==='pf' && U.profDraft){ U.profDraft[t.dataset.k]=t.value; return; }
  if(c==='fitplan'){ S.fitPlan=S.fitPlan||{}; (S.fitPlan[t.dataset.k]=S.fitPlan[t.dataset.k]||{})[U.fitDate||todayISO()]=t.value; save(); return; }
  if(c==='ftn' && U.ftNew){ U.ftNew[t.dataset.k]=t.value; return; }
  if(c==='filo'){ S.filoEdit=S.filoEdit||{}; S.filoEdit[t.dataset.k]=t.value; save(); return; }
  if(c==='grname'){ const g=grp(U.resGroup); if(g){ g.name=t.value; save(); } return; }
  if(c==='fpwname'){ fitProgOf(U.fpGroup).weeks[U.fpWeek-1].name=t.value; save(); return; }
  if(c==='fpdt'){ fitProgOf(U.fpGroup).weeks[U.fpWeek-1].days[+t.dataset.k].title=t.value; save(); return; }
  if(c==='fpdx'){ fitProgOf(U.fpGroup).weeks[U.fpWeek-1].days[+t.dataset.k].text=t.value; save(); return; }
  if(c==='mcf'){ const cy=mCycle(U.mcOpen); if(cy){ cy[t.dataset.k]=t.value; save(); } return; }
  if(c==='mmf' && t.type!=='date' && t.type!=='time'){ const [cid,mid,f]=t.dataset.k.split(':'); const m=(mCycle(cid)?.meets||[]).find(x=>x.id===mid); if(m){ m[f]=t.value; save(); } return; }
  if(c==='mmnote'){ S.mnotes=S.mnotes||{}; S.mnotes[t.dataset.k]=t.value; save(); return; }
  if(c==='ppnote'){ const pv=privOf(t.dataset.k); pv.card=pv.card||{}; pv.card.notes=t.value; save(); return; }
  if(c==='shnote'){ const [sid,f]=t.dataset.k.split(':'); for(const pv of Object.values(S.priv||{})){ const x=(pv.sheets||[]).find(z=>z.id===sid); if(x){ x[f]=t.value; save(); break; } } return; }
  if(c==='tdl' && U.tdEd){ U.tdEd[+t.dataset.k].l=t.value; return; }
  if(c==='tdu' && U.tdEd){ U.tdEd[+t.dataset.k].u=t.value; return; }
  if(c==='bit' && U.biEd){ U.biEd[t.dataset.k]=t.value; return; }
  if(c==='biq' && U.biEd){ U.biEd.qs[+t.dataset.k].l=t.value; return; }
  if(c==='bio' && U.biEd){ U.biEd.qs[+t.dataset.k].os=t.value; return; }
  if(c==='bis' && U.biEd){ U.biEd.shots[+t.dataset.k].n=t.value; return; }
  if(c==='btq' && U.biEd){ U.biEd.tq[+t.dataset.k].q=t.value; return; }
  if(c==='bto' && U.biEd){ const [i,j]=t.dataset.k.split(':').map(Number); U.biEd.tq[i].o[j].t=t.value; return; }
  if(c==='med' && U.mEd){ U.mEd[t.dataset.k]=t.value; return; }
  if(c==='medq' && U.mEd){ U.mEd.qs[+t.dataset.k].t=t.value; return; }
  if(c==='mfa' && U.mfDraft){ U.mfDraft.a[+t.dataset.k]=t.value; return; }
  if(c==='owname'){ ownOf(U.planGroup).weeks[U.oWeek-1].name=t.value; save(); return; }
  if(c==='odtitle'){ ownOf(U.planGroup).weeks[U.oWeek-1].days[U.oDay].title=t.value; save(); return; }
  if(c==='odnote'){ ownOf(U.planGroup).weeks[U.oWeek-1].days[U.oDay].note=t.value; save(); return; }
  if(c==='mtname'){ const x=tByKey(t.dataset.k); if(x){ x.t.name=t.value; save(); } return; }
  if(c==='tpaste'){ U.tPaste=t.value; return; }
  if(c==='lk' && U.lkDraft){ U.lkDraft[t.dataset.k]=t.value; return; }
  if(c==='tnew' && U.tNew){ U.tNew[t.dataset.k]=t.value; return; }
  if(c==='tf' && U.tOpen){ const x=tByKey(U.tOpen); x.t[t.dataset.k]=t.value; save(); return; }
  if(c==='tfres' && t.tagName==='INPUT'){ const [pid,f]=t.dataset.k.split(':'); const x=tByKey(U.tOpen); x.t.results=x.t.results||{}; (x.t.results[pid]=x.t.results[pid]||{})[f]=t.value; save(); return; }
  if(c==='mm' && U.tOpen){ const [i,f]=t.dataset.k.split(':'); const r=myRes(); r.matches[+i][f]=t.value; save(); return; }
  if(c==='mres' && U.tOpen){ myRes()[t.dataset.k]=t.value; save(); return; }
  if(c==='twnote'){ weekData(U.tWeek.y,U.tWeek.n).note=t.value; save(); return; }
  if(c==='tour'){ const [i,f]=t.dataset.k.split(':'); weekData(U.tWeek.y,U.tWeek.n).t[+i][f]=t.value; save(); return; }
  if(c==='tres' && t.tagName==='INPUT'){ const [i,pid,f]=t.dataset.k.split(':'); const tt=weekData(U.tWeek.y,U.tWeek.n).t[+i]; tt.results=tt.results||{}; (tt.results[pid]=tt.results[pid]||{})[f]=t.value; save(); return; }
  if(c==='wwhere' && U.wellDraft){ U.wellDraft.where=t.value; return; }
  if(c==='restore'){ U.restoreText=t.value; return; }
  if(c==='libq'){ U.libQ=t.value; U.libN=40; const pos=t.selectionStart; render(); const n=document.getElementById('f-libq'); if(n){ n.focus(); try{ n.setSelectionRange(pos,pos); }catch(_){} } return; }
  if(c==='task' && U.setup){ U.setup.tasks[+t.dataset.k]=t.value; return; }
  if(!c || !U.setup) return;
  if(c==='choice') U.setup.choices[+t.dataset.k]=t.value;
  if(c==='mbn') U.setup.bName=t.value;
});
document.addEventListener('keydown', e=>{
  if(e.key!=='Enter') return;
  if(e.target.id==='f-code'){ ACT.code(); render(); }
  if(e.target.id==='f-coach'){ ACT.coachin(); render(); }
});

