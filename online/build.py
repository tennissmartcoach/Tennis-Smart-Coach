# Builds the online site: python3 online/build.py   (build.mjs does the same with Node: node online/build.mjs)
# 1. puts every src/ file back inside one self-contained page, in the order smart-coach.html loads them
# 2. adds online/cloud.js just before src/app/start.js: it fills in the HOOK points (src/app/core.js)
# 3. wraps it in the published head (icons, manifest, Firebase)
# No text of the app is searched and replaced: the online layer plugs in only through HOOK.
import re, os
D=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
rd=lambda f: open(D+f,encoding='utf-8').read().replace('\r\n','\n')
def wr(f,s):
    with open(D+f,'w',encoding='utf-8',newline='\n') as h: h.write(s)

START='<script src="src/app/start.js"></script>'
s=rd('smart-coach.html')
assert s.count(START)==1,('in smart-coach.html manca la riga',START)
s=s.replace(START,'<script src="online/cloud.js"></script>\n'+START)
# the source page declares utf-8 so the browser reads the src/ files right; the published head below has its own
if s.startswith('<meta charset="utf-8">\n'): s=s[len('<meta charset="utf-8">\n'):]
s=re.sub(r'<link rel="stylesheet" href="(src/[^"]+)">',lambda m:'<style>\n'+rd(m.group(1))+'</style>',s)
s=re.sub(r'<script src="((?:src/|online/cloud\.js)[^"]*)"></script>',lambda m:'<script>\n'+rd(m.group(1))+'</script>',s)

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
FIREBASE=''.join('<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-%s-compat.js"></script>\n'%m for m in ('app','auth','firestore'))
assert '<title>Tennis Smart Coach</title>' in s,'manca il titolo'
s=head+s.replace('<title>Tennis Smart Coach</title>','<title>Tennis Smart Coach</title>\n</head>\n<body>',1)
s=s.replace('<script>',FIREBASE+'<script>',1)
s=s.rstrip()+'\n</body>\n</html>\n'

os.makedirs(D+'online/site',exist_ok=True)
wr('online/site/index.html',s)
# all the app's code in one file, to check it with: node --check online/check.js
wr('online/check.js','\n'.join(re.findall(r'<script>(.*?)</script>',s,re.S)))
# the same page with a fake Firebase (online/mockfb.js), to try the online version without touching real data
wr('online/test.html',s.replace(FIREBASE,'').replace('<script>','<script>'+rd('online/mockfb.js')+'</script>\n<script>',1))
print('built')
