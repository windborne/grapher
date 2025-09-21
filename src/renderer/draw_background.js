/**
 * Draws the background on a 2d canvas
 *
 * @param {Array<{ minXt: number, maxXt: number, color: string }>} data
 * @param {CanvasRenderingContext2D} context
 */
export default function drawBackground({ data }, { context }) {
    if (!context) {
        console.error('Canvas context is null in drawBackground');
        return;
    }
    
    const width = context.canvas.width;
    const height = context.canvas.height;

    for (let { minXt, maxXt, color } of data) {
        context.fillStyle = color;
        context.fillRect(minXt*width, 0, (maxXt - minXt)*width, height);
    }
}
