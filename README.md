# Altar

A tarot reference and interpreter for readers who use physical cards. There is no virtual deck, shuffling or drawing. You look up spreads, lay your real cards out, type in what you drew, and get each card's meaning plus how the cards combine.

- **Spreads:** 12 spreads with a layout diagram, position meanings and step-by-step instructions for laying them out.
- **Read:** pick a spread, tap a numbered slot, search for the card (by name, number or suit, like `tower` or `3 cups`), and choose upright or reversed. Results show up two ways:
  - **Each card:** keywords and the upright or reversed meaning in that position.
  - **Together:** suit, element and number patterns, recurring themes, how neighboring cards interact (with classic pairings), a story arc, support and challenge, a topic lens (love, work, money, inner life) and journal questions.
- **Cards:** all 78 cards with upright and reversed meanings, astrology and element correspondences, and classic pairings.
- **Tradition toggle:** the switch under the title picks how everything is interpreted, Rider-Waite or Marseille. It applies to Read, Cards and the reading basics, and your choice is remembered on your device. Both traditions use the same card ids, so a saved reading opens in either one.
- **Journal:** save readings (with a question and notes) to your own Turso database and reopen them later.

Everything except the Journal runs in the browser. Your current reading is remembered on your device.

## Project layout

```
tarot-table/
├─ index.html
├─ package.json
├─ package-lock.json
├─ tsconfig.json
├─ vite.config.ts
├─ vercel.json
├─ .env.example
├─ .gitignore
├─ db/
│  └─ schema.sql            reference copy of the table (the API creates it for you)
├─ api/
│  ├─ readings.ts           Vercel function: list, save and delete readings in Turso
│  └─ tsconfig.json
└─ src/
   ├─ main.tsx
   ├─ App.tsx
   ├─ styles.css
   ├─ types.ts
   ├─ data/
   │  ├─ cards.ts           the 78 cards (Rider-Waite)
   │  ├─ marseille.ts       the same 78 cards read the Marseille way
   │  ├─ traditions.ts      registry of traditions and the default
   │  ├─ spreads.ts         the spreads and their layouts
   │  └─ lore.ts            themes, pairings, numerology, element notes (Rider-Waite)
   ├─ lib/
   │  ├─ engine.ts          the combined-interpretation logic
   │  ├─ tradition.tsx      React context that hands the active tradition to components
   │  ├─ facts.ts           number, court and suit notes for a card
   │  ├─ search.ts          card search
   │  └─ storage.ts         local persistence and the journal API client
   └─ components/
      ├─ Glyph.tsx  Table.tsx  Sheet.tsx  Picker.tsx  CardDetail.tsx
      └─ SpreadsTab.tsx  ReadTab.tsx  CardsTab.tsx  JournalTab.tsx
```

## Deploy: GitHub, Turso, Vercel

### 1. Turso

Create a database and grab two values. In the Turso dashboard, or with the CLI:

```sh
turso db create tarot-table
turso db show tarot-table --url          # TURSO_DATABASE_URL
turso db tokens create tarot-table       # TURSO_AUTH_TOKEN
```

You do not need to create any tables. The API creates the `readings` table the first time it runs.

### 2. GitHub

Create a new repository and upload the contents of this folder (drag the files and folders into the GitHub web uploader, keeping the structure above). Do not upload `node_modules`, `dist` or any `.env` file. The included `.gitignore` covers these if you use git.

### 3. Vercel

1. Import the GitHub repository in Vercel. It detects Vite automatically.
2. Under **Environment Variables**, add:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `JOURNAL_KEY`: a long passphrase you choose. The journal API answers only requests that send it.
3. Deploy.

### 4. First use

Open the deployed site, go to **Journal**, and enter your `JOURNAL_KEY`. It is stored in that browser only. Saving from the Read tab and browsing the Journal will work from then on.

The Spreads, Read and Cards tabs do not need any of the three environment variables.

## Run locally

```sh
npm install
npm run dev          # front end only: Spreads, Read and Cards work; Journal does not
```

To run the journal API locally too, copy `.env.example` to `.env.local`, fill it in, and use the Vercel CLI:

```sh
npm i -g vercel
vercel dev
```

Other scripts: `npm run build` builds to `dist/`, `npm run typecheck` checks both the app and the API.

## Notes

- **Privacy:** the journal is protected by one shared key, which suits a personal app. Anyone who has the key can read and delete your readings. If you later want real accounts, Clerk slots in at `api/readings.ts` (check the session there instead of `JOURNAL_KEY`).
- **Interpretations** are rule-based, not generated. The engine combines suit, element, number, tone and theme data with a set of hand-written classic pairings, so results are consistent and work offline. Rider-Waite mode uses Rider-Waite-Smith meanings with Golden Dawn element and astrology correspondences, and reversals are optional. Marseille mode reads by number, suit and picture instead: names and numbering follow the Marseille deck (La Force is XI, La Justice is VIII), number cards echo the major of the same number, every card is read upright, and there are no elements or astrology. Each Marseille card has a "look closely" note; those describe the common Marseille pattern, and your deck may differ in details. Major pairs also get a numerology line (the two numbers added and reduced), which is a common practice rather than a fixed rule.
- **Choosing the default tradition:** change `DEFAULT_TRADITION` in `src/data/traditions.ts`. It only applies until someone picks a tradition in the toggle.
- **Adding a tradition:** build a `Card[]` with the same 78 ids (see `src/data/marseille.ts`), describe it in `src/data/traditions.ts` (suits, number notes, pairings, and whether it uses elements, reversals and numerology), and add its id to `TraditionId` in `src/types.ts`. Pairings are keyed by each card's `key`, the Rider-Waite short name that every tradition shares.
- **Adding a spread:** add an entry to `src/data/spreads.ts`. Positions use `x` and `y` grid units, where one unit is one card width across or one card height down.
