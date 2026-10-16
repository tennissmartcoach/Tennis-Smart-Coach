---
name: verify
description: Verifica a runtime di Tennis Smart Coach prima di dichiarare una modifica "funzionante". Usare dopo ogni modifica a smart-coach.html, online/cloud.js o al build, e quando l'utente chiede di provare, controllare o fare screenshot dell'app.
---

# Verifica di Tennis Smart Coach

Non dire mai che una modifica funziona solo perché il codice "sembra giusto": prima la fai provare al browser.

## Passi

1. **Build** (crea la versione online di prova con Firebase finto):
   `node online/build.mjs`
   Se si ferma con "build fermo: trovate N copie…", una delle righe che il build sostituisce è cambiata in `smart-coach.html`: aggiorna la riga corrispondente in `online/build.mjs` **e** in `online/build.py` (Silvio usa ancora quello).
2. **Prima volta su un computer**: `cd tools/verify && npm i` (scarica solo playwright-core, usa Edge già installato).
3. **Prova**: `node tools/verify/verify.mjs` (aggiungi `--local` per provare solo `smart-coach.html`).
   Apre l'app su telefono (390×844) e desktop (1280×800) e:
   - in locale entra come maestro, atleta, genitore, preparatore atletico e mentale, tocca ogni scheda della barra in basso e le sotto-schede dell'atleta;
   - online (`online/test.html`, database finto, nessun dato vero) crea un account maestro e un circolo con dati di prova, poi gira tutte le schede e controlla che i salvataggi arrivino.
   Segnala: errori JavaScript, schermata "Qualcosa non ha funzionato", pagine vuote, scroll orizzontale.
4. **Guarda gli screenshot** in `tools/verify/out/` delle schermate toccate dalla modifica (con lo strumento Read): il test automatico vede i crash, non se una cosa è brutta o al posto sbagliato.
5. Se hai cambiato un flusso specifico (un bottone, un modulo), provalo anche con un breve script Playwright mirato che clicca come farebbe un utente.

## Regole

- Mai provare sul sito pubblicato: è collegato al database vero del circolo.
- Se la verifica fallisce, dillo con l'output esatto, non minimizzare.
