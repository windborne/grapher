import {drawZeroLine} from './draw_zero_line';

/**
 * Draws the data on the canvas
 * Assumes the data is in individual point render space, ie x and y in pixels
 *
 * @param {Array<[number, number]>} individualPoints - data to draw
 * @param {Object} options                           - set of options
 * @param {Object} options.context                   - the context to draw on
 * @param {String} options.color                     - color of the bar to draw
 * @param {{renderWidth: Number, renderHeight: Number}} options.sizing - size of the canvas, in pixels
 * @param {Number} options.indexInAxis               - index of the series in the axis
 * @param {Number} options.axisSeriesCount           - number of series in the axis
 * @param {Number} options.zero                      - y coordinate that represents "zero"
 * @param {Boolean} options.hasNegatives             - if any values are negative (in which case should render from zero)
 * @param {String} options.negativeColor             - color of the bar to draw if negative
 * @param {String} options.zeroColor                 - color of the zero line
 * @param {Number} options.zeroWidth                 - width of the zero line
 * @param {Number} options.closestSpacing            - closest x spacing between points, in data space
 * @param {{minX: Number, maxX: Number}} options.bounds - bounds of the data as rendered
 * @private
 */
export default function drawBars(individualPoints, {
    color, context, sizing, indexInAxis, axisSeriesCount, zero, hasNegatives, negativeColor, zeroColor, zeroWidth, closestSpacing, bounds
}) {
    context.strokeStyle = color;
    context.fillStyle = color;

    const {barWidth, totalBarWidth} = getBarWidths({ closestSpacing, bounds, sizing, axisSeriesCount });
    const barBottom = hasNegatives ? zero : sizing.renderHeight;

    for (let i = 0; i < individualPoints.length; i++) {
        const [x, y] = individualPoints[i];

        if (hasNegatives) {
            if (y <= zero) {
                context.fillStyle = color;
            } else {
                context.fillStyle = negativeColor;
            }
        }

        context.fillRect(x - totalBarWidth / 2 + barWidth*indexInAxis, y, barWidth, barBottom-y);
    }

    if (zeroWidth) {
        drawZeroLine(barBottom, {
            context,
            sizing,
            color,
            zero,
            zeroColor,
            zeroWidth
        });
    }
}

/**
 * Calculates the widths of the bars
 *
 * @param {Number} closestSpacing - closest x spacing between points, in data space
 * @param {{minX: Number, maxX: Number}} bounds - bounds of the data as rendered
 * @param {{renderWidth: Number, renderHeight: Number}} sizing - size of the canvas, in pixels
 * @param {Number} axisSeriesCount - number of series in the axis
 * @return {{barWidth: Number, totalBarWidth: Number, barSpacing: Number}}
 */
export function getBarWidths({closestSpacing, bounds, sizing, axisSeriesCount}) {
    // width of bar plus spacing, which we define as the closest distance between points in pixel space
    const fullBarWidth = closestSpacing / (bounds.maxX - bounds.minX) * sizing.renderWidth;

    const totalBarWidth = fullBarWidth * 0.8;
    const barSpacing = fullBarWidth * 0.2;
    const barWidth = totalBarWidth / axisSeriesCount;

    return {
        barWidth,
        totalBarWidth,
        barSpacing
    };
}
