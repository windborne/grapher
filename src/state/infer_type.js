import {extractYValue} from '../helpers/flatten_simple_data.js';

/**
 * Given a series object, figures out the form of the data
 * Note that this is not a validator, nor is it guaranteed to get it right 100% of the time!
 * If it is giving the wrong type, it is recommended to specify the type manually
 *
 * @param {*} series
 * @param {Boolean} options.useSimpleData
 * @param {Array} options.data
 * @return {String}
 */
export default function inferType(series, options={ useSimpleData: false }) {
    if (series.type && series.type !== 'infer') {
        return series.type;
    }

    const data = options.data || (options.useSimpleData ? (series.simpleData || series.data) : series.data);

    if (!data) {
        throw new Error('Data must be provided');
    }

    if (Array.isArray(data)) {
        if (data.length === 0) {
            return 'tuples';
        }

        if (Array.isArray(data[0])) {
            return 'tuples';
        }

        if (typeof data[0] === 'number' || !data[0]) {
            return 'values';
        }

        return 'objects';
    }

    if (data.observe) {
        if (series.xKey) {
            return 'object_observable';
        } else {
            return 'tuple_observable';
        }
    }

    if (typeof data === 'function') {
        return 'generator';
    }

    throw new Error('Could not infer type');
}

/**
 *
 * @param simpleData
 * @param singleSeries
 * @return {boolean}
 */
export function isEnumLike(simpleData, singleSeries) {
    for (let i = 0; i < simpleData.length; i++) {
        const y = extractYValue(simpleData[simpleData.length - 1], singleSeries);
        if (y === null || y === undefined) {
            continue;
        }

        if (typeof y === 'string') {
            return true;
        }
    }

    return false;
}
