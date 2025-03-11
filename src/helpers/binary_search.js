/**
 * Finds the closest point to the target
 *
 * @param {Array} data                          - the data, in data space
 * @param {Number} targetX                      - the x coordinate to get closest to
 * @param {Object} [searchParams]
 * @param {String} [searchParams.searchType]    - whether to search for the closest, one before, or one after
 * @param {Boolean} [searchParams.returnIndex]  - whether to return the index or the object itself
 * @param {Number} [startIndex]                 - where to start the search from
 * @param {Number} [endIndex]                   - where to end the search
 * @return {Array|Number}
 */
export default function binarySearch(data, targetX, searchParams={}, startIndex=0, endIndex=undefined) {
    if (endIndex === undefined) {
        endIndex = data.length - 1;
    }

    if (data.length === 0) {
        return searchParams.returnIndex ? -1 : [null, null];
    }

    const middleIndex = Math.floor((startIndex + endIndex)/2);

    if (targetX === data[middleIndex][0] || (data[middleIndex][0] instanceof Date && data[middleIndex][0].valueOf() === targetX)) {
        if (searchParams.returnIndex) {
            return middleIndex;
        } else {
            return data[middleIndex];
        }
    }

    if (startIndex === endIndex) {
        if (data[startIndex][0] < targetX && searchParams.searchType === 'before') {
            return searchParams.returnIndex ? startIndex : data[startIndex];
        } else if (data[startIndex][0] > targetX && searchParams.searchType === 'after') {
            return searchParams.returnIndex ? startIndex : data[startIndex];
        } else {
            return searchParams.returnIndex ? -1 : [null, null];
        }
    }

    if (endIndex - 1 === startIndex) {
        let index;

        if (searchParams.searchType === 'before') {
            index = startIndex;
            // index = (targetX <= data[startIndex][0]) ? startIndex : endIndex;
        } else if (searchParams.searchType === 'after') {
            index = endIndex;
            // index = (targetX >= data[endIndex][0]) ? endIndex : startIndex;
        } else {
            index = Math.abs(data[startIndex][0] - targetX) > Math.abs(data[endIndex][0] - targetX) ?
                endIndex :
                startIndex;
        }

        return searchParams.returnIndex ? index : data[index];
    }

    if (targetX > data[middleIndex][0]) {
        return binarySearch(data, targetX, searchParams, middleIndex, endIndex);
    }

    if (targetX < data[middleIndex][0]) {
        return binarySearch(data, targetX, searchParams, startIndex, middleIndex);
    }
}
