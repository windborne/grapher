const BUCKETS_PER_PIXEL = 2;
const CONDENSE_THRESHOLD = 2;

/**
 * Condenses the dataset down to a lower number of points to make subsequent operations more efficient
 * Will only condense when data length passes a given threshold
 * Note that this works best on datasets that are relatively evenly distributed across the x axis
 *
 * @param {Array<Array>} data
 * @param {{data: [], minX: Number, maxX: Number, length: Number}} swap
 * @param {Number} minX
 * @param maxX
 * @param renderWidth
 * @param dataChanged
 * @return {{data: [], minX: Number, maxX: Number, length: Number}}
 */
export default function condenseDataSpace({ data, swap, minX, maxX, renderWidth, dataChanged }) {
    const targetBucketCount = renderWidth*BUCKETS_PER_PIXEL;

    const useSwap = !dataChanged && swap && swap.minX === minX && swap.maxX <= maxX && swap.length <= data.length;

    let partiallyCondensedData;
    if (useSwap) {
        partiallyCondensedData = swap.data;

        if (data.length > swap.length) {
            // always overwrite the last in case it was mangled by the selected space interpolation
            if (data.length > 0 && partiallyCondensedData.length > 0) {
                partiallyCondensedData[partiallyCondensedData.length - 1] = data[swap.length - 1];
            }

            partiallyCondensedData = partiallyCondensedData.concat(data.slice(swap.length));
        }
    } else {
        partiallyCondensedData = [...data];
    }

    if (partiallyCondensedData.length / targetBucketCount < CONDENSE_THRESHOLD*2) { // * 2 because min and max
        return {
            data: partiallyCondensedData,
            minX,
            maxX,
            length: data.length
        };
    }

    const condensedData = [];
    const bucketSize = (maxX - minX)/targetBucketCount;
    let minInBucket = null;
    let maxInBucket = null;
    let currentBucketIndex = 0;

    // always add the first point so that x ranges are preserved
    if (data.length) {
        condensedData.push(data[0]);
    }

    for (let tuple of partiallyCondensedData) {
        const [x, y] = tuple;

        if (y === null) {
            continue;
        }

        const bucketIndex = Math.floor((x - minX)/bucketSize);

        if (bucketIndex !== currentBucketIndex) {
            if (minInBucket && maxInBucket) {
                if (minInBucket === maxInBucket) {
                    if (condensedData[condensedData.length - 1] !== minInBucket) {
                        condensedData.push(minInBucket);
                    }
                } else if (minInBucket[0] < maxInBucket[0]) {
                    condensedData.push(maxInBucket, minInBucket);
                } else {
                    condensedData.push(minInBucket, maxInBucket);
                }
            }

            minInBucket = null;
            maxInBucket = null;
            currentBucketIndex = bucketIndex;
        }

        if (!minInBucket || y < minInBucket[1]) {
            minInBucket = tuple;
        }

        if (!maxInBucket || y > maxInBucket[1]) {
            maxInBucket = tuple;
        }
    }

    if (minInBucket && maxInBucket) {
        if (minInBucket === maxInBucket) {
            condensedData.push(minInBucket);
        } else if (minInBucket[0] < maxInBucket[0]) {
            condensedData.push(maxInBucket, minInBucket);
        } else {
            condensedData.push(minInBucket, maxInBucket);
        }
    }

    // always add the last point so that x ranges are preserved
    if (data.length >= 2 && data[data.length - 1] !== minInBucket && data[data.length - 1] !== maxInBucket) {
        condensedData.push(data[data.length - 1]);
    }

    return {
        data: condensedData,
        minX,
        maxX,
        length: data.length
    };
}
