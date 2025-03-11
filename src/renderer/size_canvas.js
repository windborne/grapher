export const DPI_INCREASE = 2;

/**
 * Sizes the canvas such that rendering is pixel perfect
 * Returns the sizing information
 *
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} context
 * @param {Boolean} reset                       - if true, will reset the canvas size before checking sizing
 * @return {Promise<{boundingRect: DOMRect, pixelRatio: number, elementHeight: number, renderWidth: number, renderHeight: number, elementWidth: number}>}
 */
export default async function sizeCanvas(canvas, context, {reset=true}={}) {
    if (reset) {
        canvas.width = '';
        canvas.height = '';
        canvas.style.width = '0';
        canvas.style.height = '';

        await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    let boundingRect = canvas.parentNode.getBoundingClientRect();

    while (boundingRect.width === 0) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        boundingRect = canvas.getBoundingClientRect();
    }

    const dpr = window.devicePixelRatio || 1;
    const bsr = context.webkitBackingStorePixelRatio ||
        context.mozBackingStorePixelRatio ||
        context.msBackingStorePixelRatio ||
        context.oBackingStorePixelRatio ||
        context.backingStorePixelRatio || 1;

    const pixelRatio = DPI_INCREASE*dpr / bsr;

    const elementWidth = boundingRect.width;
    const elementHeight = boundingRect.height;
    const renderWidth = elementWidth * pixelRatio;
    const renderHeight = elementHeight * pixelRatio;

    canvas.width = renderWidth;
    canvas.height = renderHeight;
    canvas.style.width = `${elementWidth}px`;
    canvas.style.height = `${elementHeight}px`;

    // We could us this to make coordinates behave as if they weren't transformed if we wanted
    // context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0)

    return {
        pixelRatio,
        elementWidth,
        elementHeight,
        renderWidth,
        renderHeight,
        boundingRect
    };
}
