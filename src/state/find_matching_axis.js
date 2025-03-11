/**
 *
 * @param {Array<Object>} axes
 * @param {'left'|'right'} [side]
 * @param {String|Number} [number]
 * @return {Object|undefined}
 */
export default function findMatchingAxis({ axes, side, number }) {
    if (number) {
        number = parseInt(number) || 0;
    } else {
        number = 0;
    }

    let axis;
    let seen = 0;
    for (let candidateAxis of axes) {
        if (candidateAxis.side !== side) {
            continue;
        }

        if (seen === number) {
            axis = candidateAxis;
            break;
        }

        seen++;
    }

    return axis;
}
