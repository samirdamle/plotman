import React, { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import { plotman } from 'plotman'

const data = [
    {
        revenue: 49,
        profit: 22,
        fruit: {
            name: 'Apple',
            price: 10,
        },
    },
    {
        revenue: 74,
        profit: 39,
        fruit: {
            name: 'Banana',
            price: 5,
        },
    },
    {
        revenue: 20,
        profit: 62,
        fruit: {
            name: 'Cherry',
            price: 15,
        },
    },
]

function App() {
    const { config, plotXY } = plotman({ width: 900, margin: { top: 80 } })
    console.log(config)

    return (
        <div className="app">
            <div style={{ ...config.styles.container, background: 'thistle' }}>
                <div style={{ ...config.styles.xAxis, background: 'bisque' }}>
                    {config.xAxis.ticks.map((item, itemIndex) => {
                        return (
                            <div key={itemIndex} className="position-absolute border flex-grow-1" style={{ left: item.x + 'px', top: item.y + 'px' }}>
                                {/* <div style={{ marginLeft: itemIndex === config.xAxis.ticks.length - 1 ? '-100%' : '' }}>{item.label}</div> */}
                                {/* <div className={`d-flex flex-column ${itemIndex === 0 ? '' : 'align-items-center'}`} style={{ width: '100px', marginLeft: itemIndex === 0 ? '' : '-50px' }}> */}
                                <div className={`d-flex flex-column align-items-center`} style={{ width: '100px', marginLeft: '-50px' }}>
                                    <div className="">|</div>
                                    <div className="">{item.label}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div style={{ ...config.styles.yAxis, background: 'tan' }}></div>
                <div style={{ ...config.styles.plotArea, background: 'white' }}>
                    {data.map((item, itemIndex) => {
                        const point = plotXY('revenue', 'profit', item)
                        return (
                            <div
                                key={itemIndex}
                                className="position-absolute"
                                style={{ left: point.x, top: point.y, width: item.fruit.price * 4 + 'px', height: item.fruit.price * 4 + 'px', borderRadius: '100px', background: 'lime' }}></div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default App
