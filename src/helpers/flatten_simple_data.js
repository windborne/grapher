/**
 * Flattens simple data
 * Returns an array of tuples (x value, simple point)
 *
 * @param simpleData
 * @param series
 * @param inDataSpace
 * @return {[]}
 */
export default function flattenSimpleData(simpleData, {series, inDataSpace }) {
    const flattened = [];
    let fI = 0;

    for (let point of simpleData) {
        const yValue = extractYValue(point, series);

        if (series.yKey && Array.isArray(yValue)) {
            for (let subpoint of point[series.yKey]) {
                if (series.ignoreDiscontinuities && typeof subpoint[series.yKey] !== 'number' && !Array.isArray(subpoint)) {
                    continue;
                }

                const x = inDataSpace[fI++][0];

                if (series.square && flattened.length > 0) {
                    flattened.push([x, flattened[flattened.length - 1][1]]);
                }

                flattened.push([x, subpoint]);
            }

            continue;
        }

        if (series.ignoreDiscontinuities && (yValue === undefined || yValue === null)) {
            continue;
        }

        const x = inDataSpace[fI++][0];

        if (series.square && flattened.length > 0) {
            flattened.push([x, flattened[flattened.length - 1][1]]);
        }

        flattened.push([x, point]);
    }

    if (flattened.length !== inDataSpace.length)  {
        console.warn('Flattening didn\'t give the same length as it has in data space'); // eslint-disable-line no-console
    }

    return flattened;
}

export function extractYValue(point, series) {
    if (series.yKey) {
        return point[series.yKey];
    }

    if (Array.isArray(point)) {
        if (point.length === 1) {
            return point[0];
        } else {
            return point[1];
        }
    }

    return point;
}

export function extractXValue(point, series) {
    if (series.xKey) {
        return point[series.xKey];
    }

    if (Array.isArray(point)) {
        return point[0];
    }

    return point;
}
