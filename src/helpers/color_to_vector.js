/**
 * Returns the color as a [r, g, b, a] array with domain 0 to 1 for use in webgl
 *
 * @param color
 * @return {[number, number, number, number]|[number, number, number, number]}
 */
export default function colorToVector(color) {
    if (color === 'black') {
        color = '#000000';
    } else if (color === 'white') {
        color = '#FFFFFF';
    } else if (color === 'transparent') {
        return [0, 0, 0, 0];
    }

    if (color.startsWith('rgb')) {
        const parts = color.split(',').map((part) => parseFloat(part.match(/\d+(\.\d+)?/)[0]));
        return [
            parts[0]/255,
            parts[1]/255,
            parts[2]/255,
            parts.length >= 4 ? parts[3] : 1
        ];
    }

    if (typeof color !== 'string' || !/^#[\dA-F]{6}$/i.test(color)) {
        throw new Error(`Color must be a hex string: ${color}`);
    }

    const r = parseInt(color.substr(1, 2),  16)/255;
    const g = parseInt(color.substr(3, 2),  16)/255;
    const b = parseInt(color.substr(5, 2),  16)/255;
    const a = 1.0;
    return [r, g, b, a];
}
