import nameForSeries from '../helpers/name_for_series.js';

export default function calculateAnnotationsState({ annotations, series, sizing, selection }) {
    const shownSeries = new Set(series.map((singleSeries, i) => {
        return {
            name: nameForSeries(singleSeries, i),
            hidden: singleSeries.hidden
        };
    }).filter(({ hidden }) => !hidden).map(({ name }) => name));

    const { elementWidth } = sizing;
    const { minX, maxX } = selection;

    const renderableAnnotations = annotations.filter((annotation) => {
        if (!annotation.series) {
            return true;
        }

        for (let seriesName of annotation.series) {
            if (shownSeries.has(seriesName)) {
                return true;
            }
        }

        return false;
    }).map((annotation) => {
        let xAsNumber = annotation.x;
        if (typeof xAsNumber === 'string') {
            xAsNumber = new Date(xAsNumber).valueOf();
        } else if (xAsNumber instanceof Date) {
            xAsNumber = xAsNumber.valueOf();
        }

        let xEndAsNumber = annotation.xEnd || xAsNumber;
        if (typeof xEndAsNumber === 'string') {
            xEndAsNumber = new Date(xEndAsNumber).valueOf();
        } else if (xEndAsNumber instanceof Date) {
            xEndAsNumber = xEndAsNumber.valueOf();
        }

        const xStart = Math.min(xAsNumber, xEndAsNumber);
        const xEnd = Math.max(xAsNumber, xEndAsNumber);

        const pixelX = (xStart - minX)/(maxX - minX) * elementWidth;
        const pixelEnd = (xEnd - minX)/(maxX - minX) * elementWidth;
        const width = Math.max(pixelEnd - pixelX, 1);

        return {
            ...annotation,
            pixelX,
            width
        };
    });

    return {
        annotations: renderableAnnotations,
        elementWidth
    };
}
