import React from 'react'
import { plotman } from 'plotman'

function MiniChart({
    data = [],
    options = {
        width: 200,
        height: 100,
    },
}: {
    data: any[]
    options: any
}) {
    const { config, plot } = plotman(options)
    console.log('%c config', 'color: lime')
    console.log(config)
    console.log('===')
    const {
        chartType,
        gap = 1,
        plotArea: { width, height },
        xAxis,
        yAxis,
    } = config
    const points = plot(data, { x: chartType === 'bar' })

    console.log('%c points', 'color: yellow')
    console.log(points)

    function pointsToLinePath(points: number[]) {
        const xCoords = points.map((point, pointIndex) => (width / points.length) * pointIndex + (0.5 * width) / points.length)
        let d = 'M ' + xCoords[0] + ' ' + points[0] + points.map((point, pointIndex) => ' L ' + xCoords[pointIndex] + ' ' + point)
        let vertices = points.map((point, pointIndex) => [xCoords[pointIndex], point])
        console.log('%c vertices', 'color: lime')
        console.log(vertices)
        return { d, vertices }
    }

    return (
        <div>
            <div className="mb-2">MiniChart</div>
            {chartType === 'bar' && (
                <div className={`d-flex flex-column`}>
                    {points.map((point, pointIndex) => (
                        <div
                            key={pointIndex}
                            style={{ width: point + 'px', height: (height - gap * points.length) / points.length + 'px', marginBottom: gap + 'px', background: 'steelblue' }}
                            title={yAxis.categories[pointIndex] + ' = ' + data[pointIndex]}></div>
                    ))}
                </div>
            )}
            {chartType === 'column' && (
                <div className={`d-flex align-items-end`}>
                    {points.map((point, pointIndex) => (
                        <div
                            key={pointIndex}
                            style={{ width: (width - gap * points.length) / points.length + 'px', height: height - point + 'px', marginRight: gap + 'px', background: 'steelblue' }}
                            title={xAxis.categories[pointIndex] + ' = ' + data[pointIndex]}></div>
                    ))}
                </div>
            )}
            {(chartType === 'line' || chartType === 'scatter') && (
                <div>
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {chartType === 'line' && <path d={pointsToLinePath(points).d} stroke="steelblue" strokeWidth={2} fill="none" />}
                        {pointsToLinePath(points).vertices.map((vertex, vertexIndex) => (
                            <circle key={vertexIndex} r={(0.25 * width) / points.length} fill={chartType === 'line' ? 'transparent' : 'steelblue'} cx={vertex[0]} cy={vertex[1]}>
                                <title>{xAxis.categories[vertexIndex] + ' = ' + data[vertexIndex]}</title>
                            </circle>
                        ))}
                    </svg>
                </div>
            )}
        </div>
    )
}
function MiniBarChart(props: any) {
    return <div>MiniBarChart</div>
}
function MiniLineChart(props: any) {
    return <div>MiniLineChart</div>
}
function MiniDotChart(props: any) {
    return <div>MiniDotChart</div>
}
function MiniScatterChart(props: any) {
    return <div>MiniScatterChart</div>
}

function VariousPlots() {
    const numData = [30, 60, 40, 70, 30, 10, 50, 80, 20, 10, 20, 40]
    const arrData1 = [
        [0, 20, [1, { qty: 2 }, 'red']],
        [1, 40, [6, { qty: 8 }, 'blue']],
        [2, 50, [3, { qty: 7 }, 'green']],
    ]
    const arrData2 = [
        [0, [20, 40, 10, 30], [1, { qty: 2 }, 'red']],
        [1, [10, 30, 20, 40], [6, { qty: 8 }, 'blue']],
        [2, [50, 70, 10, 60], [3, { qty: 7 }, 'green']],
    ]
    const { config, plot } = plotman({ width: 200, height: 60, xAxis: { min: 0, max: 5 }, yAxis: { min: 0, max: 100 } })
    const arrPoints = plot(arrData2)
    console.log('%c arrPoints', 'color: lime')
    console.log(arrPoints)

    return (
        <div>
            <div className="d-flex flex-wrap">
                <div className="mb-3 me-3 p-3 border" style={{ minWidth: '200px' }}>
                    <MiniChart
                        data={numData}
                        options={{
                            width: 200,
                            height: 100,
                            xAxis: { min: 0, max: Math.max(...numData) },
                            yAxis: { categories: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] },
                            chartType: 'bar',
                        }}
                    />
                    <br />
                </div>
                <div className="mb-3 me-3 p-3 border" style={{ minWidth: '200px' }}>
                    <MiniChart
                        data={numData}
                        options={{
                            width: 200,
                            height: 100,
                            xAxis: { categories: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] },
                            yAxis: { min: 0, max: Math.max(...numData) },
                            chartType: 'column',
                            gap: 4,
                        }}
                    />
                    <br />
                </div>
                <div className="mb-3 me-3 p-3 border" style={{ minWidth: '200px' }}>
                    <MiniChart
                        data={numData}
                        options={{
                            width: 200,
                            height: 100,
                            xAxis: { categories: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] },
                            yAxis: { min: 0, max: Math.max(...numData) },
                            chartType: 'line',
                        }}
                    />
                    <br />
                </div>
                <div className="mb-3 me-3 p-3 border" style={{ minWidth: '200px' }}>
                    <MiniChart
                        data={numData}
                        options={{
                            width: 200,
                            height: 100,
                            xAxis: { categories: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] },
                            yAxis: { min: 0, max: Math.max(...numData) },
                            chartType: 'scatter',
                        }}
                    />
                    <br />
                </div>
                <div className="mb-3 me-3 p-3 border" style={{ minWidth: '200px' }}>
                    <MiniDotChart />
                    <br />
                </div>
                <div className="mb-3 me-3 p-3 border" style={{ minWidth: '200px' }}>
                    <MiniScatterChart />
                    <br />
                </div>
            </div>
        </div>
    )
}

export default VariousPlots
