import inferType from '../infer_type';
import { SIMPLE_DATA_TYPES } from '../data_types';

/**
 * Given a series of a simple type (ie, not a function or an observable), converts it into data space
 *
 * @param {*} singleSeries
 * @param {Object} options
 * @return {*}
 */
export default function simpleSeriesToDataSpace(singleSeries, options={}) {
    const type = inferType(singleSeries, { useSimpleData: true, data: options.data });
    if (!SIMPLE_DATA_TYPES.includes(type)) {
        throw new Error(`Cannot normalize ${type} (expected a simple type)`);
    }

    const result = {
        tuples: tuplesToDataSpace,
        values: valuesToDataSpace,
        objects: objectsToDataSpace
    }[type](options.data || singleSeries.simpleData || singleSeries.data, singleSeries, options);

    let inDataSpace;
    let rangeValues = [];
    let windDirections = null;
    let windData = null;

    if (Array.isArray(result)) {
        inDataSpace = result;
    } else {
        inDataSpace = result.data;
        rangeValues = result.rangeValues || [];
        windDirections = result.windDirections || null;
        windData = result.windData || null;
    }

    if (singleSeries.square) {
        const square = [];
        let prevY = options.prevY;
        for (let tuple of inDataSpace) {
            if (prevY !== undefined) {
                square.push([tuple[0], prevY]);
            }
            square.push(tuple);
            prevY = tuple[1];
        }

        return square;
    }

    if (singleSeries.shiftXBy) {
        for (let tuple of inDataSpace) {
            if (typeof tuple[0] === 'string') {
                const originalXValue = tuple[0];
                tuple[0] = new Date(new Date(tuple[0]).valueOf() + singleSeries.shiftXBy);
                if (isNaN(tuple[0])) {
                    tuple[0] = options.stateController.enumToNumber(originalXValue, singleSeries);
                }
            } else if (tuple[0] instanceof Date) {
                tuple[0] = new Date(tuple[0].valueOf() + singleSeries.shiftXBy);
            } else if (typeof tuple[0] === 'number') {
                tuple[0] += singleSeries.shiftXBy;
            }
        }
    }

    if (singleSeries.xUnixDates) {
        for (let tuple of inDataSpace) {
            if (typeof tuple[0] === 'number') {
                tuple[0] = new Date(tuple[0]*1000);
            }
        }
    }

    if (rangeValues.length > 0 || windDirections) {
        return {
            data: inDataSpace,
            rangeValues: rangeValues,
            windDirections: windDirections,
            windData: windData
        };
    }

    return inDataSpace;
}

/**
 * Converts a values array to data space
 *
 * @param {Array<Number|String>} data
 * @param {Object} singleSeries
 * @param {Object} options
 * @param {Number} [options.valueXStart]
 * @param {StateController} options.stateController
 * @return {Array<Array<Number|Date|null>>}
 */
function valuesToDataSpace(data, singleSeries, options) {
    const inDataSpace = [];

    for (let i = 0; i < data.length; i++) {
        let yValue = data[i];

        if (typeof yValue === 'string') {
            yValue = options.stateController.enumToNumber(yValue, singleSeries);
        }

        if (typeof yValue === 'boolean') {
            yValue = +yValue;
        }

        inDataSpace.push([i + (options.valueXStart || 0), yValue]);
    }

    return inDataSpace;
}

/**
 * Converts a tuples array to data space
 *
 * @param {Array<Array<Number|Date|null>>} data
 * @param {Object} singleSeries
 * @param {Object} options
 * @param {StateController} options.stateController
 * @return {Array<Array<Number|Date|null>>}
 */
function tuplesToDataSpace(data, singleSeries, options) {
    return [...data.map(([ xValue, yValue]) => {
        if (yValue === undefined) {
            yValue = null;
        }

        if (typeof xValue === 'string') {
            const originalXValue = xValue;
            xValue = new Date(xValue);

            if (isNaN(xValue)) {
                xValue = options.stateController.enumToNumber(originalXValue, singleSeries, true);
            }
        }

        if (typeof yValue === 'string') {
            yValue = options.stateController.enumToNumber(yValue, singleSeries);
        }

        if (typeof yValue === 'boolean') {
            yValue = +yValue;
        }

        return [xValue, yValue];
    })];
}

function readBinaryFormatValue(view, offset, index) {
    const localOffset = view.getUint32(offset + 2 + Uint32Array.BYTES_PER_ELEMENT*index, true);

    if (localOffset === 0) {
        return null;
    }

    const type = view.getUint8(localOffset);

    if (type === 0) {
        return view.getFloat64(offset + localOffset + 1, true);
    } else if (type === 1 || type === 6) {
        return null;
    } else if (type === 3) {
        return new Date(view.getFloat64(offset + localOffset + 1, true));
    } else {
        throw new Error(`Binary format type ${type} not supported`);
    }
}

/**
 * Converts an objects array to data space
 *
 * @param {Array<Object>} data
 * @param {Object} series
 * @param {Object} options
 * @param {StateController} options.stateController
 * @return {Array<Array<Number|Date|null>>}
 */
function objectsToDataSpace(data, series, options) {
    const hasWindKeys = series.windXKey && series.windYKey;

    if (!series.xKey || typeof series.xKey !== 'string') {
        throw new Error('xKey must be provided in the series');
    }

    if (!hasWindKeys && (!series.yKey || typeof series.yKey !== 'string')) {
        throw new Error('yKey must be provided in the series (or both windXKey and windYKey)');
    }

    const inDataSpace = [];
    const rangeValues = [];
    const windDirections = hasWindKeys ? [] : null;
    const windData = hasWindKeys ? [] : null;

    for (let point of data) {
        if (point.buffer instanceof ArrayBuffer) {
            const view = new DataView(point.buffer);
            const xIndex = point.channels[series.xKey];
            const yIndex = point.channels[series.yKey];

            for (let offset of point.offsets) {
                inDataSpace.push([readBinaryFormatValue(view, offset, xIndex), readBinaryFormatValue(view, offset, yIndex)]);
            }
        } else if (!hasWindKeys && Array.isArray(point[series.yKey])) {
            if (point[series.yKey].length && !Array.isArray(point[series.yKey][0]) && typeof point[series.yKey][0] === 'object') {
                for (let subpoint of point[series.yKey]) {
                    let yValue = subpoint[series.yKey];
                    if (yValue === undefined) {
                        yValue = null;
                    }

                    if (typeof yValue === 'string') {
                        yValue = options.stateController.enumToNumber(yValue, series);
                    }

                    if (typeof yValue === 'boolean') {
                        yValue = +yValue;
                    }

                    let xValue = subpoint[series.xKey];
                    if (typeof xValue === 'string') {
                        xValue = new Date(xValue);
                    }

                    inDataSpace.push([xValue, yValue]);
                }
            } else {
                inDataSpace.push(...point[series.yKey]);
            }
        } else {
            let yValue;
            if (hasWindKeys) {
                const windX = point[series.windXKey];
                const windY = point[series.windYKey];
                if (windX != null && windY != null) {
                    yValue = Math.sqrt(windX * windX + windY * windY);
                    windDirections.push(Math.atan2(windY, windX));
                    windData.push({ x: windX, y: windY });
                } else {
                    yValue = null;
                    windDirections.push(null);
                    windData.push(null);
                }
            } else {
                yValue = point[series.yKey];
                if (yValue === undefined) {
                    yValue = null;
                }

                if (typeof yValue === 'string') {
                    yValue = options.stateController.enumToNumber(yValue, series);
                }

                if (typeof yValue === 'boolean') {
                    yValue = +yValue;
                }
            }

            let xValue = point[series.xKey];
            if (typeof xValue === 'string') {
                xValue = new Date(xValue);
            }

            inDataSpace.push([xValue, yValue]);

            if (series.rangeKey && point[series.rangeKey]) {
                const range = point[series.rangeKey];
                if (typeof range === 'object' && range.min !== undefined && range.max !== undefined) {
                    if (typeof range.min === 'number') {
                        rangeValues.push(range.min);
                    }
                    if (typeof range.max === 'number') {
                        rangeValues.push(range.max);
                    }
                }
            }
        }
    }

    if (rangeValues.length > 0 || windDirections) {
        return {
            data: inDataSpace,
            rangeValues: rangeValues,
            windDirections: windDirections,
            windData: windData
        };
    }

    return inDataSpace;
}
