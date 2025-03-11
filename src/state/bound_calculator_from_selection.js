import scaleBounds from '../renderer/scale_bounds';

export default function boundCalculatorFromSelection({ minPixelX, maxPixelX, minPixelY, maxPixelY}, { elementWidth, elementHeight, selection, axes }) {
    if (Math.abs(maxPixelX - minPixelX) < 1 || Math.abs(maxPixelY - minPixelY) < 1) {
        return;
    }

    const minX = (minPixelX/elementWidth)*(selection.maxX - selection.minX) + selection.minX;
    const maxX = (maxPixelX/elementWidth)*(selection.maxX - selection.minX) + selection.minX;

    const byAxis = [];
    for (let { currentBounds, scale } of axes) {
        const scaledBounds = scaleBounds({ ...currentBounds, scale });
        let maxY = (1 - minPixelY/elementHeight)*(scaledBounds.maxY - scaledBounds.minY) + scaledBounds.minY;
        let minY = (1 - maxPixelY/elementHeight)*(scaledBounds.maxY - scaledBounds.minY) + scaledBounds.minY;

        if (scale === 'log') {
            minY = Math.pow(10, minY);
            maxY = Math.pow(10, maxY);
        }
        byAxis.push({
            minX,
            maxX,
            minY,
            maxY
        });
    }

    return () => {
        return {
            minX,
            maxX,
            byAxis
        };
    };
}
