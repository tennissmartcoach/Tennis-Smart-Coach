import re, os
D=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
src=open(D+'smart-coach.html',encoding='utf-8').read()
# the source is split in files; the published page stays one self-contained file
SRC_FILES=[('<link rel="stylesheet" href="src/style.css">','src/style.css','style'),
           ('<script src="src/data.js"></script>','src/data.js','script'),
           ('<script src="src/demo.js"></script>','src/demo.js','script')]
for tag,f,kind in SRC_FILES:
    assert src.count(tag)==1,('manca la riga',tag)
    src=src.replace(tag,'<'+kind+'>\n'+open(D+f,encoding='utf-8').read()+'</'+kind+'>')
cloud=open(D+'online/cloud.js').read()
cloud=cloud.replace("return `<div class=\"login\">${hero}${inner}</div>`;","return `<main style=\"padding-bottom:32px\">${hero}${inner}</main>`;")
s=src
def rep(old,new,cnt=1):
    global s
    assert s.count(old)==cnt,(s.count(old),old[:80]); s=s.replace(old,new)
rep("function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }","/* save() is defined by the online layer */")
rep("function renderInner(){\n  const root = document.getElementById('app');","function renderInner(){\n  const root = document.getElementById('app');\n  if(!C.ready){ root.innerHTML = cloudView(); return; }")
rep("const who = role==='coach' ? 'Maestro' :","const who = (role==='coach' || ROLE_NAME[role]) ? (role==='coach' ? 'Maestro' : ROLE_NAME[role]) + (C.clubName ? ' · ' + esc(C.clubName) : '') :")
rep("  return `<div class=\"note\"><b>Versione di prova.</b> Per ora i dati restano solo su questo telefono.</div>`;","  return syncBar();")
rep("  if(U.homeView==='backup') return backupView();","  if(U.homeView==='backup') return backupView();\n  if(U.homeView==='staff') return staffView();")
rep('<button class="item" data-a="homego" data-k="backup">',
    '<button class="item" data-a="staffopen"><span class="ticon" aria-hidden="true">${IC.people}</span><span class="grow"><b>Staff e accessi</b><br><span class="small muted">colleghi, preparatori e gruppi che vedono</span></span><span class="chev">›</span></button><button class="item" data-a="homego" data-k="backup">')
rep("function render(){\n  try{","function render(){ const _vk = viewFilterOn(); try{ renderBase(); } finally { viewFilterOff(_vk); } }\nfunction renderBase(){\n  try{")
rep("privDetail(U.athPriv) + athManage(ath(U.athPriv))","privDetail(U.athPriv) + cloudShareCard(ath(U.athPriv)) + athManage(ath(U.athPriv))")
rep("U.privOpen && ath(U.privOpen) ? privDetail(U.privOpen) :","U.privOpen && ath(U.privOpen) ? privDetail(U.privOpen) + cloudShareCard(ath(U.privOpen)) :",2)
rep("  logout(){ S.session=null;","  logout(){ ACT.clogout(); return; S.session=null;")
rep("<section class=\"card\"><h3>Codici e PIN · ${esc(g.id===PRIV_ID?'Lezioni private':g.name)}</h3>","<section class=\"card\"><h3>Codici e PIN · ${esc(g.id===PRIV_ID?'Lezioni private':g.name)}</h3>${cloudPinsExtra(g)}")
rep("<div class=\"pinrow\">\n        <b>${esc(a.name)}</b>","<div class=\"pinrow\">\n        <b>${esc(a.name)}</b>${cloudAthExtra(a)}")
rep("<p class=\"small muted\">Il PIN servirà ad atleti e genitori per entrare nell'app con il codice del gruppo. ↻ ne crea uno nuovo.","<p class=\"small muted\">Atleta e genitore entrano con il codice personale e il loro PIN. ↻ crea un nuovo PIN (quello vecchio smette di funzionare).")
rep("    if(t==='ath'){ S.athletes=","    if(t==='ath'){ cloudAthRemoved(id); S.athletes=")
rep("if(c==='athmove'){ const a=ath(t.dataset.k); if(a){ a.groupId=t.value;","if(c==='athmove'){ const a=ath(t.dataset.k); if(a){ a.groupId=t.value; if(a.groupId===PRIV_ID) a.owner=C.user.uid; cloudMoved(a);")
rep("  grpcode(){ const g=grp(U.resGroup); g.code=genCode(g.name);","  grpcode(){ const g=grp(U.resGroup); if(C.codes && g.code){ fbDb.doc('codes/'+g.code.toUpperCase()).delete().catch(()=>{}); delete C.codes[g.code.toUpperCase()]; } g.code=genCode(g.name);")
rep("\nS = load();\nrender();", "\n"+cloud+"\nS = undefined;\ncloudInit();\nrender();")
s=s.replace(".err{background:var(--ko-soft)", """.sync{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted);padding:2px 2px}
.sync i{width:9px;height:9px;border-radius:50%;background:var(--ok);flex:none}
.sync.saving i{background:var(--ochre)} .sync.off i{background:var(--muted)} .sync.err i{background:var(--ko)} .sync.err span{color:var(--ko);font-weight:600}
.sync b{margin-left:auto;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:45%}
.err{background:var(--ko-soft)""",1)
head='''<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Smart Coach">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" type="image/png" href="icon-180.png">
<link rel="manifest" href="manifest.webmanifest">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,-apple-system,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
'''
s=head+s
s=s.replace("<title>Tennis Smart Coach</title>","<title>Tennis Smart Coach</title>\n</head>\n<body>",1)
s=s.replace("<script>","<script src=\"https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js\"></script>\n<script src=\"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js\"></script>\n<script src=\"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js\"></script>\n<script>",1)
s=s.rstrip()+"\n</body>\n</html>\n"
os.makedirs(D+'online/site',exist_ok=True)
os.makedirs(D+'online/site',exist_ok=True); open(D+'online/site/index.html','w').write(s)
open(D+'online/check.js','w').write(re.findall(r'<script>(.*?)</script>',s,re.S)[-1])
mock=open(D+'online/mockfb.js').read()
t=re.sub(r'<script src="https://www.gstatic.com/firebasejs/[^"]+"></script>\n','',s).replace('<script>','<script>'+mock+'</script>\n<script>',1)
open(D+'online/test.html','w').write(t)
print('built')
