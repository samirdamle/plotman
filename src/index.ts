import merge from 'ts-deepmerge'

type Config = {
    width: number
    height: number
    margin: {
        top: number
        bottom: number
        left: number
        right: number
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
}

function plotman(config: Config = defaultConfig) {
    // config = { ...defaultConfig, ...config }
    config = merge(defaultConfig, config)

    function plot() {
        console.log('config')
        console.log(config)
        const { width } = config
        return width
    }

    function plotX() {}

    function plotY() {}

    return { plot, plotX, plotY }
}

export { plotman }
export default plotman
