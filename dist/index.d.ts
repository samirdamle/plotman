import { Properties } from 'csstype';
declare type Tick = {
    label: string | number;
    prefix?: string;
    suffix?: string;
    x: number;
    y: number;
};
declare type Axis = {
    title?: string;
    min: number;
    max: number;
    tick?: Tick;
    interval?: number;
    bins?: number;
    categories?: string[];
    ticks?: Tick[];
};
declare type Config = {
    width: number;
    height: number;
    margin: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    plotArea?: {
        width?: number;
        height?: number;
    };
    title?: string;
    xAxis: Axis;
    xAxis2?: Axis;
    yAxis: Axis;
    yAxis2?: Axis;
    styles?: {
        container: Properties;
        plotArea: Properties;
        xAxis: Properties;
        yAxis: Properties;
    };
};
declare function plotman(config?: Config): {
    config: Config;
    plot: (data: any[]) => void;
    plotXY: (x: number | string, y: number | string, data: any) => {
        x: number | null;
        y: number | null;
        data: any;
    };
    plotX: (x: number | string, data?: any) => number | null;
    plotY: (y: number | string, data?: any) => number | null;
};
export { plotman };
export default plotman;
