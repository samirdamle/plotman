# Plan: Auto-Scale Axes for Plotman

## 1. API Surface — chosen approach

**Recommendation:** Extend the factory with an optional second argument: `plotman(config, data?, plotOptions?)`

**Rationale:**
- One entry point, no new exported symbol to remember, no wrapper-around-wrapper indirection
- The factory already does all init work (lines 84-179); auto-resolution belongs there
- The signature mirrors `plot(data, options)` exactly, so the same call shape a user already knows transfers straight to construction
- Backward compatible: both new params are optional. If neither axis requests auto, data is ignored entirely (we don't even scan it)

**Rejected alternatives:**
- **(b)** Separate factory — splits the surface (two factories doing nearly the same thing) and would force the helper to re-merge defaults a second time
- **(c)** — Same fragmentation reason

> **Note:** We will not ship the `plot(data, { autoFit: true })` shortcut from the FEATURE_SUGGESTIONS sketch in this PR — that's a separate convenience layer (see "Out of scope" below).

---

## 2. Type changes

In `/home/user/plotman/src/index.ts` around lines 14-27:

```typescript
export type AxisBound = number | 'auto'

export type Axis = {
    title?: string
    min: AxisBound          // was: number
    max: AxisBound          // was: number
    auto?: boolean          // shorthand for min:'auto', max:'auto'
    pad?: number            // fraction of data range, default 0; applied per auto-side
    tick?: Tick
    interval?: number
    bins?: number
    values?: number[]
    categories?: string[]
    ticks?: Tick[]
    hasLogScale: boolean
}
```

**Key design decisions:**

- After resolution, `axis.min` and `axis.max` are guaranteed numbers for the rest of the function body (we narrow via reassignment)
- Any user code that read `config.xAxis.min` post-construction continues to receive a `number`
- The widened input type is backward compatible because `number` is assignable to `number | 'auto'`

**Why not `auto?: boolean` only?**

The spec explicitly calls out per-side `'auto'` (`{ min: 0, max: 'auto' }`), which is the cleanest way to express "fix one side, auto the other." We support both:
- `auto: true` — shorthand that expands to both sides
- `min: 'auto'` or `max: 'auto'` — per-side control

---

## 3. Data-bounds extraction

### Helper functions

Create new internal (non-exported) helpers:

```typescript
function extractAxisValues(data: any[], options: PlotOptions | undefined, which: 'x' | 'y'): number[] {
    if (!Array.isArray(data) || data.length === 0) return []
    const sample = data.find(d => d != null)
    if (sample == null) return []

    if (typeof sample === 'number') {
        // shape 1: number[] — Y-only, X is index
        return which === 'y'
            ? data.filter((v): v is number => typeof v === 'number')
            : data.map((_, i) => i)
    }
    if (Array.isArray(sample)) {
        // shape 2: [x, y, z?]
        const idx = which === 'x' ? 0 : 1
        return data
            .filter(item => Array.isArray(item) && typeof item[idx] === 'number')
            .map(item => item[idx])
    }
    if (typeof sample === 'object') {
        // shape 3: object[]
        const path = which === 'x' ? options?.x : options?.y
        if (path == null) return []
        return data
            .map(item => (typeof path === 'number' ? path : get(item, path)))
            .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v))
    }
    return []
}

function getDataBounds(values: number[], hasLogScale: boolean) {
    if (hasLogScale) values = values.filter(v => v > 0)
    if (values.length === 0) return null
    let min = values[0], max = values[0]
    for (const v of values) { if (v < min) min = v; if (v > max) max = v }
    return { min, max }
}
```

**Key points:**
- Reuses plot's shape detection verbatim (src/index.ts:184-214)
- `getDataBounds()` returns `{ min: number, max: number } | null` (null when data is empty or has no usable values)
- Recommendation: duplicate the shape-detection ladder now for zero risk to existing behavior; refactor in a follow-up when a third caller appears

---

## 4. Where in src/index.ts the resolution happens

Insert a new resolution block between line 96 (end of categorical override) and line 98 (xRange calculation). The new factory signature is:

```typescript
plotman(config: Config = defaultConfig, data?: any[], plotOptions?: PlotOptions)
```

### Resolution logic (~25 lines):

```typescript
function resolveAuto(axis: Axis, which: 'x' | 'y') {
    const wantsAuto =
        axis.auto === true || axis.min === 'auto' || axis.max === 'auto'
    if (!wantsAuto) return
    if (axis.categories && axis.categories.length > 0) return  // categoricals win

    if (!data) {
        throw new Error(
            `plotman: ${which}Axis requested auto-scaling but no data was passed to plotman(config, data, options).`
        )
    }
    const values = extractAxisValues(data, plotOptions, which)
    const bounds = getDataBounds(values, axis.hasLogScale)
    if (!bounds) {
        throw new Error(
            `plotman: ${which}Axis auto-scaling found no usable numeric values` +
            (axis.hasLogScale ? ' (log scale requires positive values).' : '.')
        )
    }
    let { min: dMin, max: dMax } = bounds
    if (dMin === dMax) {
        // single-value / all-equal: spread by 1 (or 0.5 each side) so range != 0
        const spread = dMin === 0 ? 1 : Math.abs(dMin) * 0.1
        dMin -= spread / 2; dMax += spread / 2
    }
    const pad = typeof axis.pad === 'number' ? axis.pad : 0
    const padAmount = (dMax - dMin) * pad

    const wantMin = axis.auto === true || axis.min === 'auto'
    const wantMax = axis.auto === true || axis.max === 'auto'
    if (wantMin) axis.min = dMin - padAmount
    if (wantMax) axis.max = dMax + padAmount

    if (axis.hasLogScale && (axis.min as number) <= 0) {
        // safety net if user only auto'd max but left min<=0
        throw new Error(`plotman: ${which}Axis log scale requires min > 0`)
    }
}

resolveAuto(xAxis, 'x')
resolveAuto(yAxis, 'y')
// existing line 98 onward unchanged: xRange = Math.abs(xAxis.max - xAxis.min) ...
```

**After this block:**
- `xAxis.min`/`max` are guaranteed numeric
- The existing arithmetic at lines 98-102 works without change
- The function-local destructuring at line 86 still binds the same axis object references, so mutations are visible to the rest of the body and to `setTicks` (line 167-168)

---

## 5. Edge case matrix

| Case | Behavior |
|------|----------|
| Empty data: `[]` with `auto: true` | Throw clear error: "auto-scaling found no usable numeric values." |
| Single-value data `[5]` | Spread to `[4.5, 5.5]` (or for 0, to `[-0.5, 0.5]`). Avoids `range === 0` which downstream replaces with `EPSILON`. |
| All-equal data `[5,5,5]` | Same as single-value. |
| `hasLogScale: true` + `auto` | Filter to positive values first. If none remain, throw. If user mixes `min: 0` + `max: 'auto'` + log, throw "log scale requires min > 0". |
| `categories` + `auto` | Categoricals win silently (we early-return from `resolveAuto`). Documented behavior. |
| Mixed `{ min: 0, max: 'auto' }` | Only `max` is replaced; `min` stays `0`. Pad applied to the auto side only: `max = dataMax + pad*range`. |
| `pad` undefined | Default to `0` (no padding). |
| `auto: true` AND explicit `min: 5` | `auto: true` is the shorthand; we treat per-side string sentinels as more specific. **Recommendation:** `auto: true` always wins; document as "shorthand, can't be partially overridden — use `min:'auto'`/`max:'auto'` for per-side control." |
| No auto requested anywhere | New code is a no-op; `data` arg is ignored, no perf cost beyond the boolean check. |
| Data passed but no auto requested | Ignored. Don't validate it; let `plot()` do shape validation when it's actually called. |

---

## 6. Verification plan

No test infra exists. Two-part recommendation:

### Part A — Minimal vitest setup (~10 min, ~30 LOC)

- Add `vitest` as a devDep
- Add `"test": "vitest run"` script
- Create `/home/user/plotman/src/index.test.ts`
- Implement six focused test cases below

### Part B — Alternative (no new tooling)

If the maintainer prefers no new tooling, add `/home/user/plotman/scripts/verify-auto-scale.ts` that imports from `../src/index` and `console.assert`s each case, runnable via:

```bash
npx tsx scripts/verify-auto-scale.ts
```

### Test cases

| # | Config | Data | Expected Result |
|---|--------|------|-----------------|
| 1 | `{ yAxis: { auto: true, hasLogScale: false } }` | `[10, 20, 30, 40]` | `yAxis.min=10, max=40` |
| 2 | `{ yAxis: { auto: true, pad: 0.1 } }` | `[10, 20, 30, 40]` | `yAxis.min=7, max=43` (10% of range=30) |
| 3 | `{ yAxis: { min: 0, max: 'auto' } }` | `[10, 20, 30]` | `yAxis.min=0, max=30` |
| 4 | `{ xAxis: { min: 'auto', max: 'auto' } }` | `[[1,5],[3,7],[9,2]]` (tuple shape) | `xAxis.min=1, max=9` |
| 5 | `{ yAxis: { auto: true } }`, objects + options `{x:'t',y:'v'}` | `[{t:1,v:50},{t:2,v:75}]` | `yAxis.min=50, max=75` |
| 6 | `{ yAxis: { auto: true, hasLogScale: true } }` | `[1, 10, 100]` | `yAxis.min=1, max=100`; same data with `[0, 10, 100]` filters the 0 |
| 7 (negative) | `{ yAxis: { auto: true } }` and no data passed | n/a | Throws with helpful message |
| 8 (degenerate) | `{ yAxis: { auto: true } }` | `[5, 5, 5]` | `min=4.5, max=5.5` (or whatever spread we pick — pin in the test) |

**Smoke test:**

Confirm backward compat with existing behavior (no auto):

```typescript
plotman({xAxis:{min:0,max:10},yAxis:{min:0,max:100}})
// assert plotX(5) === plotW/2
```

---

## 7. Documentation updates

### `/home/user/plotman/DOCUMENTATION.md`

- **Section "Configuration"** → Axis table (around line 254-266): Mark `min`/`max` as `number | 'auto'`; add new rows for `auto` and `pad`
- **Section "API"** → `plotman(config)` description (line 157): Document the new `data` and `options` params and when they're required
- **Section "Cookbook"** (after line 426 area): Add a new recipe "Auto-scale Y from data" showing the three canonical forms:
  - `auto:true`
  - Per-side `'auto'`
  - Partial `min:0,max:'auto'`
- **Section "Gotchas"** (around line 537-540): Add bullets:
  - "Auto-scale requires passing data to the factory"
  - "Auto-scale + log scale ignores non-positive values"

### `/home/user/plotman/README.md`

- **Feature bullet list** (near line 37-44): Add "Auto-scale axes from data"
- **Quickstart** (around line 22): Leave alone (keep the explicit-bounds example as the canonical intro)

### `/home/user/plotman/FEATURE_SUGGESTIONS.md`

- Mark item #1 as shipped (or leave as-is; maintainer's call)

---

## 8. Files to modify

| File | Change |
|------|--------|
| `/home/user/plotman/src/index.ts` | Widen `Axis.min`/`max` to `number \| 'auto'`; add `auto?`, `pad?`; extend factory signature with `data?`, `plotOptions?`; insert `extractAxisValues`, `getDataBounds`, `resolveAuto` and call them between current lines 96 and 98 |
| `/home/user/plotman/DOCUMENTATION.md` | Update Axis table, factory signature, add cookbook recipe, add gotcha bullets |
| `/home/user/plotman/README.md` | One-line feature bullet |
| `/home/user/plotman/package.json` | (Only if Part A chosen) add `vitest` devDep + test script |
| `/home/user/plotman/src/index.test.ts` | (Part A) new test file with the 8 cases above |
| `/home/user/plotman/scripts/verify-auto-scale.ts` | (Part B alternative) standalone runnable script |
| `/home/user/plotman/FEATURE_SUGGESTIONS.md` | Optional: strike through item #1 |

**Note:** No build, rollup, or tsconfig changes required — the new public types are exported alongside `Axis` already.

---

## 9. Out of scope

Explicitly **not** in this PR:

- **"Nice" rounding of auto-resolved bounds** — `10/25/50/100` — that is FEATURE_SUGGESTIONS #2 and is independently useful for non-auto axes too
- **`autoFit` shortcut on `plot()`** — `plot(data, { autoFit: true })` would short-circuit construction. Adds a second code path; defer until #1 lands and proves the API
- **Padding for non-auto axes** — `pad` only applies to auto-resolved sides. A user with `min:0,max:100` who wants `pad:0.05` would get `min:-5,max:105`, but adding that semantic now muddies what `pad` means; defer
- **Refactoring `plot()` to share the shape-detection ladder** — Duplicate now, refactor when a third caller appears
- **`xAxis2`/`yAxis2` auto-scaling** — The factory currently doesn't process secondary axes; auto-scaling them would be the same code applied twice more, but secondary axes aren't otherwise wired up
- **Async data sources / Promises** — Data must be a synchronous array, same as `plot()`
- **Inferring shape for empty arrays** — If `data: []` with `auto`, we throw rather than silently using defaults

---

## Critical Files for Implementation

- `/home/user/plotman/src/index.ts`
- `/home/user/plotman/DOCUMENTATION.md`
- `/home/user/plotman/README.md`
- `/home/user/plotman/src/index.test.ts` (new — Part A) or `/home/user/plotman/scripts/verify-auto-scale.ts` (new — Part B)
- `/home/user/plotman/package.json` (only if adding vitest)
