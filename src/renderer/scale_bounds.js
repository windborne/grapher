/**
 * Scales y min and max bounds according to linear or log
 *
 * @param {Number} minY
 * @param {Number} maxY
 * @param {'linear'|'log'} scale
 * @return {{minY: Number, maxY: Number}}
 */
export default function scaleBounds({ minY, maxY, scale }) {
    if (scale === 'log') {
        maxY = Math.log10(maxY);

        if (minY <= 0) {
            if (maxY > 0) {
                minY = -maxY;
            } else {
                minY = 2*maxY;
            }
        } else {
            minY = Math.log10(minY);
        }
    }

    return {
        minY,
        maxY
    };
}
