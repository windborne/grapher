import scaleBounds from '../../renderer/scale_bounds';
let RustAPI;
import('../../rust/pkg/index.js').then((module) => {
    RustAPI = module;
});

function selectedSpaceToRenderSpaceInPlace({ data, renderWidth, renderHeight, minX, maxX, minY, maxY, scale }, { nullMask, yValues, minYValues, maxYValues }) {
    let i = 0;
    let prevI = i - 1;

    for (let pixelX = 0; pixelX < renderWidth; pixelX++) {
        // find the x value that corresponds to the x pixel
        const x = (pixelX/(renderWidth - 1))*(maxX - minX) + minX;

        // set i such that data[i][0] < x <= data[i+1][0]
        let minSeenY = null;
        let maxSeenY = null;

        if (i > 0 && i <= data.length && data[i - 1][1] === null) {
            i--;
        }

        if (i < data.length - 2 && data[i + 1][0] < x) {
            i++;
        }

        for (i; i < data.length - 2 && data[i + 1][0] < x; i++) {
            const curY = data[i][1];

            if (curY === null) {
                continue;
            }

            if (minSeenY === null || curY < minSeenY) {
                minSeenY = curY;
            }

            if (maxSeenY === null || curY > maxSeenY) {
                maxSeenY = curY;
            }
        }

        minYValues[pixelX] = minSeenY === null ? 0 : renderHeight*(1 - ((scale === 'log' ? Math.log10(minSeenY) : minSeenY) - minY)/(maxY - minY));
        maxYValues[pixelX] = maxSeenY === null ? 0 : renderHeight*(1 - ((scale === 'log' ? Math.log10(maxSeenY) : maxSeenY) - minY)/(maxY - minY));

        // pass any discontinuities along
        if (i >= data.length - 1 || data[i][1] === null || data[i + 1][1] === null) {
            const y = i >= data.length - 1 ? null : data[i][1];

            nullMask[pixelX] = ((y === null) << 0) | ((minSeenY === null) << 1) | ((maxSeenY === null) << 2);
            yValues[pixelX] = y === null ? 0 : renderHeight*(1 - ((scale === 'log' ? Math.log10(y) : y) - minY)/(maxY - minY));

            i++;

            continue;
        }

        // interpolate
        const [xBefore, yBefore] = data[i];
        const [xAfter, yAfter] = data[i + 1];

        const percent = (x - xBefore) / (xAfter - xBefore);
        let y = percent * (yAfter - yBefore) + yBefore;

        // we're at the first point after the direction changed. Don't interpolate
        if (prevI !== i) {
            y = yBefore;
        }

        // // two x's with the same value; common in area charts
        // // to avoid this from having gotten skipped over, save in either min or max as appropriate
        // if (i > 0 && data[i - 1][0] === data[i][0]) {
        //     // 0: minY a
        //     // 1: original a
        //     // 2: minY b
        //     // 3: original b
        //
        //     const [xBeforeOffset, yBeforeOffset] = data[i - 1];
        //     const [xAfter, yAfter] = data[i + 1];
        // }

        yValues[pixelX] = y === null ? 0 : renderHeight*(1 - ((scale === 'log' ? Math.log10(y) : y) - minY)/(maxY - minY));
        nullMask[pixelX] = ((y === null) << 0) | ((minSeenY === null) << 1) | ((maxSeenY === null) << 2);

        prevI = i;
    }
}

/**
 * Convert from selected space to value space
 *
 * @param data
 * @param {Object} [swap]
 * @param {Number} renderWidth  - width, in pixels, of the area in which the graph is rendered
 * @param {Number} renderHeight - height, in pixels, of the area in which the graph is rendered
 * @param {Number} minX         - the minimum x value that is rendered
 * @param {Number} maxX         - the maximum x value that is rendered
 * @param {Number} minY         - the minimum y value that is rendered
 * @param {Number} maxY         - the maximum y value that is rendered
 * @param {'log'|'linear'} scale
 * @param {Boolean} [dataChanged] - if true, will not rely on the prior data state from swap being accurate
 * @return {{nullMask: Uint8Array, maxYValues: Float64Array, minYValues: Float64Array, yValues: Float64Array, dataF64: Float64Array, dataNullMask: Uint8Array}}
 */
export default function selectedSpaceToRenderSpace({ data, swap, renderWidth, renderHeight, minX, maxX, minY, maxY, scale, dataChanged }) {
    if (swap && swap.yValues.length !== renderWidth) {
        swap = null;
    }

    const nullMask = (swap && swap.nullMask) || new Uint8Array(renderWidth);
    nullMask.fill(0);
    const yValues = new Float64Array(renderWidth);
    const minYValues = new Float64Array(renderWidth);
    const maxYValues = new Float64Array(renderWidth);

    const scaledBounds = scaleBounds({ minY, maxY, scale});
    minY = scaledBounds.minY;
    maxY = scaledBounds.maxY;

    const everyOther = true;
    const startI = 0;
    const inParams = { data, renderWidth, renderHeight, minX, maxX, minY, maxY, scale };

    let dataF64, dataNullMask;

    if (RustAPI) {
        let copyIndexStart = 0;

        const hasSwap = swap && swap.dataNullMask && swap.dataF64;
        const useSwap = !dataChanged && hasSwap && swap.minX === minX && swap.maxX <= maxX && swap.length <= data.length;

        if (!useSwap || swap.dataNullMask.length < data.length) {
            const extraSpaceFactor = 1.25;
            dataF64 = new Float64Array(Math.floor(data.length*2*extraSpaceFactor));
            dataNullMask = new Uint8Array(Math.floor(data.length*extraSpaceFactor));

            if (useSwap) {
                dataNullMask.set(swap.dataNullMask);
                dataF64.set(swap.dataF64);
            }
        } else {
            dataF64 = swap.dataF64;
            dataNullMask = swap.dataNullMask;
        }

        if (useSwap) {
            copyIndexStart = Math.max(swap.length - 1, 0);
        }

        for (let i = copyIndexStart; i < data.length; i++) {
            dataF64[2*i] = data[i][0];
            dataF64[2*i + 1] = data[i][1];

            if (data[i][1] === null) {
                dataNullMask[i] = 1;
            } else  {
                dataNullMask[i] = 0;
            }
        }
        RustAPI.selected_space_to_render_space(data.length, dataF64, dataNullMask, inParams, nullMask, yValues, minYValues, maxYValues);
    } else {
        selectedSpaceToRenderSpaceInPlace(inParams, { nullMask, yValues, minYValues, maxYValues });
    }

    return {
        nullMask,
        yValues,
        minYValues,
        maxYValues,
        dataF64,
        dataNullMask,
        minX,
        maxX,
        length: data.length
    };
}
