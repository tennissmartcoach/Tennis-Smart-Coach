/* App start: must be loaded last. The online layer (HOOK.start) opens the club archive instead of this phone's data. */
if(HOOK.start) HOOK.start();
else { S = load(); render(); }
