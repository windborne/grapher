import binarySearch from '../../helpers/binary_search';

function validateSelectedSpaceConversion({ data, inSelectedSpace, firstIndex, lastIndex, ignoreDiscontinuities }) { // eslint-disable-line no-unused-vars
    let correct = data.slice(firstIndex + 1, lastIndex);
    if (ignoreDiscontinuities) {
        correct = correct.filter(([_x, y]) => (y !== null && y !== undefined));
    }

    if (correct.length !== inSelectedSpace.length) {
        console.log({ // eslint-disable-line no-console
            data,
            attempt: inSelectedSpace.map(([x, y]) => [undateify(x), y]),
            correct: correct.map(([x, y]) => [undateify(x), y]),
            sdl: window.sdl
        });
        window.tacomaDataPaused = true;
        throw new Error('Failed to select via swap');
    }

    for (let i = 0; i < correct.length; i++) {
        if (undateify(correct[i][0]) !== undateify(inSelectedSpace[i][0]) || correct[i][1] !== inSelectedSpace[i][1]) {
            console.log({ // eslint-disable-line no-console
                i,
                attempt: inSelectedSpace.map(([x, y]) => [undateify(x), y]),
                correct: correct.map(([x, y]) => [undateify(x), y]),
                correctX: undateify(correct[i][0]),
                correctY: correct[i][1],
                attemptX: undateify(inSelectedSpace[i][0]),
                attemptY: inSelectedSpace[i][1]
            });
            window.tacomaDataPaused = true;
            throw new Error('Failed to select via swap');
        }
    }
}

/**
 * Converts from data space to selected space
 *
 * @param {Array<Array<Number>>} data
 * @param {{data: Array<Array<Number>>}|*} [swap]
 * @param {Number} minX
 * @param {Number} maxX
 * @param {Boolean} ignoreDiscontinuities
 * @param {Boolean} square
 * @return {{data: Array<Array<Number>>, lastAdded: boolean, firstAdded: boolean, afterIndex: Number, ignoreDiscontinuities: boolean, minX: Number, maxX: Number, beforeIndex: Number}}
 */
export default function dataSpaceToSelectedSpace({ data, swap, minX, maxX, ignoreDiscontinuities, square }) {
    if (!data.length || data.length && minX > data[data.length - 1][0] || data.length && maxX < data[0][0]) {
        //let previouslyEmpty = !data.length;
        return {
            data: [
                [minX, null],
                [maxX, null]
            ],
            firstAdded: true,
            lastAdded: true
            //previouslyEmpty
        };
    }

    let beforeIndex = binarySearch(data, minX, { searchType: 'before', returnIndex: true }) || 0;
    let afterIndex = binarySearch(data, maxX, { searchType: 'after', returnIndex: true }) || 0;
    if (afterIndex === -1) {
        afterIndex = 0;
    }

    while (beforeIndex >= 0 && data[beforeIndex][0] >= minX) {
        beforeIndex --;
    }

    while (afterIndex < data.length && data[afterIndex][0] <= maxX) {
        afterIndex ++;
    }

    let inSelectedSpace;
    let addToEndOnly = false;

    let firstAdded = false;
    let lastAdded = false;

    let beginningInterpolationIndex = beforeIndex;
    let endInterpolationIndex = afterIndex;
    if (ignoreDiscontinuities) {
        while (beginningInterpolationIndex >= 0 && data[beginningInterpolationIndex][1] === null) {
            beginningInterpolationIndex --;
        }
        while (endInterpolationIndex < data.length && data[endInterpolationIndex][1] === null) {
            endInterpolationIndex++;
        }
    }

    if (swap) {
        inSelectedSpace = swap.data;
        if (swap.lastAdded) {
            inSelectedSpace.pop();
        }
        if (minX === swap.minX) {
            addToEndOnly = true;
        }
        if (beforeIndex !== swap.beforeIndex) {
            addToEndOnly = false;
            if (swap.firstAdded) {
                inSelectedSpace.shift();
            }
            let index = swap.beforeIndex;
            while (index >= 0 && inSelectedSpace.length && inSelectedSpace[0][0] >= minX) {
                if (!ignoreDiscontinuities || data[index][1] || data[index][1] === 0) {
                    inSelectedSpace.unshift(data[index]);
                }
                index --;
            }
            while (index < data.length && inSelectedSpace.length && inSelectedSpace[0][0] < minX) {
                inSelectedSpace.shift();
                index ++;
            }
        }

        if (ignoreDiscontinuities && !swap.ignoreDiscontinuities) {
            inSelectedSpace = inSelectedSpace.filter(([_x, y]) => (y !== null && y !== undefined));
        }

        if (beforeIndex === swap.beforeIndex && swap.firstAdded) {
            firstAdded = true;

            let interpolationIndex = beforeIndex + 1;
            if (ignoreDiscontinuities) {
                while (interpolationIndex < data.length && data[interpolationIndex][1] === null) {
                    interpolationIndex ++;
                }
            }

            if (beginningInterpolationIndex === -1 && inSelectedSpace.length) {
                inSelectedSpace[0] = [minX, null];
            } else {
                if (square && inSelectedSpace.length) {
                    inSelectedSpace[0] = [minX, data[beginningInterpolationIndex][1]];
                } else {
                    if (inSelectedSpace.length) {
                        inSelectedSpace[0] = [minX, interpolate(data, beginningInterpolationIndex, interpolationIndex, minX)];
                    }
                }
            }
            if (data[beforeIndex + 1][0] === inSelectedSpace[0][0] && data[beforeIndex + 1][1] === inSelectedSpace[0][1]) {
                firstAdded = false;
            }
        }
        let lastIncluded = swap.afterIndex;
        if (swap.ignoreDiscontinuities && !ignoreDiscontinuities) {
            let nullIndex = beforeIndex + 1;
            let selectedIndex = 0;
            if (firstAdded) {
                selectedIndex ++;
            }
            while (selectedIndex <= inSelectedSpace.length && nullIndex < data.length && nullIndex < afterIndex) {
                if (data[nullIndex][0] <= maxX && data[nullIndex][1] === null && (!inSelectedSpace[selectedIndex] || inSelectedSpace[selectedIndex][0] !== data[nullIndex][0] || inSelectedSpace[selectedIndex][1] !== data[nullIndex][1])) {
                    inSelectedSpace.splice(selectedIndex, 0, data[nullIndex]);
                    if (nullIndex >= lastIncluded) {
                        lastIncluded = nullIndex + 1;
                    }
                }
                nullIndex ++;
                selectedIndex ++;
            }
        }

        let dataIndex = lastIncluded || 0;
        while (dataIndex < data.length && data[dataIndex][0] <= maxX) {
            if (data[dataIndex][0] >= minX) {
                if (!ignoreDiscontinuities || data[dataIndex][1] || data[dataIndex][1] === 0) {
                    inSelectedSpace.push(data[dataIndex]);
                }
            }
            dataIndex ++;
        }
        while (inSelectedSpace.length && inSelectedSpace[inSelectedSpace.length - 1][0] > maxX) {
            inSelectedSpace.pop();
        }

    } else {
        inSelectedSpace = data.slice(beforeIndex + 1, afterIndex);
        if (ignoreDiscontinuities) {
            inSelectedSpace = inSelectedSpace.filter(([_x, y]) => (y !== null && y !== undefined));
        }
    }

    if (!inSelectedSpace.length) {
        if (square) {
            if (beginningInterpolationIndex < 0) {
                inSelectedSpace = [[minX, null], [maxX, null]];
            } else {
                inSelectedSpace = [[minX, data[beginningInterpolationIndex][1]], [maxX, data[beginningInterpolationIndex][1]]];
            }
        } else {
            inSelectedSpace = [[minX, interpolate(data, beginningInterpolationIndex, endInterpolationIndex, minX)], [maxX, interpolate(data, beginningInterpolationIndex, endInterpolationIndex, maxX)]];
        }
        firstAdded = true;
        lastAdded = true;
    }

    if (!addToEndOnly) {
        let interpolationIndex = beforeIndex + 1;
        if (ignoreDiscontinuities) {
            while (interpolationIndex < data.length && data[interpolationIndex][1] === null) {
                interpolationIndex ++;
            }
        }

        if (inSelectedSpace.length && inSelectedSpace[0][0] > minX) {
            firstAdded = true;
            if (beginningInterpolationIndex === -1) {
                inSelectedSpace.unshift([minX, null]);
            } else {
                if (square) {
                    inSelectedSpace.unshift([minX, data[beginningInterpolationIndex][1]]);
                } else {
                    inSelectedSpace.unshift([minX, interpolate(data, beginningInterpolationIndex, interpolationIndex, minX)]);
                }
            }
        }
    }

    if (inSelectedSpace.length && inSelectedSpace[inSelectedSpace.length - 1][0] < maxX) {
        lastAdded = true;

        let interpolationIndex = afterIndex - 1;
        if (ignoreDiscontinuities) {
            while (interpolationIndex >= 0 && data[interpolationIndex][1] === null) {
                interpolationIndex --;
            }
        }

        if (endInterpolationIndex === data.length) {
            inSelectedSpace.push([maxX, null]);
        } else {
            if (square) {
                inSelectedSpace.push([maxX, inSelectedSpace[inSelectedSpace.length - 1][1]]);
            } else {
                inSelectedSpace.push([maxX, interpolate(data, interpolationIndex, endInterpolationIndex, maxX)]);
            }
        }
    }

    if (inSelectedSpace.length === 1) {
        let begPoint;
        let endPoint;
        if (square) {
            if (beginningInterpolationIndex < 0) {
                begPoint = [minX, null];
            } else {
                begPoint = [minX, data[beginningInterpolationIndex][1]];
            }
            endPoint = [maxX, inSelectedSpace[0][1]];
        } else {
            begPoint = [minX, interpolate(data, beginningInterpolationIndex, beforeIndex + 1, minX)];
            endPoint = [maxX, interpolate(data, afterIndex - 1, endInterpolationIndex, maxX)];
        }
        inSelectedSpace.unshift(begPoint);
        inSelectedSpace.push(endPoint);
        firstAdded = true;
        lastAdded = true;
    }

    return {
        data: inSelectedSpace,
        minX,
        maxX,
        beforeIndex,
        afterIndex,
        firstAdded,
        lastAdded,
        ignoreDiscontinuities
        //previouslyEmpty: false
    };
}

function undateify(potentialDate) {
    if (potentialDate instanceof Date) {
        return potentialDate.valueOf();
    }

    return potentialDate;
}

/**
 * Finds the point at the boundary via interpolation
 *
 * @param {Array<Array<Number>>} data
 * @param {Number} firstIndex
 * @param {Number} secondIndex
 * @param {Number} boundary
 * @return {null|*}
 */
function interpolate(data, firstIndex, secondIndex, boundary) {
    if (firstIndex < 0 || secondIndex < 0) {
        return null;
    }

    if (firstIndex >= data.length || secondIndex >= data.length) {
        return null;
    }

    if (firstIndex === secondIndex) {
        return data[firstIndex][1];
    }

    const [xBefore, yBefore] = data[firstIndex];
    const [xAfter, yAfter] = data[secondIndex];

    if (boundary === xBefore && yBefore !== null) {
        return yBefore;
    }

    if (boundary === xAfter && yAfter !== null) {
        return yAfter;
    }

    if (yBefore === null || yAfter === null) {
        return null;
    }

    const percent = (boundary - xBefore)/(xAfter - xBefore);
    if (percent < 0 || percent > 1) {
        return null;
    }

    return percent*(yAfter - yBefore) + yBefore;
}
