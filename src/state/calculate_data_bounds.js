function finalizeBounds(bounds, { dates }) {
    const initial = (bounds.minX === null && bounds.maxX === null) || bounds.minY === null || bounds.maxY === null;

    for (let key of Object.keys(bounds)) {
        if (typeof bounds[key] !== 'number' && bounds[key] !== null) {
            bounds[key] = null;
        }
    }

    bounds.initial = initial;
    bounds.dates = dates;

    return bounds;
}

function percentileBounds(inDataSpace, bounds, {percentile=100, percentileAsymmetry=0, rangeValues=[]}={}) {
    let dates = false;

    bounds.minX = inDataSpace[0][0];
    if (bounds.minX instanceof Date) {
        bounds.minX = bounds.minX.valueOf();
        dates = true;
    }

    bounds.maxX = inDataSpace[inDataSpace.length - 1][0];
    if (bounds.maxX instanceof Date) {
        bounds.maxX = bounds.maxX.valueOf();
        dates = true;
    }

    const sortedByY = inDataSpace
        .filter(([_x, y]) => typeof y === 'number')
        .sort(([_x1, y1], [_x2, y2]) => y1 - y2);

    for (let rangeValue of rangeValues) {
        if (typeof rangeValue === 'number') {
            sortedByY.push([null, rangeValue]);
        }
    }
    sortedByY.sort(([_x1, y1], [_x2, y2]) => y1 - y2);

    if (!sortedByY.length) {
        return finalizeBounds(bounds, {dates});
    }

    const asymmetry = Math.min(Math.abs(percentileAsymmetry), (100-percentile)/2) * (percentileAsymmetry < 0 ? -1 : 1);
    const inBottomPercentile = (100-percentile)/2 + asymmetry;
    const inTopPercentile = (100-percentile)/2 - asymmetry;

    const startIndex = Math.floor((sortedByY.length-1)*inBottomPercentile/100);
    const endIndex = Math.floor((sortedByY.length-1)*(100-inTopPercentile)/100);

    bounds.minY = sortedByY[startIndex][1];
    bounds.maxY = sortedByY[endIndex][1];

    return finalizeBounds(bounds, {dates});
}

export default function calculateDataBounds(inDataSpace, {percentile=100, percentileAsymmetry=0, rangeValues=[]}={}) {
    let bounds = {
        minX: null,
        maxX: null,
        minY: null,
        maxY: null,
        closestSpacing: null
    };

    if (percentile !== 100 && inDataSpace.length) {
        return percentileBounds(inDataSpace, bounds, {percentile, percentileAsymmetry, rangeValues});
    }

    let dates = false;
    let prevX = null;

    for (let [x, y] of inDataSpace) {
        if (x === null) {
            continue;
        }
        
        if (x instanceof Date) {
            x = x.valueOf();
            dates = true;
        }

        if (typeof bounds.minX !== 'number' || x < bounds.minX) {
            bounds.minX = x;
        }

        if (typeof bounds.maxX !== 'number' || x > bounds.maxX) {
            bounds.maxX = x;
        }

        if (typeof prevX === 'number' && typeof x === 'number') {
            const spacing = x - prevX;
            if (typeof bounds.closestSpacing !== 'number' || spacing < bounds.closestSpacing) {
                bounds.closestSpacing = spacing;
            }
        }
        prevX = x;

        if (typeof y !== 'number') {
            continue;
        }

        if (typeof bounds.minY !== 'number' || y < bounds.minY) {
            bounds.minY = y;
        }

        if (typeof bounds.maxY !== 'number' || y > bounds.maxY) {
            bounds.maxY = y;
        }
    }

    for (let rangeValue of rangeValues) {
        if (typeof rangeValue === 'number') {
            if (typeof bounds.minY !== 'number' || rangeValue < bounds.minY) {
                bounds.minY = rangeValue;
            }
            if (typeof bounds.maxY !== 'number' || rangeValue > bounds.maxY) {
                bounds.maxY = rangeValue;
            }
        }
    }
    
    return finalizeBounds(bounds, {dates});
}
