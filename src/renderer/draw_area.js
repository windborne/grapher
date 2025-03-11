import pathsFrom from './paths_from';
import {drawZeroLine} from './draw_zero_line';
import {DPI_INCREASE} from './size_canvas';

/**
 * Draws the data on the canvas
 * Assumes the data is in individual point render space, ie x and y in pixels
 *
 * @param {Array<[number, number]>} individualPoints - data to draw
 * @param {Object} dataInRenderSpace
 * @param {Object} options                           - set of options
 * @param {Object} options.context                   - the context to draw on
 * @param {String} options.color                     - color of the bar to draw
 * @param {{renderWidth: Number, renderHeight: Number}} options.sizing - size of the canvas, in pixels
 * @param {Number} options.zero                      - y coordinate that represents "zero"
 * @param {Boolean} options.hasNegatives             - if any values are negative (in which case should render from zero)
 * @param {Array<String>} [options.gradient]         - an array of stops, from top to bottom of canvas, to draw with
 * @param {String} [options.zeroColor]               - color of the zero line
 * @param {Number} [options.zeroWidth]               - width of the zero line
 * @param {Boolean} [options.showIndividualPoints]   - draw circles at each point
 * @param {String} [options.negativeColor]           - color of the area below zero
 * @param {Number} [options.width]                  - line width
 * @private
 */
export default function drawArea(individualPoints, dataInRenderSpace, {
    color, context, sizing, zero, hasNegatives, gradient,
    zeroColor, zeroWidth, showIndividualPoints, negativeColor, pointRadius, width, highlighted,
    shadowColor='black', shadowBlur=5
}) {
    context.fillStyle = color;
    context.shadowColor = shadowColor;
    context.shadowBlur = shadowBlur;

    if (gradient && gradient.length > 2) {
        const globalGradient = context.createLinearGradient(0, 0, 0, sizing.renderHeight);

        for (let i = 0; i < gradient.length; i++) {
            const value = gradient[i];
            if (Array.isArray(value)) {
                globalGradient.addColorStop(value[0], value[1]);
            } else {
                globalGradient.addColorStop(i / (gradient.length - 1), value);
            }
        }

        context.fillStyle = globalGradient;

        if (color === 'gradient') {
            context.strokeStyle = globalGradient;
        }
    } else {
        context.fillStyle = color;
    }

    if (!individualPoints.length) {
        return;
    }

    // we want to draw a polygon with a flat line at areaBottom, and then follows the shape of the data
    const areaBottom = hasNegatives ? zero : sizing.renderHeight;

    const areaPaths = pathsFrom(dataInRenderSpace);
    const linePaths = pathsFrom(dataInRenderSpace, {
        splitAtY: zero
    });

    for (let path of areaPaths) {
        context.beginPath();

        const [firstX, _startY] = path[0];
        const [lastX, _lastY] = path[path.length - 1];

        context.moveTo(firstX, areaBottom);

        for (let i = 0; i < path.length; i++) {
            const [x, y] = path[i];
            context.lineTo(x, y);
        }

        context.lineTo(lastX, areaBottom);

        context.fill();
    }

    if (highlighted) {
        width += 2;
    }

    width *= DPI_INCREASE;
    context.strokeStyle = color;
    context.lineWidth = width;
    // context.shadowBlur = 1;

    for (let path of linePaths) {
        if (!path.length) {
            continue;
        }

        if (hasNegatives) {
            let positive = true;
            if (path.length >= 2) {
                positive = path[1][1] <= zero;
            } else {
                positive = path[0][1] <= zero;
            }

            if (positive) {
                context.strokeStyle = color;
            } else {
                context.strokeStyle = negativeColor;
            }
        }

        context.beginPath();

        for (let i = 0; i < path.length; i++) {
            const [x, y] = path[i];

            if (i === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        }

        context.stroke();
    }

    if (zeroWidth) {
        drawZeroLine(areaBottom, {
            context,
            sizing,
            color,
            zero,
            zeroColor,
            zeroWidth
        });
    }

    if (showIndividualPoints) {
        context.fillStyle = color;

        for (let [x, y] of individualPoints) {
            if (negativeColor && hasNegatives) {
                if (y === zero && zeroColor) {
                    context.fillStyle = zeroColor;
                } else if (y < zero) {
                    context.fillStyle = color;
                } else {
                    context.fillStyle = negativeColor;
                }
            }

            context.beginPath();
            context.arc(x, y,  pointRadius ||8, 0, 2 * Math.PI, false);
            context.fill();
        }
    }
}
