import { describe, it, expect } from 'vitest'
import { plotman } from './index'

describe('auto-scale axes', () => {
    it('resolves yAxis.auto:true from a number[] (Y values are array, X is index)', () => {
        const data = [10, 20, 30, 40]
        const { config } = plotman(
            { yAxis: { auto: true, hasLogScale: false }, xAxis: { min: 0, max: 100, hasLogScale: false } },
            data,
        )
        expect(config.yAxis.min).toBe(10)
        expect(config.yAxis.max).toBe(40)
    })

    it('applies pad as a fraction of the data range on auto sides', () => {
        const data = [10, 20, 30, 40]
        const { config } = plotman(
            { yAxis: { auto: true, pad: 0.1, hasLogScale: false, nice: false }, xAxis: { min: 0, max: 100, hasLogScale: false } },
            data,
        )
        // range = 30, pad = 3 each side
        expect(config.yAxis.min).toBeCloseTo(7, 10)
        expect(config.yAxis.max).toBeCloseTo(43, 10)
    })

    it('mixes fixed min with max:"auto" — only the auto side moves', () => {
        const data = [10, 20, 30]
        const { config } = plotman(
            { yAxis: { min: 0, max: 'auto', hasLogScale: false }, xAxis: { min: 0, max: 100, hasLogScale: false } },
            data,
        )
        expect(config.yAxis.min).toBe(0)
        expect(config.yAxis.max).toBe(30)
    })

    it('resolves x bounds from tuple-shaped data ([x,y,z])', () => {
        const data: [number, number][] = [
            [1, 5],
            [3, 7],
            [9, 2],
        ]
        const { config } = plotman(
            { xAxis: { min: 'auto', max: 'auto', hasLogScale: false, nice: false }, yAxis: { min: 0, max: 10, hasLogScale: false } },
            data,
        )
        expect(config.xAxis.min).toBe(1)
        expect(config.xAxis.max).toBe(9)
    })

    it('resolves bounds from object[] using PlotOptions paths', () => {
        const data = [
            { t: 1, v: 50 },
            { t: 2, v: 75 },
            { t: 3, v: 60 },
        ]
        const { config } = plotman(
            { yAxis: { auto: true, hasLogScale: false, nice: false }, xAxis: { min: 0, max: 4, hasLogScale: false } },
            data,
            { x: 't', y: 'v', z: '' },
        )
        expect(config.yAxis.min).toBe(50)
        expect(config.yAxis.max).toBe(75)
    })

    it('filters non-positive values when hasLogScale is true', () => {
        const data = [0, 1, 10, 100]
        const { config } = plotman(
            { yAxis: { auto: true, hasLogScale: true }, xAxis: { min: 0, max: 10, hasLogScale: false } },
            data,
        )
        expect(config.yAxis.min).toBe(1)
        expect(config.yAxis.max).toBe(100)
    })

    it('throws when auto is requested but no data is supplied', () => {
        expect(() =>
            plotman({
                yAxis: { auto: true, hasLogScale: false },
                xAxis: { min: 0, max: 10, hasLogScale: false },
            }),
        ).toThrow(/auto-scaling but no data was passed/)
    })

    it('spreads single-value data so range is non-zero', () => {
        const data = [5, 5, 5]
        const { config } = plotman(
            { yAxis: { auto: true, hasLogScale: false, nice: false }, xAxis: { min: 0, max: 10, hasLogScale: false } },
            data,
        )
        expect(config.yAxis.min).toBe(4.75)
        expect(config.yAxis.max).toBe(5.25)
    })

    it('throws on log scale with no positive values', () => {
        const data = [-1, 0, -2]
        expect(() =>
            plotman(
                { yAxis: { auto: true, hasLogScale: true }, xAxis: { min: 0, max: 10, hasLogScale: false } },
                data,
            ),
        ).toThrow(/log scale requires positive values/)
    })

    it('lets categories win over auto silently', () => {
        const data = [
            { t: 1, v: 99 },
            { t: 2, v: 99 },
        ]
        const { config } = plotman(
            {
                xAxis: { auto: true, hasLogScale: false, categories: ['A', 'B'], min: 0, max: 0 },
                yAxis: { min: 0, max: 100, hasLogScale: false },
            },
            data,
            { x: 't', y: 'v', z: '' },
        )
        expect(config.xAxis.min).toBe(0)
        expect(config.xAxis.max).toBe(2)
    })
})

describe('backward compatibility', () => {
    it('numeric min/max behaves identically to before', () => {
        const { plotX, config } = plotman({
            xAxis: { min: 0, max: 10, hasLogScale: false },
            yAxis: { min: 0, max: 100, hasLogScale: false },
        })
        // plotW = 800 - 80 - 20 = 700; plotX(5) should be at the midpoint = 350
        const plotW = (config.plotArea && config.plotArea.width) || 0
        expect(plotX(5)).toBeCloseTo(plotW / 2, 10)
    })

    it('factory still accepts a single config argument', () => {
        const result = plotman({
            xAxis: { min: 0, max: 100, hasLogScale: false },
            yAxis: { min: 0, max: 100, hasLogScale: false },
        })
        expect(result).toHaveProperty('plot')
        expect(result).toHaveProperty('plotX')
        expect(result).toHaveProperty('plotY')
        expect(result).toHaveProperty('unplot')
    })
})

describe('niceTicks', () => {
    it('produces human-friendly tick values and rounds bounds (nice: true)', () => {
        const { config } = plotman({
            yAxis: { min: 0, max: 987, nice: true, targetTickCount: 5, hasLogScale: false },
            xAxis: { min: 0, max: 100, hasLogScale: false },
        })
        // niceNum(987, false) = 1000, interval = niceNum(1000/4, true) = 200
        expect(config.yAxis.max).toBe(1000)
        expect(config.yAxis.min).toBe(0)
        const tickValues = config.yAxis.ticks!.map((t) => t.value)
        expect(tickValues.every((v) => v % 200 === 0)).toBe(true)
    })

    it('tick labels are clean integers with no floating-point artifacts', () => {
        const { config } = plotman({
            yAxis: { min: 0, max: 1, nice: true, targetTickCount: 5, hasLogScale: false },
            xAxis: { min: 0, max: 10, hasLogScale: false },
        })
        const labels = config.yAxis.ticks!.map((t) => String(t.label))
        labels.forEach((label) => {
            expect(label).not.toMatch(/\.\d{10}/)
        })
    })

    it('nice: false opts out and reverts to 2-bin fallback', () => {
        const { config } = plotman({
            yAxis: { min: 0, max: 987, nice: false, hasLogScale: false },
            xAxis: { min: 0, max: 100, hasLogScale: false },
        })
        // Without nice, default is 2 bins → 3 ticks (min, mid, max)
        expect(config.yAxis.ticks!.length).toBe(3)
        expect(config.yAxis.max).toBe(987)
    })

    it('custom targetTickCount controls tick density', () => {
        const { config: cfg3 } = plotman({
            yAxis: { min: 0, max: 1000, nice: true, targetTickCount: 3, hasLogScale: false },
            xAxis: { min: 0, max: 100, hasLogScale: false },
        })
        const { config: cfg10 } = plotman({
            yAxis: { min: 0, max: 1000, nice: true, targetTickCount: 10, hasLogScale: false },
            xAxis: { min: 0, max: 100, hasLogScale: false },
        })
        expect(cfg3.yAxis.ticks!.length).toBeLessThan(cfg10.yAxis.ticks!.length)
    })

    it('niced bounds are reflected in returned config', () => {
        const { config } = plotman({
            yAxis: { min: 3, max: 97, nice: true, hasLogScale: false },
            xAxis: { min: 0, max: 100, hasLogScale: false },
        })
        expect(config.yAxis.min).toBe(0)
        expect(config.yAxis.max).toBe(100)
    })

    it('auto: true + nice: true — auto-derived bounds are then niced', () => {
        // Data range 12–88; auto gives min=12, max=88; nice rounds to clean interval
        const data = [12, 88]
        const { config } = plotman(
            { yAxis: { auto: true, nice: true, hasLogScale: false }, xAxis: { min: 0, max: 100, hasLogScale: false } },
            data,
        )
        // Nice interval should be a power of 1/2/5×10ⁿ
        const interval = config.yAxis.ticks![1].value - config.yAxis.ticks![0].value
        const magnitude = Math.pow(10, Math.floor(Math.log10(interval)))
        const ratio = interval / magnitude
        expect([1, 2, 5, 10]).toContain(ratio)
        // Bounds must be multiples of the interval
        expect(config.yAxis.min % interval).toBeCloseTo(0, 10)
        expect(config.yAxis.max % interval).toBeCloseTo(0, 10)
    })

    it('bins strategy supersedes nice', () => {
        const { config } = plotman({
            yAxis: { min: 0, max: 987, bins: 4, nice: true, hasLogScale: false },
            xAxis: { min: 0, max: 100, hasLogScale: false },
        })
        // bins: 4 → exactly 5 ticks at 0, 246.75, 493.5, 740.25, 987
        expect(config.yAxis.ticks!.length).toBe(5)
        expect(config.yAxis.max).toBe(987)
    })

    it('user-supplied interval supersedes nice', () => {
        const { config } = plotman({
            yAxis: { min: 0, max: 100, interval: 25, nice: true, hasLogScale: false },
            xAxis: { min: 0, max: 100, hasLogScale: false },
        })
        const tickValues = config.yAxis.ticks!.map((t) => t.value)
        expect(tickValues).toContain(25)
        expect(tickValues).toContain(50)
        expect(tickValues).toContain(75)
        expect(config.yAxis.max).toBe(100)
    })

    it('log-scale axis skips nice to preserve positive bounds', () => {
        const { config } = plotman({
            yAxis: { min: 1, max: 1000, nice: true, hasLogScale: true },
            xAxis: { min: 0, max: 100, hasLogScale: false },
        })
        expect(config.yAxis.min).toBe(1)
        expect(config.yAxis.max).toBe(1000)
    })

    it('default nice behavior — axes without explicit interval get nice ticks', () => {
        const { config } = plotman({
            yAxis: { min: 0, max: 100, hasLogScale: false },
            xAxis: { min: 0, max: 100, hasLogScale: false },
        })
        const interval = config.yAxis.ticks![1].value - config.yAxis.ticks![0].value
        const magnitude = Math.pow(10, Math.floor(Math.log10(interval)))
        const ratio = interval / magnitude
        expect([1, 2, 5, 10]).toContain(ratio)
    })
})
