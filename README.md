# Tennis Smart Coach

App web per il settore agonistico di un circolo di tennis. Mette insieme in un solo posto il programma di allenamento, gli atleti, le partite, i tornei e il lavoro dello staff (maestri, preparatore atletico, preparatore mentale), con una parte dedicata ad atleti e genitori.

Si usa dal telefono come un'app: si apre il sito e si aggiunge alla schermata Home. Funziona anche dal computer.

- **App online:** https://tennissmartcoach.github.io/Tennis-Smart-Coach/. È collegata ai dati veri del circolo: per entrare serve un accesso.
- **Demo da provare:** si apre `smart-coach.html` nel browser. Ha atleti finti e i dati restano solo su quel dispositivo.

## Cosa fa

### Maestro
- **Home:** gli allenamenti di oggi un gruppo alla volta, il calendario delle lezioni private, le presenze (Presente, Assente, Ritardo, Pioggia) e una sola voce per le notifiche.
- **Programma:** le 12 settimane per tipologie di gioco, con prova del giorno e partita guidata. In alternativa, per ogni gruppo, un programma personale a settimane e sedute.
  - La libreria esercizi ha un campetto che si disegna toccando lo schermo: giocatori, colpi, palla del maestro, spostamenti, zone, coni e numeri.
  - Con **"Crea il programma con l'IA"** il maestro racconta o detta le settimane. L'app prepara la richiesta da copiare in Claude o in un'altra IA, e la risposta incollata diventa un programma con esercizi e campetti.
- **Match Analysis:** prima di ogni punto si segna la scelta tattica dell'atleta, se l'ha eseguita e chi vince il punto.
  - Ace, Doppio fallo ed Errore in risposta segnano il punto da soli. "Non giocato" tiene il punto fuori dalle percentuali.
  - A fine partita c'è l'analisi: punti vinti al servizio e in risposta, esito di ogni scelta, punti importanti. C'è anche la modalità "a compiti".
- **Gruppi e atleti:** gruppi, atleti, PIN di accesso per atleti e genitori, scheda di ogni atleta con risultati, test e questionari.
- **Lezioni private:** per ogni allievo la scheda (identikit, obiettivi per area tecnica, tattica, mentale e fisica), le lezioni svolte divise in fasi, con esercizi e campetti, e il programma a settimane.
  - Con **"Crea programma o lezione"** si racconta o si detta la lezione e la si fa preparare all'IA.
  - Ogni esercizio si può modificare; una lezione si elimina tenendola premuta.
- **Tornei:** calendario della stagione, tornei assegnati a gruppi o ad atleti singoli, risultati.
- **Staff:** il maestro responsabile decide chi vede quali gruppi. Gli allievi privati li vede solo il loro maestro, che può condividerli con un preparatore.

### Preparatore atletico e preparatore mentale
- Home ordinata come quella del maestro, presenze, atleti.
- **Atletico:** programma della preparazione fisica e test atletici con prove modificabili.
- **Mentale:** programma per temi con incontri, per gruppi o atleti singoli, e schede modificabili e assegnabili (pre partita, post partita, settimana, domande ai genitori…).
- Il maestro vede i programmi dei preparatori, e quelli sono in evidenza anche per atleti e genitori.

### Atleta e genitore
- La settimana di allenamento, il prossimo incontro con il preparatore mentale e la preparazione atletica.
- I tornei, il profilo con i progressi e le schede da compilare.
- L'atleta può anche usare la Match Analysis.
- Per gli allievi privati c'è il loro percorso: obiettivi, lezioni svolte e programma.

## Come è fatta

- **Pagina e codice.** `smart-coach.html` è la pagina; il codice è in `src/`, diviso per argomento. JavaScript semplice, senza framework e senza niente da installare.
- **Versione online.** `online/cloud.js` aggiunge accessi e salvataggio su Firebase (Firestore, server a Milano). `online/build.py` o `online/build.mjs` uniscono tutto in un'unica pagina, che viene pubblicata come `index.html` su GitHub Pages.
- **Sicurezza.** Chi può leggere e scrivere cosa è deciso da `firestore.rules`. I minorenni compaiono solo con nome e iniziale del cognome.

Per chi lavora sul codice: la descrizione file per file è in [LEGGIMI.md](LEGGIMI.md), le regole del progetto sono in [CLAUDE.md](CLAUDE.md).

## Chi ci lavora

Silvio e Andrea, maestri di tennis, con l'aiuto di Claude. Ognuno lavora sul suo ramo (`silvio/...`, `andrea/...`). Il ramo `main` e la pubblicazione li gestisce Silvio.
