# Plotman — Feature Suggestions

A prioritized list of additions that would make Plotman easier and more delightful to use when building **custom charts**. Each item includes a short rationale, a rough API sketch, and an implementation hint so it's easy to pick up.

The existing philosophy — *"Plotman gives you coordinates, you render the chart"* — is a strength. Every suggestion below should preserve that: none of them force Plotman into becoming a heavy charting library. They sit **next to** the core API as optional helpers.

---

## Tier 1 — High impact, low effort

### 1. Auto-scale axes from data (`auto: true` or `min: 'auto'`) ✅ shipped

**Why:** Today, every consumer writes `Math.min(...data.map(...))` / `Math.max(...)`. That's boilerplate developers have to rewrite every time.

**Sketch:**

```ts
xAxis: { auto: true, pad: 0.05 }           // 5% padding on both sides
yAxis: { min: 'auto', max: 'auto' }        // equivalent, per-side
yAxis: { min: 0, max: 'auto' }             // mix fixed and auto
```

The factory now takes optional `data` and `options` arguments: `plotman(config, data, options)`. When any axis opts in via `auto`/`'auto'`, bounds are derived from the data at construction time. See the "Auto-scale axes from data" cookbook recipe in `DOCUMENTATION.md`.

Still open as a follow-up: `nice: true` rounding (covered separately in #2 below) and a `plot(data, { autoFit: true })` shortcut.

---

### 2. `niceTicks` / human-friendly tick generation

**Why:** `interval: 23.7` produces ugly labels. D3 and other libraries use a "nice" algorithm that rounds to 1/2/5 × 10ⁿ.

**Sketch:**

```ts
yAxis: { min: 0, max: 987, targetTickCount: 5, nice: true }
// -> ticks at 0, 250, 500, 750, 1000, and max becomes 1000
```

**Implementation hint:** port the classic `niceNum(range, round)` algorithm (~20 lines). Default to `nice: true`; opt out for raw values.

---

### 3. Built-in tick label formatters

**Why:** `tick.prefix` / `tick.suffix` cover the simple cases. Users still have to bypass them for thousands separators, dates, percentages, etc.

**Sketch:**

```ts
yAxis: { tick: { format: 'currency' } }           // preset
yAxis: { tick: { format: v => `${(v*100).toFixed(0)}%` } } // custom
xAxis: { tick: { format: 'date:MMM d' } }          // date preset
```

Presets to ship: `number`, `currency`, `percent`, `shortNumber` (`1.2k`, `3.4M`), `date`, `time`, `scientific`.

**Implementation hint:** replace the current `prefix + value + suffix` composition with `format(value, { prefix, suffix })`.

---

### 4. Grid-line helper

**Why:** Every chart wants gridlines. Developers copy tick loops to draw them.

**Sketch:**

```ts
const { gridLines } = plotman(config)
gridLines.x  // [{ x1, y1, x2, y2, value }, ...] — full-height lines at each X tick
gridLines.y  // same for horizontal
```

Pre-computed from ticks + `plotArea.height` / `.width`. Zero calculation for the consumer.

---

### 5. Responsive / `fit` helper

**Why:** Charts need to resize with their container. Today the demo hard-codes widths from `window.innerWidth`.

**Sketch:**

```ts
import { plotman, fit } from 'plotman'

const ref = fit(containerEl, (size) => plotman({ ...config, ...size }))
ref.config  // always current
ref.onChange(() => render())  // re-render on resize
ref.destroy()
```

**Implementation hint:** wrap a `ResizeObserver` + debounce; call the factory on size change.

---

## Tier 2 — Rendering conveniences

### 6. First-class renderer adapters

**Why:** Everyone writes the same DOM/SVG boilerplate. Ship optional adapters so *trying* Plotman takes 5 lines.

**Sketch:**

```ts
import { plotman } from 'plotman'
import { svgScatter, svgBar, svgLine } from 'plotman/renderers/svg'

const svg = svgScatter(data, { x: 'hours', y: 'score' }, config)
document.body.innerHTML = svg
```

Ship three small renderer modules:

- `plotman/renderers/svg` — returns `<svg>…</svg>` strings.
- `plotman/renderers/canvas` — draws to a provided `CanvasRenderingContext2D`.
- `plotman/renderers/dom` — returns an `HTMLElement`.

Keep the core unchanged — these are **optional sub-imports**.

---

### 7. React / Vue / Svelte component packages

**Why:** Framework wrappers would let developers drop a chart in with props only.

```tsx
<PlotmanScatter data={data} x="revenue" y="profit" size="fruit.price" config={cfg} />
<PlotmanBar data={sales} x="month" y="value" />
```

Publish as `@plotman/react`, `@plotman/vue`, `@plotman/svelte`. The core stays framework-agnostic.

---

### 8. Legend helper

**Why:** The current API has no notion of "series." Legends are fully DIY.

**Sketch:**

```ts
const { legend } = plotman(config, {
    series: [
        { key: 'apple',  label: 'Apples',  color: 'salmon' },
        { key: 'banana', label: 'Bananas', color: 'steelblue' },
    ],
})
// legend = [{ label, color, key, x, y }] with CSS-ready layout
```

---

### 9. Tooltip utility

**Why:** Hover-to-inspect is table-stakes. Today every demo rolls its own.

**Sketch:**

```ts
import { attachTooltip } from 'plotman/tooltip'

attachTooltip(plotAreaEl, {
    points,                         // output of plot()
    render: p => `x: ${p.x}, y: ${p.y}`,
    snapPx: 10,                     // highlight the nearest point within 10px
})
```

Uses `unplotXY` internally to find nearest points.

---

## Tier 3 — Data ergonomics

### 10. Multi-series input

**Why:** A common need — overlay multiple series — has no primitive. Today you call `plot()` once per series.

**Sketch:**

```ts
const { plotSeries } = plotman(config)

const series = plotSeries({
    revenue: { data, x: 'month', y: 'revenue', color: 'steelblue' },
    profit:  { data, x: 'month', y: 'profit',  color: 'crimson' },
})

series.revenue.points  // [{ x, y, data, color }, ...]
series.profit.points
```

---

### 11. Data transforms: bin / stack / aggregate / nest

**Why:** Histograms, stacked bars, group-by bubble charts need pre-processing. Shipping small, composable helpers keeps Plotman focused yet practical.

**Sketch:**

```ts
import { bin, stack, groupBy } from 'plotman/transforms'

bin(data, { field: 'age', bins: 10 })            // -> [{ x0, x1, count, items }]
stack(data, { x: 'year', y: ['hw','sw','srv'] }) // -> stacked series
groupBy(data, 'category')                        // -> Record<key, items>
```

Keep them as a separate entry point so tree-shaking works.

---

### 12. Native date/time axis

**Why:** Time series are one of the most common chart types. Today you must map dates to numbers manually.

**Sketch:**

```ts
xAxis: { type: 'time', min: new Date('2024-01-01'), max: new Date('2024-12-31'), tick: { format: 'MMM' } }
```

Internally uses `.getTime()` + formatting. Handles DST and month boundaries.

---

### 13. Color scales

**Why:** `z` is already the "third channel." It should map cleanly to color.

**Sketch:**

```ts
const { colorScale } = plotman(config, {
    color: { field: 'profit', scheme: 'Viridis', domain: [0, 100] },
})
colorScale(42)                    // -> '#3b8686'
```

Ship a small set of schemes (categorical: Set1/Tableau; sequential: Viridis/Plasma; diverging: RdBu). Roughly 2-3 KB total.

---

## Tier 4 — Interactivity

### 14. `hitTest()` / nearest-point lookup

**Why:** Building tooltips, brushing, and crossfilter views all need "which point is closest to (x, y)?". Using a simple quadtree built from `points` is 40 lines and a huge usability win.

**Sketch:**

```ts
const { hitTest } = plotman(config)
hitTest(points, { x: mouseX, y: mouseY, radius: 10 })  // -> point | null
```

---

### 15. Brushing / zooming helpers

**Why:** Users drag-select a region → Plotman computes the new axis domain via `unplotX`/`unplotY`. Ship this as a ready helper.

**Sketch:**

```ts
import { attachBrush } from 'plotman/brush'

attachBrush(plotAreaEl, {
    onBrush: ({ xMin, xMax, yMin, yMax }) => rerender({ xAxis: { min: xMin, max: xMax } }),
})
```

---

### 16. Animation / tween helper

**Why:** Smooth transitions between data updates make charts feel alive. A tiny 50-line helper that interpolates two sets of pixel coordinates would be enough.

```ts
import { tweenPoints } from 'plotman/animate'

tweenPoints(prevPoints, nextPoints, { duration: 500, easing: 'cubicOut' },
    frame => render(frame))
```

---

## Tier 5 — Developer experience & DX polish

### 17. A proper example gallery

Expand `demo/` beyond bubble charts to cover:

- Line chart (with area fill)
- Bar chart (horizontal + vertical, stacked + grouped)
- Candlestick / OHLC
- Heatmap
- Radar / polar
- Histogram
- Slope chart
- Dumbbell chart

Each example should be <50 lines, copy-pasteable.

---

### 18. Documentation site (Storybook / Docusaurus / Vitepress)

The README + `DOCUMENTATION.md` are a great start. A static site with live-editable examples (CodeSandbox embeds) would lower the adoption barrier significantly.

---

### 19. CLI scaffolder

```bash
npx create-plotman-chart my-chart --type bubble --framework react
```

Generates a minimal `chart.tsx` + `config.ts` pre-wired for the chosen type and framework.

---

### 20. Better runtime validation & DX errors

**Why:** Today, misconfiguration produces `NaN` coordinates or silent wrong output. Friendlier errors help adoption.

**Sketch:**

- If `hasLogScale: true` and `min <= 0` → throw with a clear message.
- If `xAxis.min === xAxis.max` → warn and use `Number.EPSILON` (already done internally — surface it as a console warning).
- Validate `PlotOptions.x`/`y` exist on the first item of `data`.

Wrap under a `plotman.debug = true` or `PLOTMAN_DEBUG=1` env flag so production isn't noisy.

---

### 21. SSR / headless support

**Why:** Generating charts server-side (PDFs, emails, OG images) is increasingly common. Since Plotman only computes numbers, it *already* runs in Node — but shipping a `renderers/svg` string renderer (see #6) unlocks this officially.

---

### 22. Type hardening

Minor improvements to `src/index.ts`:

- Export a generic `Point<T>` type for the return of `plot()`.
- Make `plot()` return types depend on `returnAsObjects` (function overloads).
- Narrow `Axis` to a discriminated union: `LinearAxis | LogAxis | CategoryAxis | BinnedAxis`.
- `plotX`/`plotY` currently return `number | null` — document when `null` happens (missing data), and add typed guards.

---

### 23. Performance: memoize per-axis work

For static configs that render many points, pre-computing once (as it does) is great. But if developers reuse the same config across re-renders, expose a lightweight `createScale(axis)` so they can build their own pipelines without calling the full factory each time.

---

### 24. Accessibility helpers

**Why:** Charts are notoriously inaccessible. Small helpers go a long way.

**Sketch:**

```ts
const { aria } = plotman(config)
aria.chartRole                 // "img" or "figure"
aria.describe(points, 'scatter') // generates an <desc> / aria-label summary
```

Also: ship a keyboard-navigation helper that lets users tab between points (again, powered by `hitTest`).

---

### 25. Plugin API

**Why:** Keep the core tiny, but let the community extend it.

**Sketch:**

```ts
plotman.use(myTickPlugin)

const p = plotman(config)
// plugin can augment `config`, add methods, hook into `plot`/`unplot`
```

Simple hook points: `beforeTicks`, `afterTicks`, `transformData`, `transformPoints`.

---

## Summary — what to ship first

If I had to pick the **top 5** to maximize developer love per hour of work:

1. **Auto-scale axes** (#1) — removes the #1 bit of boilerplate.
2. **Nice ticks** (#2) — makes default output look professional.
3. **Tick formatters** (#3) — unblocks currency, percent, dates.
4. **Grid lines & responsive helper** (#4, #5) — make charts ship-ready.
5. **SVG renderer module** (#6) — lets people try Plotman with one import.

With those five, Plotman keeps its "just coordinates" soul but becomes something you can use in a real product in an afternoon.
