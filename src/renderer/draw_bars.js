import {drawZeroLine} from './draw_zero_line';
import { applyReducedOpacity } from "../helpers/colors";

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
    color, context, sizing, indexInAxis, axisSeriesCount, zero, hasNegatives, negativeColor, zeroColor, zeroWidth, closestSpacing, bounds, cutoffIndex, cutoffOpacity, originalData, renderCutoffGradient, selectionBounds
}) {
    if (!context) {
        console.error('Canvas context is null in drawBars');
        return;
    }
    
    context.strokeStyle = color;
    context.fillStyle = color;

    const {barWidth, totalBarWidth} = getBarWidths({ closestSpacing, bounds, sizing, axisSeriesCount });
    const barBottom = hasNegatives ? zero : sizing.renderHeight;

    if (renderCutoffGradient && cutoffIndex !== undefined && originalData) {
        drawBarsWithCutoff(individualPoints, {
            color, context, sizing, indexInAxis, axisSeriesCount, zero, hasNegatives, negativeColor, zeroColor, zeroWidth, closestSpacing, bounds, cutoffIndex, cutoffOpacity, originalData, selectionBounds, barWidth, totalBarWidth, barBottom
        });
        return;
    }

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

export function getBarWidths({closestSpacing, bounds, sizing, axisSeriesCount}) {
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

/**
 * Draws the data on the canvas with cutoff
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
 * @param {Number} options.cutoffIndex               - index of the cutoff
 * @param {Number} options.cutoffOpacity             - opacity of the cutoff
 * @param {Array<[number, number]>} options.originalData - original data
 * @param {Boolean} options.selectionBounds           - if selection bounds are available
 * @param {Number} options.barWidth                  - width of the bar
 * @param {Number} options.totalBarWidth             - total width of the bar
 * @param {Number} options.barBottom                 - y coordinate that represents the bottom of the bar
 * @private
 */
function drawBarsWithCutoff(individualPoints, {
    color, context, sizing, indexInAxis, axisSeriesCount, zero, hasNegatives, negativeColor, zeroColor, zeroWidth, closestSpacing, bounds, cutoffIndex, cutoffOpacity, originalData, selectionBounds, barWidth, totalBarWidth, barBottom
}) {
    let cutoffTime;
    if (typeof originalData[0] === 'object' && originalData[0].length === 2) {
        const baseIndex = Math.floor(cutoffIndex);
        const fraction = cutoffIndex - baseIndex;
        
        if (fraction === 0 || baseIndex >= originalData.length - 1) {
            const cutoffDate = originalData[Math.min(baseIndex, originalData.length - 1)][0];
            cutoffTime = cutoffDate instanceof Date ? cutoffDate.getTime() : cutoffDate;
        } else {
            const currentDate = originalData[baseIndex][0];
            const nextDate = originalData[baseIndex + 1][0];
            const currentTime = currentDate instanceof Date ? currentDate.getTime() : currentDate;
            const nextTime = nextDate instanceof Date ? nextDate.getTime() : nextDate;
            cutoffTime = currentTime + fraction * (nextTime - currentTime);
        }
    } else {
        cutoffTime = cutoffIndex; 
    }

    for (let i = 0; i < individualPoints.length; i++) {
        const [x, y] = individualPoints[i];
        
        let barColor = color;
        let isBeforeCutoff = false;

        if (i < originalData.length) {
            const dataPoint = originalData[i];
            const pointTime = dataPoint[0] instanceof Date ? dataPoint[0].getTime() : dataPoint[0];
            isBeforeCutoff = pointTime < cutoffTime;
            
            if (isBeforeCutoff) {
                barColor = applyReducedOpacity(color, cutoffOpacity);
            }
        }

        if (hasNegatives) {
            if (y <= zero) {
                context.fillStyle = barColor;
            } else {
                const negColor = isBeforeCutoff ? applyReducedOpacity(negativeColor, cutoffOpacity) : negativeColor;
                context.fillStyle = negColor;
            }
        } else {
            context.fillStyle = barColor;
        }

        context.fillRect(x - totalBarWidth / 2 + barWidth*indexInAxis, y, barWidth, barBottom-y);
    }

    if (zeroWidth) {
        drawZeroLine(barBottom, {
            context, sizing, color, zero, zeroColor, zeroWidth
        });
    }
}
