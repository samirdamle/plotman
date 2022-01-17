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

export type PlotOptions = {
    x: string | number
    y: string | number
    z: string | number
    appendToOriginalObject?: boolean
    returnAsObjects?: boolean
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

    let xRange = Math.abs(xAxis.max - xAxis.min)
    xRange = xRange === 0 ? Number.EPSILON : xRange

    let yRange = Math.abs(yAxis.max - yAxis.min)
    yRange = yRange === 0 ? Number.EPSILON : yRange

    const plotW = Math.abs(width - margin.left - margin.right)
    const plotH = Math.abs(height - margin.top - margin.bottom)

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

    function plot(data: any[], options: PlotOptions) {
        const { x, y, z, appendToOriginalObject, returnAsObjects } = options ?? {}
        let plottedData
        if (data && Array.isArray(data)) {
            if (data.every((item) => typeof item === 'number')) {
                // data is an array of numbers, each of which is a yValue
                plottedData = data.map((item) => (x ? plotX(item) : plotY(item)))
            } else if (data.every((item) => Array.isArray(item) || item == null)) {
                // data is an array of arrays of shape: [xValue, yValue, zValue]
                plottedData = data.map((item) => {
                    let arr = null
                    if (item != null) {
                        arr = [plotX(item[0])]
                        if (item.length > 1) {
                            arr.push(plotY(item[1]))
                        }
                        if (item.length > 2) {
                            arr.push(item[2])
                        }
                    }
                    return arr
                })
            } else if (data.every((item) => typeof item === 'object' || item == null)) {
                // data is an array of objects of shape: { [x]: xValue, [y]: yValue, [z]: zValue }
                if (appendToOriginalObject) {
                    plottedData = data.map((item) => ({ ...item, plotman: { x: plotX(x, item), y: plotY(y, item), z: get(item, z) } }))
                } else if (returnAsObjects) {
                    plottedData = data.map((item) => ({ x: plotX(x, item), y: plotY(y, item), z: get(item, z) }))
                } else {
                    plottedData = data.map((item) => [plotX(x, item), plotY(y, item), get(item, z)])
                }
            } else {
                throw new Error('Plotman plot() method did not receive a valid - A. array of arrays or B. array of objects - as the first argument.')
            }
        } else {
            throw new Error('Plotman plot() method did not receive a valid array as the first argument.')
        }
        return plottedData
    }

    function plotXY(x: number | string, y: number | string, data: any) {
        const point = { x: plotX(x, data), y: plotY(y, data), data }
        return point
    }

    function plotX(x: number | string, data?: any) {
        let px = typeof x === 'number' ? x : data != null ? get(data, x) : null
        px = px != null && xAxis.categories && xAxis.categories.length > 0 ? px + 0.5 : px
        let ratio
        if (!xAxis.categories && xAxis.hasLogScale) {
            const log10XRange = xRange !== 1 ? Math.log10(xRange) : Number.EPSILON
            ratio = Math.log10(px - xAxis.min) / log10XRange
        } else {
            ratio = (px - xAxis.min) / xRange
        }
        // const ratio = !xAxis.categories && xAxis.hasLogScale ? Math.log10(px - xAxis.min) / Math.log10(xRange) : (px - xAxis.min) / xRange
        return px != null ? ratio * plotW : null
    }

    function plotY(y: number | string, data?: any) {
        let py = typeof y === 'number' ? y : data != null ? get(data, y) : null
        py = py != null && yAxis.categories && yAxis.categories.length > 0 ? py + 0.5 : py
        const diff = py - yAxis.min
        let ratio
        if (!yAxis.categories && yAxis.hasLogScale) {
            const log10YRange = yRange !== 1 ? Math.log10(yRange) : Number.EPSILON
            ratio = 1 - (diff === 0 ? diff : Math.log10(Math.abs(diff))) / log10YRange
        } else {
            ratio = 1 - diff / yRange
        }
        // const ratio = !yAxis.categories && yAxis.hasLogScale ? 1 - (diff === 0 ? diff : Math.log10(Math.abs(diff))) / Math.log10(yRange) : 1 - diff / yRange
        return py != null ? plotH * ratio : null
    }

    function unplot(points: any[], options: any) {
        console.log('%c yAxis.categories', 'color: lime')
        console.log(yAxis.categories)
        const { x } = options ?? {}
        let data
        if (Array.isArray(points)) {
            if (points.every((point) => typeof point === 'number' || point == null)) {
                data = points.map((point) => (x ? unplotX(point) : unplotY(point)))
            } else if (points.every((point) => Array.isArray(point) || point == null)) {
                // points is an array of arrays of shape [xCoordinate, yCoordinate, zCoordinate] where coordinates can be null
                data = points.map((point) => {
                    let arr = null
                    if (point != null) {
                        arr = [unplotX(point[0])]
                        if (point.length > 1) {
                            arr.push(unplotY(point[1]))
                        }
                        if (point.length > 2) {
                            arr.push(point[2])
                        }
                        return arr
                    }
                    return point
                })
            } else if (points.every((point) => typeof point === 'object' || point == null)) {
                // points is an array of objects {x: xCoordinate, y: yCoordinate, z: zCoordinate} where coordinates can be null
                data = points.map((point) => (point != null ? [unplotX(point.x), unplotY(point.y), point.z] : null))
            } else {
                throw new Error('Plotman unplot() method did not receive a valid - A. array of arrays or B. array of objects - as the first argument.')
            }
            return data
        } else {
            throw new Error('Plotman unplot() method did not receive a valid array as the first argument.')
        }
    }

    function unplotX(x: number) {
        let px: number | null = x
        const hasCategories = xAxis.categories && xAxis.categories.length > 0
        // px = xAxis.categories && xAxis.categories.length > 0 ? px - 0.5 : px
        px = px != null ? (px / plotW) * xRange + xAxis.min : null
        px = hasCategories && px != null ? Math.abs(Math.round(px - 0.5)) : px
        return px
    }

    function unplotY(y: number) {
        let py: number | null = y
        // py = yAxis.categories && yAxis.categories.length > 0 ? py - 0.5 : py
        const hasCategories = yAxis.categories && yAxis.categories.length > 0
        // return py != null ? 1 - (py / plotH) * yRange + yAxis.min : null
        py = py != null ? (py / plotH) * yRange + yAxis.min : null
        py = hasCategories && py != null ? Math.abs(Math.round(py - 0.5)) : py
        return py
    }

    function unplotXY(x: number, y: number) {
        const point = { x: unplotX(x), y: unplotY(y) }
        return point
    }

    return { config, plot, plotXY, plotX, plotY, unplot, unplotX, unplotY, unplotXY }
}

export { plotman }
export default plotman
