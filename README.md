# Plotman — A JavaScript library for plotting charts

Plotman is a tiny, framework-agnostic library for building **custom charts**. It doesn't draw charts for you — it turns your data into pixel coordinates so you can render them any way you like (DOM, SVG, Canvas, WebGL, React, Vue, Svelte, vanilla JS).

Highlights:

- **Auto-scale axes** — `{ auto: true }` (or `min: 'auto'`) and Plotman derives bounds from your data.
- **Three input shapes** — number arrays, `[x, y, z]` tuples, or object arrays with dot-notation field paths.
- **Categorical, linear, log, binned axes** — pick the one that matches your data.
- **Reverse mapping** — `unplot()` turns mouse coordinates back into data values.

## Installation

```bash
npm install plotman
```

```ts
import { plotman } from 'plotman'
```

## Quick example

```ts
const data = [
    { hours: 1, score: 52 },
    { hours: 3, score: 72 },
    { hours: 5, score: 89 },
]

// Either fix the bounds yourself…
const { plot } = plotman({
    width: 400,
    height: 300,
    margin: { top: 20, right: 20, bottom: 40, left: 40 },
    xAxis: { min: 0, max: 10, interval: 2 },
    yAxis: { min: 0, max: 100, interval: 25 },
})

// …or let Plotman scale them from the data:
const auto = plotman(
    {
        width: 400,
        height: 300,
        margin: { top: 20, right: 20, bottom: 40, left: 40 },
        xAxis: { auto: true, hasLogScale: false },
        yAxis: { auto: true, pad: 0.05, hasLogScale: false },
    },
    data,
    { x: 'hours', y: 'score', z: '' },
)

const points = plot(data, { x: 'hours', y: 'score', returnAsObjects: true })
// -> [{ x, y, z }, ...] pixel coordinates you can render with any technology
```

See [`DOCUMENTATION.md`](./DOCUMENTATION.md) for the full guide and a cookbook of simple examples (bar, line, bubble, categorical, log-scale, click-to-data, Canvas…).

## Top-level configuration

| Option   | Description                                                                  | Type     | Required |
| -------- | ---------------------------------------------------------------------------- | -------- | -------- |
| `width`  | Width of the chart in pixels                                                 | number   | yes      |
| `height` | Height of the chart in pixels                                                | number   | yes      |
| `margin` | `{ top, right, bottom, left }` space reserved for titles, ticks, and labels | object   | no       |
| `title`  | Optional chart title                                                         | string   | no       |
| `xAxis`  | X-axis configuration (see [Axis options](./DOCUMENTATION.md#axis))           | object   | yes      |
| `yAxis`  | Y-axis configuration                                                         | object   | yes      |

Plotman returns a `config` enriched with `plotArea`, `xAxis.ticks`, `yAxis.ticks`, and ready-to-use `styles` objects for layout.

## API at a glance

| Method | Purpose |
| ------ | ------- |
| `plot(data, options)` | Convert a dataset to pixel coordinates. Accepts arrays of numbers, arrays, or objects with dot-path field names. |
| `plotX(value, data?)` | Convert a single X value to a pixel X. |
| `plotY(value, data?)` | Convert a single Y value to a pixel Y. |
| `plotXY(x, y, data)` | Convert one point. Returns `{ x, y, data }`. |
| `unplot(points)` | Inverse of `plot()` — pixels back to data values. |
| `unplotX(px) / unplotY(py) / unplotXY(px, py)` | Inverse of the single-point helpers. |

Full API, types, and configuration details: [`DOCUMENTATION.md`](./DOCUMENTATION.md).

## Documentation

- **[`DOCUMENTATION.md`](./DOCUMENTATION.md)** — Full API reference, configuration guide, and a cookbook of simple copy-paste examples.
- **[`FEATURE_SUGGESTIONS.md`](./FEATURE_SUGGESTIONS.md)** — Proposed additions (auto-scale axes, nice ticks, renderer adapters, tooltips, color scales, etc.) to make Plotman even easier to use in custom charts.
- **`demo/`** — Runnable React bubble-chart demo with six configuration variations (categorical axes, log scales, bins, custom tick values).

## Build

```bash
npm run build   # tsc + rollup -> dist/index.js, dist/index.es.js, dist/index.d.ts
npm run lint
```

## License

MIT
