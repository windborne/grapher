export default function selectionFromGlobalBounds(globalBounds, boundsCalculator) {
    const targetBounds = Object.assign({}, globalBounds, boundsCalculator(globalBounds));

    if (targetBounds.maxX instanceof Date) {
        targetBounds.maxX = targetBounds.maxX.valueOf();
    }

    if (targetBounds.minX instanceof Date) {
        targetBounds.minX = targetBounds.minX.valueOf();
    }

    if (targetBounds.maxX < targetBounds.minX) {
        targetBounds.maxX = targetBounds.minX;
    }

    if (targetBounds.minX < globalBounds.minX) {
        targetBounds.minX = globalBounds.minX;
    }

    if (targetBounds.maxX > globalBounds.maxX) {
        targetBounds.maxX = globalBounds.maxX;
    }

    return targetBounds;
}
