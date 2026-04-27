# Plotman — Detailed Documentation

Plotman is a small, framework-agnostic JavaScript/TypeScript library that maps data values to pixel coordinates so you can render **any** chart you want — bubble, scatter, bar, line, area, dot-plot, heatmap, or a custom design — in **SVG, Canvas, or plain DOM**.

Plotman does one job and does it well: **turn your data into `{x, y}` pixel positions** (and back again). You keep full control of what you draw on screen.

---

## Table of contents

1. [Why Plotman?](#why-plotman)
2. [Installation](#installation)
3. [Core concepts](#core-concepts)
4. [Quick start](#quick-start)
5. [API reference](#api-reference)
6. [Configuration guide](#configuration-guide)
7. [Cookbook — simple examples](#cookbook--simple-examples)
8. [Rendering approaches](#rendering-approaches)
9. [TypeScript usage](#typescript-usage)
10. [Troubleshooting](#troubleshooting)

---

## Why Plotman?

Most charting libraries give you *charts*. Plotman gives you *coordinates*.

| You provide | Plotman returns | You render |
| ----------- | --------------- | ---------- |
| Raw data + chart size/axes | Pixel `x, y` coords + tick positions | Whatever markup you like |

Benefits:

- **Tiny API** — one factory, ~10 methods.
- **No rendering lock-in** — works with React, Vue, Svelte, vanilla JS, SVG, Canvas, WebGL.
- **Bidirectional** — `plot()` data → pixels, `unplot()` pixels → data (great for click/drag interactions).
- **Full axis control** — linear, log, categorical, bins, fixed tick values, prefix/suffix labels.
- **Lightweight** — only depends on `lodash` (for `get`) and `ts-deepmerge`.

---

## Installation

```bash
npm install plotman
```

```ts
import { plotman } from 'plotman'
// or
import plotman from 'plotman'
```

Ships as both CommonJS (`dist/index.js`) and ES Modules (`dist/index.es.js`) with `.d.ts` declarations.

---

## Core concepts

### 1. The factory

Call `plotman(config)` once per chart. It returns an object with a computed `config` (including tick positions and CSS styles) and a set of helper functions:

```ts
const {
    config,    // fully-resolved config + ticks + styles
    plot,      // data[] -> pixel coords[]
    plotX,     // single value -> pixel x
    plotY,     // single value -> pixel y
    plotXY,    // single x+y -> { x, y, data }
    unplot,    // pixel coords[] -> data[]
    unplotX,   // pixel x -> value
    unplotY,   // pixel y -> value
    unplotXY,  // pixel x+y -> { x, y }
} = plotman(myConfig)
```

### 2. The plot area

Plotman subtracts your margins from width/height to get the usable plot area:

```
plotArea.width  = width  - margin.left - margin.right
plotArea.height = height - margin.top  - margin.bottom
```

`plotX`/`plotY` return pixel values *relative to the top-left of the plot area* — not the full chart. Combine them with the generated `config.styles.plotArea` CSS to position elements correctly.

### 3. Coordinate direction

- **X** increases left-to-right: `plotX(min) = 0`, `plotX(max) = plotArea.width`.
- **Y** increases **top-to-bottom in pixels but bottom-to-top in value** — so larger data values sit higher on screen. `plotY(min) = plotArea.height`, `plotY(max) = 0`.

### 4. Auto-generated ticks and styles

After construction, `config.xAxis.ticks` and `config.yAxis.ticks` are populated, and `config.styles` contains CSS for the outer container, plot area, and axis rails so you can render a complete chart without calculating positions yourself.

---

## Quick start

A minimal scatter plot rendered as plain DOM:

```html
<div id="chart"></div>

<script type="module">
    import { plotman } from 'plotman'

    const data = [
        { hours: 1, score: 52 },
        { hours: 2, score: 61 },
        { hours: 3, score: 72 },
        { hours: 4, score: 78 },
        { hours: 5, score: 89 },
    ]

    const { config, plot } = plotman({
        width: 400,
        height: 300,
        margin: { top: 20, right: 20, bottom: 40, left: 40 },
        xAxis: { min: 0, max: 6, interval: 1 },
        yAxis: { min: 0, max: 100, interval: 20 },
    })

    const points = plot(data, { x: 'hours', y: 'score', returnAsObjects: true })

    const host = document.getElementById('chart')
    host.innerHTML = `
        <div style="position:relative; width:${config.width}px; height:${config.height}px;">
            <div style="position:absolute;
                        left:${config.margin.left}px; top:${config.margin.top}px;
                        width:${config.plotArea.width}px; height:${config.plotArea.height}px;
                        border-left:1px solid #999; border-bottom:1px solid #999;">
                ${points.map(p => `
                    <div style="position:absolute;
                                left:${p.x}px; top:${p.y}px;
                                width:10px; height:10px;
                                margin:-5px 0 0 -5px;
                                border-radius:50%;
                                background:steelblue;"></div>
                `).join('')}
            </div>
        </div>
    `
</script>
```

That's the whole mental model: call `plotman()`, call `plot()`, render whatever you like at the returned coordinates.

---

## API reference

### `plotman(config?: Config, data?: any[], options?: PlotOptions)` → factory

Creates a plotter. If no config is passed, defaults to an 800×800 chart with a `0–100` linear axis on both X and Y.

`data` and `options` are only required when an axis has opted into **auto-scaling** (`auto: true`, `min: 'auto'`, or `max: 'auto'`). They use the same shapes that `plot()` accepts (number array, tuple array, or object array with field paths). When no axis requests auto-scaling, both arguments are ignored.

Returns:

| Member | Signature | Purpose |
| ------ | --------- | ------- |
| `config` | `Config` (resolved) | Merged config with ticks and CSS styles computed. |
| `plot` | `(data: any[], options?: PlotOptions) => any[]` | Batch-convert a dataset to pixel coordinates. |
| `plotX` | `(x: number \| string, data?: any) => number \| null` | Convert a single X value to a pixel X. |
| `plotY` | `(y: number \| string, data?: any) => number \| null` | Convert a single Y value to a pixel Y. |
| `plotXY` | `(x, y, data?) => { x, y, data }` | Convert one data point to pixel `{x, y}`. |
| `unplot` | `(points: any[], options?) => any[]` | Reverse `plot()` for an array of points. |
| `unplotX` | `(px: number) => number \| null` | Reverse a pixel X to a data value. |
| `unplotY` | `(py: number) => number \| null` | Reverse a pixel Y to a data value. |
| `unplotXY` | `(px, py) => { x, y }` | Reverse a pixel point to data values. |

### `plot(data, options?)`

Accepts three data shapes:

**1. Array of numbers** — each number is treated as a Y value (or X if `options.x` is truthy).

```ts
plot([10, 20, 30])               // [plotY(10), plotY(20), plotY(30)]
plot([10, 20, 30], { x: true })  // [plotX(10), plotX(20), plotX(30)]
```

**2. Array of arrays** `[xValue, yValue, zValue?]`:

```ts
plot([
    [1, 52, 'A'],
    [2, 61, 'B'],
    [3, 72, 'C'],
])
// -> [[px1, py1, 'A'], [px2, py2, 'B'], [px3, py3, 'C']]
```

`null` items and partial arrays are handled gracefully.

**3. Array of objects** — needs a `PlotOptions` argument naming the fields:

```ts
plot(
    [{ revenue: 500, profit: 100, fruit: { price: 3 } }, ...],
    { x: 'revenue', y: 'profit', z: 'fruit.price', returnAsObjects: true }
)
// -> [{ x: 123, y: 456, z: 3 }, ...]
```

Field names support **dot-notation** (powered by `lodash.get`).

Options:

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `x` | `string \| number` | — | Property path or index for X. |
| `y` | `string \| number` | — | Property path or index for Y. |
| `z` | `string \| number` | — | Optional third channel (size, color, category, etc.). |
| `returnAsObjects` | `boolean` | `false` | Return `{x, y, z}` instead of `[x, y, z]`. |
| `appendToOriginalObject` | `boolean` | `false` | Return the original item with a `plotman: { x, y, z }` field added. |

### `unplot(points, options?)`

Inverse of `plot()`. Accepts the same three shapes (numbers, arrays, objects) and returns data values. Useful for converting mouse coordinates back into your data space.

```ts
const { unplotXY } = plotman(config)

chartEl.addEventListener('click', e => {
    const rect = plotAreaEl.getBoundingClientRect()
    const value = unplotXY(e.clientX - rect.left, e.clientY - rect.top)
    console.log('You clicked at data value:', value)
})
```

---

## Configuration guide

### Top-level `Config`

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `width` | `number` | yes | Total chart width (px). |
| `height` | `number` | yes | Total chart height (px). |
| `margin` | `{top, right, bottom, left}` | no | Space reserved for titles/ticks/labels. Defaults to `{80, 20, 120, 80}`. |
| `title` | `string` | no | Optional chart title (you render it yourself). |
| `xAxis` | `Axis` | yes | Primary X-axis configuration. |
| `yAxis` | `Axis` | yes | Primary Y-axis configuration. |
| `xAxis2`, `yAxis2` | `Axis` | no | Secondary axes (reserved for future multi-axis charts). |

After construction, Plotman also populates:

- `config.plotArea` — `{ width, height }` of the usable plot area.
- `config.styles` — four ready-to-spread CSS objects: `container`, `plotArea`, `xAxis`, `yAxis`.

### `Axis`

| Field | Type | Description |
| ----- | ---- | ----------- |
| `min` | `number \| 'auto'` | Axis minimum (required unless `categories` is set). Pass `'auto'` to derive from data. |
| `max` | `number \| 'auto'` | Axis maximum (required unless `categories` is set). Pass `'auto'` to derive from data. |
| `auto` | `boolean` | Shorthand for `min: 'auto', max: 'auto'`. Resolves both bounds from the data passed to the factory. |
| `pad` | `number` | Fraction of the data range to add as padding on each auto-resolved side (e.g. `0.05` = 5%). Defaults to `0`. |
| `title` | `string` | Optional label. |
| `hasLogScale` | `boolean` | Use log10 scale instead of linear. |
| `interval` | `number` | Distance between auto-generated ticks. |
| `bins` | `number` | Force N evenly-spaced ticks (mutually exclusive with `interval`). |
| `values` | `number[]` | Render ticks at these exact values. |
| `categories` | `string[]` | Turn axis into a categorical axis; `min`/`max` are ignored. |
| `tick` | `{prefix?, suffix?}` | Adds a prefix/suffix to every auto-generated tick label (e.g. `$`, `%`, ` units`). |
| `ticks` | `Tick[]` *(output)* | Computed tick array — `{ label, value, x, y }`. |

### `Tick`

Each tick has pre-computed pixel coordinates so you can position labels without math:

```ts
type Tick = {
    label: string | number
    value: number
    x: number   // pixel x relative to plotArea (X-axis ticks)
    y: number   // pixel y relative to plotArea (Y-axis ticks)
    prefix?: string
    suffix?: string
}
```

### Tick selection — picking one of `interval`, `bins`, `values`, `categories`

Plotman chooses a tick strategy in this priority order:

1. `categories` (if non-empty) — one tick per category.
2. `bins` — `bins + 1` evenly spaced ticks.
3. `values` — exactly the listed values.
4. `interval` — auto-generated ticks `interval` apart, snapped to `ceil(min/interval) * interval`.
5. **Fallback** — 2 bins (min and max).

Tip: don't set multiple; pick the one that describes your intent.

---

## Cookbook — simple examples

### 1. Bar chart (vanilla JS + SVG)

```ts
import { plotman } from 'plotman'

const sales = [
    { month: 'Jan', value: 40 },
    { month: 'Feb', value: 72 },
    { month: 'Mar', value: 55 },
    { month: 'Apr', value: 91 },
]

const { config, plotX, plotY } = plotman({
    width: 500,
    height: 300,
    margin: { top: 20, right: 20, bottom: 40, left: 50 },
    xAxis: { categories: sales.map(s => s.month) },
    yAxis: { min: 0, max: 100, interval: 25, tick: { suffix: 'k' } },
})

const barWidth = config.plotArea.width / sales.length * 0.6
const baseY = plotY(0)

const bars = sales.map((s, i) => {
    const cx = plotX(i)          // categorical index — returns pixel X of bar center
    const y = plotY(s.value)
    return `<rect x="${cx - barWidth / 2}" y="${y}"
                 width="${barWidth}" height="${baseY - y}"
                 fill="steelblue" />`
}).join('')

document.body.innerHTML = `
<svg width="${config.width}" height="${config.height}">
    <g transform="translate(${config.margin.left}, ${config.margin.top})">
        ${bars}
    </g>
</svg>
`
```

### 2. Line chart (SVG path)

```ts
const temps = [22, 24, 23, 27, 30, 29, 26]

const { config, plot } = plotman({
    width: 500,
    height: 240,
    margin: { top: 20, right: 20, bottom: 40, left: 40 },
    xAxis: { min: 0, max: temps.length - 1, interval: 1 },
    yAxis: { min: 15, max: 35, interval: 5, tick: { suffix: '°C' } },
})

const points = temps.map((t, i) => [i, t])
const pixels = plot(points) // [[px, py, undefined], ...]

const d = pixels
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`)
    .join(' ')

const svg = `
<svg width="${config.width}" height="${config.height}">
    <g transform="translate(${config.margin.left}, ${config.margin.top})">
        <path d="${d}" fill="none" stroke="crimson" stroke-width="2" />
    </g>
</svg>
`
```

### 3. Bubble chart in React

```tsx
import { plotman } from 'plotman'

function Bubbles({ data }) {
    const { config, plotXY } = plotman({
        width: 600,
        height: 400,
        margin: { top: 40, right: 20, bottom: 60, left: 60 },
        xAxis: { min: 0, max: 100, interval: 20 },
        yAxis: { min: 0, max: 100, interval: 20 },
    })

    return (
        <div style={config.styles.container}>
            <div style={config.styles.plotArea}>
                {data.map((d, i) => {
                    const p = plotXY('revenue', 'profit', d)
                    return (
                        <div
                            key={i}
                            style={{
                                position: 'absolute',
                                left: p.x,
                                top: p.y,
                                width: d.size * 4,
                                height: d.size * 4,
                                marginLeft: -d.size * 2,
                                marginTop: -d.size * 2,
                                borderRadius: '50%',
                                background: d.color,
                                opacity: 0.6,
                            }}
                        />
                    )
                })}
            </div>
            <div style={config.styles.xAxis}>
                {config.xAxis.ticks.map(t => (
                    <div key={t.value} style={{ position: 'absolute', left: t.x, top: 4 }}>
                        {t.label}
                    </div>
                ))}
            </div>
            <div style={config.styles.yAxis}>
                {config.yAxis.ticks.map(t => (
                    <div key={t.value} style={{ position: 'absolute', right: 4, top: t.y }}>
                        {t.label}
                    </div>
                ))}
            </div>
        </div>
    )
}
```

### 4. Categorical axis

```ts
plotman({
    width: 400, height: 300,
    margin: { top: 20, right: 20, bottom: 40, left: 60 },
    xAxis: { categories: ['Apple', 'Banana', 'Cherry'] },
    yAxis: { min: 0, max: 100, interval: 25 },
})
```

Categorical axes ignore `min`/`max` and auto-center each category inside its bucket. Pass the category **index** (e.g. `0`, `1`, `2`) as the X value when calling `plotX`/`plotXY`, or use a property that holds that index.

### 5. Logarithmic axis with explicit tick values

```ts
plotman({
    width: 500, height: 350,
    margin: { top: 20, right: 20, bottom: 40, left: 60 },
    xAxis: { hasLogScale: true, min: 1, max: 10000, values: [1, 10, 100, 1000, 10000] },
    yAxis: { min: 0, max: 100, interval: 20 },
})
```

### 6. Tick label formatting

```ts
yAxis: { min: 0, max: 500000, interval: 100000, tick: { prefix: '$', suffix: '' } }
// -> tick labels: "$0", "$100000", "$200000", ...
```

For richer formatting (thousands separators, etc.), render your own label and just use `tick.value`:

```tsx
{config.yAxis.ticks.map(t => (
    <span style={{ top: t.y, position: 'absolute' }}>
        {'$' + t.value.toLocaleString()}
    </span>
))}
```

### 7. Click-to-data with `unplot`

```ts
const { unplotXY } = plotman(config)

plotAreaEl.addEventListener('click', e => {
    const rect = plotAreaEl.getBoundingClientRect()
    const { x, y } = unplotXY(e.clientX - rect.left, e.clientY - rect.top)
    console.log(`Clicked data value: x=${x}, y=${y}`)
})
```

### 8. Auto-scale axes from data

Skip the `Math.min(...)`/`Math.max(...)` boilerplate by letting Plotman derive bounds at construction time. Pass your data to the factory; any axis with `auto: true` (or `min: 'auto'` / `max: 'auto'`) is resolved against it.

```ts
const sales = [
    { month: 'Jan', value: 40 },
    { month: 'Feb', value: 72 },
    { month: 'Mar', value: 55 },
    { month: 'Apr', value: 91 },
]

const { plotX, plotY } = plotman(
    {
        width: 500,
        height: 300,
        margin: { top: 20, right: 20, bottom: 40, left: 50 },
        xAxis: { categories: sales.map(s => s.month) },
        yAxis: { auto: true, pad: 0.05, hasLogScale: false },  // 5% headroom
    },
    sales,
    { x: 'month', y: 'value', z: '' },
)
```

Three equivalent forms:

```ts
yAxis: { auto: true, hasLogScale: false }                     // both sides from data
yAxis: { min: 'auto', max: 'auto', hasLogScale: false }       // same, per-side
yAxis: { min: 0, max: 'auto', hasLogScale: false }            // fix one, derive the other
```

`pad` is a fraction of the data range and applies only to auto-resolved sides — `{ min: 0, max: 'auto', pad: 0.1 }` leaves `min: 0` untouched and adds 10% to the top.

### 9. Canvas rendering

```ts
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
canvas.width = config.width
canvas.height = config.height

ctx.translate(config.margin.left, config.margin.top)

points.forEach(([x, y]) => {
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fillStyle = 'steelblue'
    ctx.fill()
})
```

---

## Rendering approaches

Plotman is purely computational, so you choose the renderer:

| Renderer | Good for | Notes |
| -------- | -------- | ----- |
| **DOM (absolute-positioned divs)** | Small-to-medium charts, HTML-native tooltips, CSS animations | Demo uses this approach. |
| **SVG** | Crisp vector output, easy styling, accessible | Wrap the plot in a `<g transform="translate(ml, mt)">` group. |
| **Canvas** | Many thousands of points, high-frequency updates | Use `ctx.translate(margin.left, margin.top)` to align with plot area. |
| **WebGL / custom** | Very large datasets | Plotman just gives you the pixel positions. |

---

## TypeScript usage

Every type is exported:

```ts
import { plotman, Config, Axis, Tick, PlotOptions } from 'plotman'

const config: Config = {
    width: 600,
    height: 400,
    margin: { top: 20, right: 20, bottom: 40, left: 50 },
    xAxis: { min: 0, max: 100, interval: 25, hasLogScale: false },
    yAxis: { min: 0, max: 100, interval: 25, hasLogScale: false },
}

const { plot } = plotman(config)
```

The factory is fully typed; `plot()` accepts `any[]` because it supports three different input shapes, so annotate the return yourself when helpful.

---

## Troubleshooting

- **Points look off by the margin** — `plotX`/`plotY` return coordinates *relative to the plot area*, not the full canvas. Wrap points in a container offset by `config.margin.left`/`top` (the generated `config.styles.plotArea` does this for you in DOM).
- **Points are flipped vertically** — that's intentional: higher values sit higher on screen. Remember `plotY(min)` is `plotArea.height`, not `0`.
- **`plot()` throws "did not receive a valid array"** — the dataset must be an array. Mixed-shape arrays (e.g. numbers + objects) aren't supported.
- **Categorical `plotX` returns a weird number** — pass the category *index* (not the string), or put the index on the data object and name that property in `PlotOptions.x`.
- **Log scale with `min: 0`** — `log10(0)` is `-Infinity`. Prefer `min: 1` (or the smallest meaningful positive value) for log axes.
- **Ticks look empty** — make sure at least one of `interval`, `bins`, `values`, or `categories` is set, or rely on the default fallback (2 ticks).
- **`auto-scaling but no data was passed`** — when an axis uses `auto: true` (or `'auto'` bounds), pass your data as the second argument to `plotman()`, plus the `PlotOptions` field paths for object-shaped data.
- **Auto + log scale** — non-positive values are filtered out before computing bounds (log scale requires positive values). If every value is `≤ 0` the factory throws.

---

## See also

- `FEATURE_SUGGESTIONS.md` — proposed additions to make Plotman easier to use in custom charts.
- `demo/` — runnable React bubble-chart demo with six config variations.
