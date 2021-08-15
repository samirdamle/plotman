declare type Config = {
    width: number;
    height: number;
    margin: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
};
declare function plotman(config?: Config): {
    plot: () => number;
    plotX: () => void;
    plotY: () => void;
};
export { plotman };
export default plotman;
