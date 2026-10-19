# Tennis Smart Coach – codice

Cartella per lavorare sull'app insieme. Puoi passarla così com'è anche al tuo Claude: queste note spiegano come è fatta.

## Cosa c'è

| File | Cosa contiene |
|---|---|
| `smart-coach.html` | **L'app vera e propria.** Contiene codice e dati di prova; la grafica è in `src/style.css`. Se lo apri nel browser funziona da solo (la cartella `src/` deve stare accanto): i dati restano nel browser (localStorage) e non tocca niente di online. **Le modifiche si fanno qui.** |
| `src/style.css` | La grafica dell'app (colori, caratteri, misure). `smart-coach.html` la carica da qui; il build la rimette dentro la pagina pubblicata, che resta un file unico. |
| `online/cloud.js` | La parte online: accesso di maestri, staff, atleti e genitori, salvataggio su Firebase (Firestore), codici e PIN. |
| `online/build.py` | Crea la versione online combinando `smart-coach.html` con `online/cloud.js`. Si lancia con `python3 online/build.py`. Il risultato va in `online/site/index.html`. |
| `online/build.mjs` | Lo stesso build per chi ha Node invece di Python: `node online/build.mjs`. Produce gli stessi file. Se cambi una sostituzione, aggiornala in tutti e due. |
| `tools/verify/` | Prova automatica: apre l'app in Edge su telefono e desktop, entra con tutti i ruoli e tocca tutte le schede. Prima volta `cd tools/verify && npm i`, poi `node tools/verify/verify.mjs`. |
| `online/mockfb.js` | Finto Firebase da usare nei test: la versione online si prova senza toccare i dati veri. |
| `online/firestore.rules` | Regole di sicurezza del database: chi può leggere e scrivere cosa. |
| `index.html` | Copia della versione pubblicata oggi su https://tennissmartcoach.github.io/Tennis-Smart-Coach/. Serve solo come riferimento: **non modificarla a mano**, perché si rigenera da `build.py`. |

## Come è fatto il codice (per Claude)

- JavaScript semplice, nessun framework e nessuna installazione da fare.
- I dati sono nello stato globale `S` e lo stato dell'interfaccia è in `U`. Ogni modifica chiama `save()` e poi `render()`.
- I bottoni hanno `data-a="azione"` e, se serve, `data-k="chiave"`, e sono gestiti dall'oggetto `ACT`. I campi dei moduli hanno `data-c="..."` e sono gestiti dagli ascoltatori `change` e `input`.
- La grafica è il tema "Progressi": sfondo scuro, giallo palla `#D7E84A`, caratteri Sora e IBM Plex Sans. I colori sono variabili CSS su `:root`.
- `build.py` sostituisce alcune righe precise di `smart-coach.html` per agganciare la parte online. Se una di quelle righe cambia, il build si ferma con un errore che indica la riga da sistemare.

## Regole da rispettare

1. **Le prove si fanno sul file `smart-coach.html` aperto in locale**, non sul sito online. La versione online è collegata al database vero del circolo, con gli atleti veri.
2. Minorenni: solo nome e iniziale del cognome.
3. Non pubblicare modifiche sul sito per conto proprio. Si rimanda il file modificato a Silvio, che lo unisce alla versione principale e la pubblica.
4. Meglio modifiche piccole e descritte ("ho cambiato X perché Y"), così si uniscono facilmente.
5. La chiave `apiKey` di Firebase nel codice è pubblica per natura: la protezione la fanno le regole del database, non la chiave. Altre chiavi segrete (per esempio di servizi di intelligenza artificiale) non vanno mai inserite nel codice.
