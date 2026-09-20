# Tarot Table

A tarot reference and interpreter for readers who use physical cards. There is no virtual deck, shuffling or drawing. You look up spreads, lay your real cards out, type in what you drew, and get each card's meaning plus how the cards combine.

- **Spreads:** 12 spreads with a layout diagram, position meanings and step-by-step instructions for laying them out.
- **Read:** pick a spread, tap a numbered slot, search for the card (by name, number or suit, like `tower` or `3 cups`), and choose upright or reversed. Results show up two ways:
  - **Each card:** keywords and the upright or reversed meaning in that position.
  - **Together:** suit, element and number patterns, recurring themes, how neighboring cards interact (with classic pairings), a story arc, support and challenge, a topic lens (love, work, money, inner life) and journal questions.
- **Cards:** all 78 cards with upright and reversed meanings, astrology and element correspondences, and classic pairings.
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
   │  ├─ cards.ts           the 78 cards
   │  ├─ spreads.ts         the spreads and their layouts
   │  └─ lore.ts            themes, pairings, numerology, element notes
   ├─ lib/
   │  ├─ engine.ts          the combined-interpretation logic
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
- **Interpretations** are rule-based, not generated. The engine combines suit, element, number, tone and theme data with a set of hand-written classic pairings, so results are consistent and work offline. Card meanings follow the Rider-Waite-Smith tradition, and element and astrology correspondences follow the Golden Dawn. If your reading tradition differs, edit `src/data/cards.ts` and `src/data/lore.ts`.
- **Adding a spread:** add an entry to `src/data/spreads.ts`. Positions use `x` and `y` grid units, where one unit is one card width across or one card height down.
