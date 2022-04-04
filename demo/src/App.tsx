import React, { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import './app.scss'
// import { plotman } from 'plotman'
import VariousPlots from './VariousPlots'
import ScatterPlot from './ScatterPlot'

const screenWidth = window.innerWidth
const defaultWidth = 300
const chartWidth = screenWidth ? (screenWidth >= 1200 ? (screenWidth - 200) / 3 : (screenWidth - 100) / 2) : defaultWidth

const categories = ['Apple', 'Banana', 'Cherry']
const colors = ['salmon', 'steelblue', 'orchid']
const maxFruitPrice = 10

const data = Array(50)
    .fill({})
    .map((item, itemIndex) => {
        const cat = Math.floor(Math.random() * categories.length)
        return {
            id: 'store-' + itemIndex,
            cat,
            revenue: Math.floor(Math.random() * 100),
            profit: Math.floor(Math.random() * 100),
            fruit: { name: categories[cat], price: Math.floor(Math.random() * maxFruitPrice) },
            color: colors[cat],
        }
    })

const logData = data.map((item) => ({ ...item, revenue: item.revenue * item.revenue, profit: item.profit * item.profit }))

// console.log('data')
// console.log(data)

// Categories on X-axis, continuous Y-axis
const settings1 = {
    title: 'Categories on X-axis, Continuous Y-axis',
    width: chartWidth,
    height: 600,
    margin: { top: 40, right: 40, bottom: 40, left: 80 },
    xAxis: { categories },
    yAxis: {
        interval: 20,
        min: Math.min(...data.map((point) => point.profit)),
        // min: 0,
        max: Math.max(...data.map((point) => point.profit)),
    },
    colors,
    fields: { x: 'cat', y: 'profit', size: 'fruit.price' },
}

// Categories on Y-axis, continuous X-axis
const settings2 = {
    ...settings1,
    title: 'Continuous X-axis, Categories on Y-axis',
    xAxis: { bins: 4 },
    yAxis: { categories },
    fields: { x: 'profit', y: 'cat', size: 'fruit.price' },
}

// Both X and Y axis continuous
const settings3 = {
    ...settings1,
    title: 'Both X and Y axis Continuous',
    xAxis: {
        interval: 25,
        min: -30,
        max: 130,
    },
    yAxis: {
        interval: 10,
        min: Math.min(0, ...data.map((point) => point.profit)),
        max: Math.max(100, ...data.map((point) => point.profit)),
    },
    fields: { x: 'revenue', y: 'profit', size: 'fruit.price' },
}

// Log scale on X-axis, Ticks at specific values on X-axis and Y-axis
const settings4 = {
    ...settings3,
    title: 'Log scale on X-axis, Ticks at specific values on y-axis',
    xAxis: { hasLogScale: true, min: 0, max: 10000, values: [0, 10, 100, 1000, 10000] },
    yAxis: { min: 0, max: 10000, values: [0, 1000, 2000, 5000, 10000] },
}

// Log scale on Y-axis
const settings5 = {
    ...settings3,
    title: 'Bins on X-axis, Log scale on Y-axis',
    xAxis: { min: 0, max: 10000, bins: 4 },
    yAxis: { hasLogScale: true, min: 0, max: 10000, bins: 5 },
}

// Log scale on Y-axis
const settings6 = {
    ...settings1,
    title: 'Categories on X-axis, Log scale on Y-axis',
    yAxis: { hasLogScale: true, min: 0, max: 10000, bins: 5 },
}

function App() {
    // const { config, plotXY } = plotman({ width: 600, margin: { top: 80 }, xAxis: { categories }, yAxis: { interval: 20 } })
    return (
        <div className="app" style={{ paddingTop: '20px' }}>
            <div className="">
                <h1>Examples of various plots with minimal config</h1>
                <div className="">
                    <VariousPlots />
                </div>
            </div>
            {/* <div className="">
                <div className="">
                    <h1>Examples of Bubble Chart with various settings</h1>
                    <br />
                </div>
                <div className="row">
                    <div className="col-lg-6 col-xl-4">
                        <div className="box">
                            <ScatterPlot data={data} settings={settings1} />
                        </div>
                    </div>
                    <div className="col-lg-6 col-xl-4">
                        <div className="box">
                            <ScatterPlot data={data} settings={settings2} />
                        </div>
                    </div>
                    <div className="col-lg-6 col-xl-4">
                        <div className="box">
                            <ScatterPlot data={data} settings={settings3} />
                        </div>
                    </div>
                    <div className="col-lg-6 col-xl-4">
                        <div className="box">
                            <ScatterPlot data={logData} settings={settings4} />
                        </div>
                    </div>
                    <div className="col-lg-6 col-xl-4">
                        <div className="box">
                            <ScatterPlot data={logData} settings={settings5} />
                        </div>
                    </div>
                    <div className="col-lg-6 col-xl-4">
                        <div className="box">
                            <ScatterPlot data={logData} settings={settings6} />
                        </div>
                    </div>
                </div>
            </div> */}
        </div>
    )
}

export default App
