/**
 * Gets the proper name for a series
 *
 * @param {Object} singleSeries
 * @param {Number} index
 * @return {string}
 */
export default function nameForSeries(singleSeries, index) {
    let name = singleSeries.name || singleSeries.yKey;

    if (!name) {
        name = index.toString();
    }

    return name;
}
