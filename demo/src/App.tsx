import React, { useState } from 'react'
import './App.css'
import { plotman } from 'plotman'

function App() {
    const { plot } = plotman({ width: 900, margin: { top: 0 } })
    plot()

    return <div className="app">Hello2</div>
}

export default App
