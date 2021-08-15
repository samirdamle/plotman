const defaultConfig = {
    width: 800,
    height: 800,
    margin: {
        top: 80,
        bottom: 120,
        left: 80,
        right: 20,
    },
};
function plotman(config = defaultConfig) {
    config = { ...defaultConfig, ...config };
    function plot() {
        const { width } = config;
        return width;
    }
    function plotX() { }
    function plotY() { }
    return { plot, plotX, plotY };
}
export { plotman };
export default plotman;
//# sourceMappingURL=index.js.map