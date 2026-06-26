# BetKhaata – Insights & My Bets Crash/Black Screen Fix Walkthrough

## Symptom
- Home page works
- Bankroll page works
- Insights page crashes (black screen)
- My Bets page sometimes crashes

## Root cause
- `zustand` persistence was hydrating corrupted/invalid data from `localStorage`.
- Invalid JSON / wrong shapes / missing keys could cause selectors (analytics + chart inputs) to throw during render.

## Fixes Implemented

### 1) Safe persist hydration + state sanitization (Priority #1/#4)
**File:** `src/store/betStore.ts`
- Added robust sanitization logic for persisted payload.
- Implemented safe parsing and cleanup so invalid persisted structures don’t propagate into the app.
- Updated zustand `persist` options so hydration/migration uses the sanitizer.
- Added additional safe defaults for core arrays (`bets`, `matches`, `bankrolls`, `transactions`, `bankrollHistory`).

### 2) Selector hardening for corrupted/empty/malformed data (Priority #2/#3/#4)
**File:** `src/store/betStore.ts`
- Hardened analytics calculations to avoid:
  - divide-by-zero
  - `NaN` propagation
  - undefined access when `state.bets` is not a valid array
- Hardened these selectors:
  - `selectAnalytics`
  - `selectDailyPnLFromBets`
  - `selectBankrollGrowthData`
  - `selectFilteredBets`
  - `selectRunningBets`

### 3) Build verification (Priority #6)
- Ran: `npm run build`
- Result: build completed successfully (static generation).

## Notes
- UI was kept unchanged (changes are store/selector-level safeguards + analytics stability).
- After this update, the app should never crash on:
  - fresh install
  - empty data
  - corrupted `localStorage`
  - deleted bets / missing history

