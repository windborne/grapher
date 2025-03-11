/**
 * Expands bounds to give a little y padding
 *
 * @param {Object} bounds
 * @param {?Number} bounds.minY
 * @param {?Number} bounds.maxY
 * @param {?Number} bounds.minX
 * @param {?Number} bounds.maxX
 * @param {Array<Number>} [expandYWith]
 * @param {Number} [extendXForNBars=0]
 * @return {Object}
 */
export default function expandBounds(bounds, {expandYWith = [], extendXForNBars=0}) {
    const expandedBounds = Object.assign({}, bounds);
    for (let y of expandYWith) {
        if (y === null || y === undefined) {
            continue;
        }

        if (typeof expandedBounds.minY !== 'number' || y < expandedBounds.minY) {
            expandedBounds.minY = y;
        }

        if (typeof expandedBounds.maxY !== 'number' || y > expandedBounds.maxY) {
            expandedBounds.maxY = y;
        }
    }

    expandedBounds.unscaledMinY = expandedBounds.minY;
    expandedBounds.unscaledMaxY = expandedBounds.maxY;

    const range = expandedBounds.maxY - expandedBounds.minY;
    const midpoint = expandedBounds.minY + range/2;
    expandedBounds.minY = midpoint - 1.05*range/2;
    expandedBounds.maxY = midpoint + 1.05*range/2;

    if (expandedBounds.minY === expandedBounds.maxY && expandedBounds.minY !== null) {
        if (expandedBounds.minY > 0) {
            expandedBounds.minY *= 0.95;
            expandedBounds.maxY *= 1.05;
        } else if (expandedBounds.minY < 0) {
            expandedBounds.minY *= 1.05;
            expandedBounds.maxY *= 0.95;
        } else {
            expandedBounds.minY -= 1;
            expandedBounds.maxY += 1;
        }
    }

    if (extendXForNBars && expandedBounds.minX !== expandedBounds.maxX && expandedBounds.minX !== null && expandedBounds.maxX !== null) {
        // Base expansion factor on expected bar count
        const barWidth = (expandedBounds.maxX - expandedBounds.minX) / extendXForNBars;
        expandedBounds.minX -= barWidth/2;
        expandedBounds.maxX += barWidth/2;
    }

    return expandedBounds;
}
