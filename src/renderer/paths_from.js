import {DPI_INCREASE} from './size_canvas';

/**
 * Returns an array of contiguous paths from data in render space
 *
 * @param {{nullMask: Uint8Array, maxYValues: Float64Array, minYValues: Float64Array, yValues: Float64Array}} dataInRenderSpace
 * @param {Object} options
 * @param {Number} options.splitAtY - split the path whenever it's suddenly less or greater than this value
 * @return {[[Number]]}
 */
export default function pathsFrom(dataInRenderSpace, {splitAtY}={}) {
    const paths = [];
    let currentPath = [];
    let previouslyDiscontinuous = true;

    const { nullMask, maxYValues, minYValues, yValues } = dataInRenderSpace;

    for (let i = 0; i < yValues.length; i++) {
        const x = i*DPI_INCREASE;
        const y = yValues[i];

        if (nullMask[i] & 0b001) { // y null
            if (!previouslyDiscontinuous) {
                paths.push(currentPath);
                currentPath = [];
            }

            previouslyDiscontinuous = true;
            continue;
        }

        currentPath.push([x, y]);

        const minY = minYValues[i];
        const maxY = maxYValues[i];

        if (minY !== maxY) {
            if (!(nullMask[i] & 0b010)) {
                currentPath.push([x, minY]);
            }

            if (!(nullMask[i] & 0b100)) {
                currentPath.push([x, maxY]);
            }
            currentPath.push([x, y]);
        }

        previouslyDiscontinuous = false;

        if (typeof splitAtY === 'number' && i > 0) {
            const prevY = yValues[i-1];
            const signFlipped = !(nullMask[i-1] & 0b001) && (prevY < splitAtY && y >= splitAtY) || (prevY > splitAtY && y <= splitAtY);

            if (signFlipped) {
                if (!previouslyDiscontinuous) {
                    paths.push(currentPath);
                    currentPath = [
                        [x, y]
                    ];
                }

                previouslyDiscontinuous = true;
            }
        }
    }

    if (!previouslyDiscontinuous) {
        paths.push(currentPath);
    }

    return paths;
}
