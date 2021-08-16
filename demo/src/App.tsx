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
// console.log('data')
// console.log(data)
const settings1 = { width: 500, height: 800, margin: { top: 80 }, xAxis: { categories }, yAxis: { interval: 20 }, colors, fields: { x: 'cat', y: 'profit', size: 'fruit.price' } }
const settings2 = { ...settings1, xAxis: { interval: 25 }, fields: { x: 'revenue', y: 'profit', size: 'fruit.price' } }
const settings3 = { ...settings1, xAxis: { bins: 10 }, yAxis: { categories }, fields: { x: 'profit', y: 'cat', size: 'fruit.price' } }

function App() {
    const { config, plotXY } = plotman({ width: 600, margin: { top: 80 }, xAxis: { categories }, yAxis: { interval: 20 } })
    return (
        <div className="app" style={{ paddingTop: '400px' }}>
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
            </div>
        </div>
    )
}

export default App
