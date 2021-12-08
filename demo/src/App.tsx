import React, { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import { plotman } from 'plotman'
import ScatterPlot from './ScatterPlot'

const categories = ['Apple', 'Banana', 'Cherry']
const colors = ['salmon', 'steelblue', 'orchid']

const data = Array(50)
    .fill({})
    .map((item, itemIndex) => {
        const cat = Math.floor(Math.random() * categories.length)
        return {
            id: 'store-' + itemIndex,
            cat,
            revenue: Math.floor(Math.random() * 100),
            profit: Math.floor(Math.random() * 100),
            fruit: { name: categories[cat], price: Math.floor(Math.random() * 16) },
            color: colors[cat],
        }
    })

const logData = data.map((item) => ({ ...item, revenue: item.revenue * item.revenue, profit: item.profit * item.profit }))

console.log('data')
console.log(data)

// Categories on X-axis, continuous Y-axis
const settings1 = {
    width: 500,
    height: 800,
    margin: { top: 80 },
    xAxis: { categories },
    yAxis: {
        interval: 20,
        min: Math.min(...data.map((point) => point.profit)),
        max: Math.max(...data.map((point) => point.profit)),
    },
    colors,
    fields: { x: 'cat', y: 'profit', size: 'fruit.price' },
}

// Categories on Y-axis, continuous X-axis
const settings2 = { ...settings1, xAxis: { bins: 10 }, yAxis: { categories }, fields: { x: 'profit', y: 'cat', size: 'fruit.price' } }

// Both X and Y axis continuous
const settings3 = {
    ...settings1,
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

// Log scale on X-axis
const settings4 = {
    ...settings3,
    xAxis: { hasLogScale: true, min: 0, max: 10000, values: [0, 10, 100, 1000, 10000] },
    yAxis: { min: 0, max: 10000, values: [0, 2000, 4000, 6000, 8000, 10000] },
}

// Log scale on Y-axis
const settings5 = {
    ...settings3,
    xAxis: { min: 0, max: 10000, bins: 4 },
    yAxis: { hasLogScale: true, min: 0, max: 10000, bins: 5 },
}

// Log scale on Y-axis
const settings6 = {
    ...settings1,
    yAxis: { hasLogScale: true, min: 0, max: 10000, bins: 5 },
}

function App() {
    const { config, plotXY } = plotman({ width: 600, margin: { top: 80 }, xAxis: { categories }, yAxis: { interval: 20 } })
    return (
        <div className="app" style={{ paddingTop: '0px' }}>
            <div className="row">
                <div className="col-4">
                    <ScatterPlot data={data} settings={settings1} />
                </div>
                <div className="col-4">
                    <ScatterPlot data={data} settings={settings2} />
                </div>
                <div className="col-4">
                    <ScatterPlot data={data} settings={settings3} />
                </div>
                <div className="col-4">
                    <ScatterPlot data={logData} settings={settings4} />
                </div>
                <div className="col-4">
                    <ScatterPlot data={logData} settings={settings5} />
                </div>
                <div className="col-4">
                    <ScatterPlot data={logData} settings={settings6} />
                </div>
            </div>
        </div>
    )
}

export default App
