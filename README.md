# Note Bibliche

App di note in stile Note di Apple, con versetti biblici inseriti come blocchi (barra a sinistra, numeri in apice, riferimento in grassetto).
Funziona sul telefono come app (PWA), anche offline. Le note restano salvate sul dispositivo.

## Provarla sul computer

```bash
npm install
npm run dev      # apre http://localhost:5173
npm test         # prova il riconoscimento dei riferimenti (Gv 3,16 ecc.)
```

In locale i versetti vengono chiesti direttamente alle Bibbie online. Se il browser blocca la richiesta (CORS), la versione pubblicata su Vercel funziona comunque, perché passa dalla funzione `api/bible.js`.

## Pubblicarla su Vercel (gratis)

1. Crea un repository su GitHub e carica questa cartella (senza `node_modules` e `dist`, già esclusi da `.gitignore`).
2. Su vercel.com: **Add New → Project**, scegli il repository. Vercel riconosce Vite da solo: premi **Deploy**.
3. Dopo un minuto hai un indirizzo tipo `note-bibliche.vercel.app`.

## Metterla sulla Home del telefono

- **iPhone (Safari):** Condividi → *Aggiungi a Home*.
- **Android (Chrome):** menu ⋮ → *Installa app*.

## Fonti dei versetti

Nessuna chiave API necessaria. I testi vengono scaricati una volta e salvati nella nota.

| Lingua | Traduzioni | Servizio |
|---|---|---|
| Italiano | NR06 (Nuova Riveduta 2006), Diodati 1649 | bolls.life, getbible.net |
| English | KJV, WEB, NKJV, ESV, NIV, NASB, NLT | bolls.life |
| Українська | Огієнко 1962, Куліш 1903, Хоменко 1963, Філарет 2004, УБТ 2020, Гижа 2019 | bolls.life |

Alcune traduzioni (NR06, NKJV, ESV, NIV, NASB, NLT, УБТ, Гижа) hanno diritti d'autore: va bene per uso personale, ma non ridistribuire l'app con quei testi dentro.
Quelle di pubblico dominio sono Diodati, KJV, WEB, Огієнко (il testo del 1962 potrebbe avere condizioni proprie), Куліш.

I riferimenti si possono scrivere in qualsiasi lingua con qualsiasi traduzione: "John 3:16", "Іван 3:16" e "Giovanni 3:16" sono equivalenti.
Il nome del libro mostrato sotto il versetto è nella lingua della traduzione.

Per aggiungere una traduzione basta una riga in `src/bible/sources.js` (`TRANSLATIONS`). L'elenco completo dei codici Bolls è su bolls.life.
Per aggiungere un servizio diverso, una voce in `SOURCES` nello stesso file.

## Struttura

- `src/bible/books.js`: i 66 libri con nomi e abbreviazioni in italiano, inglese e ucraino
- `src/bible/parse.js`: trasforma "Gv 3,16-18" in libro, capitolo, versetti
- `src/bible/providers.js`: scarica i capitoli (prima dal proxy, poi diretto) con cache
- `api/bible.js`: funzione serverless, accetta solo traduzioni dell'elenco
- `src/App.jsx`, `src/components/`: interfaccia
