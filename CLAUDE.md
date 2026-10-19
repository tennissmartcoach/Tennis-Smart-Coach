# Tennis Smart Coach

App web per il settore agonistico di tennis: programma, atleti, partite, tornei, staff. Ci lavorano Andrea e Silvio, ognuno con il suo Claude. Le spiegazioni all'utente vanno date in parole semplici: chi usa questo progetto non è un programmatore.

## Come è fatta (struttura dal 19/10/2026)

- `smart-coach.html`: solo la pagina, carica in ordine i file di `src/`. Aperta nel browser funziona da sola, con i dati salvati nel browser.
- `src/style.css`: tutta la grafica.
- `src/data.js`: i contenuti del programma (12 settimane, libreria esercizi, prove, profili, stagione 2026, questionari, test).
- `src/demo.js`: i dati di prova (atleti finti, esempi). Non sono dati del circolo.
- `src/app/*.js`: il codice, diviso per argomento: `core` (strumenti, archivio, stato, `HOOK`), `match-engine` (punteggio), `screens` (accesso, schermata principale, scheda atleta), `programme` (programmi, partita, libreria, campetto), `forms` (questionari, schede), `private` (lezioni private), `tournaments`, `team` (presenze, note, benessere, avvisi), `home`, `staff` (preparatori), `actions` (bottoni ed eventi), `start` (avvio, sempre per ultimo).
- `online/cloud.js`: la parte online (Firebase: accessi, salvataggio, codici e PIN). Si aggancia all'app solo con l'oggetto `HOOK` di `src/app/core.js`: l'elenco è in fondo a `cloud.js`.
- `online/build.mjs` (Node) e `online/build.py` (Python): fanno la stessa cosa, cioè rimettono tutto in un'unica pagina in `online/site/index.html`. Se ne cambi uno, cambia anche l'altro.
- `index.html`: la copia pubblicata su GitHub Pages. Non si modifica a mano.

## Regole

1. Le modifiche si fanno nei file di `src/` (e `online/cloud.js` per la parte online), mai in `index.html` né in `online/site/`.
2. Codice semplice, senza framework né installazioni. Lo stato è in `S` (dati) e `U` (interfaccia): ogni modifica chiama `save()` e poi `render()`. I bottoni hanno `data-a="azione"` (gestiti da `ACT` in `actions.js`), i campi `data-c="..."`.
3. Qualcosa di nuovo che online deve comportarsi diversamente: un punto `HOOK.nome` nell'app e la sua funzione in fondo a `cloud.js`. Il build non cerca né sostituisce testo nel codice.
4. Un file nuovo in `src/`: aggiungi la sua riga `<script src="src/...">` in `smart-coach.html` prima di `src/app/start.js`. Il build lo prende da solo.
5. Prima di dire che una modifica funziona, usa la skill `verify` (`.claude/skills/verify/SKILL.md`): build, controllo della sintassi, prova automatica con Edge per tutti i ruoli.
6. Mai provare sul sito pubblicato: è collegato al database vero del circolo. Si prova in locale o con `online/test.html` (database finto).
7. Minorenni: solo nome e iniziale del cognome, anche nei dati di prova.
8. Nessuna chiave segreta nel codice (la `apiKey` di Firebase è pubblica per natura; le protegge `firestore.rules`).
9. Ognuno lavora sul suo ramo (`andrea/...`, `silvio/...`). Il main e la pubblicazione li gestisce Silvio. Modifiche piccole, con un messaggio di commit che dice cosa e perché.
