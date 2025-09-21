import {DPI_INCREASE} from './size_canvas';
import pathsFrom from './paths_from';

/**
 * Draws the data on the canvas
 * Assumes the data is in render space
 *
 * @param {{nullMask: Uint8Array, maxYValues: Float64Array, minYValues: Float64Array, yValues: Float64Array}} dataInRenderSpace    - the data to render
 * @param {Object} options                          - set of options
 * @param {Object} options.context                  - the context to draw on
 * @param {String} options.color                    - color of the line to draw
 * @param {Number} [options.width]                  - line width
 * @param {Number} [options.shadowBlur]             - level to blur shadow to
 * @param {String} [options.shadowColor]            - color of the shadow
 * @param {String} [options.dashed]                 - whether or not to make the line dashed
 * @param {Array<Number>} [options.dashPattern]     - dash array for the canvas
 * @param {Boolean} [options.highlighted]           - whether the line is highlighted or not
 * @param {Boolean} [options.showIndividualPoints]  - draw circles at each point
 * @param {Function} [options.getIndividualPoints]  - points to draw circles at. Only called when needed.
 * @param {Function} [options.getRanges]            - ranges to draw. Only called when needed
 * @private
 */
export default function drawLine(dataInRenderSpace, {
    color, width=1, context, shadowColor='black', shadowBlur=5, dashed=false, dashPattern=null, highlighted=false, showIndividualPoints=false, getIndividualPoints, getRanges
}) {
    if (!context) {
        console.error('Canvas context is null in drawLine');
        return;
    }
    
    if (highlighted) {
        width += 2;
    }
    width *= DPI_INCREASE;

    context.strokeStyle = color;
    context.lineWidth = width;
    context.shadowColor = shadowColor;
    context.shadowBlur = shadowBlur;

    if (dashed) {
        context.setLineDash(dashPattern || [5, 5]);
    } else {
        context.setLineDash([]);
    }

    const paths = pathsFrom(dataInRenderSpace);

    for (let path of paths) {
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

    if (getRanges) {
        const ranges = getRanges();

        context.lineWidth = width; // ensure the same width
        context.strokeStyle = color;
        context.setLineDash([]);
        const horizontalBarWidth = 8 * DPI_INCREASE;

        for (let range of ranges) {
            if (!range) {
                continue;
            }

            const { pixelX, pixelMinY, pixelMaxY } = range;

            // bar on bottom
            if (pixelMinY !== null) {
                context.beginPath();
                context.moveTo(pixelX - (horizontalBarWidth / 2), pixelMinY);
                context.lineTo(pixelX + (horizontalBarWidth / 2), pixelMinY);
                context.stroke();
            }

            // bar on top
            if (pixelMaxY !== null) {
                context.beginPath();
                context.moveTo(pixelX - (horizontalBarWidth / 2), pixelMaxY);
                context.lineTo(pixelX + (horizontalBarWidth / 2), pixelMaxY);
                context.stroke();
            }

            if (pixelMinY === null || pixelMaxY === null) {
                continue;
            }

            // draw a vertical line for the range
            context.beginPath();
            context.moveTo(pixelX, pixelMinY);
            context.lineTo(pixelX, pixelMaxY);
            context.stroke();
        }
    }

    if (showIndividualPoints) {
        context.fillStyle = color;
        const individualPoints = getIndividualPoints();

        for (let [x, y] of individualPoints) {
            context.beginPath();
            context.arc(x, y, width + 4, 0, 2 * Math.PI, false);
            context.fill();
        }
    }
}
