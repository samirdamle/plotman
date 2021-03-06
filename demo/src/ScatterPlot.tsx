import React from 'react'
import { plotman } from 'plotman'
import get from 'lodash/get'

function ScatterPlot({ data, settings }) {
    const { colors } = settings || ['red', 'blue', 'green', 'violet']
    const { fields } = settings
    const { config, plotXY, plot, unplot } = plotman(settings)

    console.log('%c config', 'color: red')
    console.log(config)

    let plottedDataOfNumbers, plottedDataOfArrays, plottedDataOfObjects
    function tryOutPlot() {
        console.log('%c ============================', 'color: orange')
        console.log('fields', fields)

        plottedDataOfNumbers = plot(data.map((item) => item[fields.y]))
        console.log('%c data as array of numbers', 'color: cyan')
        console.log(plottedDataOfNumbers)

        // Test cases for null value check for x, y, z
        plottedDataOfArrays = plot(data.map((item) => [item[fields.x], item[fields.y], get(item, fields.size)])) // none of x, y, z are null
        // plottedDataOfArrays = plot(data.map((item) => [item[fields.x], item[fields.y], null]))                // z is null
        // plottedDataOfArrays = plot(data.map((item) => [item[fields.x], item[fields.y]]))                      // x and y only
        // plottedDataOfArrays = plot(data.map((item) => [item[fields.x]]))                                      // x only
        // plottedDataOfArrays = plot(data.map((item) => [item[fields.x], null, null]))                          // y and z are null
        // plottedDataOfArrays = plot(data.map((item) => [null, null, null]))                                    // x, y, z are null
        // plottedDataOfArrays = plot(data.map((item) => null))                                                  // all items are null

        console.log('%c data as array of arrays', 'color: yellow')
        console.log(plottedDataOfArrays)

        plottedDataOfObjects = plot(data, {
            x: fields.x,
            y: fields.y,
            z: fields.size,
            // appendToOriginalObject: true,
            returnAsObjects: true,
        })

        console.log('%c data as array of objects', 'color: lime')
        console.log(plottedDataOfObjects)
    }
    tryOutPlot()

    let dataOfNumbers, dataOfArrays, dataOfObjects
    function tryOutUnplot() {
        console.log('>>>>>>>>>>>>>>>>>>>')
        dataOfNumbers = unplot(plottedDataOfNumbers)
        console.log('%c dataOfNumbers', 'color: lime')
        console.log(dataOfNumbers)

        dataOfArrays = unplot(plottedDataOfArrays)
        console.log('%c dataOfArrays', 'color: pink')
        console.log(dataOfArrays)

        dataOfObjects = unplot(plottedDataOfObjects)
        console.log('%c dataOfObjects', 'color: orange')
        console.log(dataOfObjects)
    }
    tryOutUnplot()

    return (
        <div>
            <h2 className="title">{settings.title}</h2>
            <div style={{ ...config.styles.container }}>
                <div style={{ ...config.styles.xAxis, borderTop: 'solid #000 1px' }}>
                    {config.xAxis.ticks.map((item, itemIndex) => {
                        return (
                            <div key={itemIndex} className="position-absolute" style={{ left: item.x + 'px', top: item.y + 'px' }}>
                                <div className={`d-flex flex-column align-items-center`} style={{ width: '100px', marginLeft: '-50px' }}>
                                    <div style={{ width: '2px', height: '10px', marginLeft: '-1px', background: '#666' }}></div>
                                    <div className="pt-0">{item.label}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div style={{ ...config.styles.yAxis, borderRight: 'solid #000 1px' }}>
                    {config.yAxis.ticks.map((item, itemIndex) => {
                        return (
                            <div key={itemIndex} className="position-absolute" style={{ right: item.x + 'px', top: item.y + 'px' }}>
                                <div className={`d-flex justify-content-end align-items-center`} style={{ height: '30px', marginTop: '-15px' }}>
                                    <div className="pe-1">{item.label}</div>
                                    <div style={{ width: '10px', height: '2px', marginTop: '-1px', background: '#666' }}></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div style={{ ...config.styles.plotArea }}>
                    {data.map((item, itemIndex) => {
                        const point = plotXY(fields.x, fields.y, item)
                        return (
                            <div
                                key={itemIndex}
                                className="position-absolute"
                                title={`x: ${get(item, fields.x)}  |  y: ${get(item, fields.y)}  |  z: ${get(item, fields.size)}`}
                                style={{
                                    left: point.x + 'px',
                                    top: point.y + 'px',
                                    width: get(item, fields.size) * 4 + 'px',
                                    height: get(item, fields.size) * 4 + 'px',
                                    marginLeft: -get(item, fields.size) * 2 + 'px',
                                    marginTop: -get(item, fields.size) * 2 + 'px',
                                    borderRadius: '100px',
                                    background: item.color,
                                    opacity: 0.5,
                                }}></div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default ScatterPlot
