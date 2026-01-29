import { LineSeries } from "@nivo/line"

type DeepWritable<T> = {
    -readonly [P in keyof T]: T[P] extends object
        ? DeepWritable<T[P]>
        : T[P];
};

export type Series = LineSeries & {
    color?: string;
};

export type MutableSeries = DeepWritable<LineSeries> & {
    color?: string;
};