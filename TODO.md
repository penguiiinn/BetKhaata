## TODO - Fix Insights & My Bets black screen/crashes

### Step 1: Persist hydration/localStorage corruption hardening (Priority 1)
- [ ] Update `src/store/betStore.ts` to safely parse and sanitize persisted Zustand state (handle invalid JSON, missing keys, null/undefined, wrong shapes).
- [ ] Ensure safe fallback defaults are used when hydration data is corrupted.

### Step 2: Store state sanitization & defaults (Priority 2)
- [ ] Normalize bet/bankroll/transaction/history entries to prevent undefined field access.

### Step 3: Harden selectors & analytics (Priority 3)
- [ ] Add defensive guards in selectors: `selectAnalytics`, `selectDailyPnLFromBets`, `selectBankrollGrowthData`, `selectFilteredBets`, etc.
- [ ] Prevent divide-by-zero/NaN outputs.

### Step 4: Harden Insights/My Bets rendering (Priority 4)
- [ ] Add final UI-level guards in `src/components/insights/*` and `src/components/bets/BetsScreen.tsx` where needed.

### Step 5: Build verification (Priority 6)
- [ ] Run `npm run build` and fix TypeScript/runtime issues.

### Step 6: Walkthrough update (Priority 7)
- [ ] Update/create `walkthrough.md` describing all fixes.
- [x] Mark step progress once fixes are complete.



