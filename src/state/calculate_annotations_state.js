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
    const xRange = maxX - minX;

    // Avoid division by zero if minX === maxX
    if (xRange === 0) {
        return {
            annotations: [],
            elementWidth
        };
    }

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
        const isRange = annotation.startX !== undefined && annotation.endX !== undefined;
        const isPoint = annotation.x !== undefined;

        let xStartValue = annotation.startX;
        let xEndValue = annotation.endX;

        if (!isRange && isPoint) {
            xStartValue = annotation.x;
            xEndValue = annotation.x;
        } else if (!isRange && !isPoint) {
            return null;
        }

        const convertToNumber = (val) => {
            if (typeof val === 'string') return new Date(val).valueOf();
            if (val instanceof Date) return val.valueOf();
            return val;
        };

        let startX = convertToNumber(xStartValue);
        let endX = convertToNumber(xEndValue);

        if (startX > endX) {
            [startX, endX] = [endX, startX];
        }

        let pixelStartX = (startX - minX) / xRange * elementWidth;
        let pixelEndX = (endX - minX) / xRange * elementWidth;

        // Clamp values to be within the element width
        pixelStartX = Math.max(0, Math.min(elementWidth, pixelStartX));
        pixelEndX = Math.max(0, Math.min(elementWidth, pixelEndX));

        let pixelWidth = pixelEndX - pixelStartX;
        if (pixelWidth < 1 && pixelEndX > 0 && pixelStartX < elementWidth) {
             if (!isRange && isPoint) {
                 pixelWidth = 1;
                 pixelStartX -= 0.5;
             } else if (isRange) {
                 pixelWidth = 1;
             } else {
                 pixelWidth = 0;
             }
        }
        
        pixelStartX = Math.max(0, Math.min(elementWidth - pixelWidth, pixelStartX));


        if (pixelWidth <= 0) {
            return null;
        }


        return {
            ...annotation,
            isRange,
            pixelStartX,
            pixelWidth
        };
    }).filter(annotation => annotation !== null);

    return {
        annotations: renderableAnnotations,
        elementWidth
    };
}
