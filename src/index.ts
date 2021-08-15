import merge from 'ts-deepmerge'
import get from 'lodash/get'
import { Properties } from 'csstype'

type Tick = {
    label: string | number
    prefix?: string
    suffix?: string
    x: number
    y: number
}

type Axis = {
    title?: string
    min: number
    max: number
    tick?: Tick
    interval?: number
    bins?: number
    categories?: string[]
    ticks?: Tick[]
    // tick: {
    //     margin: number
    // }
}

type Config = {
    width: number
    height: number
    margin: {
        top: number
        bottom: number
        left: number
        right: number
    }
    plotArea?: {
        width?: number
        height?: number
    }
    title?: string
    xAxis: Axis
    xAxis2?: Axis
    yAxis: Axis
    yAxis2?: Axis
    styles?: {
        container: Properties
        plotArea: Properties
        xAxis: Properties
        yAxis: Properties
    }
}

const defaultConfig: Config = {
    width: 800,
    height: 800,
    margin: {
        top: 80,
        bottom: 120,
        left: 80,
        right: 20,
    },
    xAxis: {
        min: 0,
        max: 100,
    },
    yAxis: {
        min: 0,
        max: 100,
    },
}

function plotman(config: Config = defaultConfig) {
    config = merge(defaultConfig, config)
    let { width, height, margin, xAxis, yAxis } = config
    const xRange = Math.abs(xAxis.max - xAxis.min)
    const yRange = Math.abs(yAxis.max - yAxis.min)
    const plotW = width - margin.left - margin.right
    const plotH = height - margin.top - margin.bottom

    if (xAxis.categories && xAxis.categories.length > 0) {
        xAxis.ticks = xAxis.categories.map((cat: string, catIndex: number) => {
            const len = Array.isArray(xAxis.categories) ? xAxis.categories.length : 1
            const interval = len ? plotW / len : 1
            const tick: Tick = {
                label: cat,
                x: (catIndex + 0.5) * interval,
                y: 0,
            }
            return tick
        })
    } else if (xAxis.bins != null) {
        xAxis.ticks = Array(xAxis.bins + 1)
            .fill(1)
            .map((_, binIndex) => {
                const px = xAxis.min + (binIndex * xRange) / (xAxis.bins ?? 1)
                const x = plotX(px) || 0
                const tick: Tick = {
                    label: (xAxis.tick?.prefix || '') + px + (xAxis.tick?.suffix || ''),
                    x,
                    y: 0,
                }
                return tick
            })
    } else {
        const bins = xAxis.interval ? Math.floor(xRange / xAxis.interval) : 2
        xAxis.interval = xAxis.interval || xRange / bins || 1
        xAxis.ticks = Array(bins + 1)
            .fill(1)
            .map((_, binIndex) => {
                const px = xAxis.min + binIndex * (xAxis.interval || 1)
                const x = plotX(px) || 0
                const tick: Tick = {
                    label: (xAxis.tick?.prefix || '') + px + (xAxis.tick?.suffix || ''),
                    x,
                    y: 0,
                }
                return tick
            })
    }

    config = {
        ...config,
        plotArea: { width: plotW, height: plotH },
        styles: {
            container: { position: 'relative', width: width + 'px', height: height + 'px' },
            plotArea: { position: 'absolute', left: margin.left + 'px', top: margin.top + 'px', width: plotW + 'px', height: plotH + 'px' },
            xAxis: { position: 'absolute', left: margin.left + 'px', top: margin.top + plotH + 'px', width: plotW + 'px', height: margin.bottom + 'px' },
            yAxis: { position: 'absolute', left: '0', top: margin.top + 'px', width: margin.left + 'px', height: plotH + 'px' },
        },
    }

    function plot(data: any[]) {
        console.log(data)
    }

    function plotXY(x: number | string, y: number | string, data: any) {
        // const px = typeof x === 'number' ? x : data != null ? get(data, x) : null
        // const py = typeof y === 'number' ? y : data != null ? get(data, y) : null
        // const point = { x: px != null ? (px * plotW) / xRange : null, y: py != null ? (py * plotH) / yRange : null, data }
        const point = { x: plotX(x, data), y: plotY(y, data), data }
        return point
    }

    function plotX(x: number | string, data?: any) {
        const px = typeof x === 'number' ? x : data != null ? get(data, x) : null
        return px != null ? (px * plotW) / xRange : null
    }

    function plotY(y: number | string, data?: any) {
        const py = typeof y === 'number' ? y : data != null ? get(data, y) : null
        return py != null ? (py * plotH) / yRange : null
    }

    return { config, plot, plotXY, plotX, plotY }
}

export { plotman }
export default plotman
