export default function mergeBounds(boundsList) {
    const mergedBounds = {
        minX: null,
        maxX: null,
        minY: null,
        maxY: null,
        closestSpacing: null,
        dates: false,
        initial: true
    };

    for (let { minX, maxX, minY, maxY, dates, initial, closestSpacing } of boundsList) {
        if (dates) {
            mergedBounds.dates = true;
        }

        if (initial) {
            continue;
        }
        mergedBounds.initial = false;

        if (mergedBounds.minX === null || minX < mergedBounds.minX) {
            mergedBounds.minX = minX;
        }

        if (mergedBounds.maxX === null || maxX > mergedBounds.maxX) {
            mergedBounds.maxX = maxX;
        }

        if (mergedBounds.closestSpacing === null || closestSpacing < mergedBounds.closestSpacing) {
            mergedBounds.closestSpacing = closestSpacing;
        }

        if (mergedBounds.minY === null || minY < mergedBounds.minY) {
            mergedBounds.minY = minY;
        }

        if (mergedBounds.maxY === null || maxY > mergedBounds.maxY) {
            mergedBounds.maxY = maxY;
        }
    }

    if (mergedBounds.minX === null) {
        mergedBounds.minX = 0;
    }

    if (mergedBounds.maxX === null) {
        mergedBounds.maxX = 0;
    }

    if (mergedBounds.closestSpacing === null) {
        mergedBounds.closestSpacing = 1;
    }

    if (mergedBounds.minY === null) {
        mergedBounds.minY = 0;
    }

    if (mergedBounds.maxY === null) {
        mergedBounds.maxY = 0;
    }

    return mergedBounds;
}
