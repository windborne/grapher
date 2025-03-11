export default function generatorParamsEqual(a, b) {
    if (a === undefined || b === undefined) {
        return a === b;
    }

    return (a.minX === b.minX) &&
        (a.maxX === b.maxX) &&
        (a.sizing.elementWidth === b.sizing.elementWidth) &&
        (a.sizing.renderWidth === b.sizing.renderWidth);
}
