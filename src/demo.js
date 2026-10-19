/* Demo data for trying the app: example athletes (minors: first name and initial only), sessions, matches, forms.
   Used by load() in this-phone mode and by "Con dati di prova" when a club is created online. */
function addTourDemo(d){ if(d.tourSeed) return d; d.tourSeed=1; const gs=(d.groups||[]).filter(g=>g.id!=='priv').map(g=>g.id); if(!gs.length) return d; let k=0;
  Object.values(d.season||{}).forEach(y=>Object.values((y&&y.weeks)||{}).forEach(w=>(w.t||[]).forEach(t=>{ if(!t.name || t.who) return;
    const pg=[...new Set((t.players||[]).concat(t.requests||[]).map(pid=>(d.athletes||[]).find(a=>a.id===pid)?.groupId).filter(g=>g&&g!=='priv'))];
    if(k%5===4){ k++; return; } t.who={groups: pg.length?pg:[gs[k%gs.length]], aths:[]}; k++; })));
  const today=new Date().toISOString().slice(0,10); let u=0;
  Object.entries(d.season||{}).forEach(([y,yy])=>Object.entries((yy&&yy.weeks)||{}).forEach(([n,w])=>(w.t||[]).forEach(t=>{ if(!t.name || weekMonday(+y,+n)<addDays(today,-6)) return;
    const pg=[...new Set((t.players||[]).map(pid=>(d.athletes||[]).find(a=>a.id===pid)?.groupId).filter(g=>g&&g!=='priv'))];
    if(u===1){ delete t.who; u++; return; } t.who={groups:[...new Set([...pg, gs[u%gs.length], gs[(u+1)%gs.length]])], aths:[]}; u++; })));
  return d; }
function addStaffDemo(d){ if(d.staffSeed) return d; d.staffSeed=1; const t=new Date(), iso=n=>{ const x=new Date(t); x.setDate(x.getDate()+n); return new Date(x.getTime()-x.getTimezoneOffset()*6e4).toISOString().slice(0,10); };
  d.fitProg=d.fitProg||{};
  const W1={g1:['Rapidità di piedi','Forza del core','Prevenzione spalla','Resistenza a intervalli','Mobilità e recupero'], g2:['Coordinazione e rapidità','Forza gambe','Prevenzione spalla','Cambi di direzione','Mobilità e recupero']};
  const TX=['Scala 4×, sprint 5 m ×6, partenze su segnale','Plank 3×30″, dead bug 3×10, pallone medico 3×8','Elastici: extrarotazioni 3×12, Y-T-W 2×10','Navette 6×20 m, rec. 40″','Allungamento dinamico 15′, respirazione'];
  Object.entries(W1).forEach(([gid,ts])=>{ if(!(d.groups||[]).some(g=>g.id===gid)) return; const ex=d.fitProg[gid]; if(ex && (ex.weeks||[]).some(w=>w.name||(w.days||[]).some(x=>x.title||x.text))) return; d.fitProg[gid]={cur:1, weeks:[{name:gid==='g1'?'Rapidità e forza':'Coordinazione', days:ts.map((x,i)=>({title:x, text:TX[i]}))}]}; });
  d.mforms=d.mforms||[]; const g2a=(d.athletes||[]).find(a=>a.groupId==='g2');
  d.mforms.push({id:'demo-c1', mcycle:true, title:'Gestione dell’errore', goal:'Dopo un errore, tornare concentrati entro il punto successivo', who:{groups:['g1'], aths:g2a?[g2a.id]:[]}, date:t.toISOString(),
    meets:[{id:'dm1', date:iso(-5), time:'18:45', title:'Cosa mi dico dopo un errore', act:'Discussione di gruppo: frasi che aiutano e frasi che bloccano', home:'Scegli la tua parola chiave e scrivila sul polsino', done:true},
           {id:'dm2', date:iso(2), time:'18:45', title:'La routine dei 15 secondi', act:'Prova in campo: reazione, respiro, piano, parola chiave', home:'Usa la routine in ogni punto del match del venerdì'},
           {id:'dm3', date:iso(9), time:'18:45', title:'Errori e punteggio', act:'Situazioni di punteggio: 30-40, palla break'}]});
  d.mforms.push({id:'demo-c2', mcycle:true, title:'Concentrazione e routine pre-gara', goal:'Arrivare al torneo con una routine chiara', who:{groups:['g2'], aths:[]}, date:t.toISOString(),
    meets:[{id:'dm4', date:iso(4), time:'17:30', title:'La mia routine prima del match', act:'Ognuno costruisce la sua lista: riscaldamento, piano A e B, parola chiave', home:'Prova la routine prima della partita del sabato'}]});
  return d; }
function addPlDemo(d){ if(d.plSeed) return d; d.plSeed=1; d.priv=d.priv||{}; const ps=(d.athletes||[]).filter(a=>a.groupId==='priv'); const t=new Date(), iso=n=>{ const x=new Date(t); x.setDate(x.getDate()+n); return new Date(x.getTime()-x.getTimezoneOffset()*6e4).toISOString().slice(0,10); };
  const plan=[[0,'17:00',60],[2,'18:00',60],[0,'18:30',45],[3,'17:30',60],[1,'16:00',90],[4,'19:00',60],[2,'15:30',45]];
  plan.forEach(([n,tm,m],i)=>{ const a=ps[i%ps.length]; if(!a) return; const pv=d.priv[a.id]=d.priv[a.id]||{prog:{title:'',freq:''},goals:[],lessons:[]}; (pv.sched=pv.sched||[]).push({id:'pl'+i, date:iso(n), time:tm, dur:m}); });
  return d; }
function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const ROSTER = [{"id": "r0", "groupId": "g1", "name": "Sofia L.", "pin": "8411", "ppin": "8629"}, {"id": "r1", "groupId": "g1", "name": "Giulia R.", "pin": "8402", "ppin": "9320"}, {"id": "r2", "groupId": "g1", "name": "Aurora B.", "pin": "4111", "ppin": "4025"}, {"id": "r3", "groupId": "g1", "name": "Emma C.", "pin": "9387", "ppin": "8794"}, {"id": "r4", "groupId": "g1", "name": "Ginevra T.", "pin": "4050", "ppin": "2542"}, {"id": "r5", "groupId": "g1", "name": "Alice N.", "pin": "8316", "ppin": "5970"}, {"id": "r6", "groupId": "g2", "name": "Lorenzo V.", "pin": "3323", "ppin": "2485"}, {"id": "r7", "groupId": "g2", "name": "Edoardo G.", "pin": "9825", "ppin": "1686"}, {"id": "r8", "groupId": "g2", "name": "Pietro C.", "pin": "7490", "ppin": "8421"}, {"id": "r9", "groupId": "g2", "name": "Diego F.", "pin": "3580", "ppin": "1245"}, {"id": "r10", "groupId": "g2", "name": "Samuele P.", "pin": "9656", "ppin": "2034"}, {"id": "r11", "groupId": "g3", "name": "Anna D.", "pin": "1975", "ppin": "1584"}, {"id": "r12", "groupId": "g3", "name": "Marco T.", "pin": "4116", "ppin": "4963"}, {"id": "r13", "groupId": "g3", "name": "Elena S.", "pin": "1492", "ppin": "8601"}, {"id": "r14", "groupId": "g3", "name": "Luca B.", "pin": "6345", "ppin": "8217"}, {"id": "r15", "groupId": "g3", "name": "Noemi R.", "pin": "4200", "ppin": "9505"}, {"id": "r16", "groupId": "g3", "name": "Filippo M.", "pin": "4828", "ppin": "5819"}, {"id": "r17", "groupId": "g4", "name": "Martina Z.", "pin": "9188", "ppin": "1075"}, {"id": "r18", "groupId": "g4", "name": "Nicola P.", "pin": "2392", "ppin": "8492"}, {"id": "r19", "groupId": "g4", "name": "Irene C.", "pin": "5557", "ppin": "7664"}, {"id": "r20", "groupId": "g4", "name": "Tommaso V.", "pin": "2363", "ppin": "5161"}, {"id": "r21", "groupId": "g4", "name": "Beatrice G.", "pin": "6165", "ppin": "4762"}];
function seed(){
  return addShort(addExample5(addExample4(addExample({ roster:6, example:false, coachCode:'MAESTRO', groups:[{id:'g1', name:'AGO 1', code:'AGO1', week:1},{id:'g2', name:'AGO 2', code:'AGO2', week:1, freq:4},{id:'g3', name:'Pre-agonistica U12', code:'U12', week:1, freq:3, prog:'own', lesson:{dur:90, phases:[{k:'att',n:'Attivazione',m:12},{k:'p1',n:'Pausa',m:3,pause:true},{k:'pr',n:'Fase centrale',m:30},{k:'sr',n:'Servizio e risposta',m:15},{k:'ap',n:'Gioco a punti',m:30}]}},{id:'g4', name:'Scuola tennis U10', code:'U10', week:1, freq:2, prog:'own', lesson:{dur:60, phases:[{k:'att',n:'Riscaldamento e coordinazione',m:12},{k:'pr',n:'Tecnica',m:20},{k:'sr',n:'Servizio',m:10},{k:'ap',n:'Giochi a squadre',m:18}]}},{id:'priv', name:'Lezioni private', code:'PRIV', week:1}], profiles:{}, priv:{}, att:{}, notes:[], well:[], notices:[], season:{2026:JSON.parse(JSON.stringify(SEASON2026))}, athletes:JSON.parse(JSON.stringify(ROSTER)), results:[], matches:[], forms:[], tests:[], customEx:[], plan:{}, provaEdit:{}, session:null, live:null, seen:new Date().toISOString() }))));
}

/* short example programmes: U12 three weeks with 3 sessions, U10 two weeks with 2 sessions */
function addShort(d){
  d.customEx = d.customEx || []; const CX = [{"id": "cx_u10a", "custom": true, "ph": "att", "t": "Il semaforo", "chip": "Riscaldamento con la palla", "lines": ["Verde = palleggio libero, giallo = palla alta, rosso = fermi e split.", "Il maestro chiama i colori mentre i bambini palleggiano a coppie nel mini campo."]}, {"id": "cx_u10b", "custom": true, "ph": "pr", "t": "Dritto nel cerchio", "chip": "Mini campo, palla rossa", "lines": ["Cerchi a terra nel campo avversario: 1 punto se la palla rimbalza nel cerchio.", "Il maestro lancia dalla mano; dopo 5 lanci si cambia."]}, {"id": "cx_u10c", "custom": true, "ph": "pr", "t": "Rovescio a due mani: la scopa", "chip": "Palla rossa", "lines": ["Prima il gesto senza palla, come spazzare il pavimento da basso verso alto.", "Poi 10 lanci facili dal maestro, la palla deve superare la rete alta."]}, {"id": "cx_u10d", "custom": true, "ph": "sr", "t": "Servizio dal basso al bersaglio", "chip": "Servizio semplificato", "lines": ["Servizio dal basso o con lancio basso verso un cono nel quadrato.", "3 punti se colpisci il cono, 1 se la palla entra."]}, {"id": "cx_u10e", "custom": true, "ph": "ap", "t": "La sfida dei 10 scambi", "chip": "Gioco a coppie", "lines": ["A coppie nel mini campo: contate gli scambi senza errori.", "Record della coppia: il prossimo allenamento si prova a batterlo."]}, {"id": "cx_u10f", "custom": true, "ph": "ap", "t": "Re del campo", "chip": "Gioco a squadre", "lines": ["Un bambino è il re: chi vince il punto prende il suo posto.", "Il re resta sul campo finché vince; si conta chi è rimasto re più volte."]}, {"id": "cx_u12a", "custom": true, "ph": "att", "t": "Palleggio a zone", "chip": "Riscaldamento a 3/4 campo", "lines": ["Palleggio incrociato, poi lungolinea quando il maestro dice cambio.", "Obiettivo: 20 colpi senza errori per coppia."]}, {"id": "cx_u12b", "custom": true, "ph": "ap", "t": "Punti a obiettivo", "chip": "Gioco a punti", "lines": ["Punto doppio se lo vinci con il colpo della settimana.", "Set a 7 punti, si cambia avversario a ogni set."]}];
  CX.forEach(e=>{ if(!d.customEx.some(x=>x.id===e.id)) d.customEx.push(e); });
  d.own = d.own || {}; const OWN = {"g3": {"cur": 1, "weeks": [{"name": "Costruire lo scambio", "days": [{"title": "Diagonale profonda", "note": "Tenere la palla profonda in diagonale prima di cambiare.", "ex": ["cx_u12a", "w1d0pr0", "w1d0sr0", "w1d0ap0"]}, {"title": "Il diritto che comanda", "note": "Girarsi attorno alla palla per usare il diritto.", "ex": ["w1d1att0", "w1d1pr0", "w1d1sr0", "cx_u12b"]}, {"title": "Partita a tema", "note": "Game da 30-30 e tie-break con l'arma dichiarata.", "ex": ["w1d4att0", "w1d4sr0", "w1d1ap0", "w1d0ap0"]}, {"title": "", "note": "", "ex": []}, {"title": "", "note": "", "ex": []}]}, {"name": "Difendere e ripartire", "days": [{"title": "La difesa alta", "note": "Palla alta e profonda quando si è in difficoltà.", "ex": ["w2d0att0", "w2d0pr0", "w2d0sr0", "w2d0ap0"]}, {"title": "Il contrattacco", "note": "Riconoscere la palla che perde peso e rientrare nello scambio.", "ex": ["w2d1att0", "w2d3pr0", "w2d1sr0", "w2d1ap0"]}, {"title": "Partita a tema", "note": "Punti che iniziano in svantaggio.", "ex": ["w2d4att0", "w2d4sr0", "w2d0ap0", "cx_u12b"]}, {"title": "", "note": "", "ex": []}, {"title": "", "note": "", "ex": []}]}, {"name": "Servizio e risposta", "days": [{"title": "Gli schemi del servizio", "note": "Servizio + primo colpo nello spazio.", "ex": ["w3d0att0", "w3d0pr0", "w3d0sr0", "w3d0ap0"]}, {"title": "La seconda si attacca", "note": "Risposta aggressiva sulla seconda di servizio.", "ex": ["w3d1att0", "w3d1pr0", "w3d1sr0", "w3d1ap0"]}, {"title": "Partita a tema", "note": "Tie-break con intenzione dichiarata.", "ex": ["w3d4att0", "w3d4sr0", "w3d2ap0", "w3d0ap0"]}, {"title": "", "note": "", "ex": []}, {"title": "", "note": "", "ex": []}]}]}, "g4": {"cur": 1, "weeks": [{"name": "Palla rossa: controllo", "days": [{"title": "Dritto e coordinazione", "note": "Mini campo, palla rossa, tanti tocchi a testa.", "ex": ["cx_u10a", "cx_u10b", "cx_u10e"]}, {"title": "Rovescio e gioco", "note": "Rovescio a due mani e primo gioco a punti.", "ex": ["cx_u10a", "cx_u10c", "cx_u10f"]}, {"title": "", "note": "", "ex": []}, {"title": "", "note": "", "ex": []}, {"title": "", "note": "", "ex": []}]}, {"name": "Palla rossa: servizio e gioco", "days": [{"title": "Il servizio", "note": "Servizio dal basso e primi punti.", "ex": ["cx_u10a", "cx_u10d", "cx_u10e"]}, {"title": "Tutti in partita", "note": "Ripasso di dritto e rovescio, poi re del campo.", "ex": ["cx_u10b", "cx_u10c", "cx_u10f"]}, {"title": "", "note": "", "ex": []}, {"title": "", "note": "", "ex": []}, {"title": "", "note": "", "ex": []}]}]}};
  Object.keys(OWN).forEach(k=>{ if(!d.own[k]) d.own[k] = OWN[k]; });
  return d;
}

/* ---------- example data for testing (first two athletes + private lessons) ---------- */
function addExample(d){
  const day = n => new Date(Date.now() - n*864e5).toISOString();
  const has = (arr, f) => arr.some(f);
  const r = rng(7);
  // daily tests, week 1
  [['r0',[17,6,5,4,19]],['r1',[13,7,4,6,15]]].forEach(([id,v])=>{
    if(has(d.results, x=>x.athleteId===id)) return;
    v.forEach((ok,dd)=>{ const pv=PROVA[1][dd]; d.results.push({id:uid(), athleteId:id, groupId:'g1', week:1, day:dd, kind:pv.k, ok, tot:pv.k==='su'?pv.n:null, date:day(5-dd)}); });
  });
  // tests weeks 1 and 6
  const T = {r0:[{fondo:14,palleggi:26,salita:9,volee:6,servizio:5,sprint:1.32,cod:3.05,reaz:1.58},{fondo:18,palleggi:31,salita:13,volee:8,servizio:7,sprint:1.28,cod:2.94,reaz:1.49}],
             r1:[{fondo:11,palleggi:29,salita:7,volee:8,servizio:4,sprint:1.36,cod:3.12,reaz:1.62},{fondo:15,palleggi:33,salita:10,volee:9,servizio:6,sprint:1.33,cod:3.01,reaz:1.55}]};
  Object.entries(T).forEach(([id,[w1,w6]])=>{ if(has(d.tests,x=>x.athleteId===id)) return; d.tests.push({id:uid(), athleteId:id, week:1, date:day(20), v:w1}, {id:uid(), athleteId:id, week:6, date:day(2), v:w6}); });
  // questionnaires and forms
  if(!has(d.forms, f=>f.athleteId==='r0')){
    d.forms.push({id:uid(), athleteId:'r0', kind:'tipo', by:'student', week:1, date:day(6), ans:{0:0,1:0,2:2,3:2,4:0,5:1,6:2,7:1,8:0,9:0,10:2,11:0}});
    const fa = {arma:'Il diritto', quando:'la palla arriva centrale o corta', evito:'Il rovescio in corsa', vinco:'Diritto incrociato profondo'};
    [5,3,4,2,3,2,3,2,2,4].forEach((v,i)=>fa['f'+i]=v); [5,2,4,3,2,1,2,1,1,3].forEach((v,i)=>fa['u'+i]=v); [1,0,0,1,0,1].forEach((v,i)=>fa['p'+i]=v);
    d.forms.push({id:uid(), athleteId:'r0', kind:'arma', by:'student', week:1, date:day(6), ans:fa});
    d.forms.push({id:uid(), athleteId:'r0', kind:'sett', by:'student', week:1, date:day(1), ans:{r0:5,r1:4,r2:3,r3:3,r4:4,r5:5,t1:'Entrare sulla palla corta e attaccare in salita',t2:'Quando la palla era profonda volevo comunque attaccare',t3:'Aspettare la palla giusta prima di girare il diritto',used:0,best:2}});
    d.forms.push({id:uid(), athleteId:'r0', kind:'pre', by:'student', week:1, date:day(3), ans:{evento:'Torneo giovanile, primo turno',avv:'Giocatrice mancina',sa:'Rovescio in back, viene poco a rete',fis:4,car:5,cal:3,pianoA:'Diagonale profonda sul rovescio, poi entro sulla palla corta',pianoB:'Palle alte e cariche per toglierle il ritmo',arma:'Diritto incrociato',focus:'Scegliere prima del punto',parola:'Profonda, poi entro',risc:'Sì'}});
    d.forms.push({id:uid(), athleteId:'r0', kind:'post', by:'student', week:1, date:day(3), ans:{evento:'Torneo giovanile, primo turno',avv:'Giocatrice mancina',esito:'Vinta',punteggio:'6-4 3-6 10-7',pianoA:4,pianoB:'Sì, ma tardi',imp:3,emo:3,impegno:5,ok:'Il diritto incrociato e la risposta profonda',ko:'Troppi errori con il rovescio in corsa nel secondo set',avvfa:'Mi ha giocato tanti back bassi sul rovescio',allena:'Il rovescio su palla bassa e la pazienza nello scambio'}});
    d.forms.push({id:uid(), athleteId:'r0', kind:'gen', by:'parent', week:1, date:day(4), ans:{q0:'Che diventi più autonoma e si diverta anche quando perde',q2:'Racconta soprattutto le partite e gli esercizi a punti',q3:'Dopo una sconfitta è nervosa per un po’, poi ne parla con calma',q6:'Non molla mai, anche quando è sotto nel punteggio',q10:'Vederla preparare da sola borsa e riscaldamento prima dei tornei'}});
  }
  if(!has(d.forms, f=>f.athleteId==='r1')){
    d.forms.push({id:uid(), athleteId:'r1', kind:'tipo', by:'student', week:1, date:day(6), ans:{0:1,1:2,2:0,3:1,4:2,5:0,6:0,7:0,8:1,9:2,10:1,11:2}});
    const fb = {arma:'La volée', quando:'riesco a venire avanti dopo una palla corta', evito:'Il diritto da fondo quando la palla è alta', vinco:'Volée di rovescio'};
    [3,4,3,3,4,5,4,3,4,2].forEach((v,i)=>fb['f'+i]=v); [2,4,2,3,4,4,3,3,4,1].forEach((v,i)=>fb['u'+i]=v); [0,1,1,0,1,0].forEach((v,i)=>fb['p'+i]=v);
    d.forms.push({id:uid(), athleteId:'r1', kind:'arma', by:'student', week:1, date:day(6), ans:fb});
    d.forms.push({id:uid(), athleteId:'r1', kind:'sett', by:'student', week:1, date:day(1), ans:{r0:4,r1:3,r2:4,r3:2,r4:5,r5:4,t1:'La volée dopo l’approccio',t2:'Non mi accorgevo quando la palla era abbastanza corta per entrare',t3:'Fare la routine tra i punti',used:1,best:0}});
    d.forms.push({id:uid(), athleteId:'r1', kind:'pre', by:'student', week:1, date:day(2), ans:{evento:'Amichevole al circolo',avv:'Compagna del gruppo',fis:3,car:3,cal:4,pianoA:'Venire a rete appena posso',pianoB:'Restare a fondo e giocare alto',focus:'Lo split prima della volée',parola:'Avanti',risc:'In parte'}});
    d.forms.push({id:uid(), athleteId:'r1', kind:'post', by:'student', week:1, date:day(2), ans:{evento:'Amichevole al circolo',avv:'Compagna del gruppo',esito:'Persa',punteggio:'4-6 5-7',pianoA:3,pianoB:'No',imp:2,emo:4,impegno:4,ok:'Le volée quando ero già vicina alla rete',ko:'Entravo su palle troppo profonde e mi passava',allena:'Riconoscere la palla giusta per entrare'}});
    d.forms.push({id:uid(), athleteId:'r1', kind:'gen', by:'parent', week:1, date:day(5), ans:{q1:'Vorremmo che fosse più sicura di sé nelle partite',q5:'Prepara la borsa da sola, ma dimentica spesso l’acqua',q8:'Il martedì ha il rientro a scuola, a volte arriva stanca',q11:'Le piace molto giocare il doppio'}});
  }
  d.profiles = d.profiles || {};
  d.profiles.r0 = d.profiles.r0 || {share:true, date:day(1), tecf:'Diritto pesante e profondo, servizio in kick', tecm:'Rovescio su palla bassa, volée di rovescio', tatf:'Costruisce bene il punto in diagonale', tatm:'Attacca anche su palle troppo profonde', menf:'Grinta e voglia di vincere', menm:'Gestione della frustrazione dopo gli errori', fisf:'Veloce nel primo passo', fism:'Recupero tra i punti nei match lunghi'};
  d.profiles.r1 = d.profiles.r1 || {share:true, date:day(1), tecf:'Mano sensibile, volée e palla corta', tecm:'Diritto da fondo su palla alta', tatf:'Cerca la rete con coraggio', tatm:'Scelta del momento per entrare', menf:'Calma e attenzione in allenamento', menm:'Fiducia nei punti importanti', fisf:'Coordinazione e reattività a rete', fism:'Forza nelle gambe per i colpi da fondo'};
  // match analysis examples
  if(!has(d.matches, m=>m.a.id==='r0')){
    const f = {type:'set', sets:1, games:4, tb:true, decider:'tb10', ad:false, first:0};
    const m = {id:uid(), groupId:'g1', week:1, date:day(1), a:{id:'r0',name:'Sofia L.'}, b:{id:'r1',name:'Giulia R.'}, format:f, choices:W(1).choices.map(c=>c.label), trackEx:true, points:[], done:true};
    let st = newState(f);
    while(st.done===null && m.points.length<120){ const ch = r()<.9?Math.floor(r()*4):null; const ex = ch===null?null:r()<.7; const w = r()<(ex?.62:.4)?0:1; m.points.push({w, ch, ex, srv:curServer(st), pr:isPressure(f,st)}); applyPoint(f, st, w); }
    d.matches.push(m);
  }
  if(!has(d.matches, m=>m.a.id==='r1')){
    const pts = []; for(let i=0;i<22;i++){ const t = []; if(r()<.45) t.push(0); if(r()<.25) t.push(1); if(r()<.4) t.push(2); pts.push(t.length ? {t, w:r()<.55?0:1} : {t:[], w:null, empty:true}); }
    d.matches.push({id:uid(), mode:'task', groupId:'g1', week:1, date:day(2), a:{id:'r1',name:'Giulia R.'}, b:{id:null,name:'Compagna'}, kind:'Tie-break', tasks:['Palla corta','Cross stretto','Vado a rete'], points:pts, done:true});
  }
  // private lessons (test people)
  d.priv = d.priv || {};
  const P4 = [
    ['pv1','Riccardo B.','Servizio e risposta','1 ora a settimana, ottobre–dicembre',[['tec','Seconda di servizio carica: 7 su 10 dentro','doing'],['tat','Risposta profonda al centro sulla prima','todo'],['men','Routine prima del servizio','done']],[['Servizio kick, 3 serie da 10; risposte al centro dal cesto','Seconda sotto punteggio'],['Seconde a bersaglio, poi game solo seconde','Risposta sulla seconda']]],
    ['pv2','Ettore M.','Gioco a rete','2 ore a settimana',[['tec','Volée bassa di rovescio solida','doing'],['tat','Approccio lungolinea e copertura','doing'],['fis','Split step al momento giusto','todo']],[['Approccio e prima volée, 4 serie da 8','Smash e copertura del pallonetto']]],
    ['pv3','Nicolò F.','Ripresa dopo la pausa estiva','1 ora a settimana',[['fis','Resistenza negli scambi lunghi','doing'],['tec','Diritto in topspin più carico','todo']],[['Palleggio di controllo, diagonali, 2 x 5 minuti a ritmo','Aumentare il ritmo del palleggio']]],
    ['pv4','Carlo S.','Preparazione torneo sociale','1 ora e mezza a settimana, fino a novembre',[['tat','Piano A e piano B contro chi difende','todo'],['men','Gestire i punti importanti','todo']],[]]
  ];
  P4.forEach(([id,name,title,freq,goals,lessons],i)=>{
    if(d.athletes.some(a=>a.id===id)) return;
    d.athletes.push({id, groupId:'priv', name, pin:String(4100+i*7), ppin:String(5200+i*9)});
    d.priv[id] = {prog:{title, freq}, goals:goals.map(([area,text,st])=>({id:uid(), area, text, st})), lessons:lessons.map(([what,next],j)=>({id:uid(), date:day(14-j*7), what, next}))};
  });
  d.profiles.pv1 = d.profiles.pv1 || {share:true, date:day(3), tecf:'Prima di servizio potente', tecm:'Seconda troppo piatta', tatf:'Attacca bene la palla corta', tatm:'Risposta spesso corta', menf:'Motivato', menm:'Si innervosisce dopo i doppi falli', fisf:'Esplosivo', fism:'Mobilità delle spalle'};
  d.seen = day(7);
  return d;
}

function addExample4(d){
  const iso = n => { const x = new Date(Date.now()-n*864e5); return new Date(x.getTime()-x.getTimezoneOffset()*6e4).toISOString().slice(0,10); };
  d.att = d.att || {}; const team = d.athletes.filter(a=>a.groupId==='g1').map(a=>a.id);
  [1,2,3,4,6,7,8].forEach((n,k)=>{ const dt = new Date(Date.now()-n*864e5); if(dt.getDay()===0||dt.getDay()===6) return; const r = {}; team.forEach((id,i)=>{ r[id] = (i+k)%9===0 ? 'a' : (i+k)%11===0 ? 'g' : 'p'; }); d.att[iso(n)+'|g1'] = r; });
  d.well = d.well || [];
  d.well.push({athleteId:'r0', date:iso(1), fat:4, pain:true, where:'polso destro'}, {athleteId:'r0', date:iso(2), fat:3, pain:false, where:''}, {athleteId:'r1', date:iso(1), fat:5, pain:false, where:''});
  d.notes = d.notes || []; d.notes.push({id:uid(), athleteId:'r0', date:new Date(Date.now()-864e5).toISOString(), text:'Oggi rovescio molto più solido in diagonale'});
  d.notices = d.notices || []; d.notices.push({id:uid(), date:new Date(Date.now()-36e5).toISOString(), text:'Esempio di avviso: venerdì allenamento spostato alle 17:00.', to:'all'});
  const pv = d.priv.r0 = d.priv.r0 || {prog:{title:'',freq:''}, goals:[], lessons:[]}; if(!pv.goals.length) pv.goals.push({id:uid(), area:'tec', text:'Rovescio su palla bassa: 7 su 10 oltre i 3/4', st:'doing'}, {id:uid(), area:'men', text:'Routine dopo l’errore', st:'todo'});
  d.ex4 = true; return d;
}

function addExample5(d){
  d.season = d.season || {}; if(!d.season[2026]) d.season[2026] = JSON.parse(JSON.stringify(SEASON2026));
  const W = d.season[2026].weeks;
  const T = (name) => ({name, kind:'', deadline:'', info:'', players:[], results:{}});
  const set = (n, i, kind, deadline, res, name) => { W[n] = W[n] || {type:'comp', t:[], note:''}; while(W[n].t.length<=i) W[n].t.push(T('')); const t = W[n].t[i]; if(name) t.name = name; t.kind = kind; t.deadline = deadline; t.players = Object.keys(res); t.results = {}; Object.entries(res).forEach(([id,[round,note]])=>{ t.results[id] = {round:round||'', note:note||''}; }); };
  // past season, from the 2026 sheet
  set(8,0,'ob','2026-01-26',{r0:['2° turno','6-3 2-6 4-6']});
  set(9,0,'sv','2026-02-16',{r0:['Quarti','persa 3-6 4-6'], r1:['1° turno','persa 5-7 2-6']});
  set(11,1,'esp','2026-03-02',{r1:['Ottavi','persa al terzo set']});
  set(14,0,'ob','2026-03-23',{r0:['Semifinale','persa 4-6 6-7'], r1:['2° turno','']});
  set(18,0,'ob','2026-04-20',{r0:['Quarti','persa 6-4 4-6 8-10']});
  set(20,1,'sv','2026-05-04',{r1:['3° turno','']});
  set(21,0,'sv','2026-05-11',{r0:['Finale','persa 5-7 6-4 7-10'], r1:['Ottavi','']});
  set(22,0,'ob','2026-05-18',{r0:['2° turno','persa 2-6 6-3 5-7']});
  set(25,0,'esp','2026-06-08',{r1:['Semifinale','vinti due match al terzo set']});
  // simulated autumn
  [40,41,43,47,48].forEach(n=>{ W[n] = W[n] || {type:'train', t:[], note:''}; });
  set(42,0,'sv','2026-10-13',{r0:[], r1:[]}, 'Torneo giovanile U14 Palermo (simulazione)'); W[42].type='comp';
  W[44] = {type:'taper', t:[], note:'Scarico prima dei regionali: volumi ridotti, più qualità'};
  set(45,0,'ob','2026-10-27',{r0:[], r1:[]}, 'Campionati regionali U14 (simulazione)'); W[45].type='comp';
  set(45,1,'esp','2026-10-30',{}, 'Torneo TE 14 cat. 3 (simulazione)');
  W[46] = {type:'rest', t:[], note:'Settimana di riposo dopo i regionali'};
  set(49,0,'esp','2026-11-23',{r1:[]}, 'Torneo di Natale U14 (simulazione)'); W[49].type='comp';
  d.ex5 = true; return d;
}
