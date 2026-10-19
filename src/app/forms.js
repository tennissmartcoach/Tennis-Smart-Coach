/* Questionnaires, parent pages, coach tests, pre/post match and built-in forms */
/* ---------- questionnaires ---------- */
const fdate = d => new Date(d).toLocaleDateString('it-IT',{day:'numeric',month:'short'});
const formsOf = (id, kind) => S.forms.filter(f=>f.athleteId===id && f.kind===kind).sort((a,b)=>a.date<b.date?-1:1);
function tipoResult(ans, tq){
  tq = tq || defTpl('tipo').tq; const c = {}; TYPES.forEach(t=>c[t[0]]=0);
  Object.entries(ans).forEach(([i,o])=>{ const q = tq[+i]; if(q && q.o[o] && c[q.o[o].ty]!==undefined) c[q.o[o].ty]++; });
  const order = TYPES.map(t=>t[0]).sort((a,b)=>c[b]-c[a]);
  return {c, first:order[0], second:order[1]};
}
const tname = k => TYPES.find(t=>t[0]===k)[1];
const tipoOf = f => tipoResult(f.ans, tplOf(f).tq);
function tipoBars(ans, tq){
  tq = tq || defTpl('tipo').tq; const r = tipoResult(ans, tq), N = tq.length || 1;
  return `<div class="bars">${TYPES.map(([k,n])=>`<div class="bar"><div class="lab"><span>${n}</span><span>${r.c[k]} su ${N}</span></div><div class="track"><div class="fill" style="width:${r.c[k]/N*100}%;background:${tcol(k)}"></div></div></div>`).join('')}</div>`;
}
function rateSeg(key, val){ return `<div class="seg" role="group">${[1,2,3,4,5].map(n=>`<button data-a="rate" data-k="${key}" data-v="${n}" aria-pressed="${val===n}">${n}</button>`).join('')}</div>`; }
function formsList(){
  const a = me(), g = grp(a.groupId);
  const card = (kind, when, desc) => { const fs = formsOf(a.id, kind), last = fs[fs.length-1];
    let res = '';
    if(last && kind==='tipo'){ const r = tipoOf(last); res = `<p class="small">Ultimo risultato: <b>${tname(r.first)}</b>, poi ${tname(r.second)}</p>`; }
    if(last && kind==='arma') res = `<p class="small">La mia arma: <b>${esc(last.ans.arma||'–')}</b></p>`;
    return `<section class="card"><div class="row between"><h2>${esc(fname(kind))}</h2><span class="tag teal">${when}</span></div><p class="muted small">${desc}</p>${res}
      ${fs.length?`<p class="small muted">Compilata ${fs.length} ${fs.length===1?'volta':'volte'} · ultima il ${fdate(last.date)} (sett. ${last.week})</p>`:''}
      <button class="btn block" data-a="openform" data-k="${kind}">Compila</button></section>`; };
  const mine = ['pre','post','sett','tipo','arma'].filter(k=>formFor(k, a));
  if(!mine.length) return `<h1>Le mie schede</h1><section class="card"><p class="muted">Per ora non ci sono schede da compilare.</p></section>`;
  return `<h1>Le mie schede</h1>
    ${!mine.includes('pre')?'':card('pre','Ogni partita','Prima di entrare in campo: come ti senti, il piano A e il piano B, la tua arma.')}
    ${!mine.includes('post')?'':card('post','Ogni partita','Dopo la partita: cosa ha funzionato, cosa no, cosa allenare.')}
    ${!mine.includes('sett')?'':card('sett','Ogni settimana, dopo l’allenamento 5','Cinque minuti dopo il confronto finale: come è andata la settimana.')}
    ${!mine.includes('tipo')?'':card('tipo','Sett. 1 · 6 · 12',tplNow('tipo').tq.length+' situazioni di gioco. Rispondi con quello che fai davvero, non con quello che vorresti fare.')}
    ${!mine.includes('arma')?'':card('arma','Sett. 1 · 6 · 12','Quanto ti fidi di ogni colpo e quanto lo usi nei punti importanti.')}`;
}
function formView(){
  const F = U.form, a = me(), g = grp(a.groupId), w = W(g.week||1), A = F.ans, T = F.tpl || (F.tpl = tplNow(F.kind));
  const head = `<button class="btn ghost" data-a="closeform" style="align-self:flex-start">‹ Indietro</button>`;
  if(F.kind==='pre' || F.kind==='post') return matchFormView(F.kind, A);
  if(F.kind==='tipo'){
    const tq = T.tq;
    if(F.step < tq.length){
      const q = tq[F.step];
      return `${head}<section class="card"><span class="eyebrow">Domanda ${F.step+1} di ${tq.length}</span>
        <div class="track"><div class="fill clay" style="width:${F.step/tq.length*100}%"></div></div>
        <h2>${esc(q.q)}</h2>
        <div class="list">${q.o.map((o,i)=>`<button class="btn ${A[F.step]===i?'':'ghost'} block" data-a="tipoans" data-k="${i}" style="text-align:left">${esc(o.t)}</button>`).join('')}</div>
        ${F.step>0?`<button class="chip" data-a="tipoback" style="align-self:flex-start">‹ Domanda precedente</button>`:''}</section>`;
    }
    const r = tipoResult(A, tq);
    return `${head}<section class="card"><span class="eyebrow">Il tuo risultato</span><h1 style="color:${tcol(r.first)}">${tname(r.first)}</h1>
      <p>${esc(TYPES.find(t=>t[0]===r.first)[2])}</p><p class="small muted">Seconda: <b>${tname(r.second)}</b>. Non è un'etichetta: in 12 settimane le provi tutte e il risultato può cambiare.</p>${tipoBars(A, tq)}
      <button class="btn clay block" data-a="saveform">Salva e invia al maestro</button><button class="btn ghost block" data-a="tipoback">Rivedi le risposte</button></section>`;
  }
  if(F.kind==='arma') return `${head}
    <section class="card"><span class="eyebrow">Sett. ${g.week}</span><h1>${esc(T.title)}</h1>${T.intro?`<p class="muted small">${esc(T.intro)}</p>`:''}</section>
    ${(T.shots||[]).map(sh=>`<section class="card"><h3>${esc(sh.n)}</h3><div class="field"><label>Quanto mi fido</label>${rateSeg('f'+sh.k, A['f'+sh.k])}</div><div class="field"><label>Quanto lo uso nei punti importanti</label>${rateSeg('u'+sh.k, A['u'+sh.k])}</div></section>`).join('')}
    ${qsCard(T.qs, A)}
    <button class="btn clay block" data-a="saveform">Salva e invia al maestro</button>`;
  if(F.kind==='sett') return `${head}
    <section class="card"><span class="eyebrow">Settimana ${w.n} · ${esc(w.name)}</span><h1>${esc(T.title)}</h1>${T.intro?`<p class="muted small">${esc(T.intro)}</p>`:''}</section>
    ${qsCard(T.qs, A)}
    <section class="card"><span class="eyebrow">Match Analysis</span>
      <div class="field"><label>La scelta che ho usato di più</label><div class="chips">${w.choices.map((c,i)=>`<button class="chip" data-a="rate" data-k="used" data-v="${i}" aria-pressed="${A.used===i}">${esc(c.label)}</button>`).join('')}</div></div>
      <div class="field"><label>Quella che mi ha fatto vincere più punti</label><div class="chips">${w.choices.map((c,i)=>`<button class="chip" data-a="rate" data-k="best" data-v="${i}" aria-pressed="${A.best===i}">${esc(c.label)}</button>`).join('')}</div></div></section>
    <button class="btn clay block" data-a="saveform">Salva e invia al maestro</button>`;
  if(F.kind==='gen') return `${head}
    <section class="card"><span class="eyebrow">Incontro individuale</span><h1>${esc(T.title)}</h1>${T.intro?`<p class="muted small">${esc(T.intro)}</p>`:''}</section>
    ${qsCard(T.qs, A, true)}
    <button class="btn clay block" data-a="saveform">Invia al maestro</button>`;
  return '';
}

/* ---------- parent ---------- */
function parentWeek(){
  const a = me(), g = grp(a.groupId), w = W(g.week), t = TYPES[(w.n-1)%6];
  return `
    <section class="card">
      <div class="row"><div class="wk" style="background:${wcol(w.n)}"><small>SETT</small>${w.n}</div><div class="grow" style="min-width:0"><span class="eyebrow">Settimana ${w.n} di 12</span><h2>${esc(w.name)}</h2></div></div>
      <p>Questa settimana ${esc(a.name)} lavora sul modo di giocare di chi ${esc(t[2])}</p>
    </section>
    ${typeCard(w.n, false, true)}
    ${weekDays(w.n, false, g)}
    <section class="card" style="background:var(--clay-soft);border-color:transparent">
      <span class="eyebrow">La domanda da fare a casa</span>
      <h1>“Cosa volevi fare?”</h1>
      <p>Prima di “hai vinto?”. Venerdì, prima di ogni punto, ${esc(a.name)} sceglie una di queste:</p>
      <div class="choices">${w.choices.filter(c=>!c.u14 || /U14/i.test(g.name)).map((c,i)=>`<div class="choice" style="background:var(--surface)"><i>${i+1}</i><span>${esc(c.label)}</span></div>`).join('')}</div>
    </section>
    <section class="card"><h3>Come potete aiutarci</h3>
      <div class="list small">
        <div><b style="color:var(--ok)">Sì, grazie</b><br>Lodate l'impegno e le scelte coraggiose, anche quando il punto va male. Aiutateli ad arrivare puntuali, riposati, con acqua e materiale. Avvisateci per tempo di tornei, verifiche e periodi di stanchezza.</div>
        <div><b style="color:var(--ko)">Meglio evitare</b><br>Correggere la tecnica durante l'allenamento o la partita, discutere scelte tecniche nelle chat, giudicare la giornata solo dal risultato.</div>
      </div>
    </section>`;
}
function meetView(){
  const a = me(), fs = formsOf(a.id, 'gen'), last = fs[fs.length-1];
  return `<h1>Incontro con il maestro</h1>
    <section class="card"><p>Gli incontri individuali si fanno ogni 3–4 mesi, o quando serve. Prima dell'incontro potete rispondere ad alcune domande: aiutano il maestro a conoscere meglio ${esc(a.name)}.</p>
      ${last?`<p class="small muted">Ultimo invio il ${fdate(last.date)} · ${Object.values(last.ans).filter(v=>String(v).trim()).length} risposte</p>`:''}
      ${formFor('gen', a)?`<button class="btn clay block" data-a="openform" data-k="gen">${last?'Compila di nuovo':'Rispondi alle domande'}</button>`:''}</section>
    <div class="note"><b>Una regola sola:</b> le questioni tecniche non si discutono nelle chat né davanti ad altri genitori. Per qualsiasi dubbio, chiedete un incontro.</div>`;
}

/* ---------- coach: tests ---------- */
function testsView(){
  if(!U.resGroup) U.resGroup = S.groups[0]?.id;
  const g = grp(U.resGroup); if(!g) return `<section class="card"><p>Crea prima un gruppo nella scheda Gruppi.</p></section>`;
  const as = S.athletes.filter(a=>a.groupId===g.id);
  if(U.testAth && ath(U.testAth)){
    const a = ath(U.testAth); if(!U.testWeek) U.testWeek = 1; const wk = U.testWeek;
    const t = S.tests.find(t=>t.athleteId===a.id && t.week===wk);
    const val = k => t && t.v[k]!==undefined && t.v[k]!==null ? t.v[k] : '';
    return `<button class="btn ghost" data-a="testback" style="align-self:flex-start">‹ Tutti gli atleti</button>
      <section class="card"><span class="eyebrow">${esc(g.name)} · Test</span><h1>${esc(a.name)}</h1>
        <div class="seg" role="group">${TEST_WEEKS.map(n=>`<button data-a="testweek" data-k="${n}" aria-pressed="${n===wk}">Settimana ${n}${S.tests.some(x=>x.athleteId===a.id&&x.week===n)?' ✓':''}</button>`).join('')}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px">${testsDef().map(x=>`<div class="field"><label for="t-${a.id}-${x.k}">${esc(x.l)}<br><span style="font-weight:400">${esc(x.u)}</span></label><input id="t-${a.id}-${x.k}" class="input" inputmode="decimal" value="${val(x.k)}" placeholder="–"></div>`).join('')}</div>
        <button class="btn clay block" data-a="savetest" data-k="${a.id}">Salva i test della settimana ${wk}</button>
        <button class="chip" data-a="tdopen" style="align-self:flex-start">Modifica le prove dei test</button>
      </section>
      <section class="card"><h3>Confronto settimane 1 · 6 · 12</h3>${testTable(a.id)}</section>`;
  }
  return `
    ${S.groups.length>1?`<div class="chips">${S.groups.map(x=>`<button class="chip" data-a="resgroup" data-k="${x.id}" aria-pressed="${x.id===g.id}">${esc(x.name)}</button>`).join('')}</div>`:''}
    <div class="note"><b>Come si fa:</b> tre prove da 1 minuto in palleggio (oltre i 3/4, totali, in fase ascendente), 12 palle di volée, 10 prime di servizio e la prova atletica (due tentativi, vale il migliore). Solo numeri, senza commenti.</div>
    <section class="card" style="padding:4px 16px"><div class="list">${as.map(a=>`<button class="item" data-a="testath" data-k="${a.id}"><span class="grow"><b style="font-size:17px">${esc(a.name)}</b><br><span class="small muted">${TEST_WEEKS.map(n=>`Sett. ${n} ${S.tests.some(x=>x.athleteId===a.id&&x.week===n)?'✓':'–'}`).join(' · ')}</span></span><span class="chev">›</span></button>`).join('') || '<p class="muted">Nessun atleta in questo gruppo.</p>'}</div></section>`;
}
function testTable(id){
  const ts = TEST_WEEKS.map(n=>S.tests.find(t=>t.athleteId===id && t.week===n));
  if(!ts.some(Boolean)) return '<p class="muted">Ancora nessun test.</p>';
  return `<div class="scroll-x"><table class="grid"><thead><tr><th>Prova</th>${TEST_WEEKS.map(n=>`<th>Sett. ${n}</th>`).join('')}</tr></thead><tbody>${testsDef().map(t=>`<tr><td>${esc(t.l)}<br><span class="muted small">${esc(t.u)}</span></td>${ts.map(x=>`<td>${x&&x.v[t.k]!==undefined&&x.v[t.k]!==''?esc(x.v[t.k]):'<span class="pc e">–</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function athleteExtra(id){
  const role = S.session.role;
  const out = {tipo:'',arma:'',sett:'',fam:''};
  if(role==='parent') return out;
  const tipo = formsOf(id,'tipo'), arma = formsOf(id,'arma'), sett = formsOf(id,'sett'), gen = formsOf(id,'gen');
  const lt = tipo[tipo.length-1], la = arma[arma.length-1];
  out.tipo = `<section class="card"><h3>Che tennista sono?</h3>${lt?`<p>Ultimo (sett. ${lt.week}): <b style="color:${tcol(tipoOf(lt).first)}">${tname(tipoOf(lt).first)}</b>, poi ${tname(tipoOf(lt).second)}</p>${tipoBars(lt.ans, tplOf(lt).tq)}${tipo.length>1?`<p class="small muted">Storico: ${tipo.map(f=>`sett. ${f.week} ${tname(tipoOf(f).first)}`).join(' · ')}</p>`:''}`:'<p class="muted">Non ancora compilato.</p>'}</section>`;
  if(la){ const gaps = (tplOf(la).shots||[]).map(sh=>({x:esc(sh.n), f:la.ans['f'+sh.k], u:la.ans['u'+sh.k]})).filter(r=>r.f&&r.u);
    out.arma = `<section class="card"><h3>La mia arma</h3>${ansLines(tplOf(la), la.ans)||'<p class="small muted">Nessuna risposta scritta.</p>'}
      <div class="scroll-x"><table class="grid"><thead><tr><th>Colpo</th><th>Fiducia</th><th>Uso nei punti importanti</th></tr></thead><tbody>${gaps.map(r=>`<tr><td>${r.x}${Math.abs(r.f-r.u)>=2?' <span class="tag">da parlarne</span>':''}</td><td>${r.f}</td><td>${r.u}</td></tr>`).join('')}</tbody></table></div></section>`; }
  else out.arma = `<section class="card"><h3>La mia arma</h3><p class="muted">Non ancora compilata.</p></section>`;
  out.sett = `<section class="card"><h3>La mia settimana</h3>${sett.length?`<div class="list">${sett.slice().reverse().map(f=>{ const T=tplOf(f), vs=T.qs.filter(q=>q.t==='rate').map(q=>f.ans[q.k]).filter(Boolean); const avg = vs.length?(vs.reduce((a,b)=>a+b,0)/vs.length).toFixed(1):'–'; return `<div><div class="row between"><b>Sett. ${f.week} · ${esc(W(f.week).name)}</b><span class="tag pri">media ${avg} su 5</span></div>${ansLines(T, f.ans, ['text','area','seg','pair'])}</div>`; }).join('')}</div>`:'<p class="muted">Nessuna scheda settimanale.</p>'}</section>`;
  if(role==='coach'){ const lg = gen[gen.length-1];
    out.fam = `<section class="card"><h3>Dalla famiglia</h3>${lg?`<p class="small muted">Inviata il ${fdate(lg.date)}</p><div class="list">${tplOf(lg).qs.filter(q=>answered(q,lg.ans)).map(q=>`<div><p class="small muted">${esc(q.l)}</p><p>${ansVal(q,lg.ans[q.k])}</p></div>`).join('')}</div>`:'<p class="muted">La famiglia non ha ancora risposto alla traccia per l’incontro.</p>'}</section>`; }
  return out;
}


/* ---------- pre / post match forms ---------- */
const PRE = [{k:'evento',t:'text',l:'Torneo o partita'},{k:'avv',t:'text',l:'Contro chi gioco'},{k:'sa',t:'area',l:'Cosa so dell’avversario: come gioca, punti forti e deboli'},{k:'fis',t:'rate',l:'Come mi sento fisicamente'},{k:'car',t:'rate',l:'Quanto mi sento carico/a'},{k:'cal',t:'rate',l:'Quanto mi sento calmo/a'},{k:'pianoA',t:'area',l:'Il mio piano A: come voglio giocare'},{k:'pianoB',t:'area',l:'Il mio piano B: cosa cambio se il piano A non funziona'},{k:'arma',t:'text',l:'La mia arma di oggi'},{k:'focus',t:'text',l:'Una sola cosa su cui concentrarmi'},{k:'parola',t:'text',l:'La mia parola chiave'},{k:'risc',t:'seg',l:'Ho fatto il riscaldamento completo?',o:['Sì','In parte','No']}];
const POST = [{k:'evento',t:'text',l:'Torneo o partita'},{k:'avv',t:'text',l:'Avversario'},{k:'esito',t:'seg',l:'Risultato',o:['Vinta','Persa']},{k:'punteggio',t:'text',l:'Punteggio'},{k:'pianoA',t:'rate',l:'Quanto ho seguito il piano A'},{k:'pianoB',t:'seg',l:'Ho usato il piano B?',o:['Sì, al momento giusto','Sì, ma tardi','No']},{k:'imp',t:'rate',l:'Come ho giocato i punti importanti'},{k:'emo',t:'rate',l:'Come ho gestito le emozioni'},{k:'impegno',t:'rate',l:'Il mio impegno'},{k:'ok',t:'area',l:'Cosa ha funzionato'},{k:'ko',t:'area',l:'Cosa non ha funzionato'},{k:'avvfa',t:'area',l:'Cosa ha fatto l’avversario che mi ha messo in difficoltà'},{k:'allena',t:'area',l:'Cosa voglio allenare questa settimana'}];
const MFORMS = {pre:PRE, post:POST};
/* ---------- built-in forms: editable templates (stored in S.mforms with builtin:kind) ---------- */
const BUILTIN = ['pre','post','sett','arma','tipo','gen'];
const BI_WHO = {pre:'Atleta · ogni partita', post:'Atleta · ogni partita', sett:'Atleta · ogni settimana', arma:'Atleta · sett. 1, 6, 12', tipo:'Atleta · sett. 1, 6, 12', gen:'Genitori · prima dell’incontro'};
const BI_INTRO = {pre:'Cinque minuti prima di entrare in campo. Rispondi solo a quello che ti serve. I punteggi vanno da 1 (poco) a 5 (molto).', post:'Da compilare con calma, anche la sera. Prima quello che è andato bene. I punteggi vanno da 1 (poco) a 5 (molto).', sett:'1 = per niente, 5 = moltissimo.', arma:'Da 1 (poco) a 5 (moltissimo).', tipo:'Rispondi con quello che fai davvero, non con quello che vorresti fare.', gen:'Non è un questionario di gradimento. Rispondete solo alle domande che vi sembrano utili, anche 5 o 6: il maestro le legge prima dell’incontro.'};
function defTpl(kind){
  const b = {builtin:kind, title:FORM_NAMES[kind], intro:BI_INTRO[kind]};
  if(kind==='pre'||kind==='post') return {...b, qs:(kind==='pre'?PRE:POST).map(q=>({...q, o:q.o?[...q.o]:undefined}))};
  if(kind==='gen') return {...b, qs:PARENT_Q.map((l,i)=>({k:'q'+i, t:'area', l}))};
  if(kind==='sett') return {...b, qs:[...WK_ITEMS.map((l,i)=>({k:'r'+i, t:'rate', l})), ...WK_T.map(([k,l])=>({k, t:'area', l}))]};
  if(kind==='arma') return {...b, shots:SHOTS.map((n,i)=>({k:String(i), n})), qs:[...ARMA_T.map(([k,l])=>({k, t:'text', l})), ...PAIRS.flatMap(([l,ps],pi)=>ps.map((o,j)=>({k:'p'+(pi*3+j), t:'pair', l, o:[...o]})))]};
  if(kind==='tipo') return {...b, tq:TQ.map(([q,os])=>({q, o:os.map(([t,ty])=>({t, ty}))}))};
  return b;
}
const tplCustom = kind => (S.mforms||[]).find(f=>f.builtin===kind);
const tplNow = kind => JSON.parse(JSON.stringify(tplCustom(kind) || defTpl(kind)));
const tplOf = f => f.tpl || defTpl(f.kind);
const fname = k => (tplCustom(k)||{}).title || FORM_NAMES[k];
function qField(q, A, prev){
  if(q.t==='pair') return `${prev&&prev.t==='pair'&&prev.l===q.l?'':`<h3>${esc(q.l)}</h3>`}<div class="seg" role="group">${q.o.map((o,i)=>`<button data-a="rate" data-k="${q.k}" data-v="${i}" aria-pressed="${A[q.k]===i}">${esc(o)}</button>`).join('')}</div>`;
  return `<div class="field"><label ${q.t==='text'||q.t==='area'?`for="ft-${q.k}"`:''} style="font-weight:600">${esc(q.l)}</label>${
    q.t==='text'?`<input id="ft-${q.k}" class="input" data-c="ftext" data-k="${q.k}" value="${esc(A[q.k]||'')}">`:
    q.t==='area'?`<textarea id="ft-${q.k}" class="input" rows="2" data-c="ftext" data-k="${q.k}">${esc(A[q.k]||'')}</textarea>`:
    q.t==='rate'?rateSeg(q.k, A[q.k]):
    `<div class="seg" role="group">${(q.o||[]).map(o=>`<button data-a="fseg" data-k="${q.k}" data-v="${esc(o)}" aria-pressed="${A[q.k]===o}">${esc(o)}</button>`).join('')}</div>`}</div>`;
}
function qsCard(qs, A, numbered){
  if(numbered) return qs.map((q,i)=>`<section class="card"><label for="ft-${q.k}" style="font-weight:600"><span style="font-family:var(--f-disp);color:var(--clay);font-size:20px">${i+1}</span> ${esc(q.l)}</label>${q.t==='area'||q.t==='text'?`<textarea id="ft-${q.k}" class="input" rows="2" data-c="ftext" data-k="${q.k}">${esc(A[q.k]||'')}</textarea>`:qField({...q,l:''},A).replace('<label  style="font-weight:600"></label>','')}</section>`).join('');
  return qs.length ? `<section class="card">${qs.map((q,i)=>qField(q, A, qs[i-1])).join('')}</section>` : '';
}
const ansVal = (q,v) => q.t==='rate' ? `<b>${esc(v)}/5</b>` : q.t==='pair' ? esc((q.o||[])[v] ?? '') : esc(v);
const answered = (q,ans) => ans[q.k]!==undefined && ans[q.k]!==null && String(ans[q.k]).trim()!=='';
function ansLines(T, ans, only){ return (T.qs||[]).filter(q=>(!only||only.includes(q.t)) && answered(q,ans)).map(q=>`<p class="small"><span class="muted">${esc(q.l)}:</span> ${ansVal(q,ans[q.k])}</p>`).join(''); }
function matchFormView(kind, A){
  const T = U.form.tpl || tplNow(kind);
  return `<button class="btn ghost" data-a="closeform" style="align-self:flex-start">‹ Indietro</button>
    <section class="card"><span class="eyebrow">${kind==='pre'?'Prima della partita':'Dopo la partita'}</span><h1>${esc(T.title)}</h1>
      ${T.intro?`<p class="muted small">${esc(T.intro)}</p>`:''}</section>
    ${qsCard(T.qs, A)}
    <button class="btn clay block" data-a="saveform">Salva e invia al maestro</button>`;
}
function matchFormsSummary(id){
  const fs = S.forms.filter(f=>f.athleteId===id && (f.kind==='pre'||f.kind==='post')).sort((a,b)=>a.date<b.date?1:-1).slice(0,4);
  if(!fs.length) return '';
  return `<section class="card"><h3>Prima e dopo la partita</h3><div class="list">${fs.map(f=>`<div><div class="row between"><b>${esc(fname(f.kind))}</b><span class="small muted">${fdate(f.date)}</span></div>
    ${ansLines(tplOf(f), f.ans)}</div>`).join('')}</div></section>`;
}

