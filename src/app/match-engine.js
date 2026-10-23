/* Tennis scoring engine and match statistics */
/* ---------- scoring engine ---------- */
function newState(f){
  const st = {sets:[], g:[0,0], p:[0,0], tb:null, server:f.first, done:null, won:[0,0]};
  if(f.type!=='set') st.tb = {target: f.type==='tb7'?7:10, first:f.first, whole:true};
  return st;
}
function tbServer(st){ const n = st.p[0]+st.p[1]; if(n===0) return st.tb.first; return Math.floor((n-1)/2)%2===0 ? 1-st.tb.first : st.tb.first; }
function curServer(st){ return st.tb ? tbServer(st) : st.server; }
function setWon(f, st, w){
  st.won[w]++; st.g=[0,0];
  const need = f.sets===3 ? 2 : 1;
  if(st.won[w]>=need){ st.done=w; return; }
  if(f.sets===3 && st.won[0]===1 && st.won[1]===1 && f.decider==='tb10') st.tb = {target:10, first:st.server, decider:true};
}
function applyPoint(f, st, w){
  if(st.done!==null) return;
  const o = 1-w;
  if(st.tb){
    st.p[w]++;
    if(st.p[w]>=st.tb.target && st.p[w]-st.p[o]>=2){
      const tb = st.tb, sc = [...st.p];
      st.p=[0,0]; st.tb=null;
      if(tb.whole){ st.sets.push({a:sc[0], b:sc[1]}); st.won[w]++; st.done=w; }
      else if(tb.decider){ st.sets.push({a:sc[0], b:sc[1], stb:true}); st.won[w]++; st.done=w; }
      else { st.g[w]++; st.sets.push({a:st.g[0], b:st.g[1], tb:Math.min(sc[0],sc[1])}); st.server = 1-tb.first; setWon(f, st, w); }
    }
    return;
  }
  st.p[w]++;
  const gameWon = f.ad ? (st.p[w]>=4 && st.p[w]-st.p[o]>=2) : st.p[w]>=4;
  if(!gameWon) return;
  st.p=[0,0]; st.g[w]++; st.server = 1-st.server;
  const G = f.games, gw = st.g[w], go = st.g[o];
  if(gw>=G && gw-go>=2){ st.sets.push({a:st.g[0], b:st.g[1]}); setWon(f, st, w); }
  else if(f.tb && st.g[0]===G && st.g[1]===G) st.tb = {target:7, first:st.server};
}
function replay(m){ const st = newState(m.format); m.points.forEach(p=>applyPoint(m.format, st, p.w)); return st; }
function isPressure(f, st){
  if(st.done!==null) return false;
  const [a,b] = st.p;
  if(st.tb){ const t = st.tb.target; return (a>=t-2 && b>=t-2) || (Math.max(a,b)>=t-1 && Math.abs(a-b)<=1); }
  if(!f.ad && a===3 && b===3) return true;
  return (a>=3 && b>=2) || (b>=3 && a>=2);
}
function ptLabel(f, st, i){
  if(st.tb) return String(st.p[i]);
  const me = st.p[i], ot = st.p[1-i];
  if(me>=3 && ot>=3){ if(me===ot) return '40'; return me>ot ? 'V' : '40'; }
  return ['0','15','30','40'][Math.min(me,3)];
}
function statusTags(f, st){
  const t = [];
  if(st.done!==null) return [['Partita finita','hot']];
  if(st.tb) t.push([st.tb.decider ? 'Super tie-break' : 'Tie-break', '']);
  else if(!f.ad && st.p[0]===3 && st.p[1]===3) t.push(['Killer point','hot']);
  else if(st.p[0]>=3 && st.p[1]>=3 && st.p[0]===st.p[1]) t.push(['Parità','']);
  if(isPressure(f, st)) t.push(['Punto importante','hot']);
  return t;
}
function formatLabel(f){
  if(f.type==='tb7') return 'Tie-break a 7';
  if(f.type==='tb10') return 'Tie-break a 10';
  let s = (f.sets===1 ? '1 set' : '2 set su 3') + ' a ' + f.games + ' game';
  s += f.tb ? ', tie-break sul ' + f.games + '-' + f.games : ', senza tie-break';
  if(f.sets===3) s += f.decider==='tb10' ? ', 3° set super tie-break' : '';
  return s + (f.ad ? ', con vantaggi' : ', killer point');
}
function scoreLine(st){ const l = st.sets.map(x=> x.stb ? `[${x.a}-${x.b}]` : `${x.a}-${x.b}${x.tb!==undefined?`(${x.tb})`:''}`); if(st.done===null && (st.g[0]||st.g[1])) l.push(`${st.g[0]}-${st.g[1]}`); return l.join('  '); }

/* ---------- stats ---------- */
function matchStats(m){
  const n = m.choices.length;
  const rows = m.choices.map((label,i)=>({label, n:0, ex:0, exn:0, won:0, prn:0, prw:0, ng:0}));
  const none = {label:'Nessuna scelta', n:0, won:0, prn:0, prw:0, ex:0, exn:0, ng:0};
  let won=0, srv=0, srvW=0, ret=0, retW=0, prn=0, prw=0; const quick = {aceA:0, dfA:0, aceB:0, dfB:0, ng:0};
  m.points.forEach(p=>{
    const r = p.ch===null || p.ch===undefined ? none : rows[p.ch];
    if(!r) return;
    const w = p.w===0;
    if(p.how==='ace'){ if(p.srv===0) quick.aceA++; else quick.aceB++; } else if(p.how==='df'){ if(p.srv===0) quick.dfA++; else quick.dfB++; }
    if(w) won++; if(p.pr){ prn++; if(w) prw++; }
    // a point not played (ace, double fault, nothing to try) counts in the score but says nothing about the choice
    if(p.ng){ r.ng++; quick.ng++; if(p.srv===0){ srv++; if(w) srvW++; } else { ret++; if(w) retW++; } return; }
    r.n++; if(w) r.won++;
    if(p.ex!==null && p.ex!==undefined){ r.exn++; if(p.ex) r.ex++; }
    if(p.pr){ r.prn++; if(w) r.prw++; }
    if(p.srv===0){ srv++; if(w) srvW++; } else { ret++; if(w) retW++; }
  });
  return {rows, none, tot:m.points.length, won, srv, srvW, ret, retW, prn, prw, quick};
}
function mergeStats(list){
  const by = {};
  list.forEach(m=>{ const s = matchStats(m); s.rows.forEach(r=>{ const k = r.label; by[k] = by[k] || {label:k, n:0, won:0, ex:0, exn:0, prn:0, prw:0, ng:0}; ['n','won','ex','exn','prn','prw','ng'].forEach(f=>by[k][f]+=r[f]||0); }); });
  return Object.values(by).filter(r=>r.n>0).sort((a,b)=>b.n-a.n);
}

