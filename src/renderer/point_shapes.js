// Individual-point marker shapes. A series may set `pointShape` to one of the
// SHAPE_CODES keys, or to a function (datum, index) => shape for per-point
// styling (e.g. distinguishing data sources on a single line). Unknown or
// missing shapes fall back to 'circle'.

export const SHAPE_CODES = {
    circle: 0,
    square: 1,
    triangle: 2,
    diamond: 3
};

export function resolvePointShape(pointShape, point) {
    let shape = pointShape;
    if (typeof pointShape === 'function') {
        shape = pointShape(point && point.datum, point && point.datumIndex);
    }

    return SHAPE_CODES[shape] !== undefined ? shape : 'circle';
}

// Per-point color override. Returns the resolved color string, or null to use
// the series color (functions may return undefined/null for "no override").
export function resolvePointColor(pointColor, point) {
    let color = pointColor;
    if (typeof pointColor === 'function') {
        color = pointColor(point && point.datum, point && point.datumIndex);
    }

    return typeof color === 'string' && color.length ? color : null;
}

// Splits points into per-(shape, color) buckets, preserving order within each
// bucket. Returns [{shape, color, points}, ...] with a single bucket when both
// options are uniform, so callers pay nothing extra in the common case.
// `color` is null when the series color should be used.
export function groupPointsByStyle(points, pointShape, pointColor) {
    if (typeof pointShape !== 'function' && typeof pointColor !== 'function') {
        return [{ shape: resolvePointShape(pointShape), color: resolvePointColor(pointColor), points }];
    }

    const buckets = new Map();
    for (const point of points) {
        const shape = resolvePointShape(pointShape, point);
        const color = resolvePointColor(pointColor, point);
        const key = `${shape}\u0000${color || ''}`;
        if (!buckets.has(key)) {
            buckets.set(key, { shape, color, points: [] });
        }
        buckets.get(key).points.push(point);
    }

    return Array.from(buckets.values());
}

// Adds the marker outline to the current canvas path. Callers own
// beginPath/fill. Sizes are chosen so each shape optically matches a circle
// of radius r.
export function tracePointPath(context, shape, x, y, r) {
    switch (shape) {
        case 'square': {
            const half = r * 0.9;
            context.rect(x - half, y - half, 2 * half, 2 * half);
            break;
        }
        case 'triangle':
            context.moveTo(x, y - r);
            context.lineTo(x + r, y + r);
            context.lineTo(x - r, y + r);
            context.closePath();
            break;
        case 'diamond':
            context.moveTo(x, y - r);
            context.lineTo(x + r, y);
            context.lineTo(x, y + r);
            context.lineTo(x - r, y);
            context.closePath();
            break;
        default:
            context.arc(x, y, r, 0, 2 * Math.PI, false);
    }
}
