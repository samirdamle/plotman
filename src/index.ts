import merge from 'ts-deepmerge'
import get from 'lodash/get'
import { Properties } from 'csstype'

export type Tick = {
    label: string | number
    prefix?: string
    suffix?: string
    value: number
    x: number
    y: number
}

export type Axis = {
    title?: string
    min: number
    max: number
    tick?: Tick
    // tickMin?: number
    // tickMax?: number
    interval?: number
    bins?: number
    values?: number[]
    categories?: string[]
    ticks?: Tick[]
    hasLogScale: boolean
}

export type Config = {
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
        hasLogScale: false,
    },
    yAxis: {
        min: 0,
        max: 100,
        hasLogScale: false,
    },
}

function plotman(config: Config = defaultConfig) {
    config = merge(defaultConfig, config)
    let { width, height, margin, xAxis, yAxis } = config
    if (xAxis.categories && xAxis.categories.length > 0) {
        xAxis.min = 0
        xAxis.max = xAxis.categories.length
    }
    if (yAxis.categories && yAxis.categories.length > 0) {
        yAxis.min = 0
        yAxis.max = yAxis.categories.length
    }
    const xRange = Math.abs(xAxis.max - xAxis.min)
    const yRange = Math.abs(yAxis.max - yAxis.min)
    const plotW = width - margin.left - margin.right
    const plotH = height - margin.top - margin.bottom

    function setTicks(axis: any, range: number, isX: boolean) {
        if (axis.categories && axis.categories.length > 0) {
            axis.ticks = axis.categories.map((cat: string, catIndex: number) => {
                const len = Array.isArray(axis.categories) ? axis.categories.length : 1
                const interval = len ? (isX ? plotW : plotH) / len : 1
                const tick: Tick = {
                    label: cat,
                    value: catIndex,
                    x: isX ? (catIndex + 0.5) * interval : 0,
                    y: !isX ? plotH - (catIndex + 0.5) * interval : 0,
                }
                return tick
            })
        } else if (axis.bins != null && typeof axis.bins === 'number') {
            axis.ticks = Array(axis.bins + 1)
                .fill(1)
                .map((_, binIndex) => {
                    const value = axis.min + (binIndex * range) / (axis.bins ?? 1)
                    const coord = (isX ? plotX(value) : plotY(value)) || 0
                    const tick: Tick = {
                        label: (axis.tick?.prefix || '') + value + (axis.tick?.suffix || ''),
                        value,
                        x: isX ? coord : 0,
                        y: !isX ? coord : 0,
                    }
                    return tick
                })
        } else if (axis.values != null && typeof Array.isArray(axis.bins)) {
            axis.ticks = axis.values.map((value: number) => {
                const coord = (isX ? plotX(value) : plotY(value)) || 0
                const tick: Tick = {
                    label: (axis.tick?.prefix || '') + value + (axis.tick?.suffix || ''),
                    value,
                    x: isX ? coord : 0,
                    y: !isX ? coord : 0,
                }
                return tick
            })
        } else {
            const bins = axis.interval ? Math.ceil(range / axis.interval) : 2
            axis.interval = axis.interval || range / bins || 1
            axis.ticks = Array(bins + 1)
                .fill(1)
                .map((_, binIndex) => {
                    // const value = axis.min + binIndex * (axis.interval || 1)
                    const value = axis.interval * Math.ceil(axis.min / axis.interval) + binIndex * axis.interval
                    const coord = (isX ? plotX(value) : plotY(value)) || 0
                    const tick: Tick = {
                        label: (axis.tick?.prefix || '') + value + (axis.tick?.suffix || ''),
                        value,
                        x: isX ? coord : 0,
                        y: !isX ? coord : 0,
                    }
                    return tick
                })
                .filter((tick) => tick.value >= axis.min && tick.value <= axis.max)
        }
        return axis
    }

    xAxis = setTicks(xAxis, xRange, true)
    yAxis = setTicks(yAxis, yRange, false)

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
        const point = { x: plotX(x, data), y: plotY(y, data), data }
        return point
    }

    function plotX(x: number | string, data?: any) {
        let px = typeof x === 'number' ? x : data != null ? get(data, x) : null
        px = xAxis.categories && xAxis.categories.length > 0 ? px + 0.5 : px
        const ratio = !xAxis.categories && xAxis.hasLogScale ? Math.log10(px - xAxis.min) / Math.log10(xRange) : (px - xAxis.min) / xRange
        // if (true) {
        //     console.log('======')
        //     console.log('px = ' + px + ' | ratio = ' + ratio)
        // }
        return px != null ? ratio * plotW : null
    }

    function plotY(y: number | string, data?: any) {
        let py = typeof y === 'number' ? y : data != null ? get(data, y) : null
        py = yAxis.categories && yAxis.categories.length > 0 ? py + 0.5 : py
        const diff = py - yAxis.min
        const ratio = !yAxis.categories && yAxis.hasLogScale ? 1 - (diff === 0 ? diff : Math.log10(Math.abs(diff))) / Math.log10(yRange) : 1 - diff / yRange
        if (true) {
            console.log('======')
            console.log('py = ' + py + ' | ratio = ' + ratio)
        }
        return py != null ? plotH * ratio : null
    }

    function unplotX(x: number) {
        let px = x
        px = xAxis.categories && xAxis.categories.length > 0 ? px - 0.5 : px
        return px != null ? (px / plotW) * xRange + xAxis.min : null
    }

    function unplotY(y: number) {
        let py = y
        py = yAxis.categories && yAxis.categories.length > 0 ? py - 0.5 : py
        return py != null ? 1 - (py / plotH) * yRange + yAxis.min : null
    }

    function unplotXY(x: number, y: number) {
        const point = { x: unplotX(x), y: unplotY(y) }
        return point
    }

    return { config, plot, plotXY, plotX, plotY, unplotX, unplotY, unplotXY }
}

export { plotman }
export default plotman
