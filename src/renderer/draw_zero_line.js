/**
 * Draws a horizontal line at the specified y-coordinate.
 *
 * @param {Number} y
 * @param {Object} options
 * @param {CanvasRenderingContext2D} options.context
 * @param {{renderWidth: Number, renderHeight: Number}} options.sizing
 * @param {String} options.color
 * @param {String} options.zeroColor
 * @param {Number} options.zeroWidth
 */
export function drawZeroLine(y, { context, sizing, color, zeroColor, zeroWidth}) {
    if (!zeroWidth) {
        return;
    }

    if (!context) {
        console.error('Canvas context is null in drawZeroLine');
        return;
    }

    context.strokeStyle = zeroColor || color;
    context.lineWidth = zeroWidth;

    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(sizing.renderWidth, y);
    context.stroke();
}
