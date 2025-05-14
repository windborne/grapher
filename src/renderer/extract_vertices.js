import pathsFrom from './paths_from';
import {DPI_INCREASE} from './size_canvas';
import RustAPI from '../state/rust_api';

/**
 *
 * @param {[[Number]]} paths
 * @param {Boolean} dashed
 * @param {Array} dashPattern
 * @return {{prevPositions: Float32Array, indices: Uint32Array, vertices: Float32Array, positions: Float32Array}}
 */
export function extractVerticesFromPaths(paths, { dashed, dashPattern }) {
    let pointNumber = 0;
    for (let path of paths) {
        if (dashed) {
            for (let i = 0; i < path.length; i++) {
                if (dashed && i % (dashPattern[0] + dashPattern[1]) >= dashPattern[0]) {
                    continue;
                }
                pointNumber++;
            }
        } else {
            pointNumber += path.length;
        }
    }

    const positions = new Float32Array(pointNumber*8);
    const prevPositions = new Float32Array(pointNumber*8);
    const vertices = new Float32Array(pointNumber*4);
    const indices = new Uint32Array(pointNumber*6);

    if (pointNumber > 0) {
        const verticesPattern = new Float32Array([0, 1, 2, 3]);
        vertices.set(verticesPattern);
        let vertexPointer = verticesPattern.length;
        let sourceLength = verticesPattern.length;
        while (vertexPointer < vertices.length) {
            if (vertexPointer + sourceLength > vertices.length) {
                sourceLength = vertices.length - vertexPointer;
            }

            vertices.copyWithin(vertexPointer, 0, sourceLength);
            vertexPointer += sourceLength;
            sourceLength <<= 1;
        }
    }

    let pointI = 0;
    for (let path of paths) {
        for (let i = 0; i < path.length; i++) {
            if (dashed && i % (dashPattern[0] + dashPattern[1]) >= dashPattern[0]) {
                continue;
            }

            const [x, y] = path[i];

            let prevX, prevY;

            if (i === 0) {
                prevX = x - 1;
                prevY = y;
            } else {
                [prevX, prevY] = path[i - 1];
            }

            for (let j = 0; j < 4; j++) {
                positions[pointI * 8 + 2 * j] = x;
                positions[pointI * 8 + 2 * j + 1] = y;
                prevPositions[pointI * 8 + 2 * j] = prevX;
                prevPositions[pointI * 8 + 2 * j + 1] = prevY;
            }

            indices[pointI * 6] = pointI * 4;
            indices[pointI * 6 + 1] = pointI * 4 + 1;
            indices[pointI * 6 + 2] = pointI * 4 + 3;

            indices[pointI * 6 + 3] = pointI * 4;
            indices[pointI * 6 + 4] = pointI * 4 + 2;
            indices[pointI * 6 + 5] = pointI * 4 + 3;

            pointI++;
        }
    }

    return {
        positions,
        prevPositions,
        vertices,
        indices
    };
}

/**
 * Takes the paths and turns them into what's needed for the line webgl program
 *
 * @param {{nullMask: Uint8Array, maxYValues: Float64Array, minYValues: Float64Array, yValues: Float64Array, paths?: [[Number]]}} dataInRenderSpace
 * @param {Boolean} dashed
 * @param {Array} dashPattern
 * @return {{prevPositions: Float32Array, indices: Uint32Array, vertices: Float32Array, positions: Float32Array}}
 */
export default function extractVertices(dataInRenderSpace, { dashed, dashPattern }) {
    if (dataInRenderSpace.paths) {
        return extractVerticesFromPaths(dataInRenderSpace.paths, { dashed, dashPattern});
    }

    if (!RustAPI()) {
        const paths = pathsFrom(dataInRenderSpace);
        return extractVerticesFromPaths(paths, { dashed, dashPattern});
    }

    const pointNumber = RustAPI().get_point_number(
        dataInRenderSpace.nullMask, dataInRenderSpace.yValues, dataInRenderSpace.minYValues, dataInRenderSpace.maxYValues,
        dashed, dashPattern[0], dashPattern[1]
    );

    let positions = new Float32Array(pointNumber*8);
    let prevPositions = new Float32Array(pointNumber*8);
    let vertices = new Float32Array(pointNumber*4);
    let indices = new Uint32Array(pointNumber*6);

    RustAPI().extract_vertices(
        DPI_INCREASE,
        dataInRenderSpace.nullMask, dataInRenderSpace.yValues, dataInRenderSpace.minYValues, dataInRenderSpace.maxYValues,
        positions, prevPositions, vertices, indices,
        dashed, dashPattern[0], dashPattern[1]
    );

    return {
        positions,
        prevPositions,
        vertices,
        indices
    };
}
